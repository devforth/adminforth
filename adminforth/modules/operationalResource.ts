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
import { assertColumnsAggregatable, assertRecordWritable, stripReadForbiddenColumns } from './columnAccess.js';
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

export default class OperationalResource implements IOperationalResource {
  dataConnector: IAdminForthDataSourceConnectorBase;
  resourceConfig: AdminForthResource;

  constructor(
    dataConnector: IAdminForthDataSourceConnectorBase,
    resourceConfig: AdminForthResource,
    private readonly adminforth: IAdminForth,
    private readonly executors: OperationalResourceExecutors,
    private readonly scope?: ResourceScope,
  ) {
    this.dataConnector = dataConnector;
    this.resourceConfig = resourceConfig;
  }

  asUser(adminUser: AdminUser, options: OperationalResourceUserOptions = {}): IScopedOperationalResource {
    return new OperationalResource(
      this.dataConnector,
      this.resourceConfig,
      this.adminforth,
      this.executors,
      { type: 'user', adminUser, options },
    );
  }

  asSystem(options: OperationalResourceSystemOptions = {}): IScopedOperationalResource {
    return new OperationalResource(
      this.dataConnector,
      this.resourceConfig,
      this.adminforth,
      this.executors,
      { type: 'system', adminUser: options.adminUser ?? null, options },
    );
  }

