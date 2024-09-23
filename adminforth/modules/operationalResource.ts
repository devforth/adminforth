import { error } from 'console';
import { IAdminForthFilter, IAdminForthSort, IOperationalResource, IAdminForthDataSourceConnectorBase, AdminForthResource, IAdminForth } from '../types/AdminForthConfig.js';


function filtersIfFilter(filter: IAdminForthFilter | IAdminForthFilter[] | undefined): IAdminForthFilter[] {
  if (!filter) {
    return [];
  }
  return (Array.isArray(filter) ? filter : [filter]) as IAdminForthFilter[];
}

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

  async get(filter: IAdminForthFilter | IAdminForthFilter[]): Promise<any | null> {
    return (
      await this.dataConnector.getData({
        resource: this.resourceConfig,
        filters: filtersIfFilter(filter),
        limit: 1,
        offset: 0,
        sort: [],
      })
    ).data[0] || null;
  }

  async list(
      filter: IAdminForthFilter | IAdminForthFilter[], 
      limit: number | null, 
      offset: number | null, 
      sort: IAdminForthSort | IAdminForthSort[]
  ): Promise<any[]> {
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
      filters: filtersIfFilter(filter),
      limit: appliedLimit,
      offset: appliedOffset,
      sort: sortsIfSort(sort),
      getTotals: false,
    });
    return data;
  }

  async count(filter: IAdminForthFilter | IAdminForthFilter[] | undefined): Promise<number> {
    return await this.dataConnector.getCount({
      resource: this.resourceConfig,
      filters: filtersIfFilter(filter),
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