import { jest } from '@jest/globals';
import AdminForth from '../../adminforth/index.js';
import { ActionCheckSource } from '../../adminforth/types/Common.js';
import {
  resolveBoolOrFn,
  isBackendOnly,
  isShown,
  stripBackendOnly,
  columnWriteError,
  recordWriteError,
} from '../../adminforth/modules/utils.js';

const EDITOR = { dbUser: { role: 'editor' } } as any;
const VIEWER = { dbUser: { role: 'viewer' } } as any;

function ctxFor(columns: any[], adminUser: any = EDITOR, source = ActionCheckSource.EditRequest) {
  const resource: any = { resourceId: 'things', columns };
  return { adminUser, resource, meta: { pk: 1 }, source, adminforth: {} as any };
}

const col = (name: string, extra: Record<string, any> = {}) => ({ name, ...extra });

describe('resolveBoolOrFn', () => {
  it.each([
    ['true', true, true],
    ['false', false, false],
    ['undefined', undefined, false],
  ])('passes a %s through as a boolean', async (_label, value, expected) => {
    expect(await resolveBoolOrFn(value as any, ctxFor([]))).toBe(expected);
  });

  it('calls a function value and coerces whatever it returns', async () => {
    expect(await resolveBoolOrFn((async () => 'yes') as any, ctxFor([]))).toBe(true);
    expect(await resolveBoolOrFn((async () => '') as any, ctxFor([]))).toBe(false);
  });

  it('hands the function the request context', async () => {
    const rule = jest.fn(async () => true);
    const ctx = ctxFor([]);

    await resolveBoolOrFn(rule as any, ctx);

    expect(rule).toHaveBeenCalledWith(ctx);
  });
});

describe('isBackendOnly', () => {
  it('resolves a per-user rule differently for different users', async () => {
    const column = col('salary', { backendOnly: async ({ adminUser }: any) => adminUser.dbUser.role !== 'editor' });

    expect(await isBackendOnly(column as any, ctxFor([column], EDITOR))).toBe(false);
    expect(await isBackendOnly(column as any, ctxFor([column], VIEWER))).toBe(true);
  });
});

describe('isShown', () => {
  it('prefers the page key, falls back to all, and defaults to shown', async () => {
    expect(await isShown(col('a', { showIn: { edit: false, all: true } }) as any, 'edit', ctxFor([]))).toBe(false);
    expect(await isShown(col('b', { showIn: { all: false } }) as any, 'edit', ctxFor([]))).toBe(false);
    expect(await isShown(col('c') as any, 'edit', ctxFor([]))).toBe(true);
  });
});

describe('stripBackendOnly', () => {
  it('drops undeclared keys and backendOnly columns, keeping the rest', async () => {
    const columns = [col('id'), col('title'), col('secret', { backendOnly: true })];
    const record = { id: 1, title: 'Mug', secret: 'x', password_hash: 'y' };

    const visible = await stripBackendOnly(record, ctxFor(columns));

    expect(visible).toEqual({ id: 1, title: 'Mug' });
    // both call sites in core discard the return value and rely on the record being mutated
    expect(visible).toBe(record);
  });

  it('resolves a per-user rule, so one user keeps what another loses', async () => {
    const columns = [col('id'), col('note', { backendOnly: async ({ adminUser }: any) => adminUser.dbUser.role !== 'editor' })];

    expect(await stripBackendOnly({ id: 1, note: 'hi' }, ctxFor(columns, EDITOR))).toEqual({ id: 1, note: 'hi' });
    expect(await stripBackendOnly({ id: 1, note: 'hi' }, ctxFor(columns, VIEWER))).toEqual({ id: 1 });
  });
});

