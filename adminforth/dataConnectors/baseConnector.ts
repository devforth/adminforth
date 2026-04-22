import {
  AdminForthResource, IAdminForthDataSourceConnectorBase,
  AdminForthResourceColumn,
  IAdminForthSort, IAdminForthSingleFilter, IAdminForthAndOrFilter,
  AdminForthConfig,
  IAggregationRule, IGroupByRule, IGroupByDateTrunc,
} from "../types/Back.js";



import { suggestIfTypo } from "../modules/utils.js";
import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections } from "../types/Common.js";
import { randomUUID } from "crypto";
import dayjs from "dayjs";
import { afLogger } from '../modules/logger.js';

type AdminForthFilterNode = IAdminForthSingleFilter | IAdminForthAndOrFilter;
type AdminForthFilterInput = AdminForthFilterNode | AdminForthFilterNode[];
type AdminForthFilterNormalizationResult = {
  ok: boolean;
  error: string;
  normalizedFilters?: AdminForthFilterInput;
};


export default class AdminForthBaseConnector implements IAdminForthDataSourceConnectorBase {

  client: any;

  /**
   * @deprecated Since 1.2.9. Will be removed in 2.0.0. Use .client instead.
   */
  get db() {
    afLogger.warn('.db is deprecated, use .client instead');
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

  cloneFilterNode(filter: AdminForthFilterNode): AdminForthFilterNode {
    if ((filter as IAdminForthAndOrFilter).subFilters) {
      const complexFilter = filter as IAdminForthAndOrFilter;
      return {
        ...complexFilter,
        subFilters: complexFilter.subFilters.map((subFilter) => this.cloneFilterNode(subFilter)),
      };
    }

    const singleFilter = filter as IAdminForthSingleFilter;
    return {
      ...singleFilter,
      ...(Array.isArray(singleFilter.value) ? { value: [...singleFilter.value] } : {}),
    };
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
      return { operator: AdminForthFilterOperators.AND, subFilters: filter.map((subFilter) => this.cloneFilterNode(subFilter)) };
    }
    if ((filter as IAdminForthAndOrFilter).subFilters) {
      // if filter is already AndOr filter - return as is
      return this.cloneFilterNode(filter as IAdminForthAndOrFilter) as IAdminForthAndOrFilter;
    }

    // by default, assume filter is Single filter, turn it into AndOr filter
    return { operator: AdminForthFilterOperators.AND, subFilters: [this.cloneFilterNode(filter as AdminForthFilterNode)] };
  }

