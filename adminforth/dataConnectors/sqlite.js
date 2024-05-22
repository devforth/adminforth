import betterSqlite3 from 'better-sqlite3';
import { AdminForthTypes } from '../types';
import dayjs from 'dayjs';

class SQLiteConnector {
    constructor(url) {
      // create connection here
      this.db = betterSqlite3(url);
    }

    discoverFields(tableName) {
        const stmt = this.db.prepare(`PRAGMA table_info(${tableName})`);
        const rows = stmt.all();
        const fieldTypes = {};
        rows.forEach((row) => {
          const field = {};
          const baseType = row.type.toLowerCase();
          if (baseType == 'int') {
            field.type = AdminForthTypes.INTEGER;
            field.underlineType = 'int';
          } else if (baseType.includes('varchar(')) {
            field.type = AdminForthTypes.STRING;
            field.underlineType = 'varchar';
            const length = baseType.match(/\d+/);
            field.maxLength = length ? parseInt(length[0]) : null;
          } else if (baseType == 'text') {
            field.type = AdminForthTypes.TEXT;
            field.underlineType = 'text';
          } else if (baseType.includes('decimal(')) {
            field.type = AdminForthTypes.DECIMAL;
            field.underlineType = 'decimal';
            const [precision, scale] = baseType.match(/\d+/g);
            field.precision = parseInt(precision);
            field.scale = parseInt(scale);
          } else if (baseType == 'real') {
            field.type = AdminForthTypes.FLOAT; //8-byte IEEE floating point number. It
            field.underlineType = 'real';
          } else if (baseType == 'timestamp') {
            field.type = AdminForthTypes.DATETIME;
            field.underlineType = 'timestamp';
          } else {
            field.unknownType = baseType;
          }
          fieldTypes[row.name] = field
        });
        return fieldTypes;
    }

    getFieldValue(field, value) {
      if (field.type == AdminForthTypes.TIMESTAMP) {
        if (field.underlineType == 'timestamp' || field.underlineType == 'int') {
          return dayjs(value).toISOString();
        } else if (field.underlineType == 'varchar') {
          return dayjs(value).toISOString();
        } else {
          throw new Error(`AdminForth does not support row type: ${field.underlineType} for timestamps, use VARCHAR (with iso strings) or TIMESTAMP/INT (with unix timestamps)`);
        }
      }
    }

    setFieldValue(field, value) {
      if (field.type == AdminForthTypes.TIMESTAMP) {
        if (field.underlineType == 'timestamp' || field.underlineType == 'int') {
          // value is iso string now, convert to unix timestamp
          return dayjs(value).unix();
        } else if (field.underlineType == 'varchar') {
          // value is iso string now, convert to unix timestamp
          return dayjs(value).toISOString();
        }
      }
    }

    close() {
        this.db.close();
    }
}

export default SQLiteConnector;