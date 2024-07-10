import type { 
  AdminForthResource, 
  IAdminForth,
  AdminUser,
} from "adminforth";

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js';

import { AdminForthPlugin, AllowedActionsEnum, AdminForthSortDirections, AdminForthDataTypes } from "adminforth";
import { PluginOptions } from "./types.js";

dayjs.extend(utc);

export default class AuditLogPlugin extends AdminForthPlugin {
 
  options: PluginOptions;
  adminforth: IAdminForth;
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
      // utc iso string
      [this.options.resourceColumns.resourceCreatedColumnName]: dayjs.utc().format()
    }
    const auditLogResource = this.adminforth.config.resources.find((r) => r.resourceId === this.auditLogResource);
    await this.adminforth.createResourceRecord({ resource: auditLogResource, record, adminUser: user});
    return {ok: true};
  }

  modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
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
          throw new Error(`Column ${this.options.resourceColumns.resourceDataColumnName} not found in ${resource.label}`)
        }
        if (diffColumn.type !== AdminForthDataTypes.JSON) {
          throw new Error(`Column ${this.options.resourceColumns.resourceDataColumnName} must be of type 'json'`)
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
        resource.options.defaultSort = {
            columnName: this.options.resourceColumns.resourceCreatedColumnName,
            direction: AdminForthSortDirections.desc
        }
        return;
      }

      ['edit', 'create', 'delete'].forEach((hook) => {
        resource.hooks[hook].afterSave.push(async ({resource, record, adminUser, oldRecord}) => {
          return await this.createLogRecord(resource, hook as AllowedActionsEnum, record, adminUser, oldRecord)
        })
      })
    })
  }
}