import { AdminForthResource, IAdminForthDataSourceConnectorBase, AdminForthSortDirections, AdminForthFilterOperators, AdminForthResourceColumn } from "../types/AdminForthConfig.js";


export default class AdminForthBaseConnector implements IAdminForthDataSourceConnectorBase {
  getPrimaryKey(resource: AdminForthResource): string {
    for (const col of resource.dataSourceColumns) {
        if (col.primaryKey) {
            return col.name;
        }
    }
  }

  getRecordByPrimaryKeyWithOriginalTypes(resource: AdminForthResource, id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getDataWithOriginalTypes({ resource, limit, offset, sort, filters }: { 
    resource: AdminForthResource, 
    limit: number, 
    offset: number, 
    sort: { field: string, direction: AdminForthSortDirections }[], 
    filters: { field: string, operator: AdminForthFilterOperators, value: any }[] 
  }): Promise<{ data: any[], total: number }> {
    throw new Error('Method not implemented.');
  }

  discoverFields(resource: AdminForthResource): Promise<{ [key: string]: AdminForthResourceColumn; }> {
    throw new Error('Method not implemented.');
  }

  getFieldValue(field: AdminForthResourceColumn, value: any) {
    throw new Error('Method not implemented.');
  }

  setFieldValue(field: AdminForthResourceColumn, value: any) {
    throw new Error('Method not implemented.');
  }

  getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource; columns: AdminForthResourceColumn[]; }): Promise<{ [key: string]: { min: any; max: any; }; }> {
    throw new Error('Method not implemented.');
  }

  createRecordOriginalValues({ resource, record }: { resource: AdminForthResource; record: any; }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  createRecord({ resource, record }: { resource: AdminForthResource; record: any; }): Promise<void> {
    // transform value using setFieldValue and call createRecordOriginalValues
    const newRecord = {...record};
    for (const col of resource.dataSourceColumns) {
        newRecord[col.name] = this.setFieldValue(col, record[col.name]);
    }
    process.env.HEAVY_DEBUG && console.log('🪲🪲🪲🪲 creating record', newRecord);
    return this.createRecordOriginalValues({ resource, record: newRecord });
  }

  updateRecord({ resource, recordId, newValues }: { resource: AdminForthResource; recordId: string; newValues: any; }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  deleteRecord({ resource, recordId }: { resource: AdminForthResource; recordId: string; }): Promise<void> {
    throw new Error('Method not implemented.');
  }


  async getData({ resource, limit, offset, sort, filters }: { 
    resource: AdminForthResource, 
    limit: number, 
    offset: number, 
    sort: { field: string, direction: AdminForthSortDirections }[], 
    filters: { field: string, operator: AdminForthFilterOperators, value: any }[] 
  }): Promise<{ data: any[], total: number }> {
    if (filters) {
      filters.map((f) => {
        if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          f.value = f.value.map((val) => this.setFieldValue(resource.dataSourceColumns.find((col) => col.name == f.field), val));
        } else {
          f.value = this.setFieldValue(resource.dataSourceColumns.find((col) => col.name == f.field), f.value);
        }
      });
    }

    const d = await this.getDataWithOriginalTypes({ resource, limit, offset, sort, filters });
    // call getFieldValue for each field
    d.data.map((record) => {
      for (const col of resource.dataSourceColumns) {
        record[col.name] = this.getFieldValue(col, record[col.name]);
      }
    });

    return d;
  }

  async getMinMaxForColumns({ resource, columns }: { resource: AdminForthResource; columns: AdminForthResourceColumn[]; }): Promise<{ [key: string]: { min: any; max: any; }; }> {
    const mm = await this.getMinMaxForColumnsWithOriginalTypes({ resource, columns });
    const result = {};
    for (const col of columns) {
        result[col.name] = {
            min: this.getFieldValue(col, mm[col.name].min),
            max: this.getFieldValue(col, mm[col.name].max),
        };
    }
    return result;
  }

  getRecordByPrimaryKey(resource: AdminForthResource, recordId: string): Promise<any> {
    return this.getRecordByPrimaryKeyWithOriginalTypes(resource, recordId).then((record) => {
        const newRecord = {};
        for (const col of resource.dataSourceColumns) {
            newRecord[col.name] = this.getFieldValue(col, record[col.name]);
        }
        return newRecord;
    });
  }

    
}