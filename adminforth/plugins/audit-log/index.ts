import type { 
  AdminForthResource, 
  IAdminForth,
  AdminUser,
} from "adminforth";

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js';

import { AdminForthPlugin, AllowedActionsEnum, AdminForthSortDirections, AdminForthDataTypes, HttpExtra } from "adminforth";
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

  instanceUniqueRepresentation(pluginOptions: any) : string {
    return `single`;
  }

  static defaultError = 'Sorry, you do not have access to this resource.'

  createLogRecord = async (resource: AdminForthResource, action: AllowedActionsEnum | string, data: Object, user: AdminUser, oldRecord?: Object, extra?: HttpExtra) => {
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
      [this.options.resourceColumns.resourceCreatedColumnName]: dayjs.utc().format(),
      ...(this.options.resourceColumns.resourceIpColumnName && extra?.headers ? {[this.options.resourceColumns.resourceIpColumnName]: this.adminforth.auth.getClientIp(extra.headers)} : {}),
    }
    const auditLogResource = this.adminforth.config.resources.find((r) => r.resourceId === this.auditLogResource);
    await this.adminforth.createResourceRecord({ resource: auditLogResource, record, adminUser: user});
    return {ok: true};
  }

  /**
   * Create a custom action in the audit log resource
   * @param resourceId - The resourceId of the resource that the action is being performed on. Can be null if the action is not related to a specific resource.
   * @param recordId - The recordId of the record that the action is being performed on. Can be null if the action is not related to a specific record.
   * @param actionId - The id of the action being performed, can be random string
   * @param data - The data to be stored in the audit log
   * @param user - The adminUser user performing the action
   */
  logCustomAction = async (resourceId: string | null=null, recordId: string | null=null, actionId: string, data: Object, user: AdminUser, headers?: Record<string, string>) => {
    if (resourceId) {
      const resource = this.adminforth.config.resources.find((r) => r.resourceId === resourceId);
      if (!resource) {
        const similarResource = this.adminforth.config.resources.find((r) => r.resourceId.includes(resourceId));
        throw new Error(`Resource ${resourceId} not found. Did you mean ${similarResource.resourceId}?`)
      }
    }

    const record = {
      [this.options.resourceColumns.resourceIdColumnName]: resourceId,
      [this.options.resourceColumns.resourceActionColumnName]: actionId,
      [this.options.resourceColumns.resourceDataColumnName]: { 'oldRecord': {}, 'newRecord': data },
      [this.options.resourceColumns.resourceUserIdColumnName]: user.pk,
      [this.options.resourceColumns.resourceRecordIdColumnName]: recordId,
      [this.options.resourceColumns.resourceCreatedColumnName]: dayjs.utc().format(),
      ...(this.options.resourceColumns.resourceIpColumnName && headers ? {[this.options.resourceColumns.resourceIpColumnName]: this.adminforth.auth.getClientIp(headers)} : {}),
    }
    const auditLogResource = this.adminforth.config.resources.find((r) => r.resourceId === this.auditLogResource);
    await this.adminforth.createResourceRecord({ resource: auditLogResource, record, adminUser: user});
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
      };

      ['edit', 'delete'].forEach((hook) => {
        resource.hooks[hook].afterSave.push(async ({resource, updates, adminUser, oldRecord, extra}) => {
          return await this.createLogRecord(resource, hook as AllowedActionsEnum, updates, adminUser, oldRecord, extra)
        })
      });

      ['create'].forEach((hook) => {
        resource.hooks[hook].afterSave.push(async ({resource, record, adminUser, extra}) => {
          return await this.createLogRecord(resource, hook as AllowedActionsEnum, record, adminUser, undefined, extra)
        })
      });
      
    })
  }
}