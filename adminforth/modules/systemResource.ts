import type {
  CreateResourceRecordResult,
  ISystemOperationalResource,
  OperationalResourceSystemOptions,
} from '../types/Back.js';
import type OperationalResource from './operationalResource.js';
import type { ResourceHookExecutors } from './userScopedResource.js';

/**
 * Resource writes no user asked for, which still run the resource lifecycle: validation, save
 * hooks and the onDelete strategy. No permission checks, no column access rules, no row scope.
 */
export default class SystemResource implements ISystemOperationalResource {
  constructor(
    private readonly data: OperationalResource,
    private readonly executors: ResourceHookExecutors,
    private readonly options: OperationalResourceSystemOptions,
  ) {}

  async create(record: any): Promise<CreateResourceRecordResult & { ok: boolean; createdRecord: any }> {
    const result = await this.executors.create({
      resource: this.data.resourceConfig,
      record,
      adminUser: this.options.adminUser,
      extra: this.options.extra,
    });
    return { ...result, ok: !result.error, createdRecord: result.createdRecord };
  }

  async update(primaryKey: any, updates: any): Promise<any> {
    const oldRecord = this.options.oldRecord
      ?? await this.data.dataConnector.getRecordByPrimaryKey(this.data.resourceConfig, primaryKey);
    if (!oldRecord) {
      const primaryKeyColumn = this.data.resourceConfig.columns.find((column) => column.primaryKey);
      return { ok: false, error: `Record with ${primaryKeyColumn.name} ${primaryKey} not found` };
    }

    const result = await this.executors.update({
      resource: this.data.resourceConfig,
      recordId: primaryKey,
      updates,
      oldRecord,
      adminUser: this.options.adminUser,
      extra: this.options.extra,
    });
    return { ...result, ok: !result.error };
  }

  async delete(primaryKey: any): Promise<boolean> {
    const record = this.options.record
      ?? await this.data.dataConnector.getRecordByPrimaryKey(this.data.resourceConfig, primaryKey);
    if (!record) {
      return false;
    }

    const { error } = await this.executors.delete({
      resource: this.data.resourceConfig,
      recordId: primaryKey,
      record,
      adminUser: this.options.adminUser,
      extra: this.options.extra,
    }, true);
    if (error) {
      throw new Error(error);
    }
    return true;
  }
}
