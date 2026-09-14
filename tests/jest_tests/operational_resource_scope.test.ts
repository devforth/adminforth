import OperationalResource from '../../adminforth/modules/operationalResource.js';
import { ActionCheckSource } from '../../adminforth/types/Common.js';

function setup(resourceId = 'users') {
  const calls = {
    acl: 0,
    createExecutor: 0,
    updateExecutor: 0,
    connectorCreate: 0,
    connectorUpdate: 0,
    connectorDelete: 0,
    connectorGetData: 0,
    connectorGetByPk: 0,
    connectorCount: 0,
    connectorAggregate: 0,
    validate: 0,
    beforeList: 0,
    afterList: 0,
  };
  const resource = {
    resourceId,
    dataSource: 'main',
    columns: [
      { name: 'id', primaryKey: true },
      { name: 'name', showIn: { create: true, edit: true } },
      { name: 'readonly', showIn: { create: true, edit: true }, editReadonly: true },
      { name: 'private', backendOnly: true },
      {
        name: 'secret',
        showIn: { create: true, edit: true },
        backendOnly: ({ source }) => source === ActionCheckSource.CreateRequest,
      },
    ],
    dataSourceColumns: [],
    options: {
      allowedActions: {
        create: ({ meta }) => {
          calls.acl++;
          return Promise.resolve(meta.allowed === true);
        },
        edit: ({ meta }) => {
          calls.acl++;
          return Promise.resolve(meta.allowed === true);
        },
        show: true,
        list: ({ meta }) => {
          calls.acl++;
          return Promise.resolve(meta.allowed === true);
        },
        delete: ({ meta }) => {
          calls.acl++;
          return Promise.resolve(meta.allowed === true);
        },
      },
    },
    hooks: {
      list: {
        beforeDatasourceRequest: [async () => {
          calls.beforeList++;
          return { ok: true };
        }],
        afterDatasourceResponse: [async () => {
          calls.afterList++;
          return { ok: true };
        }],
      },
    },
  } as any;
  resource.dataSourceColumns = resource.columns;

  const connector = {
    createRecord: async ({ record }) => {
      calls.connectorCreate++;
      return { ok: true, createdRecord: { id: 1, ...record } };
    },
    updateRecord: async () => {
      calls.connectorUpdate++;
      return { ok: true };
    },
    deleteRecord: async () => {
      calls.connectorDelete++;
      return true;
    },
    getData: async () => {
      calls.connectorGetData++;
      return { data: [{ id: 1, name: 'John', private: 'hidden' }], total: 1 };
    },
    getCount: async () => {
      calls.connectorCount++;
      return 1;
    },
    aggregate: async () => {
      calls.connectorAggregate++;
      return [{ total: 1 }];
    },
    validateAndNormalizeInputFilters: (filter) => filter,
    getRecordByPrimaryKey: async () => {
      calls.connectorGetByPk++;
      return { id: 1, name: 'Old name', readonly: 'old' };
    },
  } as any;
  const adminforth = { config: { resources: [resource] } } as any;
  const executors = {
    create: async ({ record }) => {
      calls.createExecutor++;
      return { createdRecord: { id: 1, ...record } };
    },
    update: async () => {
      calls.updateExecutor++;
      return { error: null };
    },
    delete: async () => ({ error: null }),
    validate: () => {
      calls.validate++;
      return null;
    },
  } as any;

  return {
    calls,
    resource: new OperationalResource(connector, resource, adminforth, executors),
  };
}

