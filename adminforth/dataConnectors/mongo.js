import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import { AdminForthFilterOperators, AdminForthSortDirections, AdminForthTypes } from '../types.js';


class MongoConnector {
    constructor({ url, fieldtypesByTable }) {
        this.db = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        if (fieldtypesByTable == null) {
            throw new Error('fieldtypesByTable is required for MongoConnector');
        };
        
        (async () => {
            try {
                await this.db.connect();
                console.log('Connected to Mongo');
            } catch (e) {
                console.error('ERROR: Failed to connect to Mongo', e);
            }
        })();

        this.fieldtypesByTable = fieldtypesByTable;
    }

    OperatorsMap = {
        [AdminForthFilterOperators.EQ]: (value) => value,
        [AdminForthFilterOperators.NE]: (value) => ({ $ne: value }),
        [AdminForthFilterOperators.GT]: (value) => ({ $gt: value }),
        [AdminForthFilterOperators.LT]: (value) => ({ $lt: value }),
        [AdminForthFilterOperators.GTE]: (value) => ({ $gte: value }),
        [AdminForthFilterOperators.LTE]: (value) => ({ $lte: value }),
        [AdminForthFilterOperators.LIKE]: (value) => ({ $regex: value }),
        [AdminForthFilterOperators.ILIKE]: (value) => ({ $regex: value, $options: 'i' }),
        [AdminForthFilterOperators.IN]: (value) => ({ $in: value }),
        [AdminForthFilterOperators.NIN]: (value) => ({ $nin: value }),
    };

    SortDirectionsMap = {
        [AdminForthSortDirections.ASC]: 1,
        [AdminForthSortDirections.DESC]: -1,
    };

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
    
    getRecordByPrimaryKey(resource, key) {
        const tableName = resource.table;
        const collection = this.db.db().collection(tableName);
        return collection.findOne({ [this.getPrimaryKey(resource)]: key })
            .then((row) => {
                if (!row) {
                    return null;
                }
                const newRow = {};
                for (const [key, value] of Object.entries(row)) {
                    console.log('aVBFAIODHF', Object.entries(row));
                    console.log('COLUMNS', resource.columns);
                    const dbKey = resource.columns.find((col) => col.name == key)
                    if (!dbKey) {
                        continue // should I continue or throw an error?
                        throw new Error(`Resource '${resource.table}' has no column '${key}' defined`);
                    }
                    newRow[key] = this.getFieldValue(dbKey, value);
                }
                console.log('newRow', newRow);
                return newRow;
            });
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

    async createRecord({ resource, record }) {
        const tableName = resource.table;
        const collection = this.db.db().collection(tableName);
        const newRow = {};
        for (const [key, value] of Object.entries(record)) {
            if (resource.columns.find((col) => col.name == key) == undefined) {
                continue
            }
            newRow[key] = this.setFieldValue(resource.columns.find((col) => col.name == key), value);
        }
        await collection.insertOne(newRow);
    }

    async updateRecord({ resource, recordId, record }) {
        const tableName = resource.table;
        const primaryKey = this.getPrimaryKey(resource);

        const newValues = {};
        for (const col of resource.columns) {
            if (record[col.name] !== undefined) {
                newValues[col.name] = this.setFieldValue(col, record[col.name]);
            }
        }

        const collection = this.db.db().collection(tableName);
        await collection.updateOne({ [primaryKey]: recordId }, { $set: newValues });
    }

    async deleteRecord({ resource, recordId }) {
        const primaryKey = this.getPrimaryKey(resource);
        const collection = this.db.db().collection(resource.table);
        await collection.deleteOne({ [primaryKey]: recordId });
    }

    async close() {
        await this.db.end();
    }
}

export default MongoConnector;