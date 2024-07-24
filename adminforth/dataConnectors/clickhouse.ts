import betterSqlite3 from 'better-sqlite3';
import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections, IAdminForthDataSourceConnector, AdminForthResource, AdminForthResourceColumn } from '../types/AdminForthConfig.js';
import AdminForthBaseConnector from './baseConnector.js';
import dayjs from 'dayjs';
import { createClient, ClickHouseLogLevel } from '@clickhouse/client' // or '@clickhouse/client-web'
import { isObject } from 'util';
import { date } from 'zod';



class ClickhouseConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

    client: any;
    dbName: string;

    /**
     * url: http[s]://[username:password@]hostname:port[/database][?param1=value1&param2=value2]
     * @param param0 
     */
    constructor({ url }: { url: string }) {
      super();
      this.dbName = new URL(url).pathname.replace('/', '');
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
        const q = await this.client.query({
          query: `SELECT * FROM system.columns WHERE table = '${tableName}' and database = '${this.dbName}'`,
          format: 'JSONEachRow',
        });
        const rows = await q.json();

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
            // const [precision, scale] = baseType.match(/\d+/g);
            // TODO
            // field.precision = parseInt(precision);
            // field.scale = parseInt(scale);
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
    

    async getDataWithOriginalTypes({ resource, limit, offset, sort, filters, getTotals }: { 
        resource: AdminForthResource, 
        limit: number, 
        offset: number, 
        sort: { field: string, direction: AdminForthSortDirections }[], 
        filters: { field: string, operator: AdminForthFilterOperators, value: any }[],
        getTotals?: boolean, 
    }): Promise<{ data: any[], total: number }> {
      const columns = resource.dataSourceColumns.map((col) => col.name).join(', ');
      const tableName = resource.table;

      const where = filters.length ? `WHERE ${filters.map((f, i) => {
        const column = resource.dataSourceColumns.find((col) => col.name == f.field);
        let placeholder = `{f${i}:${column._underlineType}}`;
        let field = f.field;
        let operator = this.OperatorsMap[f.operator];
        if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          placeholder = `(${f.value.map((_, j) => `p${i}_${j}`).join(', ')})`;
        }

        return `${field} ${operator} ${placeholder}`
      }).join(' AND ')}` : '';

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

      const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `${s.field} ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';
      

      const q = `SELECT ${columns} FROM ${tableName} ${where} ${orderBy} LIMIT {limit:Int} OFFSET {offset:Int}`;
      const d = {
        ...params,
        limit,
        offset,
      };
      console.log('🪲 Clickhouse Query', q, 'params:', d);

      const stmt = await this.client.query({
        query: q,
        format: 'JSONEachRow',
        query_params: d,
      });

      if (process.env.HEAVY_DEBUG) {
        console.log('🪲 Clickhouse Query', q, 'params:', d);
      }
      const rows = await stmt.json();

      let total = 0;
      if (getTotals) {
        const countQ = await this.client.query({
          query: `SELECT COUNT(*) FROM ${tableName} ${where}`,
          format: 'JSONEachRow',
          query_params: d,
        });
        const countResp = await countQ.json()
        console.log('🪲 Clickhouse Query count', countResp);
        total = countResp[0]['COUNT()'];
      }

      return {
        data: rows.map((row) => {
          const newRow = {};
          for (const [key, value] of Object.entries(row)) {
            newRow[key] = value;
          }
          return newRow;
        }),
        total,
      };
    }

    async getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource, columns: AdminForthResourceColumn[] }): Promise<{ [key: string]: { min: any, max: any } }> {
      const tableName = resource.table;
      const result = {};
      await Promise.all(columns.map(async (col) => {
        // const stmt = await this.db.prepare(`SELECT MIN(${col.name}) as min, MAX(${col.name}) as max FROM ${tableName}`);
        // const { min, max } = stmt.get();
        // result[col.name] = {
        //   min, max,
        // };
      }))
      return result;
    }
    async createRecordOriginalValues({ resource, record }: { resource: AdminForthResource, record: any }) {
      const tableName = resource.table;
      const columns = Object.keys(record);
      
      // const q = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map((colName) => {
      //   const colType = resource.dataSourceColumns.find((col) => col.name == colName)._underlineType;
      //   if (colType.startsWith('Int') || colType.startsWith('UInt') || colType.startsWith('Float')) {
      //     return record[colName];
      //   } else {
      //     return "'"+record[colName]+"'"
      //   }
      // }).join(', ')  })`;
      // console.log('🪲 Clickhouse Query', q) ;
      // await this.client.command({
      //   query: q,

      // });

      console.log('🪲 Clickhouse Insert', record);

      await this.client.insert({
        database: this.dbName,
        table: tableName,
        columns: columns,
        values: [Object.values(record)],
      });

      console.log('🪲 Clickhouse Query done');
      
    }

    async updateRecord({ resource, recordId, newValues }: { resource: AdminForthResource, recordId: any, newValues: any }) {
      const columnsWithPlaceholders = Object.keys(newValues).map((col) => `${col} = ?`);
      const values = [...Object.values(newValues), recordId];

      // const q = this.db.prepare(
      //     `UPDATE ${resource.table} SET ${columnsWithPlaceholders} WHERE ${this.getPrimaryKey(resource)} = ?`
      // )
      // await q.run(values);
    }

    async deleteRecord({ resource, recordId }: { resource: AdminForthResource, recordId: any }) {
      const pkColumn = resource.dataSourceColumns.find((col) => col.primaryKey);
      await this.client.command(
        { 
          query: `ALTER TABLE ${this.dbName}.${resource.table} DELETE WHERE ${
            pkColumn.name
          } = {recordId:${pkColumn._underlineType}}`, 
          query_params: { recordId },
      }
      );
    }

    close() {
      this.client.disconnect();
    }
}

export default ClickhouseConnector;