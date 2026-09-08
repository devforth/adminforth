import { jest } from '@jest/globals';
import I18nPlugin from '../../plugins/adminforth-i18n/index.js';
import BulkAiFlowPlugin from '../../plugins/adminforth-bulk-ai-flow/index.js';

type Rule = boolean | string | ((ctx: any) => Promise<boolean | string>);
type Rules = Partial<Record<'show' | 'edit', Rule>>;
type Handler = (input: Record<string, unknown>) => Promise<any>;

const ADMIN_USER = { dbUser: { role: 'editor' } };
const RECORD = { id: 1, en_string: 'Hello', de_string: '', category: 'ui', secret: 's3cr3t', editors_note: 'for editors', reviewed: { en_string: true } };

function resourceConfig(rules: Rules) {
  return {
    resourceId: 'things',
    dataSource: 'db',
    columns: [
      { name: 'id', primaryKey: true },
      { name: 'en_string' },
      { name: 'de_string' },
      { name: 'category' },
      { name: 'reviewed' },
      { name: 'secret', backendOnly: true },
      { name: 'editors_note', backendOnly: async ({ adminUser }: any) => adminUser.dbUser.role !== 'editor' },
    ],
    options: { allowedActions: { list: true, show: true, edit: true, create: true, delete: true, filter: true, ...rules } },
    hooks: {},
    recordLabel: (r: any) => `thing ${r.id}${r.secret ? ` ${r.secret}` : ''}`,
  };
}

function fakeAdminforth(config: any) {
  const get = jest.fn(async () => ({ ...RECORD }));
  const list = jest.fn(async () => [{ ...RECORD }]);
  const update = jest.fn(async () => ({ ok: true }));
  const getRecordByPrimaryKey = jest.fn(async () => ({ ...RECORD }));
  const updateResourceRecord = jest.fn(async () => ({ ok: true }));
  const adminforth = {
    resource: () => ({ get, list, update }),
    config: { resources: [config] },
    connectors: { db: { getRecordByPrimaryKey } },
    updateResourceRecord,
    websocket: { publish: () => undefined },
  };
  return { adminforth, get, list, update, getRecordByPrimaryKey, updateResourceRecord };
}

function endpointsOf(plugin: any): Record<string, Handler> {
  const handlers: Record<string, Handler> = {};
  plugin.pluginInstanceId = 'test';
  plugin.setupEndpoints({ endpoint: (e: any) => { handlers[e.path.replace('/plugin/test/', '')] = e.handler; } });
  return handlers;
}

function request(body: unknown) {
  return { body, adminUser: ADMIN_USER, headers: {}, query: {}, cookies: [], requestUrl: '/x', response: {}, tr: (s: string) => s };
}

const DENIED: Array<[string, Rule, RegExp]> = [
  ['a boolean rule', false, /not allowed/i],
  ['a string rule, passed through as the message', 'Owners only', /^Owners only$/],
];

afterEach(() => {
  jest.restoreAllMocks();
});

