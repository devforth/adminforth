import { AdminForthTypes } from '../types.js';
import dayjs from 'dayjs';
import pkg from 'pg';
const { Client } = pkg;


class PostgresConnector {
    constructor({ url }) {
      this.db = new Client({
        connectionString: url
      })
    }

    async discoverFields(tableName) {
        await this.db.connect();
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
        await this.db.end();
        return fieldTypes;
    }

    getFieldValue(field, value) {
        console.log('getFieldValue', field, value);
    }

    setFieldValue(field, value) {
        console.log('setFieldValue', field, value);
    }

    close() {
        return
    }
}

export default PostgresConnector;