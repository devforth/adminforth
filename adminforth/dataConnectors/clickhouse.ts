import { IAdminForthDataSourceConnector, IAdminForthSingleFilter, IAdminForthAndOrFilter, AdminForthResource, AdminForthResourceColumn } from '../types/Back.js';
import AdminForthBaseConnector from './baseConnector.js';
import dayjs from 'dayjs';
import { createClient } from '@clickhouse/client'

import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections } from '../types/Common.js';

class ClickhouseConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {
  
  dbName: string;
  url: string;
  
  async setupClient(url): Promise<void> {
    this.dbName = new URL(url).pathname.replace('/', '');
    this.url = url;
    // create connection here
    this.client = createClient({
      url: url.replace('clickhouse://', 'http://'),
      clickhouse_settings: {
        // Allows to insert serialized JS Dates (such as '2023-12-06T10:54:48.000Z')
        date_time_input_format: 'best_effort',

        // Recommended for cluster usage to avoid situations where a query processing error occurred after the response code, 
        // and HTTP headers were already sent to the client.
        // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
        wait_end_of_query: 1,
      },
      // log:{
      //   level: ClickHouseLogLevel.TRACE,
      // }
    });
  }
  async getAllTables(): Promise<Array<string>> {
    const res = await this.client.query({
        query: `
            SELECT name
            FROM system.tables
            WHERE database = '${this.dbName}'
        `,
        format: 'JSON',
    });
    const jsonResult = await res.json();
    return jsonResult.data.map((row: any) => row.name);
  }
  
  async getAllColumnsInTable(tableName: string): Promise<string[]> {
    const res = await this.client.query({
      query: `
        SELECT name
        FROM system.columns
        WHERE database = '${this.dbName}' AND table = {table:String}
      `,
      format: 'JSON',
      query_params: {
        table: tableName,
      },
    });
  
    const jsonResult = await res.json();
    return jsonResult.data.map((row: any) => row.name);
  }
  
    async discoverFields(resource: AdminForthResource): Promise<{[key: string]: AdminForthResourceColumn}> {
        const tableName = resource.table;

        let rows;
        try {
          const q = await this.client.query({
            query: `SELECT * FROM system.columns WHERE table = '${tableName}' and database = '${this.dbName}'`,
            format: 'JSONEachRow',
          });
          rows = await q.json();
        } catch (e) {
          console.error(` 🛑Error connecting to datasource URL ${this.url}:`, e);
          return null;
        }

        const fieldTypes = {};
        rows.forEach((row) => {
          const field: any = {};
          const baseType = row.type;
          if (baseType.startsWith('Int') || baseType.startsWith('UInt')) {
            field.type = AdminForthDataTypes.INTEGER;
          } else if (baseType === 'FixedString' || baseType === 'String') {
            field.type = AdminForthDataTypes.STRING;
            // TODO
            // const length = baseType.match(/\d+/g);
            // field.maxLength = length ? parseInt(length[0]) : null;
          } else if (baseType == 'UUID') {
            field.type = AdminForthDataTypes.STRING;
          } else if (baseType.startsWith('Decimal')) {
            field.type = AdminForthDataTypes.DECIMAL;
            const [precision, scale] = baseType.match(/\d+/g);
            field.precision = parseInt(precision);
            field.scale = parseInt(scale);
          } else if (baseType.startsWith('Float')) {
            field.type = AdminForthDataTypes.FLOAT;
          } else if (baseType == 'DateTime64' || baseType == 'DateTime' || baseType.startsWith('DateTime64(')) {
            field.type = AdminForthDataTypes.DATETIME;
          } else if (baseType == 'Date' || baseType == 'Date64') {
            field.type = AdminForthDataTypes.DATE;
          } else if (baseType == 'Boolean' || baseType == 'Bool') {
            field.type = AdminForthDataTypes.BOOLEAN;
            field._underlineType = 'boolean';
          } else {
            field.type = 'unknown'
          }
          field._underlineType = baseType;
          field._baseTypeDebug = baseType;
          field.required = row.notnull == 1;
          field.primaryKey = row.pk == 1;
          field.default = row.dflt_value;
          fieldTypes[row.name] = field
        });
        return fieldTypes;
    }