describe('columnWriteError', () => {
  it('refuses a backendOnly column with the message the REST routes return', async () => {
    const column = col('secret', { backendOnly: true });

    expect(await columnWriteError(column as any, 'edit', ctxFor([column])))
      .toBe('Field "secret" cannot be modified as it is restricted from editing (backendOnly is true).');
    expect(await columnWriteError(column as any, 'create', ctxFor([column])))
      .toBe('Field "secret" cannot be modified as it is restricted from creation (backendOnly is true).');
  });

  it('refuses an editReadonly column on edit but not on create', async () => {
    const column = col('created_at', { editReadonly: true });

    expect(await columnWriteError(column as any, 'edit', ctxFor([column])))
      .toBe('Field "created_at" cannot be modified as it is restricted from editing (editReadonly is true).');
    expect(await columnWriteError(column as any, 'create', ctxFor([column]))).toBeNull();
  });

  it('refuses a column hidden from the page', async () => {
    const edit = col('hidden', { showIn: { edit: false } });
    const create = col('hidden', { showIn: { create: false } });

    expect(await columnWriteError(edit as any, 'edit', ctxFor([edit]))).toMatch(/showIn\.edit is false/);
    expect(await columnWriteError(create as any, 'create', ctxFor([create]))).toMatch(/showIn\.create is false/);
  });

  it.each([
    ['allowModifyWhenNotShowInEdit', 'edit', { showIn: { edit: false }, allowModifyWhenNotShowInEdit: true }],
    ['allowModifyWhenNotShowInCreate', 'create', { showIn: { create: false }, allowModifyWhenNotShowInCreate: true }],
    ['fillOnCreate', 'create', { showIn: { create: false }, fillOnCreate: () => 1 }],
  ])('allows a hidden column when %s says so', async (_label, page, extra) => {
    const column = col('hidden', extra as Record<string, any>);

    expect(await columnWriteError(column as any, page as 'create' | 'edit', ctxFor([column]))).toBeNull();
  });

  it('refuses a column a per-user rule hides from this user only', async () => {
    const column = col('salary', { showIn: { edit: async ({ adminUser }: any) => adminUser.dbUser.role === 'editor' } });

    expect(await columnWriteError(column as any, 'edit', ctxFor([column], EDITOR))).toBeNull();
    expect(await columnWriteError(column as any, 'edit', ctxFor([column], VIEWER))).toMatch(/showIn\.edit is false/);
  });
});

describe('recordWriteError', () => {
  const columns = [col('id'), col('title'), col('secret', { backendOnly: true })];

  it('reports the first unwritable field in the record', async () => {
    expect(await recordWriteError({ title: 'ok', secret: 'x' }, 'edit', ctxFor(columns)))
      .toMatch(/^Field "secret"/);
  });

  it('passes a record that only touches writable columns', async () => {
    expect(await recordWriteError({ title: 'ok' }, 'edit', ctxFor(columns))).toBeNull();
  });

  it('ignores a restricted column the record does not touch', async () => {
    expect(await recordWriteError({ id: 1 }, 'edit', ctxFor(columns))).toBeNull();
  });
});

describe('enforceColumnAccess on the programmatic write API', () => {
  // the guard must run before anything else touches the record, so a stubbed
  // validateRecordValues tells us whether the call got past it
  const stub = { validateRecordValues: () => 'reached validation' } as any;
  const resource: any = { resourceId: 'things', columns: [col('id', { primaryKey: true }), col('secret', { backendOnly: true })], hooks: {} };
  const params = (extra: Record<string, any>) => ({ resource, record: { secret: 'x' }, adminUser: EDITOR, ...extra });

  it('refuses a backendOnly column when asked to enforce', async () => {
    const result = await AdminForth.prototype.createResourceRecord.call(stub, params({ enforceColumnAccess: true }));

    expect(result.error).toBe('Field "secret" cannot be modified as it is restricted from creation (backendOnly is true).');
  });

  it('stays out of the way by default', async () => {
    const result = await AdminForth.prototype.createResourceRecord.call(stub, params({}));

    expect(result.error).toBe('reached validation');
  });

  it('refuses on update before anything else touches the record', async () => {
    const result = await AdminForth.prototype.updateResourceRecord.call(stub, params({ enforceColumnAccess: true, recordId: 1, updates: { secret: 'x' }, record: undefined }));

    expect(result.error).toBe('Field "secret" cannot be modified as it is restricted from editing (backendOnly is true).');
  });
});
