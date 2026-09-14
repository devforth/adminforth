import type {
  AdminForthResource,
  CreateResourceRecordParams,
  CreateResourceRecordResult,
  DeleteResourceRecordParams,
  DeleteResourceRecordResult,
  IAdminForth,
  IAdminForthAndOrFilter,
  IAdminForthDataSourceConnectorBase,
  IAdminForthSingleFilter,
  IAdminForthSort,
  IAggregationRule,
  IGroupByRule,
  IOperationalResource,
  IScopedOperationalResource,
  OperationalResourceSystemOptions,
  OperationalResourceUserOptions,
  UpdateResourceRecordParams,
  UpdateResourceRecordResult,
} from '../types/Back.js';
import { ActionCheckSource, AllowedActionsEnum, type AdminUser } from '../types/Common.js';
import { compositePkValues } from './recordId.js';
import { normalizeRecordValues } from './columnValueNormalizer.js';
import {
  columnsAggregatableError,
  recordWriteError,
  stripReadForbiddenColumns,
  type ColumnAccessContext,
} from './columnAccess.js';
import { interpretResource } from './resourceAccess.js';
import { filtersTools } from './filtersTools.js';
import { cascadeChildrenDelete, hookResponseError, listify } from './utils.js';
import { afLogger } from './logger.js';

type ResourceScope =
  | {
      type: 'user';
      adminUser: AdminUser;
      options: OperationalResourceUserOptions;
    }
  | {
      type: 'system';
      adminUser: AdminUser | null;
      options: OperationalResourceSystemOptions;
    };

/**
 * Which resource permission guards which operation, and which check source the permission
 * callbacks are told about. Kept as one table so the whole mapping can be audited at a glance
 * instead of being read out of seven method bodies.
 */
const OPERATION_ACCESS = {
  get: [AllowedActionsEnum.show, ActionCheckSource.ShowRequest],
  list: [AllowedActionsEnum.list, ActionCheckSource.ListRequest],
  count: [AllowedActionsEnum.list, ActionCheckSource.ListRequest],
  create: [AllowedActionsEnum.create, ActionCheckSource.CreateRequest],
  update: [AllowedActionsEnum.edit, ActionCheckSource.EditRequest],
  delete: [AllowedActionsEnum.delete, ActionCheckSource.DeleteRequest],
} as const;

type GuardedOperation = keyof typeof OPERATION_ACCESS;

const warnedUnscopedOperations = new Set<string>();

export interface OperationalResourceExecutors {
  create(params: CreateResourceRecordParams): Promise<CreateResourceRecordResult>;
  update(params: UpdateResourceRecordParams): Promise<UpdateResourceRecordResult>;
  delete(params: DeleteResourceRecordParams): Promise<DeleteResourceRecordResult>;
  validate(resource: AdminForthResource, record: any, mode: 'create' | 'edit'): string | null;
}

function sortsIfSort(sort: IAdminForthSort | IAdminForthSort[]): IAdminForthSort[] {
  return (Array.isArray(sort) ? sort : [sort]) as IAdminForthSort[];
}

/**
 * Resource API bound to a trust level. `scope` is always present here, so every method can ask
 * for permissions and column access without re-deciding whether it is allowed to.
 */
class ScopedOperationalResource implements IScopedOperationalResource {
  constructor(
    public dataConnector: IAdminForthDataSourceConnectorBase,
    public resourceConfig: AdminForthResource,
    private readonly adminforth: IAdminForth,
    private readonly executors: OperationalResourceExecutors,
    private readonly scope: ResourceScope,
  ) {}

  private get meta(): any {
    return this.scope.options.meta ?? {};
  }

  private get hooksEnabled(): boolean {
    return this.scope.type === 'user' || this.scope.options.hooks !== false;
  }

  /** Column rules only restrict what a real user may touch; system scopes are trusted. */
  private columnCtx(source: ActionCheckSource, meta: any = this.meta): ColumnAccessContext | null {
    if (this.scope.type !== 'user') {
      return null;
    }
    return {
      adminUser: this.scope.adminUser,
      resource: this.resourceConfig,
      meta,
      source,
      adminforth: this.adminforth,
    };
  }

  /** @returns the reason the operation is not allowed, or null when it is. */
  private async accessError(operation: GuardedOperation, meta: any = this.meta): Promise<string | null> {
    if (this.scope.type !== 'user') {
      return null;
    }

    const [action, source] = OPERATION_ACCESS[operation];
    const { allowedActions } = await interpretResource(
      this.scope.adminUser,
      this.resourceConfig,
      meta,
      source,
      this.adminforth,
    );
    const allowed = allowedActions[action] as boolean | string | undefined;
    return allowed === true ? null : typeof allowed === 'string' ? allowed : 'Action is not allowed';
  }

