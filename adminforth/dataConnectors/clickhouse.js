import dayjs from 'dayjs';
import pkg from 'pg';
import { AdminForthTypes } from '../types.js';
import { createClient } from '@clickhouse/client';
const { Client } = pkg;


class ClickhouseConnector {
    constructor({ url }) {
        this.db = createClient({
            url: url,
          })
          
          
        // this.db = new ClickHouse({
        //     debug: false,
        //     basicAuth: null,
        //     isUseGzip: false,
        //     trimQuery: false,
        //     usePost: false,
        //     format: "json", // "json" || "csv" || "tsv"
        //     raw: false
        //     // config: {
        //     //   session_timeout: 60,
        //     //   output_format_json_quote_64bit_integers: 0,
        //     // }
        // });

        this.OperatorsMap = {
            'eq': '=',
            'ne': '!=',
            'gt': '>',
            'gte': '>=',
            'lt': '<',
            'lte': '<=',
            'in': 'IN',
            'nin': 'NOT IN',
            'like': 'LIKE',
            'nlike': 'NOT LIKE',
        };
    }

    async discoverFields(tableName) {
        const rows = await this.db.query(`SELECT * FROM system.columns WHERE table = '${tableName}' `, [tableName]).toPromise();
        console.log('rows', rows);
        const fieldTypes = {};

        rows.forEach((row) => {
          const field = {};
          const baseType = row.type.toLowerCase();
          if (baseType == 'int') {
            field.type = AdminForthTypes.INTEGER;
            field._underlineType = 'int';

          } else if (baseType.includes('character varying')) {
            field.type = AdminForthTypes.STRING;
            field._underlineType = 'varchar';
            const length = baseType.match(/\d+/);
            field.maxLength = length ? parseInt(length[0]) : null;

          } else if (baseType == 'text') {
            field.type = AdminForthTypes.TEXT;
            field._underlineType = 'text';

          } else if (baseType.includes('decimal(')) {
            field.type = AdminForthTypes.DECIMAL;
            field._underlineType = 'decimal';
            const [precision, scale] = baseType.match(/\d+/g);
            field.precision = parseInt(precision);
            field.scale = parseInt(scale);

          } else if (baseType == 'real') {
            field.type = AdminForthTypes.FLOAT;
            field._underlineType = 'real';

          } else if (baseType == 'date') {
            field.type = AdminForthTypes.DATETIME;
            field._underlineType = 'timestamp';

          } else {
            field.type = 'unknown'
          }
          field._baseTypeDebug = baseType;
          field.required = !row.notnull == 1;
          field.primaryKey = row.pk == 1;
          field.default = row.dflt_value;
          fieldTypes[row.name] = field
        });
        return fieldTypes;
    }

    getFieldValue(field, value) {
        if (field.type == AdminForthTypes.DATETIME) {
          if (!value) {
            return null;
          }
          if (field._underlineType == 'timestamp' || field._underlineType == 'int') {
            return dayjs.unix(+value).toISOString();
          } else if (field._underlineType == 'varchar') {
            return dayjs.unix(+value).toISOString();
          } else {
            throw new Error(`AdminForth does not support row type: ${field._underlineType} for timestamps, use VARCHAR (with iso strings) or TIMESTAMP/INT (with unix timestamps)`);
          }
        }


        return value;
      }

    setFieldValue(field, value) {
      if (field.type == AdminForthTypes.TIMESTAMP) {
        if (field._underlineType == 'timestamp' || field._underlineType == 'int') {
          // value is iso string now, convert to unix timestamp
          return dayjs(value).unix();
        } else if (field._underlineType == 'varchar') {
          // value is iso string now, convert to unix timestamp
          return dayjs(value).toISOString();
        }
      }
    }
    
    async getData({ resource, limit, offset, sort, filters }) {
      const columns = resource.columns.map((col) => col.name).join(', ');
      const tableName = resource.table;
      
      for (const filter of filters) {
        if (!this.OperatorsMap[filter.operator]) {
          throw new Error(`Operator ${filter.operator} is not allowed`);
        }
        if (!resource.columns.some((col) => col.name == filter.field)) {
          throw new Error(`Field ${filter.field} is not in resource ${resource.resourceId}. Available fields: ${resource.columns.map((col) => col.name).join(', ')}`);
        }
      }
      const where = filters.length ? `WHERE ${filters.map((f, i) => `${f.field} ${this.OperatorsMap[f.operator]} '${f.value}'`).join(' AND ')}` : '';
      // const filterValues = filters.length ? filters.map((f) => f.value) : [];

      const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `${s.field} ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';
      const stmt = await this.db.query(`SELECT ${columns} FROM ${tableName} ${where} ${orderBy}  LIMIT ${limit} OFFSET ${offset}`).toPromise();
      const rows = stmt.rows;
      
      const total = (await this.db.query(`SELECT COUNT(*) FROM ${tableName} ${where}`).toPromise()).rows[0].count;
      // run all fields via getFieldValue
      return {
        data: rows.map((row) => {
          const newRow = {};
          for (const [key, value] of Object.entries(row)) {
              newRow[key] = this.getFieldValue(resource.columns.find((col) => col.name == key), value);
          }
          return newRow;
        }),
        total,
      };
    }
  
    async getMinMaxForColumns({ resource, columns }) {
        const tableName = resource.table;
        const result = {};
        await Promise.all(columns.map(async (col) => {
            const stmt = await this.db.query(`SELECT MIN(${col.name}) as min, MAX(${col.name}) as max FROM ${tableName}`).toPromise();
            const { min, max } = stmt.rows[0];
            result[col.name] = {
                min: this.getFieldValue(col, min),
                max: this.getFieldValue(col, max),
            };
        }))
        return result;
      }

    async close() {
        return
        await this.db.end();
    }
}

export default ClickhouseConnector;