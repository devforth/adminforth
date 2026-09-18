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
  IScopedOperationalResource,
  OperationalResourceUserOptions,
  UpdateResourceRecordParams,
  UpdateResourceRecordResult,
} from '../types/Back.js';
import { Filters } from '../types/Back.js';
import { ActionCheckSource, AllowedActionsEnum, type AdminUser } from '../types/Common.js';
import {
  columnsAggregatableError,
  filterColumnsReadableError,
  recordWriteError,
  sortColumnsReadableError,
  stripReadForbiddenColumns,
  type ColumnAccessContext,
} from './columnAccess.js';
import { consumeResourceAccessGrant, interpretResource, RESOURCE_ACCESS_GRANT } from './resourceAccess.js';
import { filtersTools } from './filtersTools.js';
import { hookResponseError, listify } from './utils.js';
import { resolvePolymorphicReferences } from './polymorphicReferences.js';
import type OperationalResource from './operationalResource.js';

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

/** Hook-running write paths, supplied by AdminForth. */
export interface ResourceHookExecutors {
  create(params: CreateResourceRecordParams): Promise<CreateResourceRecordResult>;
  update(params: UpdateResourceRecordParams): Promise<UpdateResourceRecordResult>;
  delete(params: DeleteResourceRecordParams, cascadeChildren?: boolean, bulkHooks?: boolean): Promise<DeleteResourceRecordResult>;
}


/**
 * Resource API bound to an authenticated admin user. Every operation enforces the resource ACL
 * and the column access rules, and runs the resource lifecycle hooks.
 */
export default class UserScopedResource implements IScopedOperationalResource {
  readonly dataConnector: IAdminForthDataSourceConnectorBase;
  readonly resourceConfig: AdminForthResource;

  constructor(
    private readonly data: OperationalResource,
    private readonly adminforth: IAdminForth,
    private readonly executors: ResourceHookExecutors,
    private readonly adminUser: AdminUser,
    private readonly options: OperationalResourceUserOptions & { [RESOURCE_ACCESS_GRANT]?: object },
  ) {
    this.dataConnector = data.dataConnector;
    this.resourceConfig = data.resourceConfig;
  }

  private get meta(): any {
    return this.options.meta ?? {};
  }

  private columnCtx(source: ActionCheckSource, meta: any = this.meta): ColumnAccessContext {
    return {
      adminUser: this.adminUser,
      resource: this.resourceConfig,
      meta,
      source,
      adminforth: this.adminforth,
    };
  }

  /** @returns the reason the operation is not allowed, or null when it is. */
  private async accessError(operation: GuardedOperation, meta: any = this.meta): Promise<string | null> {
    const [action, source] = OPERATION_ACCESS[operation];
    const { allowedActions } = await interpretResource(
      this.adminUser,
      this.resourceConfig,
      meta,
      source,
      this.adminforth,
    );
    const allowed = allowedActions[action] as boolean | string | undefined;
    return allowed === true ? null : typeof allowed === 'string' ? allowed : 'Action is not allowed';
  }

  /**
   * Runs one phase of the resource read hooks. `beforeDatasourceRequest` may narrow `query`
   * (this is how row-level multi-tenancy is expressed); `afterDatasourceResponse` may rewrite
   * the records it is handed.
   */
  private async runReadHooks(
    page: 'show' | 'list',
    phase: 'beforeDatasourceRequest' | 'afterDatasourceResponse',
    query: any,
    records?: any[],
  ): Promise<void> {
    const hooks = listify(this.resourceConfig.hooks?.[page]?.[phase]);
    if (!hooks.length) {
      return;
    }

    for (const hook of hooks) {
      const payload: any = {
        resource: this.resourceConfig,
        query,
        adminUser: this.adminUser,
        extra: this.options.extra ?? {
          body: query,
          query: {},
          headers: {},
          cookies: [],
          requestUrl: '',
          response: this.options.response,
        },
        adminforth: this.adminforth,
      };

      if (phase === 'beforeDatasourceRequest') {
        // hooks reach these either as their own argument or off the query, and the documented
        // spelling is query.filtersTools — so both have to be present, same as the REST path
        payload.filtersTools = filtersTools.get(query);
        query.filtersTools = payload.filtersTools;
      } else {
        payload.response = records;
      }

      const error = hookResponseError(await hook(payload));
      if (error) {
        throw new Error(error.error);
      }
    }
  }