  private readHookExtra(query: any) {
    return this.scope.options.extra ?? {
      body: query,
      query: {},
      headers: {},
      cookies: [],
      requestUrl: '',
      response: this.scope.options.response,
    };
  }

  private async runBeforeReadHooks(page: 'show' | 'list', query: any): Promise<void> {
    if (!this.hooksEnabled) {
      return;
    }

    for (const hook of listify(this.resourceConfig.hooks?.[page]?.beforeDatasourceRequest)) {
      const tools = filtersTools.get(query);
      // hooks reach these either as their own argument or off the query, and the documented
      // spelling is query.filtersTools — so both have to be present, same as the REST path
      query.filtersTools = tools;
      const response = await hook({
        resource: this.resourceConfig,
        query,
        adminUser: this.scope.adminUser,
        filtersTools: tools,
        extra: this.readHookExtra(query),
        adminforth: this.adminforth,
      });
      const error = hookResponseError(response);
      if (error) {
        throw new Error(error.error);
      }
    }
  }

  private async runAfterReadHooks(page: 'show' | 'list', query: any, records: any[]): Promise<void> {
    if (!this.hooksEnabled) {
      return;
    }

    for (const hook of listify(this.resourceConfig.hooks?.[page]?.afterDatasourceResponse)) {
      const response = await hook({
        resource: this.resourceConfig,
        query,
        response: records,
        adminUser: this.scope.adminUser,
        extra: this.readHookExtra(query),
        adminforth: this.adminforth,
      });
      const error = hookResponseError(response);
      if (error) {
        throw new Error(error.error);
      }
    }
  }

  async get(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>): Promise<any | null> {
    const accessError = await this.accessError('get');
    if (accessError) {
      throw new Error(accessError);
    }

    const query = {
      filters: filter,
      limit: 1,
      offset: 0,
      sort: [],
    };
    await this.runBeforeReadHooks('show', query);
    const records = (
      await this.dataConnector.getData({
        resource: this.resourceConfig,
        filters: this.dataConnector.validateAndNormalizeInputFilters(query.filters),
        limit: query.limit,
        offset: query.offset,
        sort: query.sort,
      })
    ).data;

    const record = records[0] || null;
    const ctx = this.columnCtx(ActionCheckSource.ShowRequest);
    if (record && ctx) {
      await stripReadForbiddenColumns(ctx, record);
    }
    await this.runAfterReadHooks('show', query, records);
    return record;
  }

  async list(
      filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>,
      limit: number | null = null,
      offset: number | null = null,
      sort: IAdminForthSort | IAdminForthSort[] = [],
      columns?: string[]
  ): Promise<any[]> {
    const accessError = await this.accessError('list');
    if (accessError) {
      throw new Error(accessError);
    }

    // check if type of limit and offset is number
    if (limit !== null && typeof limit !== 'number') {
      throw new Error('Limit must be a number');
    }
    if (offset !== null && typeof offset !== 'number') {
      throw new Error('Offset must be a number');
    }

    const query = {
      filters: filter,
      limit: limit === null ? 1000000000 : limit,
      offset: offset === null ? 0 : offset,
      sort: sortsIfSort(sort),
    };
    await this.runBeforeReadHooks('list', query);
    const { data } = await this.dataConnector.getData({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(query.filters),
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      getTotals: false,
      columns: columns ? this.resourceConfig.dataSourceColumns.filter((column) => columns.includes(column.name)) : undefined,
    });

    const ctx = this.columnCtx(ActionCheckSource.ListRequest);
    if (ctx) {
      for (const record of data) {
        await stripReadForbiddenColumns(ctx, record);
      }
    }
    await this.runAfterReadHooks('list', query, data);
    return data;
  }

