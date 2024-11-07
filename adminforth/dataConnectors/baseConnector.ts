import { 
  AdminForthResource, IAdminForthDataSourceConnectorBase, 
  AdminForthResourceColumn, 
  IAdminForthSort, IAdminForthFilter 
} from "../types/Back.js";



import { suggestIfTypo } from "../modules/utils.js";
import { AdminForthFilterOperators, AdminForthSortDirections } from "../types/Common.js";


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

  async checkUnique(resource: AdminForthResource, column: AdminForthResourceColumn, value: any) {
    process.env.HEAVY_DEBUG && console.log('☝️🪲🪲🪲🪲 checkUnique|||', column, value);
    const existingRecord = await this.getData({
      resource,
      filters: [{ field: column.name, operator: AdminForthFilterOperators.EQ, value }],
      limit: 1,
      sort: [],
      offset: 0,
      getTotals: false
    });

    return existingRecord.data.length > 0;
  }

  async createRecord({ resource, record, adminUser }: { 
    resource: AdminForthResource; record: any; adminUser: any;
  }): Promise<{ error?: string; ok: boolean; createdRecord?: any; }> {
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
    
    let error: string | null = null;
    await Promise.all(
      resource.dataSourceColumns.map(async (col) => {
        if (col.isUnique && !col.virtual && !error) {
          const exists = await this.checkUnique(resource, col, recordWithOriginalValues[col.name]);
          if (exists) {
            error = `Record with ${col.name} ${recordWithOriginalValues[col.name]} already exists`;
          }
        }
      })
    );
    if (error) {
      process.env.HEAVY_DEBUG && console.log('🪲🆕 check unique error', error);
      return { error, ok: false };
    }

    process.env.HEAVY_DEBUG && console.log('🪲🆕 creating record', recordWithOriginalValues);
    await this.createRecordOriginalValues({ resource, record: recordWithOriginalValues });

    return {
      ok: true,
      createdRecord: recordWithOriginalValues,
    }
  }

  updateRecordOriginalValues({ resource, recordId, newValues }: { resource: AdminForthResource; recordId: string; newValues: any; }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateRecord({ resource, recordId, newValues }: { resource: AdminForthResource; recordId: string; newValues: any; }): Promise<{ error?: string; ok: boolean; }> {
    // transform value using setFieldValue and call updateRecordOriginalValues
    const recordWithOriginalValues = {...newValues};

    for (const field of Object.keys(newValues)) {
      const col = resource.dataSourceColumns.find((col) => col.name == field);
      // todo instead of throwing error, we can just not use setFieldValue here, and pass original value to updateRecordOriginalValues
      // we might consider this because some users might not want to define all columns in resource with showIn:[], but still want to use them in hooks
      if (!col) {
        const similar = suggestIfTypo(resource.dataSourceColumns.map((col) => col.name), field);
        throw new Error(`
          Update record received field '${field}' (with value ${newValues[field]}), but such column not found in resource '${resource.resourceId}'. ${similar ? `Did you mean '${similar}'?` : ''}
        `);
      }
      recordWithOriginalValues[col.name] = this.setFieldValue(col, newValues[col.name]);
    }

    process.env.HEAVY_DEBUG && console.log(`🪲✏️ updating record id:${recordId}, values: ${JSON.stringify(recordWithOriginalValues)}`);

    await this.updateRecordOriginalValues({ resource, recordId, newValues: recordWithOriginalValues });

    return { ok: true };
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
        if (!f.field) {
          throw new Error(`Field "field" not specified in filter object: ${JSON.stringify(f)}`);
        }
        if (!f.operator) {
          throw new Error(`Field "operator" not specified in filter object: ${JSON.stringify(f)}`);
        }
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