import { AdminForthPlugin, suggestIfTypo, AdminForthFilterOperators } from "adminforth";
import type { IAdminForth, IHttpServer, AdminForthResourceColumn, AdminForthComponentDeclaration, AdminForthResource } from "adminforth";
import type { PluginOptions } from './types.js';

export default class ImportExport extends AdminForthPlugin {
  options: PluginOptions;
  emailField: AdminForthResourceColumn;
  authResourceId: string;
  adminforth: IAdminForth;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  async modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    if (!resourceConfig.options.pageInjections) {
      resourceConfig.options.pageInjections = {};
    }
    if (!resourceConfig.options.pageInjections.list) {
      resourceConfig.options.pageInjections.list = {};
    }
    if (!resourceConfig.options.pageInjections.list.threeDotsDropdownItems) {
      resourceConfig.options.pageInjections.list.threeDotsDropdownItems = [];
    }
    (resourceConfig.options.pageInjections.list.threeDotsDropdownItems as AdminForthComponentDeclaration[]).push({
      file: this.componentPath('ExportCsv.vue'),
      meta: { pluginInstanceId: this.pluginInstanceId, select: 'all' }
    }, {
      file: this.componentPath('ExportCsv.vue'),
      meta: { pluginInstanceId: this.pluginInstanceId, select: 'filtered' }
    }, {
      file: this.componentPath('ImportCsv.vue'),
      meta: { pluginInstanceId: this.pluginInstanceId }
    });


    // simply modify resourceConfig or adminforth.config. You can get access to plugin options via this.options;
  }
  
  validateConfigAfterDiscover(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    // optional method where you can safely check field types after database discovery was performed
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    // optional method to return unique string representation of plugin instance. 
    // Needed if plugin can have multiple instances on one resource 
    return `${this.pluginInstanceId}`;
  }

  setupEndpoints(server: IHttpServer) {
    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/export-csv`,
      noAuth: true,
      handler: async ({ body }) => {
        const { filters, sort } = body;

        for (const filter of (filters || [])) {
          if (!Object.values(AdminForthFilterOperators).includes(filter.operator)) {
              throw new Error(`Operator '${filter.operator}' is not allowed`);
          }
          if (!this.resourceConfig.columns.some((col) => col.name === filter.field)) {
              throw new Error(`Field '${filter.field}' is not in resource '${this.resourceConfig.resourceId}'. Available fields: ${this.resourceConfig.columns.map((col) => col.name).join(', ')}`);
          }
          if (filter.operator === AdminForthFilterOperators.IN || filter.operator === AdminForthFilterOperators.NIN) {
              if (!Array.isArray(filter.value)) {
                  throw new Error(`Value for operator '${filter.operator}' should be an array`);
              }
          }
          if (filter.operator === AdminForthFilterOperators.IN && filter.value.length === 0) {
              // nonsense
              return { data: [], total: 0 };
          }
        }

        const data = await this.adminforth.connectors[this.resourceConfig.dataSource].getData({
          resource: this.resourceConfig,
          limit: 1e6,
          offset: 0,
          filters,
          sort,
          getTotals: true,
        });

        // csv export

        const columns = this.resourceConfig.columns.filter((col) => !col.virtual);
        let csv = data.data.map((row) => {
          return columns.map((col) => {
            return row[col.name];
          }).join(',');
        }).join('\n');

        // add headers
        const headers = columns.map((col) => col.name).join(',');
        csv = `${headers}\n${csv}`;

        return { data: csv, exportedCount: data.total, ok: true };

      }
    });

    server.endpoint({
      method: 'POST',
      path: `/plugin/${this.pluginInstanceId}/import-csv`,
      noAuth: true,
      handler: async ({ body }) => {
        const { data } = body;
        // data is in format {[columnName]: [value1, value2, value3...], [columnName2]: [value1, value2, value3...]}
        // we need to convert it to [{columnName: value1, columnName2: value1}, {columnName: value2, columnName2: value2}...]
        const rows = [];
        const columns = Object.keys(data);

        // check column names are valid
        const errors: string[] = [];
        columns.forEach((col) => {
          if (!this.resourceConfig.columns.some((c) => c.name === col)) {
            const similar = suggestIfTypo(this.resourceConfig.columns.map((c) => c.name), col);
            errors.push(`Column '${col}' defined in CSV not found in resource '${this.resourceConfig.resourceId}'. ${
              similar ? `If you mean '${similar}', rename it in CSV` : 'If column is in database but not in resource configuration, add it with showIn:[]'}`
            );
          }
        });
        if (errors.length > 0) {
          return { ok: false, errors };
        }

        const columnValues: any[] = Object.values(data);
        for (let i = 0; i < columnValues[0].length; i++) {
          const row = {};
          for (let j = 0; j < columns.length; j++) {
            row[columns[j]] = columnValues[j][i];
          }
          rows.push(row);
        }

        let importedCount = 0;
        await Promise.all(rows.map(async (row) => {
          try {
              await this.adminforth.resource(this.resourceConfig.resourceId).create(row);
              importedCount++;
          } catch (e) {
              errors.push(e.message);
          }
        }));


        return { ok: true, importedCount, errors};

      }
    });

  }

}