describe('bulk-ai-flow record endpoints', () => {
  function setUp(rules: Rules = {}) {
    const plugin: any = new BulkAiFlowPlugin({
      generateImages: { img: { prompt: 'Draw {{en_string}}' } },
      fillPlainFields: { summary: 'Sum {{secret}}' },
    } as any);
    const config = resourceConfig(rules);
    const fakes = fakeAdminforth(config);
    const attachFiles = jest.fn(async () => ['img.png']);
    plugin.adminforth = fakes.adminforth;
    plugin.resourceConfig = config;
    plugin.options.attachFiles = attachFiles;
    plugin.analyzeNoImages = jest.fn();
    return { ...fakes, plugin, attachFiles, handlers: endpointsOf(plugin) };
  }

  it.each(DENIED)('get_old_data refuses a user who may not show the record (%s), before reading it', async (_label, show, expected) => {
    const { handlers, get } = setUp({ show });

    const result = await handlers.get_old_data(request({ recordId: 1 }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(expected);
    expect(get).not.toHaveBeenCalled();
  });

  it('get_old_data drops backendOnly columns, keeps the ones this user may see, and labels from the visible columns only', async () => {
    const { handlers } = setUp();

    const result = await handlers.get_old_data(request({ recordId: 1 }));

    expect(result).toEqual({ ok: true, record: expect.objectContaining({ id: 1, en_string: 'Hello', editors_note: 'for editors', _label: 'thing 1' }) });
    expect(result.record).not.toHaveProperty('secret');
  });

  it('get_old_data evaluates a record-level show rule with the requested primary key', async () => {
    const show = jest.fn(async () => true);
    const { handlers } = setUp({ show });

    await handlers.get_old_data(request({ recordId: 1 }));

    expect(show).toHaveBeenCalledWith(expect.objectContaining({
      adminUser: ADMIN_USER,
      source: 'showRequest',
      meta: expect.objectContaining({ pk: 1 }),
    }));
  });

  it('get_image_generation_prompts refuses a user who may not show the record, before reading it', async () => {
    const { handlers, get } = setUp({ show: false });

    const result = await handlers.get_image_generation_prompts(request({ recordId: 1, customPrompt: 'Say {{en_string}}' }));

    expect(result.error).toEqual(expect.any(String));
    expect(get).not.toHaveBeenCalled();
  });

  it('get_image_generation_prompts hides backendOnly columns from a client-supplied template, as this user would see them', async () => {
    const { handlers } = setUp();

    const result = await handlers.get_image_generation_prompts(request({ recordId: 1, customPrompt: 'Say {{secret}}|{{editors_note}}|{{en_string}}' }));

    expect(result.prompt).toBe('Say |for editors|Hello');
  });

  it('a template key the operator configured compiles against the full record; a key the client changed does not', async () => {
    const { plugin } = setUp();

    const compiled = await plugin.compileOutputFieldsTemplatesNoImage(RECORD, JSON.stringify({ summary: 'Sum {{secret}}', extra: 'X {{secret}}' }), ADMIN_USER);

    expect(compiled).toEqual({ summary: 'Sum s3cr3t', extra: 'X ' });
  });

  it('without a client prompt the operator\'s templates compile against the full record', async () => {
    const { plugin } = setUp();

    const compiled = await plugin.compileOutputFieldsTemplatesNoImage(RECORD, undefined, ADMIN_USER);

    expect(compiled).toEqual({ summary: 'Sum s3cr3t' });
  });

  it('regenerating a cell without a prompt falls back to the operator\'s template, which stays server-owned', async () => {
    const { plugin } = setUp();
    const compile = jest.spyOn(plugin, 'compileOutputFieldsTemplatesNoImage');

    await plugin.regenerateCell('job', 'summary', 1, 'analyze_no_images', undefined, ADMIN_USER);

    expect(compile).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), JSON.stringify({ summary: 'Sum {{secret}}' }), ADMIN_USER);
    await expect(compile.mock.results[0].value).resolves.toEqual({ summary: 'Sum s3cr3t' });
  });

  it('with no user at all, a function-valued backendOnly column is hidden as well', async () => {
    const { plugin } = setUp();

    const visible = await plugin.withoutBackendOnlyColumns(RECORD, null, {}, 1);

    expect(visible).not.toHaveProperty('secret');
    expect(visible).not.toHaveProperty('editors_note');
    expect(visible).toEqual(expect.objectContaining({ id: 1, en_string: 'Hello' }));
  });

  it('provideAdditionalContextForRecord always receives the full record', async () => {
    const { plugin } = setUp();
    const hook = jest.fn(async () => ({}));
    plugin.options.provideAdditionalContextForRecord = hook;

    await plugin.compileOutputFieldsTemplatesNoImage(RECORD, JSON.stringify({ summary: 'Sum {{secret}}', extra: 'X {{secret}}' }), ADMIN_USER);

    expect(hook).toHaveBeenCalled();
    for (const [arg] of hook.mock.calls as any[]) {
      expect(arg.record).toEqual(expect.objectContaining({ secret: 's3cr3t' }));
    }
  });

  it('create-job refuses a user who may not show the record, before any job is created', async () => {
    const { handlers, plugin } = setUp({ show: false });

    const result = await handlers['create-job'](request({ actionType: 'analyze_no_images', recordId: 1 }));

    expect(result.ok).toBe(false);
    expect(result.error).toEqual(expect.any(String));
    expect(plugin.analyzeNoImages).not.toHaveBeenCalled();
  });

  it('create-job dispatches the job for a user who may show the record', async () => {
    const { handlers, plugin } = setUp();

    const result = await handlers['create-job'](request({ actionType: 'analyze_no_images', recordId: 1 }));

    expect(result).toEqual({ ok: true, jobId: expect.any(String) });
    expect(plugin.analyzeNoImages).toHaveBeenCalledWith(result.jobId, 1, ADMIN_USER, expect.anything(), undefined, undefined);
  });

  it('get_images refuses a user who may not show the record, without reading it or attaching files', async () => {
    const { handlers, get, attachFiles } = setUp({ show: false });

    const result = await handlers.get_images(request({ recordIds: [1] }));

    expect(result.error).toEqual(expect.any(String));
    expect(get).not.toHaveBeenCalled();
    expect(attachFiles).not.toHaveBeenCalled();
  });

  it('get_images reads the record server-side and hands the full record to attachFiles', async () => {
    const { handlers, get, attachFiles } = setUp();

    const result = await handlers.get_images(request({ recordIds: [1] }));

    expect(get).toHaveBeenCalledTimes(1);
    expect(attachFiles).toHaveBeenCalledWith({ record: expect.objectContaining({ id: 1, secret: 's3cr3t' }) });
    expect(result).toEqual({ images: [['img.png']] });
  });

  it.each(DENIED)('compile_old_image_link refuses a user who may not show the resource (%s)', async (_label, show, expected) => {
    const { handlers } = setUp({ show });

    const result = await handlers.compile_old_image_link(request({ image: 'x.png', columnName: 'img' }));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(expected);
  });
});