    getFieldValue(field: AdminForthResourceColumn, value: any): any {
      if (field.type == AdminForthDataTypes.DATETIME) {
        if (!value) {
          return null;
        }
        if (field._underlineType.startsWith('Int') || field._underlineType.startsWith('UInt')) {
          return dayjs.unix(+value).toISOString();
        } else if (field._underlineType.startsWith('DateTime') 
            || field._underlineType.startsWith('String') 
            || field._underlineType.startsWith('FixedString')) {
          const v = dayjs(value).toISOString();
          return v;
        } else {
          throw new Error(`AdminForth does not support row type: ${field._underlineType} for timestamps, use VARCHAR (with iso strings) or TIMESTAMP/INT (with unix timestamps). Issue in field "${field.name}"`);
        }
      } else if (field.type == AdminForthDataTypes.DATE) {
        if (!value) {
          return null;
        }
        return dayjs(value).toISOString().split('T')[0];
      } else if (field.type == AdminForthDataTypes.BOOLEAN) {
        return value === null ? null : !!value;
      } else if (field.type == AdminForthDataTypes.JSON) {
        if (field._underlineType.startsWith('String') || field._underlineType.startsWith('FixedString')) {
          try {
            return JSON.parse(value);
          } catch (e) {
              return {'error': `Failed to parse JSON: ${e.message}`}
          }
        } else {
          console.error(`AdminForth: JSON field is not a string but ${field._underlineType}, this is not supported yet`);
        }
      }
      return value;
    }

    setFieldValue(field: AdminForthResourceColumn, value: any): any {
      if (field.type == AdminForthDataTypes.DATETIME) {
        if (!value) {
          return null;
        }
        if (field._underlineType.startsWith('Int') || field._underlineType.startsWith('UInt')) {
          // value is iso string now, convert to unix timestamp
          return dayjs(value).unix();
        } else if (field._underlineType.startsWith('DateTime') 
          || field._underlineType.startsWith('String') 
          || field._underlineType.startsWith('FixedString')) {
          // value is iso string now, convert to unix timestamp
          const iso = dayjs(value).format('YYYY-MM-DDTHH:mm:ss');
          return iso;
        }
      } else if (field.type == AdminForthDataTypes.BOOLEAN) {
        return  value === null ? null : (value ? 1 : 0);
      } else if (field.type == AdminForthDataTypes.JSON) {
        // check underline type is text or string
        if (field._underlineType.startsWith('String') || field._underlineType.startsWith('FixedString')) {
          return JSON.stringify(value);
        } else {
          console.error(`AdminForth: JSON field is not a string/text but ${field._underlineType}, this is not supported yet`);
        }
      }

      return value;
    }

    OperatorsMap = {
      [AdminForthFilterOperators.EQ]: '=',
      [AdminForthFilterOperators.NE]: '!=',
      [AdminForthFilterOperators.GT]: '>',
      [AdminForthFilterOperators.LT]: '<',
      [AdminForthFilterOperators.GTE]: '>=',
      [AdminForthFilterOperators.LTE]: '<=',
      [AdminForthFilterOperators.LIKE]: 'LIKE',
      [AdminForthFilterOperators.ILIKE]: 'ILIKE',
      [AdminForthFilterOperators.IN]: 'IN',
      [AdminForthFilterOperators.NIN]: 'NOT IN',
      [AdminForthFilterOperators.AND]: 'AND',
      [AdminForthFilterOperators.OR]: 'OR',
    };

    SortDirectionsMap = {
      [AdminForthSortDirections.asc]: 'ASC',
      [AdminForthSortDirections.desc]: 'DESC',
    };
  
