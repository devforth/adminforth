import dayjs from 'dayjs';
import { MongoClient } from 'mongodb';
import { Decimal128, Double } from 'bson';
import { IAdminForthDataSourceConnector, IAdminForthSingleFilter, IAdminForthAndOrFilter, AdminForthResource } from '../types/Back.js';
import AdminForthBaseConnector from './baseConnector.js';
import { afLogger } from '../modules/logger.js';
import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections, } from '../types/Common.js';

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
};
function normalizeMongoValue(v: any) {
  if (v == null) {
    return v;
  }
  if (v instanceof Decimal128) {
    return v.toString();
  }
  if (v instanceof Double) {
    return v.valueOf();
  }
  if (typeof v === "object" && v.$numberDecimal) {
    return String(v.$numberDecimal);
  }
  if (typeof v === "object" && v.$numberDouble) {
    return Number(v.$numberDouble);
  }
  return v;
}

class MongoConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

    async setupClient(url): Promise<void> {
        this.client = new MongoClient(url);
        (async () => {
            try {
                await this.client.connect();
                this.client.on('error', (err) => {
                    afLogger.error(`Mongo error: ${err.message}`);
                });
                afLogger.info('Connected to Mongo');
            } catch (e) {
                afLogger.error(`Failed to connect to Mongo: ${e}`);
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
        [AdminForthFilterOperators.IS_EMPTY]: () => null,
        [AdminForthFilterOperators.IS_NOT_EMPTY]: () => ({ $ne: null }),
    };

    SortDirectionsMap = {
        [AdminForthSortDirections.asc]: 1,
        [AdminForthSortDirections.desc]: -1,
    };
    async getAllTables(): Promise<Array<string>>{
        const db = this.client.db();
    
        const collections = await db.listCollections().toArray();
    
        return collections.map(col => col.name);
    }

    async getAllColumnsInTable(collectionName: string): Promise<Array<{ name: string; type: string; isPrimaryKey?: boolean; sampleValue?: any; }>> {

        const sampleDocs = await this.client.db().collection(collectionName).find({}).sort({ _id: -1 }).limit(100).toArray();
      
        const fieldTypes = new Map<string, Set<string>>();
        const sampleValues = new Map<string, any>();

        function detectType(value: any): string {
          if (value === null || value === undefined) return 'string';
          if (typeof value === 'string') return 'string';
          if (typeof value === 'boolean') return 'boolean';
          if (typeof value === 'number') {
            return Number.isInteger(value) ? 'integer' : 'float';
          }
          if (value instanceof Date) return 'datetime';
          if (value && typeof value === 'object' && ('$numberDecimal' in value || value._bsontype === 'Decimal128')) return 'decimal';
          if (typeof value === 'object') return 'json';
          return 'string';
        }
      
        function addType(name: string, type: string) {
          if (!fieldTypes.has(name)) {
            fieldTypes.set(name, new Set());
          }
          fieldTypes.get(name)!.add(type);
        }
      
        function flattenObject(obj: any, prefix = '') {
          Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (!fieldTypes.has(fullKey)) {
              fieldTypes.set(fullKey, new Set());
              sampleValues.set(fullKey, value);
            }
      
            if (value instanceof Buffer) {
              addType(fullKey, 'json');
              return;
            }
            if (
                value &&
                typeof value === 'object' &&
                ('$numberDecimal' in value || (value as any)._bsontype === 'Decimal128')
              ) {
              addType(fullKey, 'decimal');
              return;
            }
      
            if (
              value && 
              typeof value === 'object' && 
              !Array.isArray(value) && 
              !(value instanceof Date)
            ) {
              addType(fullKey, 'json');
              return
            }
        
            addType(fullKey, detectType(value));
          });
        }
      
        for (const doc of sampleDocs) {
          flattenObject(doc);
        }
      
        return Array.from(fieldTypes.entries()).map(([name, types]) => {
            const primaryKey = name === '_id';
        
            const priority = ['datetime', 'date', 'decimal', 'integer', 'float', 'boolean', 'json', 'string'];
        
            const matched = priority.find(t => types.has(t)) || 'string';
        
            const typeMap: Record<string, AdminForthDataTypes> = {
                string: AdminForthDataTypes.STRING,
                integer: AdminForthDataTypes.INTEGER,
                float: AdminForthDataTypes.FLOAT,
                boolean: AdminForthDataTypes.BOOLEAN,
                datetime: AdminForthDataTypes.DATETIME,
                date: AdminForthDataTypes.DATE,
                json: AdminForthDataTypes.JSON,
                decimal: AdminForthDataTypes.DECIMAL,
            };
            return {
                name,
                type: typeMap[matched] ?? AdminForthDataTypes.STRING,
                ...(primaryKey ? { isPrimaryKey: true } : {}),
                sampleValue: sampleValues.get(name),
            };
        });
    }
      
    
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
          return value === null ? null : !!value;
        } else if (field.type == AdminForthDataTypes.DECIMAL) {
            if (value === null || value === undefined) {
                return null;
            }
            return value?.toString();
        }

        return value;
    }


    setFieldValue(field, value) {
        if (value === undefined) return undefined;
        if (value === null) return null;

        if (field.type === AdminForthDataTypes.DATETIME) {
            if (value === "" || value === null) {
                return null;
            }
            return dayjs(value).isValid() ? dayjs(value).toDate() : null;
        }

        if (field.type === AdminForthDataTypes.INTEGER) {
            if (value === "" || value === null) {
                return null;
            }
            return Number.isFinite(value) ? Math.trunc(value) : null;
        }

        if (field.type === AdminForthDataTypes.FLOAT) {
            if (value === "" || value === null) {
                return null;
            }
            return Number.isFinite(value) ? value : null;
        }

        if (field.type === AdminForthDataTypes.DECIMAL) {
            if (value === "" || value === null) {
                return null;
            }
            return value.toString();
        }

        return value;
    }

    getFilterQuery(resource: AdminForthResource, filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): any {
        // accept raw NoSQL filters for MongoDB
        if ((filter as IAdminForthSingleFilter).insecureRawNoSQL !== undefined) {
            return (filter as IAdminForthSingleFilter).insecureRawNoSQL;
        }

        // explicitly ignore raw SQL filters for MongoDB
        if ((filter as IAdminForthSingleFilter).insecureRawSQL !== undefined) {
            afLogger.warn(`⚠️  Ignoring insecureRawSQL filter for MongoDB:, ${(filter as IAdminForthSingleFilter).insecureRawSQL}`);
            return {};
        }

        if ((filter as IAdminForthSingleFilter).field) {
            // Field-to-field comparisons via $expr
            if ((filter as IAdminForthSingleFilter).rightField) {
                const left = `$${(filter as IAdminForthSingleFilter).field}`;
                const right = `$${(filter as IAdminForthSingleFilter).rightField}`;
                const op = (filter as IAdminForthSingleFilter).operator;
                const exprOpMap = {
                    [AdminForthFilterOperators.GT]: '$gt',
                    [AdminForthFilterOperators.GTE]: '$gte',
                    [AdminForthFilterOperators.LT]: '$lt',
                    [AdminForthFilterOperators.LTE]: '$lte',
                    [AdminForthFilterOperators.EQ]: '$eq',
                    [AdminForthFilterOperators.NE]: '$ne',
                } as const;
                const mongoExprOp = exprOpMap[op];
                if (!mongoExprOp) {
                    // For unsupported ops with rightField, return empty condition
                    return {};
                }
                return { $expr: { [mongoExprOp]: [left, right] } };
            }
            const column = resource.dataSourceColumns.find((col) => col.name === (filter as IAdminForthSingleFilter).field);
            const filterValue = (filter as IAdminForthSingleFilter).value;
            if ([AdminForthDataTypes.INTEGER, AdminForthDataTypes.DECIMAL, AdminForthDataTypes.FLOAT].includes(column.type)) {
                // Handle array values for IN/NIN operators
                const convertedValue = Array.isArray(filterValue) 
                    ? filterValue.map(v => +v) 
                    : +filterValue;
                return { [(filter as IAdminForthSingleFilter).field]: this.OperatorsMap[filter.operator](convertedValue) };
            }
            return { [(filter as IAdminForthSingleFilter).field]: this.OperatorsMap[filter.operator](filterValue) };
        }

        // filter is a AndOr filter
        return this.OperatorsMap[filter.operator]((filter as IAdminForthAndOrFilter).subFilters
            // mongodb should ignore raw SQL, but allow raw NoSQL
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
        const result: Record<string, { min: any; max: any }> = {};

        for (const column of columns) {
            const [doc] = await collection
            .aggregate([
                { $group: { _id: null, min: { $min: `$${column.name}` }, max: { $max: `$${column.name}` } } },
                { $project: { _id: 0, min: 1, max: 1 } },
            ])
            .toArray();

            result[column.name] = {
            min: normalizeMongoValue(doc?.min),
            max: normalizeMongoValue(doc?.max),
            };
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