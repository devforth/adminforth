import AdminForth from '../../adminforth/index.js';
import ConfigValidator from '../../adminforth/modules/configValidator.js';
import OperationalResource from '../../adminforth/modules/operationalResource.js';
import UserScopedResource from '../../adminforth/modules/userScopedResource.js';
import { cascadeChildrenDelete } from '../../adminforth/modules/utils.js';

function setup(parentBeforeSave: () => Promise<{ ok: boolean; error?: string }>) {
  const events: string[] = [];
  let scopedDeleteCalls = 0;
  const parent = {
    resourceId: 'parents',
    dataSource: 'main',
    columns: [{ name: 'id', primaryKey: true }],
    options: { allowedActions: { delete: true } },
    hooks: {
      delete: {
        beforeSave: [async () => {
          events.push('parent-before');
          return parentBeforeSave();
        }],
        afterSave: [async () => {
          events.push('parent-after');
          return { ok: true };
        }],
      },
    },
  } as any;
  parent.dataSourceColumns = parent.columns;
  const child = {
    resourceId: 'children',
    dataSource: 'main',
    columns: [
      { name: 'id', primaryKey: true },
      { name: 'parent_id', foreignResource: { resourceId: 'parents', onDelete: 'cascade' } },
    ],
    options: { allowedActions: { delete: true } },
    hooks: {
      delete: {
        beforeSave: [async () => {
          events.push('child-before');
          return { ok: true };
        }],
        afterSave: [async () => {
          events.push('child-after');
          return { ok: true };
        }],
      },
    },
  } as any;
  child.dataSourceColumns = child.columns;
  const admin = Object.create(AdminForth.prototype) as any;
  admin.config = { resources: [parent, child] };
  admin.statuses = { dbDiscover: 'done' };
  admin.warnedDeprecatedResourceMutations = new Set();
  const connector = {
    validateAndNormalizeInputFilters: (filters: any) => filters,
    getRecordByPrimaryKey: async (resource: any) => resource.resourceId === 'parents'
      ? { id: 'p1' }
      : { id: 'c1', parent_id: 'p1' },
    getData: async ({ resource }: any) => {
      if (resource.resourceId === 'children') {
        events.push('child-list');
        return { data: [{ id: 'c1', parent_id: 'p1' }], total: 1 };
      }
      return { data: [{ id: 'p1' }], total: 1 };
    },
    deleteRecord: async ({ resource }: any) => {
      events.push(resource.resourceId === 'parents' ? 'parent-delete' : 'child-delete');
      return true;
    },
  };
  admin.connectors = { main: connector };
  const executors = {
    create: (params: any) => admin.executeCreateResourceRecord(params),
    update: (params: any) => admin.executeUpdateResourceRecord(params),
    delete: (params: any, cascadeChildren?: boolean, bulkHooks?: boolean) => {
      scopedDeleteCalls += 1;
      return admin.executeDeleteResourceRecord(params, cascadeChildren, bulkHooks);
    },
  };
  const operationalResource = (resource: any) => new OperationalResource(
    connector as any,
    resource,
    (data, adminUser, options) => new UserScopedResource(data, admin, executors, adminUser, options),
  );
  admin.operationalResources = {
    parents: operationalResource(parent),
    children: operationalResource(child),
  };
  const actions = new ConfigValidator(admin, {} as any)
    .validateAndNormalizeBulkActions({ options: { bulkActions: [] } } as any, parent, []);
  const deleteChecked = actions[actions.length - 1];

  return {
    events,
    parent,
    scopedDeleteCalls: () => scopedDeleteCalls,
    deleteChecked: (extra?: any) => deleteChecked.action({
      selectedIds: ['p1'],
      adminUser: {} as any,
      response: {} as any,
      extra,
    } as any),
  };
}

