import OperationalResource from '../../adminforth/modules/operationalResource.js';
import UserScopedResource from '../../adminforth/modules/userScopedResource.js';
import AdminForthRestAPI from '../../adminforth/modules/restApi.js';
import { authorizeResourceOperation, RESOURCE_ACCESS_GRANT } from '../../adminforth/modules/resourceAccess.js';
import { ActionCheckSource, AllowedActionsEnum } from '../../adminforth/types/Common.js';

function singleFilters(filters: any): any[] {
  if (Array.isArray(filters)) {
    return filters.flatMap(singleFilters);
  }
  return filters.subFilters ? singleFilters(filters.subFilters) : [filters];
}

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
        beforeDatasourceRequest: [async ({ query }) => {
          calls.beforeList++;
          query.filtersTools.replaceOrAddTopFilter({ field: 'tenant', operator: 'eq', value: 't1' });
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

  const seenFilters: Record<string, any> = {};
  const seenWrites: Record<string, any> = {};
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
    getData: async ({ filters }) => {
      calls.connectorGetData++;
      seenFilters.getData = filters;
      const requestedFilters = singleFilters(filters);
      if (requestedFilters.some((filter) => filter.field === 'tenant' && filter.value === 'not-owned')
        || requestedFilters.some((filter) => filter.field === 'id' && filter.value !== 1)) {
        return { data: [], total: 0 };
      }
      return { data: [{ id: 1, name: 'John', private: 'hidden' }], total: 1 };
    },
    getCount: async ({ filters }) => {
      calls.connectorCount++;
      seenFilters.count = filters;
      return 1;
    },
    aggregate: async ({ filters }) => {
      calls.connectorAggregate++;
      seenFilters.aggregate = filters;
      return [{ total: 1 }];
    },
    validateAndNormalizeInputFilters: (filter) => filter,
    getRecordByPrimaryKey: async () => {
      calls.connectorGetByPk++;
      return { id: 1, name: 'Old name', readonly: 'old' };
    },
    getPrimaryKey: () => 'id',
  } as any;
  const adminforth = { config: { resources: [resource] } } as any;
  const executors = {
    create: async ({ record }) => {
      calls.createExecutor++;
      return { createdRecord: { id: 1, ...record } };
    },
    update: async ({ oldRecord, updates }) => {
      calls.updateExecutor++;
      seenWrites.update = { oldRecord, updates };
      return { error: null };
    },
    delete: async ({ record }, cascadeChildren) => {
      seenWrites.delete = { record, cascadeChildren };
      return { error: null };
    },
  } as any;

  const operationalResource = new OperationalResource(
    connector,
    resource,
    (data, adminUser, options) => new UserScopedResource(data, adminforth, executors, adminUser, options),
  );
  adminforth.resource = () => operationalResource;

  return {
    calls,
    seenFilters,
    seenWrites,
    adminforth,
    resource: operationalResource,
  };
}

