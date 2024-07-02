import AdminForth from "../../index.js";
import { 
  AdminForthResource, AdminForthClass, BeforeDataSourceRequestFunction,
  AllowedActionsEnum,
  BeforeSaveFunction,
  AdminUser,
  AdminForthDataTypes,
  AdminForthResourcePages,
  AdminForthFilterOperators
} from "../../types/AdminForthConfig.js";
import AdminForthPlugin from "../base.js";
import { PluginOptions } from "./types.js";



export default class AuditLogPlugin extends AdminForthPlugin {
 
  options: PluginOptions;
  adminforth: AdminForthClass;
  auditLogResource: string;

  constructor(options: PluginOptions) {
    super(options, import.meta.url);
    this.options = options;
  }

  static defaultError = 'Sorry, you do not have access to this resource.'

  createLogRecord = async (resource: AdminForthResource, action: AllowedActionsEnum, data: Object, user: AdminUser, oldRecord: Object) => {
    const recordIdFieldName = resource.columns.find((c) => c.primaryKey === true)?.name;
    const recordId = data?.[recordIdFieldName] || oldRecord?.[recordIdFieldName];
    const connector = this.adminforth.connectors[resource.dataSource];

    const newRecord = action == AllowedActionsEnum.delete ? {} : (await connector.getRecordByPrimaryKey(resource, recordId)) || {};
    if (action !== AllowedActionsEnum.delete) {
        oldRecord = oldRecord ? JSON.parse(JSON.stringify(oldRecord)) : {};
    } else {
        oldRecord = data
    }

    if (action !== AllowedActionsEnum.delete) {
        const columnsNamesList = resource.columns.map((c) => c.name);
        columnsNamesList.forEach((key) => {
            if (JSON.stringify(oldRecord[key]) == JSON.stringify(newRecord[key])) {
                delete oldRecord[key];
                delete newRecord[key];
            }
        });
    }

    const backendOnlyColumns = resource.columns.filter((c) => c.backendOnly);
    backendOnlyColumns.forEach((c) => {
        if (JSON.stringify(oldRecord[c.name]) != JSON.stringify(newRecord[c.name])) {
            if (action !== AllowedActionsEnum.delete) {
                newRecord[c.name] = '<hidden value after>'
            }
            if (action !== AllowedActionsEnum.create) {
                oldRecord[c.name] = '<hidden value before>'
            }
        } else {
            delete oldRecord[c.name];
            delete newRecord[c.name];
        }
    });

    const record = {
      [this.options.resourceColumns.resourceIdColumnName]: resource.resourceId,
      [this.options.resourceColumns.resourceActionColumnName]: action,
      [this.options.resourceColumns.resourceDataColumnName]: { 'oldRecord': oldRecord || {}, 'newRecord': newRecord },
      [this.options.resourceColumns.resourceUserIdColumnName]: user.pk,
      [this.options.resourceColumns.resourceRecordIdColumnName]: recordId,
      [this.options.resourceColumns.resourceCreatedColumnName]: new Date()
    }
    const auditLogResource = this.adminforth.config.resources.find((r) => r.resourceId === this.auditLogResource);
    await this.adminforth.createResourceRecord({ resource: auditLogResource, record, adminUser: user});
    return {ok: true};
  }

  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: AdminForthResource) {
    super.modifyResourceConfig(adminforth, resourceConfig);
    this.adminforth = adminforth;
    this.auditLogResource = resourceConfig.resourceId;

    this.adminforth.config.resources.forEach((resource) => {
      if (this.options.excludeResourceIds?.includes(resource.resourceId)) {
        return;
      }

      if (this.auditLogResource === resource.resourceId) {
        let diffColumn = resource.columns.find((c) => c.name === this.options.resourceColumns.resourceDataColumnName); 
        if (!diffColumn) {
          diffColumn = {
            name: this.options.resourceColumns.resourceDataColumnName,
            components: {},
            // type: AdminForthDataTypes.STRING
          }
        }
     
        diffColumn.showIn = ['show']
        diffColumn.components = {
          show: { 
            file: this.componentPath('AuditLogView.vue'),
            meta: {
              ...this.options, 
              pluginInstanceId: this.pluginInstanceId
            }
          }
        }
        console.log('diffColumn', diffColumn)
        return;
      }

      const defaultHooks = {
        create: { afterSave: [] },
        edit: { afterSave: [] },
        delete: { beforeSave: [] }
      }

      if ( !resource.hooks ) {
        resource.hooks = defaultHooks; 
      } else {
         resource.hooks = {...defaultHooks, ...resource.hooks}
      }

      Object.keys(resource.hooks).forEach((hook) => {
        const hookToUse = hook == AllowedActionsEnum.delete ? 'beforeSave' : 'afterSave';
        if(!Array.isArray(resource.hooks[hook][hookToUse])){
          resource.hooks[hook][hookToUse] = [resource.hooks[hook][hookToUse]]
        }
        resource.hooks[hook][hookToUse].push(async ({resource, record, adminUser, oldRecord}) => {
          return await this.createLogRecord(resource, hook as AllowedActionsEnum, record, adminUser, oldRecord)
        })
      })
    })
  }
}