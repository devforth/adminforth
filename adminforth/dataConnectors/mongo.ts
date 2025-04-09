import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import { Decimal128, ObjectId } from 'bson';
import { IAdminForthDataSourceConnector, IAdminForthSingleFilter, IAdminForthAndOrFilter, AdminForthResource } from '../types/Back.js';
import AdminForthBaseConnector from './baseConnector.js';

import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections, } from '../types/Common.js';

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
};

class MongoConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

    async setupClient(url): Promise<void> {
        this.client = new MongoClient(url);
        (async () => {
            try {
                await this.client.connect();
                this.client.on('error', (err) => {
                    console.log('Mongo error: ', err.message)
                });
                console.log('Connected to Mongo');
            } catch (e) {
                console.error(`Failed to connect to Mongo: ${e}`);
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
        [AdminForthFilterOperators.LIKE]: (value) => ({ $regex: escapeRegex(value) }),
        [AdminForthFilterOperators.ILIKE]: (value) => ({ $regex: escapeRegex(value), $options: 'i' }),
        [AdminForthFilterOperators.IN]: (value) => ({ $in: value }),
        [AdminForthFilterOperators.NIN]: (value) => ({ $nin: value }),
        [AdminForthFilterOperators.AND]: (value) => ({ $and: value }),
        [AdminForthFilterOperators.OR]: (value) => ({ $or: value }),
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
            return value?.toString();
        } else if (field.name === '_id' && !field.fillOnCreate) {
            // if "_id" was created by mongo it will be ObjectId
            return value?.toString();
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
          return value ? true : false;
        } else if (field.type == AdminForthDataTypes.DECIMAL) {
            return Decimal128.fromString(value?.toString());
        } else if (field.name === '_id' && !field.fillOnCreate) {
            // if "_id" was created by mongo it supposed to be saved as ObjectId
            return ObjectId.createFromHexString(value);
        }
        return value;
    }

    getFilterQuery(resource: AdminForthResource, filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): any {
        if ((filter as IAdminForthSingleFilter).field) {
            const column = resource.dataSourceColumns.find((col) => col.name === (filter as IAdminForthSingleFilter).field);
            if (['integer', 'decimal', 'float'].includes(column.type)) {
                return { [(filter as IAdminForthSingleFilter).field]: this.OperatorsMap[filter.operator](+(filter as IAdminForthSingleFilter).value) };
            }
            return { [(filter as IAdminForthSingleFilter).field]: this.OperatorsMap[filter.operator]((filter as IAdminForthSingleFilter).value) };
        }

        // filter is a AndOr filter
        return this.OperatorsMap[filter.operator]((filter as IAdminForthAndOrFilter).subFilters
            // mongodb should ignore raw sql
            .filter((f) => (f as IAdminForthSingleFilter).insecureRawSQL === undefined)
            .map((f) => this.getFilterQuery(resource, f)));
    }
    
    async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }:
        { 
            resource: AdminForthResource, 
            limit: number, 
            offset: number, 
            sort: { field: string, direction: AdminForthSortDirections }[], 
            filters: IAdminForthAndOrFilter,
        }
    ): Promise<any[]> {

        // const columns = resource.dataSourceColumns.filter(c=> !c.virtual).map((col) => col.name).join(', ');
        const tableName = resource.table;


        const collection = this.client.db().collection(tableName);
        const query = filters.subFilters.length ? this.getFilterQuery(resource, filters) : {};

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
        filters: IAdminForthAndOrFilter,
    }): Promise<number> {
        if (filters) {
            // validate and normalize in case this method is called from dataAPI
            const filterValidation = this.validateAndNormalizeFilters(filters, resource);
            if (!filterValidation.ok) {
                throw new Error(filterValidation.error);
            }
        }
        const collection = this.client.db().collection(resource.table);
        const query = filters.subFilters.length ? this.getFilterQuery(resource, filters) : {};
        return await collection.countDocuments(query);
    }

    async getMinMaxForColumnsWithOriginalTypes({ resource, columns }) {
        const tableName = resource.table;
        const collection = this.client.db().collection(tableName);
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

    async createRecordOriginalValues({ resource, record }): Promise<string> {
        const tableName = resource.table;
        const collection = this.client.db().collection(tableName);
        const columns = Object.keys(record);
        const newRecord = {};
        for (const colName of columns) {
            newRecord[colName] = record[colName];
        }
        const ret = await collection.insertOne(newRecord);
        return ret.insertedId;
    }

    async updateRecordOriginalValues({ resource, recordId, newValues }) {
        const collection = this.client.db().collection(resource.table);
        await collection.updateOne({ [this.getPrimaryKey(resource)]: recordId }, { $set: newValues });
    }

    async deleteRecord({ resource, recordId }): Promise<boolean> {
        const primaryKey = this.getPrimaryKey(resource);
        const collection = this.client.db().collection(resource.table);
        const res = await collection.deleteOne({ [primaryKey]: recordId });
        return res.deletedCount > 0;
    }

    async close() {
        await this.client.close()
    }
}

export default MongoConnector;