  async aggregate(
    filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>,
    aggregations: { [alias: string]: IAggregationRule },
    groupBy?: IGroupByRule | IGroupByRule[]
  ): Promise<Array<{ group?: string, [key: string]: any }>> {
    // an aggregation reads a whole set of records at once, so it needs list access, and its
    // min/max/groupBy return raw per-field values, which is what the show view does
    const accessError = (await this.accessError('list')) ?? (await this.accessError('get'));
    if (accessError) {
      throw new Error(accessError);
    }

    const ctx = this.columnCtx(ActionCheckSource.ShowRequest);
    if (ctx) {
      const columnError = await columnsAggregatableError(ctx, { aggregations, groupBy, filters: filter });
      if (columnError) {
        throw new Error(columnError);
      }
    }

    // Row-scoping hooks are how multi-tenancy is expressed, and an aggregation reads the same
    // rows a list does, so it has to be narrowed by them too — otherwise groupBy/min/max/sum
    // report across every tenant. They run after the column check above, so that check still
    // sees the caller's own filters and cannot be tripped by a filter a trusted hook added.
    // Only the request side runs: the response here is aggregated rows, not records an
    // afterDatasourceResponse hook could meaningfully process.
    const query = { filters: filter, aggregations, groupBy, limit: null, offset: 0, sort: [] };
    await this.runBeforeReadHooks('list', query);

    return this.dataConnector.aggregate({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(query.filters),
      aggregations,
      groupBy,
    });
  }

  async count(filter?: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter> | undefined): Promise<number> {
    const accessError = await this.accessError('count');
    if (accessError) {
      throw new Error(accessError);
    }

    // a count is a list the caller only learns the size of, so it is row-scoped the same way
    const query = { filters: filter, limit: null, offset: 0, sort: [] };
    await this.runBeforeReadHooks('list', query);

    return await this.dataConnector.getCount({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(query.filters),
    });
  }

  async create(recordValues: any): Promise<CreateResourceRecordResult & { ok: boolean; createdRecord: any }> {
    const accessError = await this.accessError('create');
    if (accessError) {
      return { ok: false, createdRecord: undefined, error: accessError };
    }

    const ctx = this.columnCtx(ActionCheckSource.CreateRequest);
    const columnError = ctx && await recordWriteError(ctx, recordValues, 'create');
    if (columnError) {
      return { ok: false, createdRecord: undefined, error: columnError };
    }

    if (this.hooksEnabled) {
      const result = await this.executors.create({
        resource: this.resourceConfig,
        record: recordValues,
        adminUser: this.scope.adminUser,
        extra: this.scope.options.extra,
        response: this.scope.options.response,
      });
      return { ...result, ok: !result.error, createdRecord: result.createdRecord };
    }

    const normalizedRecord = { ...recordValues };
    normalizeRecordValues(this.resourceConfig, normalizedRecord);
    const validationError = this.executors.validate(this.resourceConfig, normalizedRecord, 'create');
    if (validationError) {
      return { ok: false, createdRecord: undefined, error: validationError };
    }

    const { ok, createdRecord, error } = await this.dataConnector.createRecord({
      resource: this.resourceConfig,
      record: normalizedRecord,
      adminUser: this.scope.adminUser,
    });
    return { ok, createdRecord, error };
  }

  async update(primaryKey: any, record: any): Promise<any> {
    if (Object.keys(record).length === 0) {
      return { ok: true };
    }

    if (!this.hooksEnabled) {
      const normalizedRecord = { ...record };
      normalizeRecordValues(this.resourceConfig, normalizedRecord);
      const validationError = this.executors.validate(this.resourceConfig, normalizedRecord, 'edit');
      if (validationError) {
        return { ok: false, error: validationError };
      }
      return this.dataConnector.updateRecord({
        resource: this.resourceConfig,
        recordId: primaryKey,
        newValues: normalizedRecord,
      });
    }

    const oldRecord = this.scope.options.oldRecord
      ?? await this.dataConnector.getRecordByPrimaryKey(this.resourceConfig, primaryKey);
    if (!oldRecord) {
      const primaryKeyColumn = this.resourceConfig.columns.find((column) => column.primaryKey);
      return { ok: false, error: `Record with ${primaryKeyColumn.name} ${primaryKey} not found` };
    }

    const meta = { ...this.meta, newRecord: record, oldRecord, pk: primaryKey };

    const accessError = await this.accessError('update', meta);
    if (accessError) {
      return { ok: false, error: accessError };
    }

    const ctx = this.columnCtx(ActionCheckSource.EditRequest, meta);
    const columnError = ctx && await recordWriteError(ctx, record, 'edit');
    if (columnError) {
      return { ok: false, error: columnError };
    }

    const result = await this.executors.update({
      resource: this.resourceConfig,
      recordId: primaryKey,
      updates: record,
      oldRecord,
      adminUser: this.scope.adminUser,
      extra: this.scope.options.extra,
      response: this.scope.options.response,
    });
    return { ...result, ok: !result.error };
  }

