import { AdminForthTypes } from '../types.js';
import dayjs from 'dayjs';
import { MongoClient } from 'mongodb'


class MongoConnector {
    constructor({ url, fieldtypesByTable }) {
        this.db = new MongoClient(url, { useUnifiedTopology: true });
        if (fieldtypesByTable == null) {
            throw new Error('fieldtypesByTable is required for MongoConnector');
        }
        this.fieldtypesByTable = fieldtypesByTable;
    }

    async discoverFields(tableName) {
        return this.fieldtypesByTable[tableName];
    }

    getFieldValue(field, value) {
      if (field.type == AdminForthTypes.TIMESTAMP) {
        if (field._underlineType == 'timestamp' || field._underlineType == 'int') {
          return dayjs(value).toISOString();
        } else if (field._underlineType == 'varchar') {
          return dayjs(value).toISOString();
        } else {
          throw new Error(`AdminForth does not support row type: ${field._underlineType} for timestamps, use VARCHAR (with iso strings) or TIMESTAMP/INT (with unix timestamps)`);
        }
      }
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

    async close() {
        await this.db.end();
    }
}

export default MongoConnector;