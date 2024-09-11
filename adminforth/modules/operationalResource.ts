import { IAdminForthFilter, IAdminForthSort, IOperationalResource, IAdminForthDataSourceConnectorBase, AdminForthResource, IAdminForth } from '../types/AdminForthConfig.js';


// export interface IOperationalResource {
//   get: (filters: IAdminForthFilter | IAdminForthFilter[]) => Promise<any[]>;

//   list: (filters: IAdminForthFilter | IAdminForthFilter[], limit: number, offset: number, sort: IAdminForthSort | IAdminForthSort[]) => Promise<any[]>;

//   count: (filters: IAdminForthFilter | IAdminForthFilter[]) => Promise<number>;

//   create: (record: any) => Promise<any>;

//   update: (primaryKey: any, record: any) => Promise<any>;

//   delete: (primaryKey: any) => Promise<boolean>;

//   deleteMany: (primaryKeys: any[]) => Promise<boolean>;
// }


// async getData({ resource, limit, offset, sort, filters }: { 
//   resource: AdminForthResource, 
//   limit: number, 
//   offset: number, 
//   sort: { field: string, direction: AdminForthSortDirections }[], 
//   filters: { field: string, operator: AdminForthFilterOperators, value: any }[]
// }): Promise<{ data: any[], total: number }> {

function filtersIfFilter(filter: IAdminForthFilter | IAdminForthFilter[]): IAdminForthFilter[] {
  return (typeof filter === 'object' ? [filter] : filter) as IAdminForthFilter[];
}

function sortsIfSort(sort: IAdminForthSort | IAdminForthSort[]): IAdminForthSort[] {
  return (typeof sort === 'object' ? [sort] : sort) as IAdminForthSort[];
}

export class OperationalResource implements IOperationalResource {
  dataConnector: IAdminForthDataSourceConnectorBase;
  resourceConfig: AdminForthResource;

  constructor(dataConnector: IAdminForthDataSourceConnectorBase, resourceConfig: AdminForthResource) {
    this.dataConnector = dataConnector;
    this.resourceConfig = resourceConfig;
  }

  async get(filter: IAdminForthFilter | IAdminForthFilter[]): Promise<any[]> {
    return await this.dataConnector.getData({
      resource: this.resourceConfig,
      filters: filtersIfFilter(filter),
      limit: 1,
      offset: 0,
      sort: [],
    })[0];
  }

  async list(
      filter: IAdminForthFilter | IAdminForthFilter[], 
      limit: number, 
      offset: number, 
      sort: IAdminForthSort | IAdminForthSort[]
  ): Promise<any[]> {
    const { data } = await this.dataConnector.getData({
      resource: this.resourceConfig,
      filters: filtersIfFilter(filter),
      limit,
      offset,
      sort: sortsIfSort(sort),
      getTotals: false,
    });
    return data;
  }

  async count(filter: IAdminForthFilter | IAdminForthFilter[]): Promise<number> {
    return await this.dataConnector.getCount({
      resource: this.resourceConfig,
      filters: filtersIfFilter(filter),
    });
  }

  async create(record: any): Promise<any> {
    return await this.dataConnector.createRecord({ resource: this.resourceConfig, record });
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