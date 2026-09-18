import type {
  AdminForthResource,
  CreateResourceRecordResult,
  IAdminForthAndOrFilter,
  IAdminForthDataSourceConnectorBase,
  IAdminForthSingleFilter,
  IAdminForthSort,
  IAggregationRule,
  IGroupByRule,
  IOperationalResource,
  IScopedOperationalResource,
  OperationalResourceUserOptions,
} from '../types/Back.js';
import type { AdminUser } from '../types/Common.js';
import { compositePkValues } from './recordId.js';
import { normalizeRecordValues } from './columnValueNormalizer.js';

/**
 * Builds the user-scoped layer on top of a data-access resource. Injected by AdminForth so this
 * module stays at the bottom of the stack: it knows the connector and the resource columns, and
 * nothing about permissions, actions or lifecycle hooks.
 */
export type UserScopeFactory = (
  data: OperationalResource,
  adminUser: AdminUser,
  options: OperationalResourceUserOptions,
) => IScopedOperationalResource;

function sortsIfSort(sort: IAdminForthSort | IAdminForthSort[]): IAdminForthSort[] {
  return (Array.isArray(sort) ? sort : [sort]) as IAdminForthSort[];
}

/**
 * Plain data access for one resource: talks to the connector and normalizes values.
 * It has no notion of who is asking — no permissions, no column access
 * rules, no lifecycle hooks.
 *
 * For anything a user asked for, take {@link asUser}, which adds those on top.
 */
export default class OperationalResource implements IOperationalResource {
  dataConnector: IAdminForthDataSourceConnectorBase;
  resourceConfig: AdminForthResource;

  constructor(
    dataConnector: IAdminForthDataSourceConnectorBase,
    resourceConfig: AdminForthResource,
    private readonly scopeForUser: UserScopeFactory,
  ) {
    this.dataConnector = dataConnector;
    this.resourceConfig = resourceConfig;
  }

  asUser(adminUser: AdminUser, options: OperationalResourceUserOptions = {}): IScopedOperationalResource {
    return this.scopeForUser(this, adminUser, options);
  }

  async get(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>): Promise<any | null> {
    return (
      await this.dataConnector.getData({
        resource: this.resourceConfig,
        filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
        limit: 1,
        offset: 0,
        sort: [],
      })
    ).data[0] || null;
  }

  async list(
      filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>,
      limit: number | null = null,
      offset: number | null = null,
      sort: IAdminForthSort | IAdminForthSort[] = [],
      columns?: string[]
  ): Promise<any[]> {
    if (limit !== null && typeof limit !== 'number') {
      throw new Error('Limit must be a number');
    }
    if (offset !== null && typeof offset !== 'number') {
      throw new Error('Offset must be a number');
    }

    const { data } = await this.dataConnector.getData({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
      limit: limit === null ? 1000000000 : limit,
      offset: offset === null ? 0 : offset,
      sort: sortsIfSort(sort),
      getTotals: false,
      columns: columns ? this.resourceConfig.dataSourceColumns.filter((column) => columns.includes(column.name)) : undefined,
    });
    return data;
  }

  async aggregate(
    filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>,
    aggregations: { [alias: string]: IAggregationRule },
    groupBy?: IGroupByRule | IGroupByRule[]
  ): Promise<Array<{ group?: string, [key: string]: any }>> {
    return this.dataConnector.aggregate({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
      aggregations,
      groupBy,
    });
  }

  async count(filter?: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter> | undefined): Promise<number> {
    return await this.dataConnector.getCount({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
    });
  }

  async create(recordValues: any): Promise<CreateResourceRecordResult & { ok: boolean; createdRecord: any }> {
    const normalizedRecord = { ...recordValues };
    normalizeRecordValues(this.resourceConfig, normalizedRecord);
    const { ok, createdRecord, error } = await this.dataConnector.createRecord({
      resource: this.resourceConfig,
      record: normalizedRecord,
      adminUser: null,
    });
    return { ok, createdRecord, error };
  }

  async update(primaryKey: any, record: any): Promise<any> {
    if (Object.keys(record).length === 0) {
      return { ok: true };
    }

    const normalizedRecord = { ...record };
    normalizeRecordValues(this.resourceConfig, normalizedRecord);
    return await this.dataConnector.updateRecord({
      resource: this.resourceConfig,
      recordId: primaryKey,
      newValues: normalizedRecord,
    });
  }

  async delete(primaryKey: any): Promise<boolean> {
    return await this.dataConnector.deleteRecord({
      resource: this.resourceConfig,
      recordId: primaryKey,
      pkValues: compositePkValues(this.dataConnector, this.resourceConfig, primaryKey),
    });
  }
}