describe('OperationalResource access scopes', () => {
  it('enforces ACL, column access, validation, and hooks for asUser()', async () => {
    const { calls, resource } = setup();
    const denied = await resource.asUser({} as any, { meta: { allowed: false } }).create({ name: 'John' });
    expect(denied).toMatchObject({ ok: false, error: 'Action is not allowed' });

    const forbidden = await resource.asUser({} as any, { meta: { allowed: true } }).create({ secret: 'value' });
    expect(forbidden).toMatchObject({ ok: false });
    expect(forbidden.error).toContain('backendOnly is true');

    const created = await resource.asUser({} as any, { meta: { allowed: true } }).create({ name: 'John' });
    expect(created).toMatchObject({ ok: true, createdRecord: { id: 1, name: 'John' } });
    expect(calls).toMatchObject({ acl: 3, createExecutor: 1, connectorCreate: 0 });
  });

  it('runs hooks by default for asSystem()', async () => {
    const { calls, resource } = setup();
    const created = await resource.asSystem({ meta: { allowed: false } }).create({ secret: 'value' });

    expect(created).toMatchObject({ ok: true, createdRecord: { id: 1, secret: 'value' } });
    expect(calls).toMatchObject({ acl: 0, createExecutor: 1, connectorCreate: 0 });
  });

  it('uses validation and the connector when system hooks are disabled', async () => {
    const { calls, resource } = setup();
    const created = await resource.asSystem({ hooks: false }).create({ secret: 'value' });

    expect(created).toMatchObject({ ok: true, createdRecord: { id: 1, secret: 'value' } });
    expect(calls).toMatchObject({ acl: 0, createExecutor: 0, connectorCreate: 1, validate: 1 });
  });

  it('keeps the unscoped API equivalent to asSystem({ hooks: false })', async () => {
    const unscoped = setup();
    const scoped = setup();
    const filter = { field: 'id', operator: 'eq', value: 1 } as any;
    const aggregations = { total: { fn: 'count', field: 'id' } } as any;

    const unscopedResults = [
      await unscoped.resource.get(filter),
      await unscoped.resource.list(filter),
      await unscoped.resource.count(filter),
      await unscoped.resource.aggregate(filter, aggregations),
      await unscoped.resource.create({ name: 'John' }),
      await unscoped.resource.update(1, { name: 'Jane' }),
      await unscoped.resource.delete(1),
    ];
    const hooksFreeSystem = scoped.resource.asSystem({ hooks: false });
    const scopedResults = [
      await hooksFreeSystem.get(filter),
      await hooksFreeSystem.list(filter),
      await hooksFreeSystem.count(filter),
      await hooksFreeSystem.aggregate(filter, aggregations),
      await hooksFreeSystem.create({ name: 'John' }),
      await hooksFreeSystem.update(1, { name: 'Jane' }),
      await hooksFreeSystem.delete(1),
    ];

    expect(unscopedResults).toEqual(scopedResults);
    expect(unscoped.calls).toEqual(scoped.calls);
  });

  it('allows system hooks to update editReadonly fields while asUser rejects them', async () => {
    const { calls, resource } = setup();

    const forbidden = await resource
      .asUser({} as any, { meta: { allowed: true } })
      .update(1, { readonly: 'new' });
    expect(forbidden.error).toContain('editReadonly is true');

    const updated = await resource.asSystem().update(1, { readonly: 'new' });
    expect(updated).toMatchObject({ ok: true, error: null });
    expect(calls).toMatchObject({ acl: 1, updateExecutor: 1, connectorUpdate: 0 });
  });

  it('applies read ACL, column access, and hooks for asUser()', async () => {
    const { calls, resource } = setup();

    await expect(resource.asUser({} as any, { meta: { allowed: false } }).list([]))
      .rejects.toThrow('Action is not allowed');

    const records = await resource.asUser({} as any, { meta: { allowed: true } }).list([]);

    expect(records).toEqual([{ id: 1, name: 'John' }]);
    expect(calls).toMatchObject({ acl: 2, beforeList: 1, afterList: 1 });
  });

  it('keeps system reads unrestricted while honoring the hooks option', async () => {
    const withHooks = setup();
    const withoutHooks = setup();

    const systemRecords = await withHooks.resource.asSystem().list([]);
    const hooksFreeRecords = await withoutHooks.resource.asSystem({ hooks: false }).list([]);

    expect(systemRecords).toEqual([{ id: 1, name: 'John', private: 'hidden' }]);
    expect(hooksFreeRecords).toEqual(systemRecords);
    expect(withHooks.calls).toMatchObject({ acl: 0, beforeList: 1, afterList: 1 });
    expect(withoutHooks.calls).toMatchObject({ acl: 0, beforeList: 0, afterList: 0 });
  });

  it('rejects denied deletes and leaves the connector untouched', async () => {
    const { calls, resource } = setup();

    await expect(resource.asUser({} as any, { meta: { allowed: false } }).delete(1))
      .rejects.toThrow('Action is not allowed');
    expect(calls).toMatchObject({ acl: 1, connectorDelete: 0 });
  });

  it('reuses the record supplied by the caller instead of reading it again', async () => {
    const { calls, resource } = setup();

    const updated = await resource
      .asUser({} as any, { meta: { allowed: true }, oldRecord: { id: 1, name: 'Old name' } })
      .update(1, { name: 'Jane' });

    expect(updated).toMatchObject({ ok: true });
    expect(calls).toMatchObject({ connectorGetByPk: 0, updateExecutor: 1 });
  });

  it('requires list and show access for asUser() aggregations', async () => {
    const { calls, resource } = setup();

    await expect(
      resource.asUser({} as any, { meta: { allowed: false } }).aggregate([], { total: { fn: 'count' } } as any),
    ).rejects.toThrow('Action is not allowed');
    expect(calls).toMatchObject({ connectorAggregate: 0 });
  });

  it('refuses to aggregate, group by, or filter on columns the user cannot read', async () => {
    const { calls, resource } = setup();
    const scoped = resource.asUser({} as any, { meta: { allowed: true } });

    await expect(scoped.aggregate([], { max: { fn: 'max', field: 'private' } } as any))
      .rejects.toThrow('cannot be aggregated (backendOnly is true)');
    await expect(scoped.aggregate([], { total: { fn: 'count' } } as any, { field: 'private' } as any))
      .rejects.toThrow('cannot be aggregated (backendOnly is true)');
    await expect(scoped.aggregate(
      { field: 'private', operator: 'eq', value: 'hidden' } as any,
      { total: { fn: 'count' } } as any,
    )).rejects.toThrow('Filter: column "private" cannot be used');

    expect(calls).toMatchObject({ connectorAggregate: 0 });

    const allowed = await scoped.aggregate([], { max: { fn: 'max', field: 'name' } } as any);
    expect(allowed).toEqual([{ total: 1 }]);
    expect(calls).toMatchObject({ connectorAggregate: 1 });
  });

  it('still delegates unscoped calls per resource, warning about each one separately', async () => {
    const first = setup('warn-probe-a');
    const second = setup('warn-probe-b');

    expect(await first.resource.list([])).toEqual([{ id: 1, name: 'John', private: 'hidden' }]);
    expect(await second.resource.count([])).toBe(1);
    expect(first.calls).toMatchObject({ acl: 0, connectorGetData: 1 });
    expect(second.calls).toMatchObject({ acl: 0, connectorCount: 1 });
  });
});