  /**
   * Finds a record through the list scope before a mutation. A primary-key connector lookup
   * would bypass tenant filters installed by `beforeDatasourceRequest` hooks.
   */
  private async findScopedRecord(primaryKey: any): Promise<any | null> {
    const keyColumns = this.resourceConfig.columns.filter((column) => column.primaryKey);
    // Connectors own composite recordId interpretation. A scalar key needs no extra lookup.
    let identityFilters: ReturnType<typeof Filters.EQ>[];
    if (keyColumns.length === 1) {
      identityFilters = [Filters.EQ(keyColumns[0].name, primaryKey)];
    } else {
      const candidate = await this.dataConnector.getRecordByPrimaryKey(this.resourceConfig, primaryKey);
      if (!candidate) {
        return null;
      }
      identityFilters = keyColumns.map((column) => Filters.EQ(column.name, candidate[column.name]));
    }
    const query = {
      filters: identityFilters.map((filter) => ({ ...filter })),
      limit: 1,
      offset: 0,
      sort: [],
    };
    await this.runReadHooks('list', 'beforeDatasourceRequest', query);
    const scopedFilters = this.dataConnector.validateAndNormalizeInputFilters(query.filters);
    return this.data.get(Filters.AND(...identityFilters, scopedFilters));
  }

  async get(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>): Promise<any | null> {
    const accessError = await this.accessError('get');
    if (accessError) {
      throw new Error(accessError);
    }

    const filterError = await filterColumnsReadableError(
      this.columnCtx(ActionCheckSource.ShowRequest),
      filter,
    );
    if (filterError) {
      throw new Error(filterError);
    }

    const query = { filters: filter, limit: 1, offset: 0, sort: [] };
    await this.runReadHooks('show', 'beforeDatasourceRequest', query);
    const record = await this.data.get(query.filters);
    const records = record ? [record] : [];

    if (record) {
      await stripReadForbiddenColumns(this.columnCtx(ActionCheckSource.ShowRequest), record);
    }
    await this.runReadHooks('show', 'afterDatasourceResponse', query, records);
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

    const filterError = await filterColumnsReadableError(
      this.columnCtx(ActionCheckSource.ListRequest),
      filter,
    );
    if (filterError) {
      throw new Error(filterError);
    }

    const sortError = await sortColumnsReadableError(
      this.columnCtx(ActionCheckSource.ListRequest),
      sort,
    );
    if (sortError) {
      throw new Error(sortError);
    }

    const query = { filters: filter, limit, offset, sort };
    await this.runReadHooks('list', 'beforeDatasourceRequest', query);
    const data = await this.data.list(query.filters, query.limit, query.offset, query.sort, columns);

    const ctx = this.columnCtx(ActionCheckSource.ListRequest);
    for (const record of data) {
      await stripReadForbiddenColumns(ctx, record);
    }
    await this.runReadHooks('list', 'afterDatasourceResponse', query, data);
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

    const columnError = await columnsAggregatableError(
      this.columnCtx(ActionCheckSource.ShowRequest),
      { aggregations, groupBy, filters: filter },
    );
    if (columnError) {
      throw new Error(columnError);
    }

    // An aggregation reads the same rows a list does, so the row-scoping hooks have to narrow
    // it too, or groupBy/min/max/sum report across every tenant. They run after the column check
    // above, so that check still sees the caller's own filters. Only the request phase runs: the
    // response here is aggregated rows, not records an after hook could process.
    const query = { filters: filter, aggregations, groupBy, limit: null, offset: 0, sort: [] };
    await this.runReadHooks('list', 'beforeDatasourceRequest', query);

    return this.data.aggregate(query.filters, aggregations, groupBy);
  }

