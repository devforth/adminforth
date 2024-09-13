import { get } from "http";
import { AdminForthResource, IAdminForthDataSourceConnectorBase, AdminForthSortDirections, AdminForthFilterOperators, AdminForthResourceColumn, IAdminForthSort, IAdminForthFilter } from "../types/AdminForthConfig.js";
import { suggestIfTypo } from "../modules/utils.js";


export default class AdminForthBaseConnector implements IAdminForthDataSourceConnectorBase {
  getPrimaryKey(resource: AdminForthResource): string {
    for (const col of resource.dataSourceColumns) {
        if (col.primaryKey) {
            return col.name;
        }
    }
  }

  async getRecordByPrimaryKeyWithOriginalTypes(resource: AdminForthResource, id: string): Promise<any> {
    const data = await this.getDataWithOriginalTypes({ 
      resource, 
      limit: 1, 
      offset: 0,
      sort: [], 
      filters: [{ field: this.getPrimaryKey(resource), operator: AdminForthFilterOperators.EQ, value: id }],
    });
    return data.length > 0 ? data[0] : null;
  }

  getDataWithOriginalTypes({ resource, limit, offset, sort, filters }: { 
    resource: AdminForthResource, 
    limit: number, 
    offset: number, 
    sort: IAdminForthSort[], 
    filters: IAdminForthFilter[],
  }): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  getCount({ resource, filters }: { resource: AdminForthResource; filters: { field: string; operator: AdminForthFilterOperators; value: any; }[]; }): Promise<number> {
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

  async createRecord({ resource, record, adminUser }: { 
    resource: AdminForthResource; record: any; adminUser: any;
  }): Promise<any> {
    // transform value using setFieldValue and call createRecordOriginalValues
    const filledRecord = {...record};
    const recordWithOriginalValues = {...record};

    for (const col of resource.dataSourceColumns) {
      if (col.fillOnCreate) {
        if (filledRecord[col.name] === undefined) {
          filledRecord[col.name] = col.fillOnCreate({
            initialRecord: record, 
            adminUser
          });
        }
      }
      recordWithOriginalValues[col.name] = this.setFieldValue(col, filledRecord[col.name]);
    }
    process.env.HEAVY_DEBUG && console.log('🪲🪲🪲🪲 creating record', recordWithOriginalValues);
    await this.createRecordOriginalValues({ resource, record: recordWithOriginalValues });

    return recordWithOriginalValues;
  }

  updateRecord({ resource, recordId, newValues }: { resource: AdminForthResource; recordId: string; newValues: any; }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  deleteRecord({ resource, recordId }: { resource: AdminForthResource; recordId: string; }): Promise<boolean> {
    throw new Error('Method not implemented.');
  }


  async getData({ resource, limit, offset, sort, filters, getTotals }: { 
    resource: AdminForthResource, 
    limit: number, 
    offset: number, 
    sort: { field: string, direction: AdminForthSortDirections }[], 
    filters: { field: string, operator: AdminForthFilterOperators, value: any }[],
    getTotals: boolean,
  }): Promise<{ data: any[], total: number }> {
    if (filters) {
      filters.map((f) => {
        const fieldObj = resource.dataSourceColumns.find((col) => col.name == f.field);
        if (!fieldObj) {
          const similar = suggestIfTypo(resource.dataSourceColumns.map((col) => col.name), f.field);
          throw new Error(`Field '${f.field}' not found in resource '${resource.resourceId}'. ${similar ? `Did you mean '${similar}'?` : ''}`);
        }
        if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          f.value = f.value.map((val) => this.setFieldValue(fieldObj, val));
        } else {
          f.value = this.setFieldValue(fieldObj, f.value);
        }
      });
    }

    const promises: Promise<any>[] = [this.getDataWithOriginalTypes({ resource, limit, offset, sort, filters })];
    if (getTotals) {
      promises.push(this.getCount({ resource, filters }));
    } else {
      promises.push(Promise.resolve(undefined));
    }

    const [data, total] = await Promise.all(promises);

    // call getFieldValue for each field
    data.map((record) => {
      for (const col of resource.dataSourceColumns) {
        record[col.name] = this.getFieldValue(col, record[col.name]);
      }
    });

    return { data, total };
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