describe('i18n record endpoints', () => {
  function setUp(rules: Rules = {}, extraOptions: Record<string, unknown> = {}) {
    const plugin: any = new I18nPlugin({
      supportedLanguages: ['en', 'de'],
      translationFieldNames: { en: 'en_string', de: 'de_string' },
      categoryFieldName: 'category',
      ...extraOptions,
    } as any);
    const config = resourceConfig(rules);
    const fakes = fakeAdminforth(config);
    plugin.adminforth = fakes.adminforth;
    plugin.resourceConfig = config;
    plugin.trFieldNames = { en: 'en_string', de: 'de_string' };
    plugin.primaryKeyFieldName = 'id';
    plugin.enFieldName = 'en_string';
    plugin.getTranslateToLangTasks = jest.fn(async () => []);
    return { ...fakes, plugin, handlers: endpointsOf(plugin) };
  }

  const UPDATE = { resourceId: 'things', recordId: 1, field: 'de_string', value: 'Hallo' };
  const TRANSLATE = { selectedIds: [1], selectedLanguages: ['de'] };

  it.each(DENIED)('update-field refuses a user who may not edit the record (%s), without writing', async (_label, edit, expected) => {
    const { handlers, updateResourceRecord } = setUp({ edit });

    const result = await handlers['update-field'](request(UPDATE));

    expect(result.error).toMatch(expected);
    expect(updateResourceRecord).not.toHaveBeenCalled();
  });

  it('update-field only writes translation columns', async () => {
    const { handlers, updateResourceRecord } = setUp();

    const result = await handlers['update-field'](request({ ...UPDATE, field: 'secret', value: 'pwned' }));

    expect(result.error).toEqual(expect.any(String));
    expect(updateResourceRecord).not.toHaveBeenCalled();
  });

  it('update-field writes the translation and returns only the plugin\'s own fields', async () => {
    const { handlers, updateResourceRecord } = setUp();

    const result = await handlers['update-field'](request(UPDATE));

    expect(updateResourceRecord).toHaveBeenCalledWith(expect.objectContaining({ recordId: 1, record: { de_string: 'Hallo' } }));
    expect(result.record).toEqual({ id: 1, en_string: 'Hello', de_string: '' });
  });

  it('update-field evaluates a record-level edit rule with the old record and the change', async () => {
    const edit = jest.fn(async () => true);
    const { handlers } = setUp({ edit });

    await handlers['update-field'](request(UPDATE));

    expect(edit).toHaveBeenCalledWith(expect.objectContaining({
      source: 'editRequest',
      meta: expect.objectContaining({ pk: 1, oldRecord: expect.objectContaining({ id: 1 }), newRecord: { de_string: 'Hallo' } }),
    }));
  });

  it('update-field merges the reviewed checkbox into the write, shows it to the edit rule, and returns it', async () => {
    const edit = jest.fn(async () => true);
    const { handlers, updateResourceRecord } = setUp({ edit }, { reviewedCheckboxesFieldName: 'reviewed' });

    const result = await handlers['update-field'](request({ ...UPDATE, reviewed: true }));

    const written = { de_string: 'Hallo', reviewed: { en_string: true, de_string: true } };
    expect(edit).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ newRecord: written }) }));
    expect(updateResourceRecord).toHaveBeenCalledWith(expect.objectContaining({ recordId: 1, record: written }));
    expect(result.record).toEqual({ id: 1, en_string: 'Hello', de_string: '', reviewed: { en_string: true } });
  });

  it.each(DENIED)('translate-selected-to-languages refuses when the user may not edit the records (%s), before translating', async (_label, edit, expected) => {
    const { handlers, plugin } = setUp({ edit });

    const result = await handlers['translate-selected-to-languages'](request(TRANSLATE));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(expected);
    expect(plugin.getTranslateToLangTasks).not.toHaveBeenCalled();
  });

  it('translate-selected-to-languages evaluates a record-level edit rule per selected record', async () => {
    const edit = jest.fn(async () => false);
    const { handlers } = setUp({ edit });

    const result = await handlers['translate-selected-to-languages'](request(TRANSLATE));

    expect(result.ok).toBe(false);
    expect(edit).toHaveBeenCalledWith(expect.objectContaining({
      source: 'editRequest',
      meta: expect.objectContaining({ pk: 1, oldRecord: expect.objectContaining({ id: 1 }) }),
    }));
  });

  it('translate-selected-to-languages proceeds to translation for a user who may edit the records', async () => {
    const { handlers, plugin } = setUp();

    await handlers['translate-selected-to-languages'](request(TRANSLATE)).catch(() => undefined);

    expect(plugin.getTranslateToLangTasks).toHaveBeenCalled();
  });
});