  async count(filter?: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter> | undefined): Promise<number> {
    const accessError = await this.accessError('count');
    if (accessError) {
      throw new Error(accessError);
    }

    const filterError = await filterColumnsReadableError(
      this.columnCtx(ActionCheckSource.ListRequest),
      filter,
    );
    if (filterError) {
      throw new Error(filterError);
    }

    // a count is a list the caller only learns the size of, so it is row-scoped the same way
    const query = { filters: filter, limit: null, offset: 0, sort: [] };
    await this.runReadHooks('list', 'beforeDatasourceRequest', query);

    return this.data.count(query.filters);
  }

  async create(recordValues: any): Promise<CreateResourceRecordResult & { ok: boolean; createdRecord: any }> {
    const accessError = consumeResourceAccessGrant(
      this.options[RESOURCE_ACCESS_GRANT], this.adminUser, this.resourceConfig,
      AllowedActionsEnum.create, recordValues,
    ) ? null : await this.accessError('create');
    if (accessError) {
      return { ok: false, createdRecord: undefined, error: accessError };
    }

    const columnError = await recordWriteError(
      this.columnCtx(ActionCheckSource.CreateRequest),
      recordValues,
      'create',
    );
    if (columnError) {
      return { ok: false, createdRecord: undefined, error: columnError };
    }

    await resolvePolymorphicReferences(this.resourceConfig, recordValues, this.adminforth);

    const result = await this.executors.create({
      resource: this.resourceConfig,
      record: recordValues,
      adminUser: this.adminUser,
      extra: this.options.extra,
      response: this.options.response,
    });
    return { ...result, ok: !result.error, createdRecord: result.createdRecord };
  }

  async update(primaryKey: any, record: any): Promise<any> {
    const scopedRecord = await this.findScopedRecord(primaryKey);
    if (!scopedRecord) {
      const primaryKeyColumn = this.resourceConfig.columns.find((column) => column.primaryKey);
      return { ok: false, error: `Record with ${primaryKeyColumn.name} ${primaryKey} not found` };
    }
    const oldRecord = this.options.oldRecord ?? scopedRecord;
    const meta = { ...this.meta, newRecord: record, oldRecord: scopedRecord, pk: primaryKey };
    const accessError = consumeResourceAccessGrant(
      this.options[RESOURCE_ACCESS_GRANT], this.adminUser, this.resourceConfig,
      AllowedActionsEnum.edit, record, primaryKey,
    ) ? null : await this.accessError('update', meta);
    if (accessError) {
      return { ok: false, error: accessError };
    }

    const columnError = await recordWriteError(
      this.columnCtx(ActionCheckSource.EditRequest, meta),
      record,
      'edit',
    );
    if (columnError) {
      return { ok: false, error: columnError };
    }

    await resolvePolymorphicReferences(this.resourceConfig, record, this.adminforth, scopedRecord);

    const result = await this.executors.update({
      resource: this.resourceConfig,
      recordId: primaryKey,
      updates: record,
      oldRecord,
      adminUser: this.adminUser,
      extra: this.options.extra,
      response: this.options.response,
    });
    return { ...result, ok: !result.error };
  }

  async delete(primaryKey: any): Promise<boolean> {
    const scopedRecord = await this.findScopedRecord(primaryKey);
    if (!scopedRecord) {
      return false;
    }
    const record = this.options.record ?? scopedRecord;

    const accessError = await this.accessError('delete', { ...this.meta, record: scopedRecord, pk: primaryKey });
    if (accessError) {
      throw new Error(accessError);
    }

    const { error } = await this.executors.delete({
      resource: this.resourceConfig,
      recordId: primaryKey,
      record,
      adminUser: this.adminUser,
      extra: this.options.extra,
      response: this.options.response,
    }, true, this.options.bulkDeleteHooks);
    if (error) {
      throw new Error(error);
    }
    return true;
  }
}
