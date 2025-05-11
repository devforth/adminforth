import { IAdminForthSingleFilter, IAdminForthAndOrFilter, IAdminForthSort, IOperationalResource, IAdminForthDataSourceConnectorBase, AdminForthResource } from '../types/Back.js';
import { AdminForthFilterOperators } from '../types/Common.js';

function sortsIfSort(sort: IAdminForthSort | IAdminForthSort[]): IAdminForthSort[] {
  return (Array.isArray(sort) ? sort : [sort]) as IAdminForthSort[];
}

export default class OperationalResource implements IOperationalResource {
  dataConnector: IAdminForthDataSourceConnectorBase;
  resourceConfig: AdminForthResource;

  constructor(dataConnector: IAdminForthDataSourceConnectorBase, resourceConfig: AdminForthResource) {
    this.dataConnector = dataConnector;
    this.resourceConfig = resourceConfig;
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
      sort: IAdminForthSort | IAdminForthSort[] = []
  ): Promise<any[]> {
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

    const { data } = await this.dataConnector.getData({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
      limit: appliedLimit,
      offset: appliedOffset,
      sort: sortsIfSort(sort),
      getTotals: false,
    });
    return data;
  }


  async count(filter?: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter> | undefined): Promise<number> {
    return await this.dataConnector.getCount({
      resource: this.resourceConfig,
      filters: this.dataConnector.validateAndNormalizeInputFilters(filter),
    });
  }

  async create(recordValues: any): Promise<{ ok: boolean; createdRecord: any; error?: string; }> {
    const { ok, createdRecord, error } = await this.dataConnector.createRecord({ 
      resource: this.resourceConfig, 
      record: recordValues, 
      adminUser: null 
    });
    return { ok, createdRecord, error };
  }

  async update(primaryKey: any, record: any): Promise<any> {
    return await this.dataConnector.updateRecord({ 
      resource: this.resourceConfig,
      recordId: primaryKey,
      newValues: record
    });
  }

  async delete(primaryKey: any): Promise<boolean> {
    return await this.dataConnector.deleteRecord({ resource: this.resourceConfig, recordId: primaryKey });
  }

}