import { AdminForthTypes } from '../types.js';
import dayjs from 'dayjs';
import { MongoClient } from 'mongodb'


class MongoConnector {
    constructor({ url, fieldtypesByTable }) {
        this.db = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        if (fieldtypesByTable == null) {
            throw new Error('fieldtypesByTable is required for MongoConnector');
        };
        
        (async () => {
            await this.db.connect()
            console.log('Connected to Mongo');
        })();

        this.fieldtypesByTable = fieldtypesByTable;
        this.OperatorsMap = {
            'eq': (value) => value,
            'ne': (value) => ({ $ne: value }),
            'gt': (value) => ({ $gt: value }),
            'gte': (value) => ({ $gte: value }),
            'lt': (value) => ({ $lt: value }),
            'lte': (value) => ({ $lte: value }),
            'in': (value) => ({ $in: value }),
            'nin': (value) => ({ $nin: value }),
            'like': (value) => ({ $regex: value, $options: 'i' }),
            'nlike': (value) => ({ $not: { $regex: value, $options: 'i' } }),
        };
    }

    async discoverFields(tableName) {
        return this.fieldtypesByTable[tableName];
    }

    getPrimaryKey(resource) {
        for (const col of resource.columns) {
            if (col.primaryKey) {
                return col.name;
            }
        }
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
    
    getRecordByPrimaryKey(resource, key) {
        const tableName = resource.table;
        const collection = this.db.db().collection(tableName);
        return collection.findOne({ [getPrimaryKey(resource)]: key })
            .then((row) => {
                if (!row) {
                    return null;
                }
                const newRow = {};
                for (const [key, value] of Object.entries(row)) {
                    newRow[key] = this.getFieldValue(resource.columns.find((col) => col.name == key), value);
                }
                return newRow;
            });
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

        const collection = this.db.db().collection(tableName);
        const query = {};
        for (const filter of filters) {
            query[filter.field] = this.OperatorsMap[filter.operator](filter.value);
        }
        const total = await collection.countDocuments(query);
        const result = await collection.find(query)
            .sort(sort)
            .skip(offset)
            .limit(limit)
            .toArray();

        return { data: result, total }
    }

    async getMinMaxForColumns({ resource, columns }) {
        const tableName = resource.table;
        const collection = this.db.db().collection(tableName);
        const result = {};
        for (const column of columns) {
            result[column] = await collection
                .aggregate([
                    { $group: { _id: null, min: { $min: `$${column}` }, max: { $max: `$${column}` } } },
                ])
                .toArray();
        }
        return result;
    }

    async close() {
        await this.db.end();
    }
}

export default MongoConnector;