    getFilterString(resource: AdminForthResource, filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): string {
      if ((filter as IAdminForthSingleFilter).field) {
        // filter is a Single filter
        let field = (filter as IAdminForthSingleFilter).field;
        const column = resource.dataSourceColumns.find((col) => col.name == field);
        let placeholder = `{f$?:${column._underlineType}}`;
        let operator = this.OperatorsMap[filter.operator];
        if (filter.operator == AdminForthFilterOperators.IN || filter.operator == AdminForthFilterOperators.NIN) {
          placeholder = `(${filter.value.map((_, j) => `{p$?:${column._underlineType}}`).join(', ')})`;
        } else if (filter.operator == AdminForthFilterOperators.EQ && filter.value === null) {
          operator = 'IS';
          placeholder = 'NULL';
        } else if (filter.operator == AdminForthFilterOperators.NE) {
          if (filter.value === null) {
            operator = 'IS NOT';
            placeholder = 'NULL';
          } else {
            // for not equal, we need to add a null check
            // because nullish field will not match != value
            placeholder = `${placeholder} OR ${field} IS NULL)`;
            field = `(${field}`;
          }
        }

        return `${field} ${operator} ${placeholder}`;
      }

      // filter is a single insecure raw sql
      if ((filter as IAdminForthSingleFilter).insecureRawSQL) {
        return (filter as IAdminForthSingleFilter).insecureRawSQL;
      }

      // filter is a AndOr filter
      return (filter as IAdminForthAndOrFilter).subFilters.map((f) => {
        if ((f as IAdminForthSingleFilter).field || (f as IAdminForthSingleFilter).insecureRawSQL) {
          // subFilter is a Single filter
          return this.getFilterString(resource, f);
        }

        // subFilter is a AndOr filter - add parentheses
        return `(${this.getFilterString(resource, f)})`;
      }).join(` ${this.OperatorsMap[filter.operator]} `);
    }
    
    getFilterParams(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): any[] {
      if ((filter as IAdminForthSingleFilter).field) {
        // filter is a Single filter
        if (filter.operator == AdminForthFilterOperators.LIKE || filter.operator == AdminForthFilterOperators.ILIKE) {
          return [{ 'f': `%${filter.value}%` }];
        } else if (filter.operator == AdminForthFilterOperators.IN || filter.operator == AdminForthFilterOperators.NIN) {
          return [{ 'p': filter.value }];
        } else if (filter.operator == AdminForthFilterOperators.EQ && filter.value === null) {
          // there is no param for IS NULL filter
          return [];
        } else if (filter.operator == AdminForthFilterOperators.NE && filter.value === null) {
          // there is no param for IS NOT NULL filter
          return [];
        } else {
          return [{ 'f': (filter as IAdminForthSingleFilter).value }];
        }
      }

      // filter is a Single insecure raw sql
      if ((filter as IAdminForthSingleFilter).insecureRawSQL) {
        return [];
      }

      // filter is a AndOrFilter
      return (filter as IAdminForthAndOrFilter).subFilters.reduce((params: any[], f: IAdminForthSingleFilter | IAdminForthAndOrFilter) => {
        return params.concat(this.getFilterParams(f));
      }, []);
    }

    whereParams(filters: IAdminForthAndOrFilter): any {
      if (filters.subFilters.length === 0) {
        return {};
      }
      const paramsArray = this.getFilterParams(filters);
      const params = paramsArray.reduce((acc, param, paramIndex) => {
        if (param.f !== undefined) {
          acc[`f${paramIndex}`] = param.f;
        }
        else if (param.p !== undefined) {
          param.p.forEach((paramValue: any, paramValueIndex: number) => acc[`p${paramIndex}_${paramValueIndex}`] = paramValue);
        }

        return acc;
      }, {});

      return params;
  }

    whereClause(
      resource: AdminForthResource,
      filters: IAdminForthAndOrFilter
    ): {
      where: string,
      params: any,
    } {
      if (filters.subFilters.length === 0) {
        return {
          where: '',
          params: {},
        }
      }
      const params = this.whereParams(filters);
      const where = Object.keys(params).reduce((w, paramKey) => {
        // remove first char of string (will be "f" or "p") to leave only index
        const keyIndex = paramKey.substring(1);
        return w.replace('$?', keyIndex);
      }, `WHERE ${this.getFilterString(resource, filters)}`);

      return { where, params };
    }

