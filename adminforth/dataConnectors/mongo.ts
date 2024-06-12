import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections } from '../types/AdminForthConfig.js';

class MongoConnector {
    db: MongoClient

    constructor({ url }) {
        this.db = new MongoClient(url);
        (async () => {
            try {
                await this.db.connect();
                this.db.on('error', (err) => {
                    console.log('Mongo error: ', err.message)
                 });
                console.log('Connected to Mongo');
            } catch (e) {
                console.error('ERROR: Failed to connect to Mongo', e);
            }
        })();
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

    async discoverFields(resource) {
        return resource.columns.reduce((acc, col) => {
            if (!col.type) {
                throw new Error(`Type is not defined for column ${col.name}`);
            }

            acc[col.name] = {
                name: col.name,
                type: col.type,
                primaryKey: col.primaryKey,
                virtual: col.virtual,
                _underlineType: col._underlineType,
            };
            return acc;
        }, {});
    }

    getPrimaryKey(resource) {
        for (const col of resource.dataSourceColumns) {
            if (col.primaryKey) {
                return col.name;
            }
        }
    }

    getFieldValue(field, value) {
        if (field.type == AdminForthDataTypes.DATETIME) {
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
        } else if (field.type == AdminForthDataTypes.BOOLEAN) {
          return !!value;
        }
        return value;
      }
    
    async getRecordByPrimaryKey(resource, key) {
        const tableName = resource.table;
        const collection = this.db.db().collection(tableName);
        const row = await collection.findOne({ [this.getPrimaryKey(resource)]: key });
        if (!row) {
            return null;
        }
        const newRow = {};
        for (const [key_1, value] of Object.entries(row)) {
            const dbKey = resource.dataSourceColumns.find((col) => col.name == key_1);
            if (!dbKey) {
                continue; // should I continue or throw an error?
                throw new Error(`Resource '${resource.table}' has no column '${key_1}' defined`);
            }
            newRow[key_1] = this.getFieldValue(dbKey, value);
        }
        console.log('newRow', newRow);
        return newRow;
    }

    setFieldValue(field, value) {
        if (field.type == AdminForthDataTypes.DATETIME) {
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
        } else if (field.type == AdminForthDataTypes.BOOLEAN) {
          return value ? 1 : 0;
        }
        return value;
      }
    
    async getData({ resource, limit, offset, sort, filters }) {
        // const columns = resource.dataSourceColumns.filter(c=> !c.virtual).map((col) => col.name).join(', ');
        const tableName = resource.table;

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
        const columns = Object.keys(record);
        const newRecord = {};
        for (const colName of columns) {
            const col = resource.dataSourceColumns.find((col) => col.name == colName);
            if (col) {
                newRecord[colName] = this.setFieldValue(col, record[colName]);
            } else {
                newRecord[colName] = record[colName];
            }
        }

        await collection.insertOne(newRecord);
    }

    async updateRecord({ resource, recordId, record, newValues }) {
        const collection = this.db.db().collection(resource.table);
        await collection.updateOne({ [this.getPrimaryKey(resource)]: recordId }, { $set: newValues });
    }

    async deleteRecord({ resource, recordId }) {
        const primaryKey = this.getPrimaryKey(resource);
        const collection = this.db.db().collection(resource.table);
        await collection.deleteOne({ [primaryKey]: recordId });
    }

    async close() {
        await this.db.close()
    }
}

export default MongoConnector;