describe('default bulk delete', () => {
  it('does not cascade when the parent beforeSave hook vetoes deletion', async () => {
    const { events, scopedDeleteCalls, deleteChecked } = setup(async () => ({ ok: false, error: 'blocked' }));

    await expect(deleteChecked()).resolves.toMatchObject({ ok: false, error: 'blocked' });
    expect(scopedDeleteCalls()).toBe(1);
    expect(events).toEqual(['parent-before']);
  });

  it('runs the parent veto hook before cascading and deletes each record once', async () => {
    const { events, scopedDeleteCalls, deleteChecked } = setup(async () => ({ ok: true }));

    await expect(deleteChecked()).resolves.toMatchObject({ ok: true });
    expect(scopedDeleteCalls()).toBe(1);
    expect(events).toEqual([
      'parent-before',
      'child-list',
      'child-before',
      'child-delete',
      'child-after',
      'parent-delete',
      'parent-after',
    ]);
  });

  it('runs every beforeSave hook when one vetoes deletion', async () => {
    const { events, parent, deleteChecked } = setup(async () => ({ ok: false, error: 'blocked' }));
    parent.hooks.delete.beforeSave.push(async () => {
      events.push('parent-before-second');
      return { ok: true };
    });

    await expect(deleteChecked()).resolves.toMatchObject({ ok: false, error: 'blocked' });
    expect(events).toEqual(['parent-before', 'parent-before-second']);
  });

  it('runs every afterSave hook and ignores returned errors', async () => {
    const { events, parent, deleteChecked } = setup(async () => ({ ok: true }));
    parent.hooks.delete.afterSave[0] = async () => {
      events.push('parent-after');
      return { ok: false, error: 'after failed' };
    };
    parent.hooks.delete.afterSave.push(async () => {
      events.push('parent-after-second');
      return { ok: true };
    });

    await expect(deleteChecked()).resolves.toMatchObject({ ok: true });
    expect(events).toContain('parent-after-second');
    expect(events).toContain('parent-delete');
  });

  it('passes bulk request context to the row-scope hook using a list-shaped body', async () => {
    const { parent, deleteChecked } = setup(async () => ({ ok: true }));
    let hookPayload: any;
    parent.hooks.list = {
      beforeDatasourceRequest: [async (payload: any) => {
        hookPayload = payload;
        return { ok: true };
      }],
    };
    const requestBody = { resourceId: 'parents', actionId: 'delete', recordIds: ['p1'] };

    await expect(deleteChecked({
      body: requestBody,
      query: {},
      headers: { 'x-tenant': 't1' },
      cookies: [],
      requestUrl: '/start_bulk_action',
      response: {},
    })).resolves.toMatchObject({ ok: true });

    expect(hookPayload.extra.headers).toEqual({ 'x-tenant': 't1' });
    expect(hookPayload.extra.body).toBe(hookPayload.query);
    expect(hookPayload.extra.body).not.toBe(requestBody);
  });
});

it('keeps the legacy four-argument cascade helper hook-aware', async () => {
  const parent = {
    resourceId: 'parents',
    columns: [{ name: 'id', primaryKey: true }],
  } as any;
  const child = {
    resourceId: 'children',
    columns: [
      { name: 'id', primaryKey: true },
      { name: 'parent_id', foreignResource: { resourceId: 'parents', onDelete: 'cascade' } },
    ],
  } as any;
  const deleted: any[] = [];
  const adminforth = {
    config: { resources: [parent, child] },
    resource: () => ({ list: async () => [{ id: 'c1', parent_id: 'p1' }] }),
    deleteResourceRecord: async (params: any) => {
      deleted.push(params);
      return { error: null };
    },
  } as any;

  await expect(cascadeChildrenDelete(
    parent,
    'p1',
    { adminUser: { id: 'admin' }, response: {} },
    adminforth,
  )).resolves.toEqual({ error: null });

  expect(deleted).toHaveLength(1);
  expect(deleted[0]).toMatchObject({ resource: child, recordId: 'c1' });
});
