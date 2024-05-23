import betterSqlite3 from 'better-sqlite3';
import { AdminForthTypes, AdminForthFilterOperators, AdminForthSortDirections } from '../types.js';
import dayjs from 'dayjs';

class SQLiteConnector {
    constructor({ url }) {
      // create connection here

      this.db = betterSqlite3(url.replace('sqlite://', ''));
    }

    async discoverFields(tableName) {
        const stmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
        const rows = await stmt.all();
        console.log('rows', rows);
        const fieldTypes = {};
        rows.forEach((row) => {
          const field = {};
          const baseType = row.type.toLowerCase();
          if (baseType == 'int') {
            field.type = AdminForthTypes.INTEGER;
            field._underlineType = 'int';
          } else if (baseType.includes('varchar(')) {
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
            field.type = AdminForthTypes.FLOAT; //8-byte IEEE floating point number. It
            field._underlineType = 'real';
          } else if (baseType == 'timestamp') {
            field.type = AdminForthTypes.DATETIME;
            field._underlineType = 'timestamp';
          } else {
            field.type = 'unknown'
          }
          field._baseTypeDebug = baseType;
          field.required = row.notnull == 1;
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
        if (!value) {
          return null;
        }
        if (field._underlineType == 'timestamp' || field._underlineType == 'int') {
          // value is iso string now, convert to unix timestamp
          return dayjs(value).unix();
        } else if (field._underlineType == 'varchar') {
          // value is iso string now, convert to unix timestamp
          return dayjs(value).toISOString();
        }
      }
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
      [AdminForthSortDirections.ASC]: 'ASC',
      [AdminForthSortDirections.DESC]: 'DESC',
    };
    

    getData({ resource, limit, offset, sort, filters }) {
      const columns = resource.columns.map((col) => col.name).join(', ');
      const tableName = resource.table;
      
      for (const filter of filters) {
        if (!this.OperatorsMap[filter.operator]) {
          throw new Error(`Operator ${filter.operator} is not allowed`);
        }

        if (resource.columns.some((col) => col.name == filter.field)) {
          throw new Error(`Field ${filter.field} is not in resource ${resource.resourceId}`);
        }
      }

      const where = filters.length ? `WHERE ${filters.map((f, i) => `${f.field} ${this.OperatorsMap[f.operator]} ?`).join(' AND ')}` : '';
      const filterValues = filters.length ? filters.map((f) => f.value) : [];

      const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `${s.field} ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';

      const stmt = this.db.prepare(`SELECT ${columns} FROM ${tableName} ${where} ${orderBy} LIMIT ? OFFSET ?`);
      const rows = stmt.all([...filterValues, limit, offset]);
      // run all fields via getFieldValue
      return rows.map((row) => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
          newRow[key] = this.getFieldValue(resource.columns.find((col) => col.name == key), value);
        }
        return newRow;
      });
    }



    close() {
        this.db.close();
    }
}

export default SQLiteConnector;