  async delete(primaryKey: any): Promise<boolean> {
    if (!this.hooksEnabled) {
      return this.dataConnector.deleteRecord({
        resource: this.resourceConfig,
        recordId: primaryKey,
        pkValues: compositePkValues(this.dataConnector, this.resourceConfig, primaryKey),
      });
    }

    const record = this.scope.options.record
      ?? await this.dataConnector.getRecordByPrimaryKey(this.resourceConfig, primaryKey);
    if (!record) {
      return false;
    }

    const accessError = await this.accessError('delete', { ...this.meta, record, pk: primaryKey });
    if (accessError) {
      throw new Error(accessError);
    }

    const { error: cascadeError } = await cascadeChildrenDelete(
      this.resourceConfig,
      primaryKey,
      { adminUser: this.scope.adminUser, response: this.scope.options.response },
      this.adminforth,
    );
    if (cascadeError) {
      throw new Error(cascadeError);
    }

    const { error } = await this.executors.delete({
      resource: this.resourceConfig,
      recordId: primaryKey,
      record,
      adminUser: this.scope.adminUser,
      extra: this.scope.options.extra,
      response: this.scope.options.response,
    });
    if (error) {
      throw new Error(error);
    }
    return true;
  }
}

/**
 * Entry point returned by `adminforth.resource(id)`. It carries no trust level of its own —
 * pick one with `asUser()` or `asSystem()`. The bare operations are deprecated aliases of
 * `asSystem({ hooks: false })`, kept for backward compatibility.
 */
export default class OperationalResource implements IOperationalResource {
  constructor(
    public dataConnector: IAdminForthDataSourceConnectorBase,
    public resourceConfig: AdminForthResource,
    private readonly adminforth: IAdminForth,
    private readonly executors: OperationalResourceExecutors,
  ) {}

  private scoped(scope: ResourceScope): IScopedOperationalResource {
    return new ScopedOperationalResource(
      this.dataConnector,
      this.resourceConfig,
      this.adminforth,
      this.executors,
      scope,
    );
  }

  asUser(adminUser: AdminUser, options: OperationalResourceUserOptions = {}): IScopedOperationalResource {
    return this.scoped({ type: 'user', adminUser, options });
  }

  asSystem(options: OperationalResourceSystemOptions = {}): IScopedOperationalResource {
    return this.scoped({ type: 'system', adminUser: options.adminUser ?? null, options });
  }

  /** Warns once per resource and operation, then falls back to the trusted, hook-free scope. */
  private legacy(operation: keyof IScopedOperationalResource): IScopedOperationalResource {
    const warnKey = `${this.resourceConfig.resourceId}.${operation}`;
    if (!warnedUnscopedOperations.has(warnKey)) {
      warnedUnscopedOperations.add(warnKey);
      afLogger.warn(
        `adminforth.resource('${this.resourceConfig.resourceId}').${operation}(...) is deprecated and will be removed in the next major version. `
        + `Use .asUser(adminUser, { meta }).${operation}(...) or .asSystem({ hooks: false }).${operation}(...) instead.`,
      );
    }
    return this.asSystem({ hooks: false });
  }

  /** @deprecated Use `asUser(...).get(...)` or `asSystem({ hooks: false }).get(...)`. */
  get(...args: Parameters<IScopedOperationalResource['get']>) { return this.legacy('get').get(...args); }

  /** @deprecated Use `asUser(...).list(...)` or `asSystem({ hooks: false }).list(...)`. */
  list(...args: Parameters<IScopedOperationalResource['list']>) { return this.legacy('list').list(...args); }

  /** @deprecated Use `asUser(...).count(...)` or `asSystem({ hooks: false }).count(...)`. */
  count(...args: Parameters<IScopedOperationalResource['count']>) { return this.legacy('count').count(...args); }

  /** @deprecated Use `asUser(...).aggregate(...)` or `asSystem({ hooks: false }).aggregate(...)`. */
  aggregate(...args: Parameters<IScopedOperationalResource['aggregate']>) { return this.legacy('aggregate').aggregate(...args); }

  /** @deprecated Use `asUser(...).create(...)` or `asSystem({ hooks: false }).create(...)`. */
  create(...args: Parameters<IScopedOperationalResource['create']>) { return this.legacy('create').create(...args); }

  /** @deprecated Use `asUser(...).update(...)` or `asSystem({ hooks: false }).update(...)`. */
  update(...args: Parameters<IScopedOperationalResource['update']>) { return this.legacy('update').update(...args); }

  /** @deprecated Use `asUser(...).delete(...)` or `asSystem({ hooks: false }).delete(...)`. */
  delete(...args: Parameters<IScopedOperationalResource['delete']>) { return this.legacy('delete').delete(...args); }
}
