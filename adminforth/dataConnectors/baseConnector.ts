import { 
  AdminForthResource, IAdminForthDataSourceConnectorBase, 
  AdminForthResourceColumn, 
  IAdminForthSort, IAdminForthSingleFilter, IAdminForthAndOrFilter 
} from "../types/Back.js";



import { suggestIfTypo } from "../modules/utils.js";
import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections } from "../types/Common.js";
import { randomUUID } from "crypto";


export default class AdminForthBaseConnector implements IAdminForthDataSourceConnectorBase {

  client: any;

  get db() {
    console.warn('.db is deprecated, use .client instead');
    return this.client;
  }

  setupClient(url: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

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
      filters: { operator: AdminForthFilterOperators.AND, subFilters: [{ field: this.getPrimaryKey(resource), operator: AdminForthFilterOperators.EQ, value: id }]},
    });
    return data.length > 0 ? data[0] : null;
  }

  validateAndNormalizeInputFilters(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter> | undefined): IAdminForthAndOrFilter {
    if (!filter) {
      // if no filter, return empty "and" filter
      return { operator: AdminForthFilterOperators.AND, subFilters: [] };
    }
    if (typeof filter !== 'object') {
      throw new Error(`Filter should be an array or an object`);
    }
    if (Array.isArray(filter)) {
      // if filter is an array, combine them using "and" operator
      return { operator: AdminForthFilterOperators.AND, subFilters: filter };
    }
    if ((filter as IAdminForthAndOrFilter).subFilters) {
      // if filter is already AndOr filter - return as is
      return filter as IAdminForthAndOrFilter;
    }

    // by default, assume filter is Single filter, turn it into AndOr filter
    return { operator: AdminForthFilterOperators.AND, subFilters: [filter] };
  }

  validateAndNormalizeFilters(filters: IAdminForthSingleFilter | IAdminForthAndOrFilter | Array<IAdminForthSingleFilter | IAdminForthAndOrFilter>, resource: AdminForthResource): { ok: boolean, error: string } {
    if (Array.isArray(filters)) {
      // go through all filters in array and call validation+normalization for each
      // as soon as error is encountered, there is no point in calling validation for other filters
      // if error is not encountered all filters will be validated and normalized
      return filters.reduce((result, f, fIndex) => {
        if (!result.ok) {
          return result;
        }

        const filterValidation = this.validateAndNormalizeFilters(f, resource);

        // in case column isArray and enumerator/foreign resource - IN filter must be transformed into OR filter
        if (filterValidation.ok && f.operator == AdminForthFilterOperators.IN) {
          const column = resource.dataSourceColumns.find((col) => col.name == (f as IAdminForthSingleFilter).field);
          // console.log(`\n~~~ column: ${JSON.stringify(column, null, 2)}\n~~~ resource.columns: ${JSON.stringify(resource.dataSourceColumns, null, 2)}\n~~~ filter: ${JSON.stringify(f, null, 2)}\n`);
          if (column.isArray?.enabled && (column.enum || column.foreignResource)) {
            filters[fIndex] = {
              operator: AdminForthFilterOperators.OR,
              subFilters: f.value.map((v: any) => {
                return { field: column.name, operator: AdminForthFilterOperators.LIKE, value: v };
              }),
            };
          }
        }

        return filterValidation;
      }, { ok: true, error: '' });
    }

    if ((filters as IAdminForthSingleFilter).field) {
      // if "field" is present, filter must be Single
      if (!filters.operator) {
        return { ok: false, error: `Field "operator" not specified in filter object: ${JSON.stringify(filters)}` };
      }
      if ((filters as IAdminForthSingleFilter).value === undefined) {
        return { ok: false, error: `Field "value" not specified in filter object: ${JSON.stringify(filters)}` };
      }
      if ((filters as IAdminForthSingleFilter).insecureRawSQL) {
        return { ok: false, error: `Field "insecureRawSQL" should not be specified in filter object alongside "field": ${JSON.stringify(filters)}` };
      }
      if (![AdminForthFilterOperators.EQ, AdminForthFilterOperators.NE, AdminForthFilterOperators.GT,
      AdminForthFilterOperators.LT, AdminForthFilterOperators.GTE, AdminForthFilterOperators.LTE,
      AdminForthFilterOperators.LIKE, AdminForthFilterOperators.ILIKE, AdminForthFilterOperators.IN,
      AdminForthFilterOperators.NIN].includes(filters.operator)) {
        return { ok: false, error: `Field "operator" has wrong value in filter object: ${JSON.stringify(filters)}` };
      }
      const fieldObj = resource.dataSourceColumns.find((col) => col.name == (filters as IAdminForthSingleFilter).field);
      if (!fieldObj) {
        const similar = suggestIfTypo(resource.dataSourceColumns.map((col) => col.name), (filters as IAdminForthSingleFilter).field);
        throw new Error(`Field '${(filters as IAdminForthSingleFilter).field}' not found in resource '${resource.resourceId}'. ${similar ? `Did you mean '${similar}'?` : ''}`);
      }
      // value normalization
      if (filters.operator == AdminForthFilterOperators.IN || filters.operator == AdminForthFilterOperators.NIN) {
        if (!Array.isArray(filters.value)) {
          return { ok: false, error: `Value for operator '${filters.operator}' should be an array, in filter object: ${JSON.stringify(filters) }` };
        }
        if (filters.value.length === 0) {
          // nonsense, and some databases might not accept IN []
          const colType = resource.dataSourceColumns.find((col) => col.name == (filters as IAdminForthSingleFilter).field)?.type;
          if (colType === AdminForthDataTypes.STRING || colType === AdminForthDataTypes.TEXT) {
            filters.value = [randomUUID()];
            return { ok: true,  error: `` };
          } else {
            return { ok: false, error: `Value for operator '${filters.operator}' should not be empty array, in filter object: ${JSON.stringify(filters) }` };
          }
        }
        filters.value = filters.value.map((val: any) => this.setFieldValue(fieldObj, val));
      } else {
        (filters as IAdminForthSingleFilter).value = this.setFieldValue(fieldObj, (filters as IAdminForthSingleFilter).value);
      }
    } else if ((filters as IAdminForthSingleFilter).insecureRawSQL) {
      // if "insecureRawSQL" filter is insecure sql string
      if ((filters as IAdminForthSingleFilter).operator) {
        return { ok: false, error: `Field "operator" should not be specified in filter object alongside "insecureRawSQL": ${JSON.stringify(filters)}` };
      }
      if ((filters as IAdminForthSingleFilter).value !== undefined) {
        return { ok: false, error: `Field "value" should not be specified in filter object alongside "insecureRawSQL": ${JSON.stringify(filters)}` };
      }
    } else if ((filters as IAdminForthAndOrFilter).subFilters) {
      // if "subFilters" is present, filter must be AndOr
      if (!filters.operator) {
        return { ok: false, error: `Field "operator" not specified in filter object: ${JSON.stringify(filters)}` };
      }
      if (![AdminForthFilterOperators.AND, AdminForthFilterOperators.OR].includes(filters.operator)) {
        return { ok: false, error: `Field "operator" has wrong value in filter object: ${JSON.stringify(filters)}` };
      }

      return this.validateAndNormalizeFilters((filters as IAdminForthAndOrFilter).subFilters, resource);
    } else {
      return { ok: false, error: `Fields "field" or "subFilters" are not specified in filter object: ${JSON.stringify(filters)}` };
    }

    return { ok: true, error: '' };
  }

  getDataWithOriginalTypes({ resource, limit, offset, sort, filters }: { 
    resource: AdminForthResource, 
    limit: number, 
    offset: number, 
    sort: IAdminForthSort[], 
    filters: IAdminForthAndOrFilter,
  }): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  getCount({ resource, filters }: { resource: AdminForthResource; filters: IAdminForthAndOrFilter; }): Promise<number> {
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

  createRecordOriginalValues({ resource, record }: { resource: AdminForthResource; record: any; }): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async checkUnique(resource: AdminForthResource, column: AdminForthResourceColumn, value: any) {
    process.env.HEAVY_DEBUG && console.log('☝️🪲🪲🪲🪲 checkUnique|||', column, value);
    const existingRecord = await this.getData({
      resource,
      filters: { operator: AdminForthFilterOperators.AND, subFilters: [{ field: column.name, operator: AdminForthFilterOperators.EQ, value }]},
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
      if (filledRecord[col.name] !== undefined) {
        // no sense to set value if it is not defined
        recordWithOriginalValues[col.name] = this.setFieldValue(col, filledRecord[col.name]);
      }
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

    process.env.HEAVY_DEBUG && console.log('🪲🆕 creating record',JSON.stringify(recordWithOriginalValues));
    let pkValue = await this.createRecordOriginalValues({ resource, record: recordWithOriginalValues });
    if (recordWithOriginalValues[this.getPrimaryKey(resource)] !== undefined) {
      // some data sources always return some value for pk, even if it is was not auto generated
      // this check prevents wrong value from being used later in get request
      pkValue = recordWithOriginalValues[this.getPrimaryKey(resource)];
    }

    let createdRecord = recordWithOriginalValues;
    if (pkValue) {
      createdRecord = await this.getRecordByPrimaryKey(resource, pkValue);
    }

    return {
      ok: true,
      createdRecord,
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
      // we might consider this because some users might not want to define all columns in resource with showIn:{}, but still want to use them in hooks
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
    filters: IAdminForthAndOrFilter,
    getTotals: boolean,
  }): Promise<{ data: any[], total: number }> {
    if (filters) {
      const filterValidation = this.validateAndNormalizeFilters(filters, resource);
      if (!filterValidation.ok) {
        throw new Error(filterValidation.error);
      }
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
  async getAllTables(): Promise<string[]> {
    throw new Error('getAllTables() must be implemented in subclass');
  }

  async getAllColumnsInTable(tableName: string): Promise<Array<{ name: string; type?: string; isPrimaryKey?: boolean; sampleValue?: any; }>> {
    throw new Error('getAllColumnsInTable() must be implemented in subclass');
  }

    
}