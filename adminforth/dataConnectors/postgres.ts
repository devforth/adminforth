import dayjs from 'dayjs';
import { AdminForthResource, IAdminForthSingleFilter, IAdminForthAndOrFilter, IAdminForthDataSourceConnector } from '../types/Back.js';
import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections, } from '../types/Common.js';
import AdminForthBaseConnector from './baseConnector.js';
import pkg from 'pg';
import { afLogger, dbLogger } from '../modules/logger.js';

const { Client } = pkg;


class PostgresConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

    async setupClient(url: string): Promise<void> {
        this.client = new Client({
            connectionString: url
        });
        try {
            await this.client.connect();
            this.client.on('error', async (err) => {
                afLogger.error(`Postgres error: ${err.message} ${err.stack}`);
                this.client.end();
                await new Promise((resolve) => { setTimeout(resolve, 1000) });
                this.setupClient(url);
            });
        } catch (e) {
            afLogger.error(`Failed to connect to Postgres ${e}`);
        }
    }

    OperatorsMap = {
        [AdminForthFilterOperators.EQ]: '=',
        [AdminForthFilterOperators.NE]: 'IS DISTINCT FROM',
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
        [AdminForthFilterOperators.IS_EMPTY]: 'IS NULL',
        [AdminForthFilterOperators.IS_NOT_EMPTY]: 'IS NOT NULL',
    };

    SortDirectionsMap = {
        [AdminForthSortDirections.asc]: 'ASC',
        [AdminForthSortDirections.desc]: 'DESC',
    };

    async getAllTables(): Promise<Array<string>> {
        const res = await this.client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        `);
        return res.rows.map(row => row.table_name);
    }
    
    async getAllColumnsInTable(tableName: string): Promise<Array<{ name: string; sampleValue?: any }>> {
        const res = await this.client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public';
        `, [tableName]);
        const sampleRowRes = await this.client.query(`SELECT * FROM ${tableName} ORDER BY ctid DESC LIMIT 1`);
        const sampleRow = sampleRowRes.rows[0] ?? {};
        return res.rows.map(row => ({ name: row.column_name, sampleValue: sampleRow[row.column_name] }));
      }
      
    async discoverFields(resource) {

        const tableName = resource.table;
        const stmt = await this.client.query(`
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
            const isPgArray = baseType.endsWith('[]');
            const normalizedBaseType = isPgArray ? baseType.slice(0, -2) : baseType;
            if (normalizedBaseType == 'int') {
                field.type = AdminForthDataTypes.INTEGER;
                field._underlineType = 'int';

            } else if (normalizedBaseType.includes('float') || normalizedBaseType.includes('double')) {
                field.type = AdminForthDataTypes.FLOAT;
                field._underlineType = 'float';

            } else if (normalizedBaseType.includes('bool')) {
                field.type = AdminForthDataTypes.BOOLEAN;
                field._underlineType = 'bool';

            } else if (normalizedBaseType == 'uuid') {
                field.type = AdminForthDataTypes.STRING;
                field._underlineType = 'uuid';

            } else if (normalizedBaseType.includes('character varying')) {
                field.type = AdminForthDataTypes.STRING;
                field._underlineType = 'varchar';
                const length = normalizedBaseType.match(/\d+/);
                field.maxLength = length ? parseInt(length[0]) : null;

            } else if (normalizedBaseType == 'text') {
                field.type = AdminForthDataTypes.TEXT;
                field._underlineType = 'text';

            } else if (normalizedBaseType.includes('decimal(') || normalizedBaseType.includes('numeric(')) {
                field.type = AdminForthDataTypes.DECIMAL;
                field._underlineType = 'decimal';
                const [precision, scale] = normalizedBaseType.match(/\d+/g);
                field.precision = parseInt(precision);
                field.scale = parseInt(scale);

            } else if (normalizedBaseType == 'real') {
                field.type = AdminForthDataTypes.FLOAT;
                field._underlineType = 'real';

            } else if (normalizedBaseType == 'date') {
                field.type = AdminForthDataTypes.DATE;
                field._underlineType = 'timestamp';

            } else if (normalizedBaseType.includes('date') || normalizedBaseType.includes('time')) {
                field.type = AdminForthDataTypes.DATETIME;
                field._underlineType = 'timestamp';
            } else if (normalizedBaseType == 'json' || normalizedBaseType == 'jsonb') {
                field.type = AdminForthDataTypes.JSON;
                field._underlineType = 'json';
            } else {
                field.type = 'unknown'
            }
            field._baseTypeDebug = baseType;
            if (isPgArray) {
                field._isPgArray = true;
            }
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
                throw new Error(`AdminForth does not support row type: ${field._underlineType} for timestamps, use VARCHAR (with iso strings) or TIMESTAMP/INT (with unix timestamps). Issue in field: ${field.name} in table: ${field.table}`);
            }
        }

        if (field.type == AdminForthDataTypes.DATE) {
            if (!value) {
                return null;
            }
            return dayjs(value).toISOString().split('T')[0];
        }

        if (field.type == AdminForthDataTypes.BOOLEAN) {
            return value === null ? null : !!value;
        } 

        if (field.type == AdminForthDataTypes.JSON) {
            if (typeof value == 'string') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return { 'error': `Failed to parse JSON: ${e.message}` }
                }
            } else if (typeof value == 'object') {
                return value;
            } else {
                afLogger.error(`JSON field value is not string or object, but has type: ${typeof value}`);
                afLogger.error(`Field:, ${field}`);
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
        } else if (field.isArray?.enabled) {
            if (value === null || value === undefined) {
                return null;
            }
            if (field._isPgArray) {
                return value;
            }
            if (field._underlineType == 'json') {
                return JSON.stringify(value);
            }
            return JSON.stringify(value);
        } else if (field.type == AdminForthDataTypes.BOOLEAN) {
            return value === null ? null : (value ? true : false);
        } else if (field.type == AdminForthDataTypes.JSON) {
            if (field._underlineType == 'json') {
                return typeof value === 'string' || value === null ? value : JSON.stringify(value);
            } else {
                return JSON.stringify(value);
            }
        }
        return value;
    }

    getFilterString(resource: AdminForthResource, filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): string {
        if ((filter as IAdminForthSingleFilter).field) {
            // Field-to-field comparison support
            if ((filter as IAdminForthSingleFilter).rightField) {
                const left = `"${(filter as IAdminForthSingleFilter).field}"`;
                const right = `"${(filter as IAdminForthSingleFilter).rightField}"`;
                const operator = this.OperatorsMap[filter.operator];
                return `${left} ${operator} ${right}`;
            }
            let placeholder = '$?';
            let field = (filter as IAdminForthSingleFilter).field;
            const fieldData = resource.dataSourceColumns.find((col) => col.name == field);
            let operator = this.OperatorsMap[filter.operator];
            
            // Handle IS_EMPTY and IS_NOT_EMPTY operators
            if (filter.operator == AdminForthFilterOperators.IS_EMPTY || filter.operator == AdminForthFilterOperators.IS_NOT_EMPTY) {
                return `"${field}" ${operator}`;
            } else if (filter.operator == AdminForthFilterOperators.IN || filter.operator == AdminForthFilterOperators.NIN) {
                placeholder = `(${filter.value.map(() => placeholder).join(', ')})`;
            }

            if (fieldData._underlineType == 'uuid' &&
                (filter.operator == AdminForthFilterOperators.ILIKE || filter.operator == AdminForthFilterOperators.LIKE)
            ) {
                field = `cast("${field}" as text)`
            } else if (filter.operator == AdminForthFilterOperators.EQ && filter.value === null) {
                operator = 'IS';
                placeholder = 'NULL';
            } else {
                field = `"${field}"`
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
            if ((filter as IAdminForthSingleFilter).rightField) {
                // No params for field-to-field comparisons
                return [];
            }
            // filter is a Single filter
            
            // Handle IS_EMPTY and IS_NOT_EMPTY operators - no params needed
            if (filter.operator == AdminForthFilterOperators.IS_EMPTY || filter.operator == AdminForthFilterOperators.IS_NOT_EMPTY) {
                return [];
            } else if (filter.operator == AdminForthFilterOperators.LIKE || filter.operator == AdminForthFilterOperators.ILIKE) {
                return [`%${filter.value}%`];
            } else if (filter.operator == AdminForthFilterOperators.IN || filter.operator == AdminForthFilterOperators.NIN) {
                return filter.value;
            } else if (filter.operator == AdminForthFilterOperators.EQ && filter.value === null) {
                return [];
            } else {
                return [(filter as IAdminForthSingleFilter).value];
            }
        }

        // filter is a single insecure raw sql
        if ((filter as IAdminForthSingleFilter).insecureRawSQL) {
            return [];
        }

        // filter is a AndOrFilter
        return (filter as IAdminForthAndOrFilter).subFilters.reduce((params: any[], f: IAdminForthSingleFilter | IAdminForthAndOrFilter) => {
            return params.concat(this.getFilterParams(f));
        }, []);
    }

    whereClauseAndValues(resource: AdminForthResource, filters: IAdminForthAndOrFilter): {
        sql: string,
        paramsCount: number,
        values: any[],
    } {
        let where = filters.subFilters.length ? `WHERE ${this.getFilterString(resource, filters)}` : '';
        const filterValues = filters.subFilters.length ? this.getFilterParams(filters) : [];
        filterValues.forEach((_, i) => where = where.replace('$?', `$${i + 1}`));
        return {
            sql: where,
            paramsCount: filterValues.length + 1,
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
        const selectQuery = `SELECT ${columns} FROM "${tableName}" ${where} ${orderBy} ${limitOffset}`;
        dbLogger.trace(`🪲📜 PG Q: ${selectQuery}, params: ${JSON.stringify(d)}`);
        const stmt = await this.client.query(selectQuery, d);
        const rows = stmt.rows;
        return rows.map((row) => {
            const newRow = {};
            for (const [key, value] of Object.entries(row)) {
                newRow[key] = value;
            }
            return newRow;
        });
    }

    async getCount({ resource, filters }: { resource: AdminForthResource; filters: IAdminForthAndOrFilter; }): Promise<number> {
        const tableName = resource.table;
        // validate and normalize in case this method is called from dataAPI
        if (filters) {
            const filterValidation = this.validateAndNormalizeFilters(filters, resource);
            if (!filterValidation.ok) {
                throw new Error(filterValidation.error);
            }
        }
        const { sql: where, values: filterValues } = this.whereClauseAndValues(resource, filters);
        const q = `SELECT COUNT(*) FROM "${tableName}" ${where}`;
        dbLogger.trace(`🪲📜 PG Q: ${q}, values: ${JSON.stringify(filterValues)}`);
        const stmt = await this.client.query(q, filterValues);
        return +stmt.rows[0].count;
    }

    async getMinMaxForColumnsWithOriginalTypes({ resource, columns }) {
        const tableName = resource.table;
        const result = {};
        await Promise.all(columns.map(async (col) => {
            const q = `SELECT MIN("${col.name}") as min, MAX("${col.name}") as max FROM "${tableName}"`;
            dbLogger.trace(`🪲📜 PG Q: ${q}`);
            const stmt = await this.client.query(q);
            const { min, max } = stmt.rows[0];
            result[col.name] = {
                min, max,
            };
        }))
        return result;
    }

    async createRecordOriginalValues({ resource, record }): Promise<string> {
        const tableName = resource.table;
        const columns = Object.keys(record);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map((colName) => record[colName]);
        for (let i = 0; i < columns.length; i++) {
            columns[i] = `"${columns[i]}"`;
        }
        const primaryKey = this.getPrimaryKey(resource);
        const q = `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING "${primaryKey}"`;
        dbLogger.trace(`🪲📜 PG Q: ${q}, values: ${JSON.stringify(values)}`);
        const ret = await this.client.query(q, values);
        return ret.rows[0][primaryKey];
    }

    async updateRecordOriginalValues({ resource, recordId, newValues }) {
        const values = [...Object.values(newValues), recordId];
        const columnsWithPlaceholders = Object.keys(newValues).map((col, i) => `"${col}" = $${i + 1}`).join(', ');
        const q = `UPDATE "${resource.table}" SET ${columnsWithPlaceholders} WHERE "${this.getPrimaryKey(resource)}" = $${values.length}`;
        dbLogger.trace(`🪲📜 PG Q: ${q}, values: ${JSON.stringify(values)}`);
        await this.client.query(q, values);
    }

    async deleteRecord({ resource, recordId }): Promise<boolean> {
        const q = `DELETE FROM "${resource.table}" WHERE "${this.getPrimaryKey(resource)}" = $1`;
        dbLogger.trace(`🪲📜 PG Q: ${q}, values: ${JSON.stringify([recordId])}`);
        const res = await this.client.query(q, [recordId]);
        return res.rowCount > 0;
    }

    async close() {
        await this.client.end();
    }
}

export default PostgresConnector;