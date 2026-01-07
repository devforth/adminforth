import dayjs from 'dayjs';
import { MongoClient, BSON, ObjectId, Decimal128, Double, UUID } from 'mongodb';
import { IAdminForthDataSourceConnector, IAdminForthSingleFilter, IAdminForthAndOrFilter, AdminForthResource, Filters } from '../types/Back.js';
import AdminForthBaseConnector from './baseConnector.js';
import { AdminForthDataTypes, AdminForthFilterOperators, AdminForthSortDirections, } from '../types/Common.js';

const UUID36 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX32  = /^[0-9a-f]{32}$/i;

function idToString(v: any) {
  if (v == null) return null;
  if (typeof v === "string" || typeof v === "number" || typeof v === "bigint") return String(v);

  const s = BSON.EJSON.serialize(v);
  if (s && typeof s === "object") {
    if ("$oid" in s) {
        return String(s.$oid);
    }
    if ("$uuid" in s) {
        return String(s.$uuid);
    }
  }
  return String(v);
}

const extractSimplePkEq = (filters: IAdminForthAndOrFilter, pk: string): string | null => {
  if (!filters?.subFilters?.length) return null;
  if (filters.operator !== AdminForthFilterOperators.AND) return null;
  if (filters.subFilters.length !== 1) return null;

  const f: any = filters.subFilters[0];
  if (!f?.field) return null;
  if (f.field !== pk) return null;
  if (f.operator !== AdminForthFilterOperators.EQ) return null;
  if (typeof f.value !== "string") return null;

  return f.value;
}

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
    private pkCandidates(pkValue: any): any[] {
        if (pkValue == null || typeof pkValue !== "string") return [pkValue];
        const candidates: any[] = [pkValue];
        try { candidates.push(new UUID(pkValue)); } catch(err) { console.error(`Failed to create UUID from ${pkValue}: ${err.message}`); }
        try { candidates.push(new ObjectId(pkValue)); } catch(err) { console.error(`Failed to create ObjectId from ${pkValue}: ${err.message}`); }
        return candidates;
    }
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

    getFieldValue(field, value) {
        if (field.type === AdminForthDataTypes.DATETIME) {
            return value ? dayjs(Date.parse(value)).toISOString() : null;
        }
        if (field.type === AdminForthDataTypes.DATE) {
            return value ? dayjs(Date.parse(value)).toISOString().split("T")[0] : null;
        }
        if (field.type === AdminForthDataTypes.BOOLEAN) {
            return value === null ? null : !!value;
        }
        if (field.type === AdminForthDataTypes.DECIMAL) {
            return value === null || value === undefined ? null : value.toString();
        }
        if (field.name === '_id') {
            return idToString(value);
        }
        return value;
    }


    setFieldValue(field, value) {
        if (value === undefined) {
            return undefined;
        }
        if (value === null || value === '') {
            return null;
        }
        if (field.type === AdminForthDataTypes.DATETIME) {
            return dayjs(value).isValid() ? dayjs(value).toDate() : null;
        }
        if (field.type === AdminForthDataTypes.INTEGER) {
            return Number.isFinite(value) ? Math.trunc(value) : null;
        }
        if (field.type === AdminForthDataTypes.FLOAT) {
            return Number.isFinite(value) ? value : null;
        }
        if (field.type === AdminForthDataTypes.DECIMAL) {
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
            console.warn('⚠️  Ignoring insecureRawSQL filter for MongoDB:', (filter as IAdminForthSingleFilter).insecureRawSQL);
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


        const pk = this.getPrimaryKey(resource);
        const pkValue = extractSimplePkEq(filters, pk);

        if (pkValue !== null) {
            let res = await collection.find({ [pk]: pkValue }).limit(1).toArray();
            if (res.length) {
                return res;
            }
            if (UUID36.test(pkValue)) {
                res = await collection.find({ [pk]: new UUID(pkValue) }).limit(1).toArray();
            }
            if (res.length) {
                return res;
            }
            if (HEX32.test(pkValue)) {
                res = await collection.find({ [pk]: new ObjectId(pkValue) }).limit(1).toArray();
            }
            if (res.length) {
                return res;
            }

            return [];
        }

        const query = filters.subFilters.length ? this.getFilterQuery(resource, filters) : {};

        const sortArray: any[] = sort.map((s) => [s.field, this.SortDirectionsMap[s.direction]]);

        return await collection.find(query)
            .sort(sortArray)
            .skip(offset)
            .limit(limit)
            .toArray();
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
        const pk = this.getPrimaryKey(resource);
        for (const id of this.pkCandidates(recordId)) {
            const res = await collection.updateOne({ [pk]: id }, { $set: newValues });
            if (res.matchedCount > 0) return;
        }
        throw new Error(`Record with id ${recordId} not found in resource ${resource.name}`);
    }

    async deleteRecord({ resource, recordId }): Promise<boolean> {
        const collection = this.client.db().collection(resource.table);
        const pk = this.getPrimaryKey(resource);
        for (const id of this.pkCandidates(recordId)) {
            const res = await collection.deleteOne({ [pk]: id });
            if (res.deletedCount > 0) return true;
        }
        return false;
    }

    async close() {
        await this.client.close()
    }
}

export default MongoConnector;