  private async actionError(
    action: AllowedActionsEnum,
    source: ActionCheckSource,
    meta: any,
  ): Promise<string | null> {
    if (this.scope?.type !== 'user') {
      return null;
    }

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

  private get hooksEnabled(): boolean {
    return this.scope?.type === 'user' || (this.scope?.type === 'system' && this.scope.options.hooks !== false);
  }

  private warnUnscoped(operation: keyof IScopedOperationalResource): void {
    const warnKey = `${this.resourceConfig.resourceId}.${operation}`;
    if (warnedUnscopedOperations.has(warnKey)) {
      return;
    }
    warnedUnscopedOperations.add(warnKey);
    afLogger.warn(
      `adminforth.resource('${this.resourceConfig.resourceId}').${operation}(...) is deprecated and will be removed in the next major version. `
      + `Use .asUser(adminUser, { meta }).${operation}(...) or .asSystem({ hooks: false }).${operation}(...) instead.`,
    );
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
      const response = await hook({
        resource: this.resourceConfig,
        query,
        adminUser: this.scope.adminUser,
        filtersTools: filtersTools.get(query),
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
    if (!this.scope) {
      this.warnUnscoped('get');
      return this.asSystem({ hooks: false }).get(filter);
    }

    const meta = this.scope?.options.meta ?? {};
    const accessError = await this.actionError(
      AllowedActionsEnum.show,
      ActionCheckSource.ShowRequest,
      meta,
    );
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
    if (record && this.scope?.type === 'user') {
      await stripReadForbiddenColumns({
        resource: this.resourceConfig,
        record,
        adminUser: this.scope.adminUser,
        meta,
        source: ActionCheckSource.ShowRequest,
        adminforth: this.adminforth,
      });
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
    if (!this.scope) {
      this.warnUnscoped('list');
      return this.asSystem({ hooks: false }).list(filter, limit, offset, sort, columns);
    }

    const meta = this.scope?.options.meta ?? {};
    const accessError = await this.actionError(
      AllowedActionsEnum.list,
      ActionCheckSource.ListRequest,
      meta,
    );
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

    let appliedLimit = limit;
    if (limit === null) {
      appliedLimit = 1000000000;
    }
    let appliedOffset = offset;
    if (offset === null) {
      appliedOffset = 0;
    }

    const query = {
      filters: filter,
      limit: appliedLimit,
      offset: appliedOffset,
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
    if (this.scope?.type === 'user') {
      for (const record of data) {
        await stripReadForbiddenColumns({
          resource: this.resourceConfig,
          record,
          adminUser: this.scope.adminUser,
          meta,
          source: ActionCheckSource.ListRequest,
          adminforth: this.adminforth,
        });
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
    if (!this.scope) {
      this.warnUnscoped('aggregate');
      return this.asSystem({ hooks: false }).aggregate(filter, aggregations, groupBy);
    }

    const meta = this.scope.options.meta ?? {};

    // aggregation reads a whole set of records at once, so it needs list access
    const listError = await this.actionError(AllowedActionsEnum.list, ActionCheckSource.ListRequest, meta);
    if (listError) {
      throw new Error(listError);
    }

    // ...and min/max/groupBy return raw per-field values, which is what the show view does,
    // so a resource with no reachable show view must not be aggregatable either
    const showError = await this.actionError(AllowedActionsEnum.show, ActionCheckSource.ShowRequest, meta);
    if (showError) {
      throw new Error(showError);
    }

    if (this.scope.type === 'user') {
      await assertColumnsAggregatable({
        resource: this.resourceConfig,
        aggregations,
        groupBy,
        filters: filter,
        adminUser: this.scope.adminUser,
        meta,
        adminforth: this.adminforth,
      });
    }

    return this.dataConnector.aggregate({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
      aggregations,
      groupBy,
    });
  }

  async count(filter?: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter> | undefined): Promise<number> {
    if (!this.scope) {
      this.warnUnscoped('count');
      return this.asSystem({ hooks: false }).count(filter);
    }

    const accessError = await this.actionError(
      AllowedActionsEnum.list,
      ActionCheckSource.ListRequest,
      this.scope?.options.meta ?? {},
    );
    if (accessError) {
      throw new Error(accessError);
    }
    return await this.dataConnector.getCount({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
    });
  }

  async create(recordValues: any): Promise<CreateResourceRecordResult & { ok: boolean; createdRecord: any }> {
    if (!this.scope) {
      this.warnUnscoped('create');
      return this.asSystem({ hooks: false }).create(recordValues);
    }

    const meta = this.scope.options.meta ?? {};
    const accessError = await this.actionError(
      AllowedActionsEnum.create,
      ActionCheckSource.CreateRequest,
      meta,
    );
    if (accessError) {
      return { ok: false, createdRecord: undefined, error: accessError };
    }

    if (this.scope.type === 'user') {
      try {
        await assertRecordWritable({
          resource: this.resourceConfig,
          record: recordValues,
          mode: 'create',
          adminUser: this.scope.adminUser,
          meta,
          adminforth: this.adminforth,
        });
      } catch (error) {
        return { ok: false, createdRecord: undefined, error: (error as Error).message };
      }
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
    if (!this.hooksEnabled) {
      const validationError = this.executors.validate(this.resourceConfig, normalizedRecord, 'create');
      if (validationError) {
        return { ok: false, createdRecord: undefined, error: validationError };
      }
    }
    const { ok, createdRecord, error } = await this.dataConnector.createRecord({ 
      resource: this.resourceConfig, 
      record: normalizedRecord,
      adminUser: this.scope.adminUser,
    });
    return { ok, createdRecord, error };
  }

  async update(primaryKey: any, record: any): Promise<any> {
    if (!this.scope) {
      this.warnUnscoped('update');
      return this.asSystem({ hooks: false }).update(primaryKey, record);
    }

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

    const meta = {
      ...(this.scope.options.meta ?? {}),
      newRecord: record,
      oldRecord,
      pk: primaryKey,
    };
    const accessError = await this.actionError(
      AllowedActionsEnum.edit,
      ActionCheckSource.EditRequest,
      meta,
    );
    if (accessError) {
      return { ok: false, error: accessError };
    }

    if (this.scope.type === 'user') {
      try {
        await assertRecordWritable({
          resource: this.resourceConfig,
          record,
          mode: 'edit',
          adminUser: this.scope.adminUser,
          meta,
          adminforth: this.adminforth,
        });
      } catch (error) {
        return { ok: false, error: (error as Error).message };
      }
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
    if (!this.scope) {
      this.warnUnscoped('delete');
      return this.asSystem({ hooks: false }).delete(primaryKey);
    }

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

    const meta = {
      ...(this.scope.options.meta ?? {}),
      record,
      pk: primaryKey,
    };
    const accessError = await this.actionError(
      AllowedActionsEnum.delete,
      ActionCheckSource.DeleteRequest,
      meta,
    );
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

    const result = await this.executors.delete({
      resource: this.resourceConfig,
      recordId: primaryKey,
      record,
      adminUser: this.scope.adminUser,
      extra: this.scope.options.extra,
      response: this.scope.options.response,
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return true;
  }

}