describe('OperationalResource access tiers', () => {
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

  it('runs no permission checks, no column checks and no hooks on the bare API', async () => {
    const { calls, resource } = setup();
    const created = await resource.create({ secret: 'value' });

    expect(created).toMatchObject({ ok: true, createdRecord: { id: 1, secret: 'value' } });
    expect(calls).toMatchObject({ acl: 0, createExecutor: 0, connectorCreate: 1 });
  });

  it('rejects editReadonly for asUser()', async () => {
    const { calls, resource } = setup();

    const forbidden = await resource
      .asUser({} as any, { meta: { allowed: true } })
      .update(1, { readonly: 'new' });

    expect(forbidden.error).toContain('editReadonly is true');
    expect(calls).toMatchObject({ acl: 1, updateExecutor: 0, connectorUpdate: 0 });
  });

  it('applies read ACL, column access, and hooks for asUser()', async () => {
    const { calls, resource } = setup();

    await expect(resource.asUser({} as any, { meta: { allowed: false } }).list([]))
      .rejects.toThrow('Action is not allowed');

    const records = await resource.asUser({} as any, { meta: { allowed: true } }).list([]);

    expect(records).toEqual([{ id: 1, name: 'John' }]);
    expect(calls).toMatchObject({ acl: 2, beforeList: 1, afterList: 1 });
  });

  it('returns backendOnly columns on the bare API and strips them for asUser()', async () => {
    const bare = setup();
    const scoped = setup();

    const bareRecords = await bare.resource.list([]);
    const userRecords = await scoped.resource.asUser({} as any, { meta: { allowed: true } }).list([]);

    expect(bareRecords).toEqual([{ id: 1, name: 'John', private: 'hidden' }]);
    expect(userRecords).toEqual([{ id: 1, name: 'John' }]);
    expect(bare.calls).toMatchObject({ acl: 0, beforeList: 0, afterList: 0 });
    expect(scoped.calls).toMatchObject({ acl: 1, beforeList: 1, afterList: 1 });
  });

  it('rejects denied deletes and leaves the connector untouched', async () => {
    const { calls, resource } = setup();

    await expect(resource.asUser({} as any, { meta: { allowed: false } }).delete(1))
      .rejects.toThrow('Action is not allowed');
    expect(calls).toMatchObject({ acl: 1, connectorDelete: 0 });
  });

  it('passes the caller delete snapshot to hooks after the scoped lookup', async () => {
    const { seenWrites, resource } = setup();
    const record = { id: 1, name: 'Earlier snapshot' };
    let aclRecord: any;
    resource.resourceConfig.options.allowedActions.delete = ({ meta }) => {
      aclRecord = meta.record;
      return true;
    };

    await expect(resource.asUser({} as any, { meta: { allowed: true }, record }).delete(1))
      .resolves.toBe(true);
    expect(aclRecord.name).toBe('John');
    expect(seenWrites.delete).toEqual({ record, cascadeChildren: true });
  });

  it('passes the caller snapshot to hooks after checking current row scope', async () => {
    const { calls, seenWrites, resource } = setup();
    let aclRecord: any;
    resource.resourceConfig.options.allowedActions.edit = ({ meta }) => {
      aclRecord = meta.oldRecord;
      return true;
    };

    const updated = await resource
      .asUser({} as any, { meta: { allowed: true }, oldRecord: { id: 1, name: 'Earlier snapshot' } })
      .update(1, { name: 'Jane' });

    expect(updated).toMatchObject({ ok: true });
    expect(aclRecord.name).toBe('John');
    expect(seenWrites.update.oldRecord).toEqual({ id: 1, name: 'Earlier snapshot' });
    expect(calls).toMatchObject({ connectorGetByPk: 0, updateExecutor: 1, beforeList: 1 });
  });

  it('row-scopes updates and deletes before loading the target record', async () => {
    const { calls, seenFilters, resource } = setup();
    resource.resourceConfig.hooks.list.beforeDatasourceRequest = [async ({ query }) => {
      calls.beforeList++;
      query.filtersTools.replaceOrAddTopFilter({ field: 'tenant', operator: 'eq', value: 'not-owned' });
      return { ok: true };
    }];
    const scoped = resource.asUser({} as any, { meta: { allowed: true } });

    await expect(scoped.update(1, { name: 'Jane' })).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining('not found'),
    });
    await expect(scoped.delete(1)).resolves.toBe(false);

    expect(singleFilters(seenFilters.getData)).toContainEqual({ field: 'tenant', operator: 'eq', value: 'not-owned' });
    expect(calls).toMatchObject({ beforeList: 2, updateExecutor: 0, connectorDelete: 0 });
  });

  it('keeps the requested primary key when a scope hook replaces its filters', async () => {
    const { calls, seenFilters, resource } = setup();
    resource.resourceConfig.hooks.list.beforeDatasourceRequest = [async ({ query }) => {
      query.filters = [{ field: 'tenant', operator: 'eq', value: 't1' }];
      return { ok: true };
    }];
    const scoped = resource.asUser({} as any, { meta: { allowed: true } });

    await expect(scoped.update(2, { name: 'Jane' })).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining('not found'),
    });
    await expect(scoped.delete(2)).resolves.toBe(false);

    expect(singleFilters(seenFilters.getData)).toContainEqual({ field: 'id', operator: 'eq', value: 2 });
    expect(calls).toMatchObject({ updateExecutor: 0 });
  });

  it('derives a hidden polymorphic discriminator after validating user fields', async () => {
    const { calls, seenWrites, adminforth, resource } = setup();
    resource.resourceConfig.columns.push(
      { name: 'resource_id', showIn: { create: false, edit: false } },
      {
        name: 'record_id',
        foreignResource: {
          polymorphicOn: 'resource_id',
          polymorphicResources: [
            { resourceId: 'targets', whenValue: 'target' },
            { resourceId: null, whenValue: 'system' },
          ],
        },
      },
    );
    adminforth.config.resources.push({
      resourceId: 'targets',
      dataSource: 'targets',
      columns: [{ name: 'id', primaryKey: true }],
    });
    adminforth.connectors = {
      targets: { getData: async () => ({ data: [{ id: 'target-1' }] }) },
    };
    const scoped = resource.asUser({} as any, { meta: { allowed: true } });

    const created = await scoped.create({ record_id: 'target-1' });
    const updated = await scoped.update(1, { record_id: 'target-1' });
    const forbidden = await scoped.create({ record_id: 'target-1', resource_id: 'target' });

    expect(created.createdRecord.resource_id).toBe('target');
    expect(updated).toMatchObject({ ok: true });
    expect(seenWrites.update.updates.resource_id).toBe('target');
    expect(forbidden).toMatchObject({ ok: false, error: expect.stringContaining('showIn.create is false') });
    expect(calls).toMatchObject({ createExecutor: 1, updateExecutor: 1 });

    let createChecks = 0;
    resource.resourceConfig.options.allowedActions.create = () => ++createChecks === 1;
    adminforth.config.auth = { rateLimit: [] };
    adminforth.activatedPlugins = [];
    adminforth.connectors.main = resource.dataConnector;
    const endpoints: Record<string, any> = {};
    new AdminForthRestAPI(adminforth).registerEndpoints({
      endpoint: (endpoint: any) => { endpoints[endpoint.path] = endpoint; },
    } as any);
    const requestRecord = { record_id: 'target-1' } as any;
    const restResult = await endpoints['/create_record'].handler({
      body: { resourceId: 'users', record: requestRecord, requiredColumnsToSkip: [] },
      adminUser: {},
      query: {},
      headers: {},
      cookies: [],
      requestUrl: '',
      response: {},
    });

    expect(restResult).toMatchObject({ ok: true, newRecordId: 1 });
    expect(requestRecord.resource_id).toBe('target');
    expect(createChecks).toBe(1);

    let editChecks = 0;
    resource.resourceConfig.options.allowedActions.edit = () => ++editChecks === 1;
    const editRecord = { record_id: 'target-1' } as any;
    const editResult = await endpoints['/update_record'].handler({
      body: { resourceId: 'users', recordId: 1, record: editRecord },
      adminUser: {},
      query: {},
      headers: {},
      cookies: [],
      requestUrl: '',
      response: {},
    });

    expect(editResult).toMatchObject({ ok: true });
    expect(editRecord.resource_id).toBe('target');
    expect(editChecks).toBe(1);

    resource.resourceConfig.options.allowedActions.edit = true;
    await scoped.update(1, { record_id: null });
    expect(seenWrites.update.updates.resource_id).toBe('system');
  });

  it('consumes a REST ACL grant only once for the same user, resource, and record', async () => {
    const { adminforth, calls, resource } = setup();
    const adminUser = {} as any;
    const record = { name: 'Jane' };
    const meta = { allowed: true };
    const access = await authorizeResourceOperation(
      adminUser, resource.resourceConfig, meta, ActionCheckSource.CreateRequest,
      AllowedActionsEnum.create, adminforth, record,
    );
    expect(access.error).toBeNull();

    resource.resourceConfig.options.allowedActions.create = false;
    const scopedOptions = { meta, [RESOURCE_ACCESS_GRANT]: access.grant };
    const scoped = resource.asUser(adminUser, scopedOptions);
    await expect(scoped.create(record)).resolves.toMatchObject({ ok: true });
    await expect(scoped.create(record)).resolves.toMatchObject({ ok: false, error: 'Action is not allowed' });
    expect(calls.createExecutor).toBe(1);
  });

  it('applies the full user-scoped update path to an empty update', async () => {
    const denied = setup();
    const deniedResult = await denied.resource.asUser({} as any, { meta: { allowed: false } }).update(1, {});

    expect(deniedResult).toMatchObject({ ok: false, error: 'Action is not allowed' });
    expect(denied.calls).toMatchObject({ beforeList: 1, updateExecutor: 0 });

    const allowed = setup();
    const allowedResult = await allowed.resource.asUser({} as any, { meta: { allowed: true } }).update(1, {});

    expect(allowedResult).toMatchObject({ ok: true });
    expect(allowed.calls).toMatchObject({ beforeList: 1, updateExecutor: 1 });
  });

  it('requires list and show access for asUser() aggregations', async () => {
    const { calls, resource } = setup();

    await expect(
      resource.asUser({} as any, { meta: { allowed: false } }).aggregate([], { total: { operation: 'count' } } as any),
    ).rejects.toThrow('Action is not allowed');
    expect(calls).toMatchObject({ connectorAggregate: 0 });
  });

  it('refuses to aggregate, group by, or filter on columns the user cannot read', async () => {
    const { calls, resource } = setup();
    const scoped = resource.asUser({} as any, { meta: { allowed: true } });

    await expect(scoped.aggregate([], { max: { operation: 'max', field: 'private' } } as any))
      .rejects.toThrow('cannot be aggregated (backendOnly is true)');
    await expect(scoped.aggregate([], { total: { operation: 'count' } } as any, { field: 'private' } as any))
      .rejects.toThrow('cannot be aggregated (backendOnly is true)');
    await expect(scoped.aggregate(
      { field: 'private', operator: 'eq', value: 'hidden' } as any,
      { total: { operation: 'count' } } as any,
    )).rejects.toThrow('Filter: column "private" cannot be used');

    expect(calls).toMatchObject({ connectorAggregate: 0 });

    const allowed = await scoped.aggregate([], { max: { operation: 'max', field: 'name' } } as any);
    expect(allowed).toEqual([{ total: 1 }]);
    expect(calls).toMatchObject({ connectorAggregate: 1 });
  });

  it('refuses to filter backendOnly columns through user-scoped reads', async () => {
    const { calls, resource } = setup();
    const scoped = resource.asUser({} as any, { meta: { allowed: true } });
    const privateFilter = { field: 'private', operator: 'eq', value: 'hidden' } as any;

    await expect(scoped.get(privateFilter)).rejects.toThrow('Filter: column "private" cannot be used');
    await expect(scoped.list(privateFilter)).rejects.toThrow('Filter: column "private" cannot be used');
    await expect(scoped.count(privateFilter)).rejects.toThrow('Filter: column "private" cannot be used');

    expect(calls).toMatchObject({ connectorGetData: 0, connectorCount: 0, beforeList: 0 });
  });

  it('row-scopes aggregate and count through the same read hooks as list', async () => {
    const { calls, seenFilters, resource } = setup();
    const scoped = resource.asUser({} as any, { meta: { allowed: true } });
    const tenantFilter = { field: 'tenant', operator: 'eq', value: 't1' };

    await scoped.aggregate([], { total: { operation: 'count' } } as any, { field: 'name' } as any);
    await scoped.count([]);

    // without this an aggregation reports across every tenant's rows
    expect(seenFilters.aggregate).toContainEqual(tenantFilter);
    expect(seenFilters.count).toContainEqual(tenantFilter);
    expect(calls).toMatchObject({ beforeList: 2, connectorAggregate: 1, connectorCount: 1 });
  });

  it('does not row-scope reads on the bare API', async () => {
    const { calls, seenFilters, resource } = setup();
    await resource.aggregate([], { total: { operation: 'count' } } as any);
    await resource.count([]);

    expect(seenFilters.aggregate).toEqual([]);
    expect(seenFilters.count).toEqual([]);
    expect(calls).toMatchObject({ beforeList: 0 });
  });

});
