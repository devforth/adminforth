import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections, IAdminForthDataSourceConnector, AdminForthResource, AdminForthResourceColumn } from '../types/AdminForthConfig.js';
import AdminForthBaseConnector from './baseConnector.js';
import dayjs from 'dayjs';
import { createClient } from '@clickhouse/client'



class ClickhouseConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

    client: any;
    dbName: string;
    url: string;

    /**
     * url: http[s]://[username:password@]hostname:port[/database][?param1=value1&param2=value2]
     * @param param0 
     */
    constructor({ url }: { url: string }) {
      super();
      this.dbName = new URL(url).pathname.replace('/', '');
      this.url = url;;
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
          } else if (baseType == 'DateTime64' || baseType == 'DateTime') {
            field.type = AdminForthDataTypes.DATETIME;
          } else if (baseType == 'Date' || baseType == 'Date64') {
            field.type = AdminForthDataTypes.DATE;
          } else if (baseType == 'Boolean') {
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
        return !!value;
      } else if (field.type == AdminForthDataTypes.JSON) {
        if (field._underlineType.startsWith('String') || field._underlineType.startsWith('FixedString')) {
          return JSON.parse(value);
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
          const iso = dayjs(value).toISOString();
          return iso;
        }
      } else if (field.type == AdminForthDataTypes.BOOLEAN) {
        return value ? 1 : 0;
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
    };

    SortDirectionsMap = {
      [AdminForthSortDirections.asc]: 'ASC',
      [AdminForthSortDirections.desc]: 'DESC',
    };
    
    whereClause(
        resource: AdminForthResource,
        filters: { field: string, operator: AdminForthFilterOperators, value: any }[]
    ): string {
      return  filters.length ? `WHERE ${filters.map((f, i) => {
        const column = resource.dataSourceColumns.find((col) => col.name == f.field);
        let placeholder = `{f${i}:${column._underlineType}}`;
        let field = f.field;
        let operator = this.OperatorsMap[f.operator];
        if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          placeholder = `(${f.value.map((_, j) => `{p${i}_${j}:${
            column._underlineType
          }}`).join(', ')})`;
        }

        return `${field} ${operator} ${placeholder}`
      }).join(' AND ')}` : '';
    }

    whereParams(
        filters: { field: string, operator: AdminForthFilterOperators, value: any }[]
    ): any {
      const params = {};
      filters.length ? filters.forEach((f, i) => {
        // for arrays do set in map
        const v = f.value;

        if (f.operator == AdminForthFilterOperators.LIKE || f.operator == AdminForthFilterOperators.ILIKE) {
          params[`f${i}`] = `%${v}%`;
        } else if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          v.forEach((_, j) => {
            params[`p${i}_${j}`] = v[j];
          });
        } else {
          params[`f${i}`] = v;
        }
      }) : [];

      return params;
    }

    async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }: { 
        resource: AdminForthResource, 
        limit: number, 
        offset: number, 
        sort: { field: string, direction: AdminForthSortDirections }[], 
        filters: { field: string, operator: AdminForthFilterOperators, value: any }[],
    }): Promise<any[]> {
      console.log('getDataWithOriginalTypes', resource, limit, offset, sort, filters);
      const columns = resource.dataSourceColumns.map((col) => col.name).join(', ');
      const tableName = resource.table;

      const where = this.whereClause(resource, filters);

      const params = this.whereParams(filters);

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
      filters: { field: string, operator: AdminForthFilterOperators, value: any }[];
    }): Promise<number> {
      const tableName = resource.table;
      const where = this.whereClause(resource, filters);
      const d = this.whereParams(filters);
      
      const countQ = await this.client.query({
        query: `SELECT COUNT(*) FROM ${tableName} ${where}`,
        format: 'JSONEachRow',
        query_params: d,
      });
      const countResp = await countQ.json()
      return countResp[0]['COUNT()'];
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
    async createRecordOriginalValues({ resource, record }: { resource: AdminForthResource, record: any }) {
      const tableName = resource.table;
      const columns = Object.keys(record);
      await this.client.insert({
        database: this.dbName,
        table: tableName,
        columns: columns,
        values: [Object.values(record)],
      });
    }

    async updateRecord({ resource, recordId, newValues }: { resource: AdminForthResource, recordId: any, newValues: any }) {
      const columnsWithPlaceholders = Object.keys(newValues).map((col) => {
        return `${col} = {${col}:${resource.dataSourceColumns.find((c) => c.name == col)._underlineType}}`
      });
      const values = [...Object.values(newValues), recordId];

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