    async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }: { 
        resource: AdminForthResource, 
        limit: number, 
        offset: number, 
        sort: { field: string, direction: AdminForthSortDirections }[], 
        filters: IAdminForthAndOrFilter,
    }): Promise<any[]> {
      const columns = resource.dataSourceColumns.map((col) => {
        // for decimal cast to string
        if (col.type == AdminForthDataTypes.DECIMAL) {
          return `toString(${col.name}) as ${col.name}`
        }
        return col.name;
      }).join(', ');
      const tableName = resource.table;

      const { where, params } = this.whereClause(resource, filters);

      const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `${s.field} ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';
      

      const q = `SELECT ${columns} FROM ${tableName} ${where} ${orderBy} LIMIT {limit:Int} OFFSET {offset:Int}`;
      const d = {
        ...params,
        limit,
        offset,
      };

      const stmt = await this.client.query({
        query: q,
        format: 'JSONEachRow',
        query_params: d,
      });

      const rows = await stmt.json();

      return rows.map((row) => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
          newRow[key] = value;
        }
        return newRow;
      });
    }

    async getCount({
      resource,
      filters,
    }: {
      resource: AdminForthResource;
      filters: IAdminForthAndOrFilter;
    }): Promise<number> {
      const tableName = resource.table;
      // validate and normalize in case this method is called from dataAPI
      if (filters) {
        const filterValidation = this.validateAndNormalizeFilters(filters, resource);
        if (!filterValidation.ok) {
          throw new Error(filterValidation.error);
        }
      }
      const { where, params } = this.whereClause(resource, filters);

      const countQ = await this.client.query({
        query: `SELECT COUNT(*) as count FROM ${tableName} ${where}`,
        format: 'JSONEachRow',
        query_params: params,
      });
      const countResp = await countQ.json()
      return +countResp[0]['count'];
    }

    async getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource, columns: AdminForthResourceColumn[] }): Promise<{ [key: string]: { min: any, max: any } }> {
      const tableName = resource.table;
      const result = {};
      await Promise.all(columns.map(async (col) => {
        const stmt = await this.client.query({
          query: `SELECT MIN(${col.name}) as min, MAX(${col.name}) as max FROM ${tableName}`,
          format: 'JSONEachRow',
        });
        const rows = await stmt.json();
        result[col.name] = {
          min: rows[0].min,
          max: rows[0].max,
        };

      }))
      return result;
    }
    async createRecordOriginalValues({ resource, record }: { resource: AdminForthResource, record: any }): Promise<string> {
      const tableName = resource.table;
      const columns = Object.keys(record);
      await this.client.insert({
        database: this.dbName,
        table: tableName,
        columns: columns,
        values: [Object.values(record)],
      });
      return '';
    }

    async updateRecordOriginalValues({ resource, recordId, newValues }: { resource: AdminForthResource, recordId: any, newValues: any }) {
      const columnsWithPlaceholders = Object.keys(newValues).map((col) => {
        return `${col} = {${col}:${resource.dataSourceColumns.find((c) => c.name == col)._underlineType}}`
      });

      await this.client.command(
        { 
          query: `ALTER TABLE ${this.dbName}.${resource.table} UPDATE ${columnsWithPlaceholders.join(', ')} WHERE ${this.getPrimaryKey(resource)} = {recordId:${resource.dataSourceColumns.find((c) => c.primaryKey)._underlineType}}`, 
          query_params: { ...newValues, recordId },
      }
      );
    }

    async deleteRecord({ resource, recordId }: { resource: AdminForthResource, recordId: any }): Promise<boolean> {
      const pkColumn = resource.dataSourceColumns.find((col) => col.primaryKey);
      const res = await this.client.command(
        { 
          query: `ALTER TABLE ${this.dbName}.${resource.table} DELETE WHERE ${
            pkColumn.name
          } = {recordId:${pkColumn._underlineType}}`, 
          query_params: { recordId },
        }
      );
      // todo test what is in res
      return res;
    }

    close() {
      this.client.disconnect();
    }
}

export default ClickhouseConnector;