  validateAndNormalizeFilters(filters: AdminForthFilterInput, resource: AdminForthResource): AdminForthFilterNormalizationResult {
    if (Array.isArray(filters)) {
      const normalizedFilters: AdminForthFilterNode[] = [];

      for (const filter of filters) {
        const filterValidation = this.validateAndNormalizeFilters(filter, resource);
        if (!filterValidation.ok) {
          return filterValidation;
        }

        let normalizedFilter = filterValidation.normalizedFilters as AdminForthFilterNode;
        const normalizedSingleFilter = normalizedFilter as IAdminForthSingleFilter;

        // in case column isArray and enumerator/foreign resource - IN filter must be transformed into OR filter
        if (normalizedSingleFilter.field && normalizedSingleFilter.operator == AdminForthFilterOperators.IN) {
          const column = resource.dataSourceColumns.find((col) => col.name == normalizedSingleFilter.field);
          if (column.isArray?.enabled && (column.enum || column.foreignResource)) {
            normalizedFilter = {
              operator: AdminForthFilterOperators.OR,
              subFilters: normalizedSingleFilter.value.map((v: any) => {
                return { field: column.name, operator: AdminForthFilterOperators.LIKE, value: v };
              }),
            };
          }
        }

        normalizedFilters.push(normalizedFilter);
      }

      return { ok: true, error: '', normalizedFilters };
    }

    const filtersAsSingle = filters as IAdminForthSingleFilter;
    if (filtersAsSingle.field) {
      const normalizedFilter = this.cloneFilterNode(filters) as IAdminForthSingleFilter;

      // if "field" is present, filter must be Single
      if (!normalizedFilter.operator) {
        return { ok: false, error: `Field "operator" not specified in filter object: ${JSON.stringify(filters)}` };
      }
      // Either compare with value or with rightField (field-to-field). If rightField is set, value must be undefined.
      const comparingWithRightField = normalizedFilter.rightField !== undefined && normalizedFilter.rightField !== null;
      const isEmptyOperator = normalizedFilter.operator === AdminForthFilterOperators.IS_EMPTY || normalizedFilter.operator === AdminForthFilterOperators.IS_NOT_EMPTY;
      
      if (!comparingWithRightField && !isEmptyOperator && normalizedFilter.value === undefined) {
        return { ok: false, error: `Field "value" not specified in filter object: ${JSON.stringify(filters)}` };
      }
      if (comparingWithRightField && normalizedFilter.value !== undefined) {
        return { ok: false, error: `Specify either "value" or "rightField", not both: ${JSON.stringify(filters)}` };
      }
      if (normalizedFilter.insecureRawSQL) {
        return { ok: false, error: `Field "insecureRawSQL" should not be specified in filter object alongside "field": ${JSON.stringify(filters)}` };
      }
      if (normalizedFilter.insecureRawNoSQL) {
        return { ok: false, error: `Field "insecureRawNoSQL" should not be specified in filter object alongside "field": ${JSON.stringify(filters)}` };
      }
      if (![AdminForthFilterOperators.EQ, AdminForthFilterOperators.NE, AdminForthFilterOperators.GT,
      AdminForthFilterOperators.LT, AdminForthFilterOperators.GTE, AdminForthFilterOperators.LTE,
      AdminForthFilterOperators.LIKE, AdminForthFilterOperators.ILIKE, AdminForthFilterOperators.IN,
      AdminForthFilterOperators.NIN, AdminForthFilterOperators.IS_EMPTY, AdminForthFilterOperators.IS_NOT_EMPTY].includes(normalizedFilter.operator)) {
        return { ok: false, error: `Field "operator" has wrong value in filter object: ${JSON.stringify(filters)}` };
      }
      const fieldObj = resource.dataSourceColumns.find((col) => col.name == normalizedFilter.field);
      if (!fieldObj) {
        const similar = suggestIfTypo(resource.dataSourceColumns.map((col) => col.name), normalizedFilter.field);
        
        let isPolymorphicTarget = false;
        if (global.adminforth?.config?.resources) {
          isPolymorphicTarget = global.adminforth.config.resources.some(res => 
            res.dataSourceColumns.some(col => 
              col.foreignResource?.polymorphicResources?.some(pr => 
                pr.resourceId === resource.resourceId
              )
            )
          );
        }
        if (isPolymorphicTarget) {
          afLogger.trace(`⚠️  Field '${normalizedFilter.field}' not found in polymorphic target resource '${resource.resourceId}', allowing query to proceed.`);
          return { ok: true, error: '', normalizedFilters: normalizedFilter };
        } else {
          throw new Error(`Field '${normalizedFilter.field}' not found in resource '${resource.resourceId}'. ${similar ? `Did you mean '${similar}'?` : ''}`);
        }
      }
      // value normalization
      if (comparingWithRightField) {
        // ensure rightField exists in resource
        const rightFieldObj = resource.dataSourceColumns.find((col) => col.name == normalizedFilter.rightField);
        if (!rightFieldObj) {
          const similar = suggestIfTypo(resource.dataSourceColumns.map((col) => col.name), normalizedFilter.rightField as string);
          throw new Error(`Field '${normalizedFilter.rightField}' not found in resource '${resource.resourceId}'. ${similar ? `Did you mean '${similar}'?` : ''}`);
        }
        // No value conversion needed for field-to-field comparison here
      } else if (isEmptyOperator) {
        // IS_EMPTY and IS_NOT_EMPTY don't need value normalization
        // Set value to null if not already set
        if (normalizedFilter.value === undefined) {
          normalizedFilter.value = null;
        }
      } else if (normalizedFilter.operator == AdminForthFilterOperators.IN || normalizedFilter.operator == AdminForthFilterOperators.NIN) {
        if (!Array.isArray(normalizedFilter.value)) {
          return { ok: false, error: `Value for operator '${normalizedFilter.operator}' should be an array, in filter object: ${JSON.stringify(filters) }` };
        }
        if (normalizedFilter.value.length === 0) {
          // nonsense, and some databases might not accept IN []
          const colType = resource.dataSourceColumns.find((col) => col.name == normalizedFilter.field)?.type;
          if (colType === AdminForthDataTypes.STRING || colType === AdminForthDataTypes.TEXT) {
            normalizedFilter.value = [randomUUID()];
            return { ok: true,  error: '', normalizedFilters: normalizedFilter };
          } else {
            return { ok: false, error: `Value for operator '${normalizedFilter.operator}' should not be empty array, in filter object: ${JSON.stringify(filters) }` };
          }
        }
        normalizedFilter.value = normalizedFilter.value.map((val: any) => this.validateAndSetFieldValue(fieldObj, val));
      } else {
        normalizedFilter.value = this.validateAndSetFieldValue(fieldObj, normalizedFilter.value);
      }

      return { ok: true, error: '', normalizedFilters: normalizedFilter };
    } else if (filtersAsSingle.insecureRawSQL || filtersAsSingle.insecureRawNoSQL) {
      const normalizedFilter = this.cloneFilterNode(filters) as IAdminForthSingleFilter;

      // if "insecureRawSQL" filter is insecure sql string
      if (normalizedFilter.operator) {
        return { ok: false, error: `Field "operator" should not be specified in filter object alongside "insecureRawSQL" or "insecureRawNoSQL": ${JSON.stringify(filters)}` };
      }
      if (normalizedFilter.value !== undefined) {
        return { ok: false, error: `Field "value" should not be specified in filter object alongside "insecureRawSQL" or "insecureRawNoSQL": ${JSON.stringify(filters)}` };
      }
      return { ok: true, error: '', normalizedFilters: normalizedFilter };
    } else if ((filters as IAdminForthAndOrFilter).subFilters) {
      const complexFilter = filters as IAdminForthAndOrFilter;

      // if "subFilters" is present, filter must be AndOr
      if (!complexFilter.operator) {
        return { ok: false, error: `Field "operator" not specified in filter object: ${JSON.stringify(filters)}` };
      }
      if (![AdminForthFilterOperators.AND, AdminForthFilterOperators.OR].includes(complexFilter.operator)) {
        return { ok: false, error: `Field "operator" has wrong value in filter object: ${JSON.stringify(filters)}` };
      }

      const subFiltersValidation = this.validateAndNormalizeFilters(complexFilter.subFilters, resource);
      if (!subFiltersValidation.ok) {
        return subFiltersValidation;
      }

      return {
        ok: true,
        error: '',
        normalizedFilters: {
          ...complexFilter,
          subFilters: subFiltersValidation.normalizedFilters as AdminForthFilterNode[],
        },
      };
    } else {
      return { ok: false, error: `Fields "field" or "subFilters" are not specified in filter object: ${JSON.stringify(filters)}` };
    }
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

  getAggregateWithOriginalTypes({ resource, filters, aggregations, groupBy }: {
    resource: AdminForthResource,
    filters: IAdminForthAndOrFilter,
    aggregations: { [alias: string]: IAggregationRule },
    groupBy?: IGroupByRule,
  }): Promise<Array<{ group?: string, [key: string]: any }>> {
    throw new Error('getAggregateWithOriginalTypes() not implemented for this connector.');
  }

  private validateAggregateParams(
    resource: AdminForthResource,
    aggregations: { [alias: string]: IAggregationRule },
    groupBy?: IGroupByRule,
  ): void {
    const VALID_ALIAS = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    const VALID_OPERATIONS = ['sum', 'count', 'avg', 'min', 'max', 'median'];
    const VALID_TRUNCATIONS = ['day', 'week', 'month', 'year'];
    const VALID_TIMEZONE = /^[a-zA-Z_\/\-\+0-9]+$/;
    const columnNames = new Set(resource.dataSourceColumns.map(c => c.name));

    const assertColumn = (field: string, context: string) => {
      if (!columnNames.has(field)) {
        throw new Error(`${context}: unknown column "${field}". Available: ${[...columnNames].join(', ')}`);
      }
    };

    for (const [alias, rule] of Object.entries(aggregations)) {
      if (!VALID_ALIAS.test(alias)) {
        throw new Error(`Invalid aggregation alias "${alias}". Must match ${VALID_ALIAS}`);
      }
      if (!VALID_OPERATIONS.includes(rule.operation)) {
        throw new Error(`Invalid aggregation operation "${rule.operation}". Must be one of: ${VALID_OPERATIONS.join(', ')}`);
      }
      if (rule.operation !== 'count') {
        if (!rule.field) {
          throw new Error(`Aggregation "${alias}" with operation "${rule.operation}" requires a field`);
        }
        assertColumn(rule.field, `Aggregation "${alias}"`);
      }
    }

    if (groupBy) {
      if (groupBy.type === 'field') {
        assertColumn(groupBy.field, 'GroupBy.Field');
      } else if (groupBy.type === 'date_trunc') {
        const g = groupBy as IGroupByDateTrunc;
        assertColumn(g.field, 'GroupBy.DateTrunc');
        if (!VALID_TRUNCATIONS.includes(g.truncation)) {
          throw new Error(`Invalid truncation "${g.truncation}". Must be one of: ${VALID_TRUNCATIONS.join(', ')}`);
        }
        if (g.timezone && !VALID_TIMEZONE.test(g.timezone)) {
          throw new Error(`Invalid timezone "${g.timezone}". Must be a valid IANA timezone name`);
        }
      } else {
        throw new Error(`Unknown groupBy type "${(groupBy as any).type}"`);
      }
    }
  }

  async aggregate({ resource, filters, aggregations, groupBy }: {
    resource: AdminForthResource,
    filters: IAdminForthAndOrFilter,
    aggregations: { [alias: string]: IAggregationRule },
    groupBy?: IGroupByRule,
  }): Promise<Array<{ group?: string, [key: string]: any }>> {
    this.validateAggregateParams(resource, aggregations, groupBy);

    let normalizedFilters = filters;
    if (filters) {
      const filterValidation = this.validateAndNormalizeFilters(filters, resource);
      if (!filterValidation.ok) {
        throw new Error(filterValidation.error);
      }
      normalizedFilters = filterValidation.normalizedFilters as IAdminForthAndOrFilter;
    }
    return this.getAggregateWithOriginalTypes({ resource, filters: normalizedFilters, aggregations, groupBy });
  }

  getCount({ resource, filters }: { resource: AdminForthResource; filters: IAdminForthAndOrFilter; }): Promise<number> {
    throw new Error('Method not implemented.');
  }

  discoverFields(resource: AdminForthResource, config: AdminForthConfig): Promise<{ [key: string]: AdminForthResourceColumn; }> {
    throw new Error('Method not implemented.');
  }

  getFieldValue(field: AdminForthResourceColumn, value: any) {
    throw new Error('Method not implemented.');
  }

  setFieldValue(field: AdminForthResourceColumn, value: any) {
    throw new Error('Method not implemented.');
  }

  validateAndSetFieldValue(field: AdminForthResourceColumn, value: any): any {
    // Int
    if (field.type === AdminForthDataTypes.INTEGER) {
      if (value === "" || value === null) {
        return this.setFieldValue(field, null);
      }
      if (!Number.isFinite(value)) {
        throw new Error(`Value is not an integer. Field ${field.name} with type is ${field.type}, but got value: ${value} with type ${typeof value}`);
      }
      return this.setFieldValue(field, value);
    }

    // Float
    if (field.type === AdminForthDataTypes.FLOAT) {
      if (value === "" || value === null) {
        return this.setFieldValue(field, null);
      }

      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(
          `Value is not a float. Field ${field.name} with type is ${field.type}, but got value: ${String(value)} with type ${typeof value}`
        );
      }

      return this.setFieldValue(field, value);
    }

    // Decimal
    if (field.type === AdminForthDataTypes.DECIMAL) {
      if (value === "" || value === null) {
        return this.setFieldValue(field, null);
      }
      // Accept string
      if (typeof value === "string") {
        const string = value.trim();
        if (!string) {
          return this.setFieldValue(field, null);
        }
        if (Number.isFinite(Number(string))) {
          return this.setFieldValue(field, string);
        }
        throw new Error(`Value is not a decimal. Field ${field.name} with type is ${field.type}, but got value: ${value} with type ${typeof value}`);
      }
      // Accept Decimal-like objects (e.g., decimal.js) by using toString()
      if (value && typeof value === "object" && typeof (value as any).toString === "function") {
        const s = (value as any).toString();
        if (typeof s === "string" && s.trim() !== "" && Number.isFinite(Number(s))) {
          return this.setFieldValue(field, s);
        }
      }

      throw new Error(`Value is not a decimal. Field ${field.name} with type is ${field.type}, but got value: ${String(value)} with type ${typeof value}`);
    }

    // Date


    // DateTime
    if (field.type === AdminForthDataTypes.DATETIME) {
      if (value === "" || value === null) {
        return this.setFieldValue(field, null);
      }
      if (!dayjs(value).isValid()) {
        throw new Error(`Value is not a valid datetime. Field ${field.name} with type is ${field.type}, but got value: ${value} with type ${typeof value}`);
      }
      return this.setFieldValue(field, value);
    }

    // Time

    // Boolean
    if (field.type === AdminForthDataTypes.BOOLEAN) {
      if (value === "" || value === null) {
        return this.setFieldValue(field, null);
      }
      if (typeof value !== 'boolean') {
        const errorMessage = `Value is not a boolean. Field ${field.name} with type is ${field.type}, but got value: ${value} with type ${typeof value}`;
        if (value !== 1 && value !== 0) {
          throw new Error(errorMessage);
        } else {
          afLogger.warn(errorMessage);
          afLogger.warn(`Ignore this warn, if you are using an sqlite database`);
        }
      }
      return this.setFieldValue(field, value);
    }
    
    // JSON

    // String
    if (field.type === AdminForthDataTypes.STRING) {
      if (value === "" || value === null){
        return this.setFieldValue(field, null);
      }
    }
    return this.setFieldValue(field, value);
  }

  getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource; columns: AdminForthResourceColumn[]; }): Promise<{ [key: string]: { min: any; max: any; }; }> {
    throw new Error('Method not implemented.');
  }

  createRecordOriginalValues({ resource, record }: { resource: AdminForthResource; record: any; }): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async checkUnique(resource: AdminForthResource, column: AdminForthResourceColumn, value: any, record?: any): Promise<boolean> {
    afLogger.trace(`☝️🪲🪲🪲🪲 checkUnique||| ${column.name}, ${value}`);

    const primaryKeyField = this.getPrimaryKey(resource);
    const existingRecord = await this.getData({
      resource,
      filters: { 
        operator: AdminForthFilterOperators.AND, 
        subFilters: [
          { field: column.name, operator: AdminForthFilterOperators.EQ, value },
          ...(record ? [{ field: primaryKeyField, operator: AdminForthFilterOperators.NE as AdminForthFilterOperators.NE, value: record[primaryKeyField] }] : [])
        ]
      },
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
        if (filledRecord[col.name] === undefined || (Array.isArray(filledRecord[col.name]) && filledRecord[col.name].length === 0)) {
          filledRecord[col.name] = col.fillOnCreate({
            initialRecord: record, 
            adminUser
          });
        }
      }
      if (filledRecord[col.name] !== undefined) {
        // no sense to set value if it is not defined
        recordWithOriginalValues[col.name] = this.validateAndSetFieldValue(col, filledRecord[col.name]);
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
      afLogger.trace(`🪲🆕 check unique error, ${error}`);
      return { error, ok: false };
    }

    afLogger.trace(`🪲🆕 creating record, ${JSON.stringify(recordWithOriginalValues)}`);
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
      recordWithOriginalValues[col.name] = this.validateAndSetFieldValue(col, newValues[col.name]);
    }
    const record = await this.getRecordByPrimaryKey(resource, recordId);
    let error: string | null = null;
     await Promise.all(
      resource.dataSourceColumns.map(async (col) => {
        if (col.isUnique && !col.virtual && !error && Object.prototype.hasOwnProperty.call(recordWithOriginalValues, col.name)) {
          const exists = await this.checkUnique(resource, col, recordWithOriginalValues[col.name], record);
          if (exists) {
            error = `Record with ${col.name} ${recordWithOriginalValues[col.name]} already exists`;
          }
        }
      })
    );
    if (error) {
      afLogger.trace(`🪲🆕 check unique error, ${error}`);
      return { error, ok: false };
    }


    afLogger.trace(`🪲✏️ updating record id:${recordId}, values: ${JSON.stringify(recordWithOriginalValues)}`);

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
    let normalizedFilters = filters;

    if (filters) {
      const filterValidation = this.validateAndNormalizeFilters(filters, resource);
      if (!filterValidation.ok) {
        throw new Error(filterValidation.error);
      }
      normalizedFilters = filterValidation.normalizedFilters as IAdminForthAndOrFilter;
    }

    const promises: Promise<any>[] = [this.getDataWithOriginalTypes({ resource, limit, offset, sort, filters: normalizedFilters })];
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
        if (!record) {
            return null;
        }
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