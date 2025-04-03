import dayjs from 'dayjs';
import { AdminForthResource, IAdminForthSingleFilter, IAdminForthAndOrFilter, IAdminForthDataSourceConnector } from '../types/Back.js';
import { AdminForthDataTypes,  AdminForthFilterOperators, AdminForthSortDirections, } from '../types/Common.js';
import AdminForthBaseConnector from './baseConnector.js';
import mysql from 'mysql2/promise';

class MysqlConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

  async setupClient(url): Promise<void> {
    try {
      this.client = mysql.createPool({
        uri: url,
        waitForConnections: true,
        connectionLimit: 10,  // Adjust based on your needs
        queueLimit: 0
      });
    } catch (e) {
      console.error(`Failed to connect to MySQL: ${e}`);
    }
  }

  OperatorsMap = {
    [AdminForthFilterOperators.EQ]: '=',
    [AdminForthFilterOperators.NE]: '<>',
    [AdminForthFilterOperators.GT]: '>',
    [AdminForthFilterOperators.LT]: '<',
    [AdminForthFilterOperators.GTE]: '>=',
    [AdminForthFilterOperators.LTE]: '<=',
    [AdminForthFilterOperators.LIKE]: 'LIKE',
    [AdminForthFilterOperators.ILIKE]: 'ILIKE',
    [AdminForthFilterOperators.IN]: 'IN',
    [AdminForthFilterOperators.NIN]: 'NOT IN',
    [AdminForthFilterOperators.AND]: 'AND',
    [AdminForthFilterOperators.OR]: 'OR',
  };

  SortDirectionsMap = {
    [AdminForthSortDirections.asc]: 'ASC',
    [AdminForthSortDirections.desc]: 'DESC',
  };

  async discoverFields(resource) {
    const [results] = await this.client.execute("SHOW COLUMNS FROM " + resource.table);
    const fieldTypes = {};
    results.forEach((row) => {
      const field: any = {};
      const baseType = row.Type.toLowerCase();
      if (baseType == 'tinyint(1)') {
        field.type = AdminForthDataTypes.BOOLEAN;
        field._underlineType = 'bool';
      } else if (baseType.startsWith('tinyint')) {
        field.type = AdminForthDataTypes.INTEGER;
        field._underlineType = 'tinyint';
        field.minValue = baseType.includes('unsigned') ? 0 : -128;
        field.maxValue = baseType.includes('unsigned') ? 255 : 127;
      } else if (baseType.startsWith('smallint')) {
        field.type = AdminForthDataTypes.INTEGER;
        field._underlineType = 'tinyint';
        field.minValue = baseType.includes('unsigned') ? 0 : -32768;
        field.maxValue = baseType.includes('unsigned') ? 65535 : 32767;
      } else if (baseType.startsWith('int') || baseType.endsWith('int')) {
        field.type = AdminForthDataTypes.INTEGER;
        field._underlineType = 'int';
        field.minValue = baseType.includes('unsigned') ? 0 : null;
      } else if (baseType.startsWith('dec') || baseType.startsWith('numeric')) {
        field.type = AdminForthDataTypes.DECIMAL;
        field._underlineType = 'decimal';
        const [precision, scale] = baseType.match(/\d+/g);
        field.precision = parseInt(precision);
        field.scale = parseInt(scale);
        field.minValue = baseType.includes('unsigned') ? 0 : null;
      } else if (baseType.startsWith('float') || baseType.startsWith('double') || baseType.startsWith('real')) {
        field.type = AdminForthDataTypes.FLOAT;
        field._underlineType = 'float';
        field.minValue = baseType.includes('unsigned') ? 0 : null;
      } else if (baseType.startsWith('varchar')) {
        field.type = AdminForthDataTypes.STRING;
        field._underlineType = 'varchar';
        const length = baseType.match(/\d+/);
        field.maxLength = length ? parseInt(length[0]) : null;
      } else if (baseType.startsWith('char')) {
        field.type = AdminForthDataTypes.STRING;
        field._underlineType = 'char';
        const length = baseType.match(/\d+/);
        field.minLength = length ? parseInt(length[0]) : null;
        field.maxLength = length ? parseInt(length[0]) : null;
      } else if (baseType.endsWith('text')) {
        field.type = AdminForthDataTypes.TEXT;
        field._underlineType = 'text';
      } else if (baseType.startsWith('enum')) {
        field.type = AdminForthDataTypes.STRING;
        field._underlineType = 'enum';
      } else if (baseType.startsWith('json')) {
        field.type = AdminForthDataTypes.JSON;
        field._underlineType = 'json';
      } else if (baseType.startsWith('time')) {
        field.type = AdminForthDataTypes.TIME;
        field._underlineType = 'time';
      } else if (baseType.startsWith('datetime') || baseType.startsWith('timestamp')) {
        field.type = AdminForthDataTypes.DATETIME;
        field._underlineType = 'timestamp';
      } else if (baseType.startsWith('date')) {
        field.type = AdminForthDataTypes.DATE;
        field._underlineType = 'date';
      } else if (baseType.startsWith('year')) {
        field.type = AdminForthDataTypes.INTEGER;
        field._underlineType = 'year';
        field.minValue = 1901;
        field.maxValue = 2155;
      } else {
        field.type = 'unknown'
      }
      field._baseTypeDebug = baseType;
      field.primaryKey = row.Key === 'PRI';
      field.default = row.Default;
      field.required = row.Null === 'NO' && !row.Default;
      fieldTypes[row.Field] = field
    });
    return fieldTypes;
  }

  getFieldValue(field, value) {
    if (field.type == AdminForthDataTypes.DATETIME) {
      if (!value) {
        return null;
      }
      return dayjs(value).toISOString();
    } else if (field.type == AdminForthDataTypes.DATE) {
      return value || null;
    } else if (field.type == AdminForthDataTypes.TIME) {
      return value || null;
    } else if (field.type == AdminForthDataTypes.BOOLEAN) {
      return !!value;
    } else if (field.type == AdminForthDataTypes.JSON) {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return {'error': `Failed to parse JSON: ${e.message}`}
        }
      } else if (typeof value === 'object') {
        return value;
      } else {
        console.error('JSON field value is not string or object, but has type:',  typeof value);
        console.error('Field:', field);
        return {}
      }
    }

    return value;
  }


  setFieldValue(field, value) {
    if (field.type == AdminForthDataTypes.DATETIME) {
      if (!value) {
        return null;
      }
      return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
    } else if (field.type == AdminForthDataTypes.BOOLEAN) {
      return value ? 1 : 0;
    } else if (field.type == AdminForthDataTypes.JSON) {
      if (field._underlineType === 'json') {
        return value;
      } else {
        return JSON.stringify(value);
      }
    }
    return value;
  }


  getFilterString(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): string {
    if ((filter as IAdminForthSingleFilter).field) {
      // filter is a Single filter
      let placeholder = '?';
      let field = (filter as IAdminForthSingleFilter).field;
      let operator = this.OperatorsMap[filter.operator];
      if (filter.operator == AdminForthFilterOperators.IN || filter.operator == AdminForthFilterOperators.NIN) {
        placeholder = `(${(filter as IAdminForthSingleFilter).value.map(() => '?').join(', ')})`;
      } else if (filter.operator == AdminForthFilterOperators.ILIKE) {
        placeholder = `LOWER(?)`;
        field = `LOWER(${field})`;
        operator = 'LIKE';
      }
      return `${field} ${operator} ${placeholder}`;
    }

    // filter is a single insecure raw sql
    if ((filter as IAdminForthSingleFilter).insecureRawSQL) {
      return (filter as IAdminForthSingleFilter).insecureRawSQL;
    }

    // filter is a AndOr filter
    return (filter as IAdminForthAndOrFilter).subFilters.map((f) => {
      if ((f as IAdminForthSingleFilter).field || (f as IAdminForthSingleFilter).insecureRawSQL) {
        // subFilter is a Single filter
        return this.getFilterString(f);
      }

      // subFilter is a AndOr filter - add parentheses
      return `(${this.getFilterString(f)})`;
    }).join(` ${this.OperatorsMap[filter.operator]} `);
  }
  getFilterParams(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): any[] {
    if ((filter as IAdminForthSingleFilter).field) {
      // filter is a Single filter
      if (filter.operator == AdminForthFilterOperators.LIKE || filter.operator == AdminForthFilterOperators.ILIKE) {
        return [`%${filter.value}%`];
      } else if (filter.operator == AdminForthFilterOperators.IN || filter.operator == AdminForthFilterOperators.NIN) {
        return filter.value;
      } else {
        return [(filter as IAdminForthSingleFilter).value];
      }
    }

    // filter is a Single insecure raw sql
    if ((filter as IAdminForthSingleFilter).insecureRawSQL) {
      return [];
    }

    // filter is a AndOrFilter
    return (filter as IAdminForthAndOrFilter).subFilters.reduce((params: any[], f: IAdminForthSingleFilter | IAdminForthAndOrFilter) => {
      return params.concat(this.getFilterParams(f));
    }, []);
  }

  whereClauseAndValues(filters: IAdminForthAndOrFilter) : {
    sql: string,
    values: any[],
  } {
    return filters.subFilters.length ? {
      sql: `WHERE ${this.getFilterString(filters)}`,
      values: this.getFilterParams(filters)
    } : { sql: '', values: [] };
  }

  async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }): Promise<any[]> {
    const columns = resource.dataSourceColumns.map((col) => `${col.name}`).join(', ');
    const tableName = resource.table;
    
    const { sql: where, values: filterValues } = this.whereClauseAndValues(filters);

    const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `${s.field} ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';
    let selectQuery = `SELECT ${columns} FROM ${tableName}`;
    if (where) selectQuery += ` ${where}`;
    if (orderBy) selectQuery += ` ${orderBy}`;
    if (limit) selectQuery += ` LIMIT ${limit}`;
    if (offset) selectQuery += ` OFFSET ${offset}`;
    if (process.env.HEAVY_DEBUG_QUERY) {
      console.log('🪲📜 MySQL Q:', selectQuery, 'values:', filterValues);
    }
    const [results] = await this.client.execute(selectQuery, filterValues);
    return results.map((row) => {
      const newRow = {};
      for (const [key, value] of Object.entries(row)) {
        newRow[key] = value;
      }
      return newRow;
    });
  }

  async getCount({ resource, filters }: { resource: AdminForthResource; filters: IAdminForthAndOrFilter; }): Promise<number> {
    const tableName = resource.table;
    // validate and normalize in case this method is called from dataAPI
    if (filters) {
      const filterValidation = this.validateAndNormalizeFilters(filters, resource);
      if (!filterValidation.ok) {
        throw new Error(filterValidation.error);
      }
    }
    const { sql: where, values: filterValues } = this.whereClauseAndValues(filters);
    const q = `SELECT COUNT(*) FROM ${tableName} ${where}`;
    if (process.env.HEAVY_DEBUG_QUERY) {
      console.log('🪲📜 MySQL Q:', q, 'values:', filterValues);
    }
    const [results] = await this.client.execute(q, filterValues);
    return +results[0]["COUNT(*)"];
  }
  
  async getMinMaxForColumnsWithOriginalTypes({ resource, columns }) {
    const tableName = resource.table;
    const result = {};
    await Promise.all(columns.map(async (col) => {
      const q = `SELECT MIN(${col.name}) as min, MAX(${col.name}) as max FROM ${tableName}`;
      if (process.env.HEAVY_DEBUG_QUERY) {
        console.log('🪲📜 MySQL Q:', q);
      }
      const [results] = await this.client.execute(q);
      const { min, max } = results[0];
      result[col.name] = {
        min, max,
      };
    }))
    return result;
  }

  async createRecordOriginalValues({ resource, record }): Promise<string> {
    const tableName = resource.table;
    const columns = Object.keys(record);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((colName) => typeof record[colName] === 'undefined' ? null : record[colName]);
    const q = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    if (process.env.HEAVY_DEBUG_QUERY) {
      console.log('🪲📜 MySQL Q:', q, 'values:', values);
    }
    const ret = await this.client.execute(q, values);
    return ret.insertId;
  }

  async updateRecordOriginalValues({ resource, recordId,  newValues }) {
    const values = [...Object.values(newValues), recordId];
    const columnsWithPlaceholders = Object.keys(newValues).map((col, i) => `${col} = ?`).join(', ');
    const q = `UPDATE ${resource.table} SET ${columnsWithPlaceholders} WHERE ${this.getPrimaryKey(resource)} = ?`;
    if (process.env.HEAVY_DEBUG_QUERY) {
      console.log('🪲📜 MySQL Q:', q, 'values:', values);
    }
    await this.client.execute(q, values);
  }

  async deleteRecord({ resource, recordId }): Promise<boolean> {
    const q = `DELETE FROM ${resource.table} WHERE ${this.getPrimaryKey(resource)} = ?`;
    if (process.env.HEAVY_DEBUG_QUERY) {
      console.log('🪲📜 MySQL Q:', q, 'values:', [recordId]);
    }
    const res = await this.client.execute(q, [recordId]);
    return res.rowCount > 0;
  }

  async close() {
    await this.client.end();
  }
}

export default MysqlConnector;