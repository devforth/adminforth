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
          } else if (baseType == 'boolean') {
            field.type = AdminForthTypes.BOOLEAN;
            field._underlineType = 'boolean';
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

    getPrimaryKey(resource) {
        for (const col of resource.columns) {
            if (col.primaryKey) {
                return col.name;
            }
        }
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
      } else if (field.type == AdminForthTypes.BOOLEAN) {
        return !!value;
      }
      return value;
    }

    async getRecordByPrimaryKey(resource, key) {
        const columns = resource.columns.map((col) => col.name).join(', ');
        const tableName = resource.table;
        const stmt = this.db.prepare(`SELECT ${columns} FROM ${tableName} WHERE ${this.getPrimaryKey(resource)} = ?`);
        const row = stmt.get(key);
        if (!row) {
            return null;
        }
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
            newRow[key] = this.getFieldValue(resource.columns.find((col) => col.name == key), value);
        }
        return newRow;
    }

    setFieldValue(field, value) {
      if (field.type == AdminForthTypes.DATETIME) {
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
      } else if (field.type == AdminForthTypes.BOOLEAN) {
        return value ? 1 : 0;
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
      [AdminForthSortDirections.ASC]: 'ASC',
      [AdminForthSortDirections.DESC]: 'DESC',
    };
    

    getData({ resource, limit, offset, sort, filters }) {
      const columns = resource.columns.filter(c=> !c.virtual).map((col) => col.name).join(', ');
      const tableName = resource.table;
      
      for (const filter of filters) {
        if (!this.OperatorsMap[filter.operator]) {
          throw new Error(`Operator ${filter.operator} is not allowed`);
        }

        console.log('resource.c', resource.columns);
        if (!resource.columns.some((col) => col.name == filter.field)) {
          throw new Error(`Field "${filter.field}" is not in resource ${resource.resourceId}, available fields: ${resource.columns.map((col) => '"'+col.name+'"').join(', ')}`);
        }
      }

      const where = filters.length ? `WHERE ${filters.map((f, i) => {
        let placeholder = '?';
        let field = f.field;
        let operator = this.OperatorsMap[f.operator];
        if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          placeholder = `(${f.value.map(() => '?').join(', ')})`;
        } else if (f.operator == AdminForthFilterOperators.ILIKE) {
          placeholder = `LOWER(?)`;
          field = `LOWER(${f.field})`;
          operator = 'LIKE';
        }

        return `${field} ${operator} ${placeholder}`
      }).join(' AND ')}` : '';


      const filterValues = [];
      
      filters.length ? filters.forEach((f) => {
        // for arrays do set in map
        let v;
        if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          v = f.value.map((val) => this.setFieldValue(resource.columns.find((col) => col.name == f.field), val));
        } else {
          v = this.setFieldValue(resource.columns.find((col) => col.name == f.field), f.value);
        }

        if (f.operator == AdminForthFilterOperators.LIKE || f.operator == AdminForthFilterOperators.ILIKE) {
          filterValues.push(`%${v}%`);
        } else if (f.operator == AdminForthFilterOperators.IN || f.operator == AdminForthFilterOperators.NIN) {
          filterValues.push(...v);
        } else {
          filterValues.push(v);
        }
      }) : [];

      const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `${s.field} ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';
      

      const q = `SELECT ${columns} FROM ${tableName} ${where} ${orderBy} LIMIT ? OFFSET ?`;
      console.log('⚙️⚙️⚙️ preparing request', q);
      const stmt = this.db.prepare(q);
      const d = [...filterValues, limit, offset];
      console.log('⚙️⚙️⚙️ running request against data', d);
      const rows = stmt.all(d);

      const total = this.db.prepare(`SELECT COUNT(*) FROM ${tableName} ${where}`).get([...filterValues])['COUNT(*)'];
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
        const stmt = await this.db.prepare(`SELECT MIN(${col.name}) as min, MAX(${col.name}) as max FROM ${tableName}`);
        const { min, max } = stmt.get();
        result[col.name] = {
          min: this.getFieldValue(col, min),
          max: this.getFieldValue(col, max),
        };
      }))
      return result;
    }

    async createRecord({ resource, record }) {
        const tableName = resource.table;
        const columns = resource.columns.map((col) => col.name).join(', ');
        const placeholders = resource.columns.map(() => '?').join(', ');
        const values = resource.columns.map((col) => this.setFieldValue(col, record[col.name]));
        this.db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`).run(values);
    }

    async updateRecord({ resource, recordId, record, newValues }) {
        const columns = Object.keys(newValues).map((col) => col).join(', ');
        const placeholders = Object.keys(newValues).map(() => '?').join(', ');
        const values = [...Object.values(newValues), recordId];

        this.db.prepare(
            `UPDATE ${resource.table} SET ${columns} = ${placeholders} WHERE ${this.getPrimaryKey(resource)} = ?`
        ).run(values);
    }

    async deleteRecord({ resource, recordId }) {
        this.db.prepare(`DELETE FROM ${resource.table} WHERE ${this.getPrimaryKey(resource)} = ?`).run(recordId);
    }

    close() {
        this.db.close();
    }
}

export default SQLiteConnector;