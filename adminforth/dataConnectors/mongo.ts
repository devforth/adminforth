import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import { IAdminForthDataSourceConnector, AdminForthResource } from '../types/Back.js';
import AdminForthBaseConnector from './baseConnector.js';

import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections, } from '../types/Common.js';

class MongoConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {
    db: MongoClient

    constructor({ url }: { url: string }) {
        super();
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
        [AdminForthSortDirections.asc]: 1,
        [AdminForthSortDirections.desc]: -1,
    };

    async discoverFields(resource) {
        return resource.columns.filter((col) => !col.virtual).reduce((acc, col) => {
            if (!col.type) {
                throw new Error(`Type is not defined for column ${col.name} in resource ${resource.table}`);
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
            return dayjs(Date.parse(value)).toISOString();

        } else if (field.type == AdminForthDataTypes.DATE) {
            if (!value) {
                return null;
            }
            return dayjs(Date.parse(value)).toISOString().split('T')[0];

        } else if (field.type == AdminForthDataTypes.BOOLEAN) {
          return !!value;
        } else if (field.type == AdminForthDataTypes.DECIMAL) {
            return value.toString();
        }

        return value;
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

    async genQuery({ filters }) {
        const query = {};
        for (const filter of filters) {
            query[filter.field] = this.OperatorsMap[filter.operator](filter.value);
        }
        return query;
    }
    
    async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }:
        { 
            resource: AdminForthResource, 
            limit: number, 
            offset: number, 
            sort: { field: string, direction: AdminForthSortDirections }[], 
            filters: { field: string, operator: AdminForthFilterOperators, value: any }[] 
        }
    ): Promise<any[]> {

        // const columns = resource.dataSourceColumns.filter(c=> !c.virtual).map((col) => col.name).join(', ');
        const tableName = resource.table;

        const collection = this.db.db().collection(tableName);
        const query = await this.genQuery({ filters });

        const sortArray: any[] = sort.map((s) => {
            return [s.field, this.SortDirectionsMap[s.direction]];
        });

        const result = await collection.find(query)
            .sort(sortArray)
            .skip(offset)
            .limit(limit)
            .toArray();

        return result
    }

    async getCount({ resource, filters }: { 
            resource: AdminForthResource, 
            filters: { field: string, operator: AdminForthFilterOperators, value: any }[] 
    }): Promise<number> {

        const collection = this.db.db().collection(resource.table);
        const query = {};
        for (const filter of filters) {
            query[filter.field] = this.OperatorsMap[filter.operator](filter.value);
        }
        return await collection.countDocuments(query);
    }

    async getMinMaxForColumnsWithOriginalTypes({ resource, columns }) {
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

    async createRecordOriginalValues({ resource, record }) {
        const tableName = resource.table;
        const collection = this.db.db().collection(tableName);
        const columns = Object.keys(record);
        const newRecord = {};
        for (const colName of columns) {
            newRecord[colName] = record[colName];
        }
        await collection.insertOne(newRecord);
    }

    async updateRecordOriginalValues({ resource, recordId, newValues }) {
        const collection = this.db.db().collection(resource.table);
        await collection.updateOne({ [this.getPrimaryKey(resource)]: recordId }, { $set: newValues });
    }

    async deleteRecord({ resource, recordId }): Promise<boolean> {
        const primaryKey = this.getPrimaryKey(resource);
        const collection = this.db.db().collection(resource.table);
        const res = await collection.deleteOne({ [primaryKey]: recordId });
        return res.deletedCount > 0;
    }

    async close() {
        await this.db.close()
    }
}

export default MongoConnector;