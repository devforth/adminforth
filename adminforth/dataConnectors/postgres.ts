import dayjs from 'dayjs';
import pkg from 'pg';
import { AdminForthDataTypes, AdminForthResource, AdminForthFilterOperators, AdminForthSortDirections, IAdminForthDataSourceConnector } from '../types/AdminForthConfig.js';
import AdminForthBaseConnector from './baseConnector.js';
const { Client } = pkg;


class PostgresConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

    db: any;

    constructor({ url }) {
        super();
        this.db = new Client({
            connectionString: url
        });
        (async () => {
            await this.db.connect();
            this.db.on('error', (err) => {
                console.log('Postgres error: ', err.message, err.stack)
                this.db.end();
                this.db = new PostgresConnector({ url }).db;
             });
        })();
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

    async discoverFields(resource) {
        const tableName = resource.table;
        const stmt = await this.db.query(`
        SELECT
            a.attname AS name,
            pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
            a.attnotnull AS notnull,
            COALESCE(pg_get_expr(d.adbin, d.adrelid), '') AS dflt_value,
            CASE
                WHEN ct.contype = 'p' THEN 1
                ELSE 0
            END AS pk
        FROM
            pg_catalog.pg_attribute a
        LEFT JOIN pg_catalog.pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
        LEFT JOIN pg_catalog.pg_constraint ct ON a.attnum = ANY (ct.conkey) AND a.attrelid = ct.conrelid
        LEFT JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
        LEFT JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid
        WHERE
            c.relname = $1
            AND a.attnum > 0
            AND NOT a.attisdropped
        ORDER BY
            a.attnum;
    `, [tableName]);
        const rows = stmt.rows;
        const fieldTypes = {};

        rows.forEach((row) => {
            const field: any = {};
            const baseType = row.type.toLowerCase();
            if (baseType == 'int') {
                field.type = AdminForthDataTypes.INTEGER;
                field._underlineType = 'int';

            } else if (baseType.includes('float') || baseType.includes('double')) {
                field.type = AdminForthDataTypes.FLOAT;
                field._underlineType = 'float';

            } else if (baseType.includes('bool')) {
                field.type = AdminForthDataTypes.BOOLEAN;
                field._underlineType = 'bool';

            } else if (baseType == 'uuid') {
                field.type = AdminForthDataTypes.STRING;
                field._underlineType = 'uuid';

            } else if (baseType.includes('character varying')) {
                field.type = AdminForthDataTypes.STRING;
                field._underlineType = 'varchar';
                const length = baseType.match(/\d+/);
                field.maxLength = length ? parseInt(length[0]) : null;

            } else if (baseType == 'text') {
                field.type = AdminForthDataTypes.TEXT;
                field._underlineType = 'text';

            } else if (baseType.includes('decimal(')) {
                field.type = AdminForthDataTypes.DECIMAL;
                field._underlineType = 'decimal';
                const [precision, scale] = baseType.match(/\d+/g);
                field.precision = parseInt(precision);
                field.scale = parseInt(scale);

            } else if (baseType == 'real') {
                field.type = AdminForthDataTypes.FLOAT;
                field._underlineType = 'real';

            } else if (baseType == 'date') {
                field.type = AdminForthDataTypes.DATE;
                field._underlineType = 'timestamp';

            } else if (baseType.includes('date') || baseType.includes('time')) {
                field.type = AdminForthDataTypes.DATETIME;
                field._underlineType = 'timestamp';
            } else if (baseType == 'json' || baseType == 'jsonb') {
                field.type = AdminForthDataTypes.JSON;
                field._underlineType = 'json';
            } else {
                field.type = 'unknown'
            }
            field._baseTypeDebug = baseType;
            field.primaryKey = row.pk == 1;
            field.default = row.dflt_value;
            field.required = row.notnull && !row.dflt_value;
            fieldTypes[row.name] = field
        });
        return fieldTypes;
    }

    getFieldValue(field, value) {
        if (field.type == AdminForthDataTypes.DATETIME) {
            if (!value) {
                return null;
            }
            if (field._underlineType == 'timestamp' || field._underlineType == 'int') {
                return dayjs(value).toISOString();
            } else if (field._underlineType == 'varchar') {
                return dayjs(value).toISOString();
            } else {
                throw new Error(`AdminForth does not support row type: ${field._underlineType} for timestamps, use VARCHAR (with iso strings) or TIMESTAMP/INT (with unix timestamps)`);
            }
        }

        if (field.type == AdminForthDataTypes.DATE) {
            if (!value) {
              return null;
            }
            return dayjs(value).toISOString().split('T')[0];
        }

        if (field.type == AdminForthDataTypes.JSON) {
            if (typeof value == 'string') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return {'error': `Failed to parse JSON: ${e.message}`}
                }
            } else if (typeof value == 'object') {
                return value;
            } else {
                console.error('JSON field value is not string or object, but has type:',  typeof value);
                console.error('Field:', field);
                return {}
            }
        }

        return value;
    }


    setFieldValue(field, value) {
      if (field.type == AdminForthDataTypes.DATETIME) {
        if (!value) {
          return null;
        }
        if (field._underlineType == 'timestamp' || field._underlineType == 'int') {
          return dayjs(value);
        } else if (field._underlineType == 'varchar') {
          return dayjs(value).toISOString();
        }
      } else if (field.type == AdminForthDataTypes.BOOLEAN) {
        return value ? 1 : 0;
      } else if (field.type == AdminForthDataTypes.JSON) {
        if (field._underlineType == 'json') {
            return value;
        } else {
            return JSON.stringify(value);
        }
      }
      return value;
    }

    whereClauseAndValues(resource: AdminForthResource, filters: { field: string, operator: AdminForthFilterOperators, value: any }[]) : {
      sql: string,
      paramsCount: number,
      values: any[],
    } {
      
      let totalCounter = 1;
      const where = filters.length ? `WHERE ${filters.map((f, i) => {
        let placeholder = '$'+(totalCounter);
        const fieldData = resource.dataSourceColumns.find((col) => col.name == f.field);
        let field = f.field;
        let operator = this.OperatorsMap[f.operator];
        if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
            placeholder = `(${f.value.map((_, i) => `$${totalCounter + i}`).join(', ')})`;
            totalCounter += f.value.length;
        } else {
            totalCounter += 1;
        }

        if (fieldData._underlineType == 'uuid') {
          field = `cast("${field}" as text)`
        } else { 
          field = `"${field}"`
        }
        return `${field} ${operator} ${placeholder}`;
      }).join(' AND ')}` : '';

      const filterValues = [];
      filters.length ? filters.forEach((f) => {
        // for arrays do set in map
        let v = f.value;

        if (f.operator == AdminForthFilterOperators.LIKE || f.operator == AdminForthFilterOperators.ILIKE) {
          filterValues.push(`%${v}%`);
        } else if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          filterValues.push(...v);
        } else {
          filterValues.push(v);
        }
      }) : [];
      return {
        sql: where,
        paramsCount: totalCounter,
        values: filterValues,
      };

    }

    
    async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }): Promise<any[]> {
      const columns = resource.dataSourceColumns.map((col) => `"${col.name}"`).join(', ');
      const tableName = resource.table;
      
      const { sql: where, paramsCount, values: filterValues } = this.whereClauseAndValues(resource, filters);

      const limitOffset = `LIMIT $${paramsCount} OFFSET $${paramsCount + 1}`; 
      const d = [...filterValues, limit, offset];
      const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `"${s.field}" ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';
      const selectQuery = `SELECT ${columns} FROM ${tableName} ${where} ${orderBy} ${limitOffset}`;
      if (process.env.HEAVY_DEBUG) {
        console.log('🪲 PG selectQuery:', selectQuery, 'params:', d);
      }
      const stmt = await this.db.query(selectQuery, d);
      const rows = stmt.rows;
      return rows.map((row) => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
            newRow[key] = value;
        }
        return newRow;
      });
    }

    async getCount({ resource, filters }: { resource: AdminForthResource; filters: { field: string, operator: AdminForthFilterOperators, value: any }[]; }): Promise<number> {
        const tableName = resource.table;
        const { sql: where, values: filterValues } = this.whereClauseAndValues(resource, filters);
        const stmt = await this.db.query(`SELECT COUNT(*) FROM ${tableName} ${where}`, filterValues);
        return stmt.rows[0].count;
    }
  
    async getMinMaxForColumnsWithOriginalTypes({ resource, columns }) {
        const tableName = resource.table;
        const result = {};
        await Promise.all(columns.map(async (col) => {
            const stmt = await this.db.query(`SELECT MIN(${col.name}) as min, MAX(${col.name}) as max FROM ${tableName}`);
            const { min, max } = stmt.rows[0];
            result[col.name] = {
                min, max,
            };
        }))
        return result;
    }

    async createRecordOriginalValues({ resource, record }) {
        const tableName = resource.table;
        const columns = Object.keys(record);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map((colName) => record[colName]);
        for (let i = 0; i < columns.length; i++) {
            columns[i] = `"${columns[i]}"`;
        }
        await this.db.query(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`, values);
    }

    async updateRecordOriginalValues({ resource, recordId,  newValues }) {
        const values = [...Object.values(newValues), recordId];
        const columnsWithPlaceholders = Object.keys(newValues).map((col, i) => `"${col}" = $${i + 1}`).join(', ');
        await this.db.query(`UPDATE ${resource.table} SET ${columnsWithPlaceholders} WHERE "${this.getPrimaryKey(resource)}" = $${values.length}`, values);
    }

    async deleteRecord({ resource, recordId }): Promise<boolean> {
      const res = await this.db.query(`DELETE FROM ${resource.table} WHERE "${this.getPrimaryKey(resource)}" = $1`, [recordId]);
      return res.rowCount > 0;
    }

    async close() {
        await this.db.end();
    }
}

export default PostgresConnector;