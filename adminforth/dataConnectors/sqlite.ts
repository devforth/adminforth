import betterSqlite3 from 'better-sqlite3';
import { IAdminForthDataSourceConnector, IAdminForthSingleFilter, IAdminForthAndOrFilter, AdminForthResource, AdminForthResourceColumn, AdminForthConfig, IAggregationRule, IGroupByRule, IGroupByDateTrunc, IGroupByField } from '../types/Back.js';
import AdminForthBaseConnector from './baseConnector.js';
import dayjs from 'dayjs';
import { AdminForthDataTypes,  AdminForthFilterOperators, AdminForthSortDirections } from '../types/Common.js';
import { dbLogger, afLogger } from '../modules/logger.js';

class SQLiteConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

  async setupClient(url: string): Promise<void> {
    this.client = betterSqlite3(url.replace('sqlite://', ''));
  }
  async getAllTables(): Promise<Array<string>> {
    const stmt = this.client.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
    );
    const rows = stmt.all();
    return rows.map((row) => row.name);
  }
  async getAllColumnsInTable(tableName: string): Promise<Array<{ name: string; sampleValue?: any }>> {
    const stmt = this.client.prepare(`PRAGMA table_info(${tableName});`);
    const columns = stmt.all();
  
    const orderByField = columns.find(c => ['created_at', 'id'].includes(c.name))?.name;
  
    let sampleRow = {};
    if (orderByField) {
      const rowStmt = this.client.prepare(`SELECT * FROM ${tableName} ORDER BY ${orderByField} DESC LIMIT 1`);
      sampleRow = rowStmt.get() || {};
    } else {
      const rowStmt = this.client.prepare(`SELECT * FROM ${tableName} LIMIT 1`);
      sampleRow = rowStmt.get() || {};
    }
  
    return columns.map(col => ({
      name: col.name || '',
      sampleValue: sampleRow[col.name],
    }));
  }
  
    async hasSQLiteCascadeFk(resource: AdminForthResource, config: AdminForthConfig): Promise<boolean> {
      const cascadeColumn = resource.columns?.find(c => c.foreignResource?.onDelete === 'cascade');
      if (!cascadeColumn) return false;

      const parentResource = config.resources.find(r => r.resourceId === cascadeColumn.foreignResource.resourceId);
      if (!parentResource) return false;

      const fkStmt = this.client.prepare(`PRAGMA foreign_key_list(${resource.table})`);
      const fkRows = await fkStmt.all();
      const fkMap: { [colName: string]: boolean } = {};
      fkRows.forEach(fk => { fkMap[fk.from] = fk.on_delete?.toUpperCase() === 'CASCADE'; });

      const hasCascadeOnTable = fkMap[cascadeColumn.name] || false;
      const isUploadPluginInstalled = resource.plugins?.some(p => p.className === "UploadPlugin");

      if (hasCascadeOnTable && isUploadPluginInstalled) {
          afLogger.warn(`Table "${resource.table}" has ON DELETE CASCADE and UploadPlugin installed, which may conflict with adminForth cascade deletion`);
      }

      return hasCascadeOnTable;
    }

    async discoverFields(resource: AdminForthResource, config: AdminForthConfig): Promise<{[key: string]: AdminForthResourceColumn}> {

        const tableName = resource.table;
        const stmt = this.client.prepare(`PRAGMA table_info(${tableName})`);
        const rows = await stmt.all();       
        await this.hasSQLiteCascadeFk(resource, config);
        const fieldTypes = {};
        rows.forEach((row) => {
          const field: any = {};
          const baseType = row.type.toLowerCase();
          if (baseType == 'int' || baseType == 'integer') {
            field.type = AdminForthDataTypes.INTEGER;
            field._underlineType = 'int';
          } else if (baseType.includes('varchar(')) {
            field.type = AdminForthDataTypes.STRING;
            field._underlineType = 'varchar';
            const length = baseType.match(/\d+/);
            field.maxLength = length ? parseInt(length[0]) : null;
          } else if (baseType == 'text') {
            field.type = AdminForthDataTypes.TEXT;
            field._underlineType = 'text';
          } else if (baseType.includes('decimal(')) {
            field.type = AdminForthDataTypes.DECIMAL;
            field._underlineType = 'decimal';
            const [precision, scale] = baseType.match(/\d+/g);
            field.precision = parseInt(precision);
            field.scale = parseInt(scale);
          } else if (baseType === 'decimal') {
            field.type = AdminForthDataTypes.DECIMAL;
            field._underlineType = 'decimal';
            field.precision = 10;
            field.scale = 2;
          } else if (baseType == 'real') {
            field.type = AdminForthDataTypes.FLOAT; //8-byte IEEE floating point number. It
            field._underlineType = 'real';
          } else if (baseType == 'timestamp') {
            field.type = AdminForthDataTypes.DATETIME;
            field._underlineType = 'timestamp';
          } else if (baseType == 'boolean') {
            field.type = AdminForthDataTypes.BOOLEAN;
            field._underlineType = 'boolean';
          } else if (baseType == 'datetime') {
            field.type = AdminForthDataTypes.DATETIME;
            field._underlineType = 'datetime';
          } else {
            field.type = 'unknown'
          }
          field._baseTypeDebug = baseType;
          field.required = row.notnull == 1;
          field.primaryKey = row.pk == 1;

          field.default = row.dflt_value;
          fieldTypes[row.name] = field
        });
        return fieldTypes;
    }

    getFieldValue(field: AdminForthResourceColumn, value: any): any {
      if (field.type == AdminForthDataTypes.DATETIME) {
        if (!value) {
          return null;
        }
        if (field._underlineType == 'timestamp' || field._underlineType == 'int') {
          return dayjs.unix(+value).toISOString();
        } else if (field._underlineType == 'varchar') {
          return dayjs(value).toISOString();
        } else if (field._underlineType == 'datetime') {
          return dayjs(value).toISOString();
        } else {
          throw new Error(`AdminForth does not support row type: ${field._underlineType} for timestamps, use VARCHAR (with iso strings) or TIMESTAMP/INT (with unix timestamps). Issue in field "${field.name}"`);
        }

      } else if (field.type == AdminForthDataTypes.DATE) {
        if (!value) {
          return null;
        }
        return dayjs(value).toISOString().split('T')[0];

      } else if (field.type == AdminForthDataTypes.BOOLEAN) {
        return value === null ? null : !!value;
      } else if (field.type == AdminForthDataTypes.JSON) {
        if (field._underlineType == 'text' || field._underlineType == 'varchar') {
          try {
            return JSON.parse(value);
          } catch (e) {
            return {'error': `Failed to parse JSON: ${e.message}`}
          }
        } else {
          afLogger.warn(`AdminForth: JSON field is not a string/text but ${field._underlineType}, this is not supported yet`);
        }
      }

      return value;
    }

    setFieldValue(field: AdminForthResourceColumn, value: any): any {
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
        } else {
          return value;
        }
              }
      else if (field.isArray?.enabled) {
        if (value === null || value === undefined) {
            return null;
        }
        return JSON.stringify(value);
      } else if (field.type == AdminForthDataTypes.BOOLEAN) {
        // SQLite does not have a native boolean type, it uses 0 and 1
        // valid only for sqlite
        return value === null ? null : (value ? 1 : 0);
      } else if (field.type == AdminForthDataTypes.JSON) {
        // check underline type is text or string
        if (field._underlineType == 'text' || field._underlineType == 'varchar') {
          return JSON.stringify(value);
        } else {
          afLogger.warn(`AdminForth: JSON field is not a string/text but ${field._underlineType}, this is not supported yet`);
        }
      }

      return value;
    }

    OperatorsMap = {
      [AdminForthFilterOperators.EQ]: '=',
      [AdminForthFilterOperators.NE]: '!=',
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
      [AdminForthFilterOperators.IS_EMPTY]: 'IS NULL',
      [AdminForthFilterOperators.IS_NOT_EMPTY]: 'IS NOT NULL',
    };

    SortDirectionsMap = {
      [AdminForthSortDirections.asc]: 'ASC',
      [AdminForthSortDirections.desc]: 'DESC',
    };
  
    getFilterString(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): string {
      if ((filter as IAdminForthSingleFilter).field) {
        // Field-to-field comparison support
        if ((filter as IAdminForthSingleFilter).rightField) {
          const left = (filter as IAdminForthSingleFilter).field;
          const right = (filter as IAdminForthSingleFilter).rightField;
          const operator = this.OperatorsMap[filter.operator];
          return `${left} ${operator} ${right}`;
        }
        // filter is a Single filter
        let placeholder = '?';
        let field = (filter as IAdminForthSingleFilter).field;
        let operator = this.OperatorsMap[filter.operator];
        
        // Handle IS_EMPTY and IS_NOT_EMPTY operators
        if (filter.operator == AdminForthFilterOperators.IS_EMPTY || filter.operator == AdminForthFilterOperators.IS_NOT_EMPTY) {
          return `${field} ${operator}`;
        } else if (filter.operator == AdminForthFilterOperators.IN || filter.operator == AdminForthFilterOperators.NIN) {
          placeholder = `(${filter.value.map(() => '?').join(', ')})`;
        } else if (filter.operator == AdminForthFilterOperators.ILIKE) {
          placeholder = `LOWER(?)`;
          field = `LOWER(${filter.field})`;
          operator = 'LIKE';
        } else if (filter.operator == AdminForthFilterOperators.NE) {
          if (filter.value === null) {
            operator = 'IS NOT';
            placeholder = 'NULL';
          } else {
            // for not equal, we need to add a null check
            // because nullish field will not match != value
            placeholder = `${placeholder} OR ${field} IS NULL)`;
            field = `(${field}`;
          }
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
        return `(${this.getFilterString(f) })`;
      }).join(` ${this.OperatorsMap[filter.operator]} `);
    }
    getFilterParams(filter: IAdminForthSingleFilter | IAdminForthAndOrFilter): any[] {
      if ((filter as IAdminForthSingleFilter).field) {
        if ((filter as IAdminForthSingleFilter).rightField) {
          // No params for field-to-field comparisons
          return [];
        }
        // filter is a Single filter
        
        // Handle IS_EMPTY and IS_NOT_EMPTY operators - no params needed
        if (filter.operator == AdminForthFilterOperators.IS_EMPTY || filter.operator == AdminForthFilterOperators.IS_NOT_EMPTY) {
          return [];
        } else if (filter.operator == AdminForthFilterOperators.LIKE || filter.operator == AdminForthFilterOperators.ILIKE) {
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
    whereClause(filter: IAdminForthAndOrFilter) {
      return filter.subFilters.length ? `WHERE ${this.getFilterString(filter)}` : '';
    }

    private _dateGroupKey(rawValue: any, underlineType: string, truncation: string, timezone: string): string {
      const date = (underlineType === 'timestamp' || underlineType === 'int')
        ? new Date(Number(rawValue) * 1000)
        : new Date(rawValue);

      const fmt = (opts: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat('en', { timeZone: timezone, ...opts }).formatToParts(date);

      const get = (parts: Intl.DateTimeFormatPart[], type: string) =>
        parts.find(p => p.type === type)?.value ?? '';

      const dateParts = fmt({ year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
      const year  = get(dateParts, 'year');
      const month = get(dateParts, 'month');
      const day   = get(dateParts, 'day');
      const dateStr = `${year}-${month}-${day}`;

      switch (truncation) {
        case 'day': return dateStr;
        case 'week': {
          const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
          const dow = dowMap[get(dateParts, 'weekday')] ?? 0;
          const daysBack = dow === 0 ? 6 : dow - 1; // rewind to Monday (ISO)
          const [y, m, d] = dateStr.split('-').map(Number);
          return new Date(Date.UTC(y, m - 1, d - daysBack)).toISOString().split('T')[0];
        }
        case 'month': return `${year}-${month}-01`;
        case 'year':  return `${year}-01-01`;
        default:      return dateStr;
      }
    }

    async getAggregateWithOriginalTypes({ resource, filters, aggregations, groupBy }: {
      resource: AdminForthResource,
      filters: IAdminForthAndOrFilter,
      aggregations: { [alias: string]: IAggregationRule },
      groupBy?: IGroupByRule,
    }): Promise<Array<{ group?: string, [key: string]: any }>> {
      const tableName = resource.table;
      const where = this.whereClause(filters);
      const filterValues = this.getFilterParams(filters);

      if (!groupBy || groupBy.type === 'field') {
        const selectParts: string[] = [];
        let groupExpr: string | null = null;

        if (groupBy?.type === 'field') {
          const g = groupBy as IGroupByField;
          groupExpr = `"${g.field}"`;
          selectParts.push(`${groupExpr} AS "group"`);
        }

        for (const [alias, rule] of Object.entries(aggregations)) {
          switch (rule.operation) {
            case 'sum':    selectParts.push(`SUM("${rule.field}") AS "${alias}"`); break;
            case 'count':  selectParts.push(`COUNT(*) AS "${alias}"`); break;
            case 'avg':    selectParts.push(`AVG("${rule.field}") AS "${alias}"`); break;
            case 'min':    selectParts.push(`MIN("${rule.field}") AS "${alias}"`); break;
            case 'max':    selectParts.push(`MAX("${rule.field}") AS "${alias}"`); break;
            case 'median': throw new Error('Aggregates.median() with GroupBy.Field is not supported in SQLite.');
          }
        }

        let query = `SELECT ${selectParts.join(', ')} FROM ${tableName} ${where}`;
        if (groupExpr) query += ` GROUP BY ${groupExpr} ORDER BY ${groupExpr} ASC`;
        dbLogger.trace(`🪲📜 SQLITE AGG Q: ${query}, params: ${JSON.stringify(filterValues)}`);
        return this.client.prepare(query).all([...filterValues]);
      }

      const g = groupBy as IGroupByDateTrunc;
      const timezone = g.timezone ?? 'UTC';
      const col = resource.dataSourceColumns.find(c => c.name === g.field);
      const underlineType = col?._underlineType ?? 'varchar';

      const neededFields = new Set<string>([g.field]);
      for (const rule of Object.values(aggregations)) {
        if (rule.field) neededFields.add(rule.field);
      }
      const selectCols = [...neededFields].map(f => `"${f}"`).join(', ');
      const rawQuery = `SELECT ${selectCols} FROM ${tableName} ${where}`;
      dbLogger.trace(`🪲📜 SQLITE AGG RAW Q: ${rawQuery}, params: ${JSON.stringify(filterValues)}`);
      const rawRows: any[] = this.client.prepare(rawQuery).all([...filterValues]);

      const groups = new Map<string, any[]>();
      for (const row of rawRows) {
        const key = this._dateGroupKey(row[g.field], underlineType, g.truncation, timezone);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }

      const results: Array<{ group: string, [key: string]: any }> = [];
      for (const [groupKey, rows] of groups) {
        const result: { group: string, [key: string]: any } = { group: groupKey };
        for (const [alias, rule] of Object.entries(aggregations)) {
          const nums = rule.field ? rows.map(r => Number(r[rule.field!] ?? 0)) : [];
          switch (rule.operation) {
            case 'count':  result[alias] = rows.length; break;
            case 'sum':    result[alias] = nums.reduce((s, v) => s + v, 0); break;
            case 'avg':    result[alias] = nums.reduce((s, x) => s + x, 0) / nums.length; break;
            case 'min':    result[alias] = Math.min(...nums); break;
            case 'max':    result[alias] = Math.max(...nums); break;
            case 'median': {
              const sorted = nums.slice().sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              result[alias] = sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
              break;
            }
          }
        }
        results.push(result);
      }

      return results.sort((a, b) => a.group.localeCompare(b.group));
    }

    async getDataWithOriginalTypes({ resource, limit, offset, sort, filters }): Promise<any[]> {
      const columns = resource.dataSourceColumns.map((col) => col.name).join(', ');
      const tableName = resource.table;

      const where = this.whereClause(filters);

      const filterValues = this.getFilterParams(filters);

      const orderBy = sort.length ? `ORDER BY ${sort.map((s) => `${s.field} ${this.SortDirectionsMap[s.direction]}`).join(', ')}` : '';
      
      const q = `SELECT ${columns} FROM ${tableName} ${where} ${orderBy} LIMIT ? OFFSET ?`;
      const stmt = this.client.prepare(q);
      const d = [...filterValues, limit, offset];

      dbLogger.trace(`🪲📜 SQLITE Q: ${q}, params: ${JSON.stringify(d)}`);
      const rows = await stmt.all(d);

      return rows.map((row) => {
        const newRow = {};
        for (const [key, value] of Object.entries(row)) {
          newRow[key] = value;
        }
        return newRow;
      })
    }

    async getCount({ resource, filters }) {
      let normalizedFilters = filters;

      if (filters) {
      // validate and normalize in case this method is called from dataAPI
        const filterValidation = this.validateAndNormalizeFilters(filters, resource);
        if (!filterValidation.ok) {
          throw new Error(filterValidation.error);
        }
        normalizedFilters = filterValidation.normalizedFilters as IAdminForthAndOrFilter;
      }
      const tableName = resource.table;
      const where = this.whereClause(normalizedFilters);
      const filterValues = this.getFilterParams(normalizedFilters);
      const q = `SELECT COUNT(*) FROM ${tableName} ${where}`;
      dbLogger.trace(`🪲📜 SQLITE Q: ${q}, params: ${JSON.stringify(filterValues)}`);
      const totalStmt = this.client.prepare(q);
      return +totalStmt.get([...filterValues])['COUNT(*)'];
    }

    async getMinMaxForColumnsWithOriginalTypes({ resource, columns }: { resource: AdminForthResource, columns: AdminForthResourceColumn[] }): Promise<{ [key: string]: { min: any, max: any } }> {
      const tableName = resource.table;
      const result = {};
      await Promise.all(columns.map(async (col) => {
        const stmt = await this.client.prepare(`SELECT MIN(${col.name}) as min, MAX(${col.name}) as max FROM ${tableName}`);
        const { min, max } = stmt.get();
        result[col.name] = {
          min, max,
        };
      }))
      return result;
    }

    async createRecordOriginalValues({ resource, record }: { resource: AdminForthResource, record: any }): Promise<string> {
      const tableName = resource.table;
      const columns = Object.keys(record);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map((colName) => record[colName]);
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      const q = this.client.prepare(sql);
      dbLogger.trace(`🪲📜 SQLITE Q: ${sql}, values: ${JSON.stringify(values)}`);
      const ret = await q.run(values);
      return ret.lastInsertRowid;
    }

    async updateRecordOriginalValues({ resource, recordId, newValues }: { resource: AdminForthResource, recordId: any, newValues: any }) {
      const columnsWithPlaceholders = Object.keys(newValues).map((col) => `${col} = ?`);
      const values = [...Object.values(newValues), recordId];
      const q = `UPDATE ${resource.table} SET ${columnsWithPlaceholders} WHERE ${this.getPrimaryKey(resource)} = ?`;
      dbLogger.trace(`🪲📜 SQLITE Q: ${q}, params: ${JSON.stringify(values)}`);
      const query = this.client.prepare(q);
      await query.run(values);
    }

    async deleteRecord({ resource, recordId }: { resource: AdminForthResource, recordId: any }): Promise<boolean> {
      const q = this.client.prepare(`DELETE FROM ${resource.table} WHERE ${this.getPrimaryKey(resource)} = ?`);
      const res = await q.run(recordId);
      return res.changes > 0;
    }

    async deleteMany({ resource, recordIds }: { resource: AdminForthResource, recordIds: string[] }): Promise<number> {
      if (!recordIds || recordIds.length === 0) {
        return 0;
      }
      const placeholders = recordIds.map(() => '?').join(',');
      const q = this.client.prepare(`DELETE FROM ${resource.table} WHERE ${this.getPrimaryKey(resource)} IN (${placeholders})`);
      dbLogger.trace(`🪲📜 SQLITE Q: ${q}, params: ${JSON.stringify(recordIds)}`);
      const res = await q.run(...recordIds);
      return res.changes ?? 0;
    }

    close() {
      this.client.close();
    }
}

export default SQLiteConnector;