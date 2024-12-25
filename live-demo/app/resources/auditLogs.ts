import AuditLogPlugin from '@adminforth/audit-log';
import { AdminForthDataTypes } from 'adminforth'
import { v4 as uuid } from 'uuid';
import importExport from '@adminforth/import-export';



export default {
  dataSource: 'maindb', 
  table: 'audit_logs',
  columns: [
    { name: 'id', primaryKey: true, required: false, fillOnCreate: ({initialRecord}: any) => uuid(), showIn: ['show'] },
    { name: 'created_at', required: false },
    { name: 'resource_id', required: false },
    { name: 'user_id', required: false, 
      foreignResource: {
      resourceId: 'users',
    } },
    { name: 'action', required: false },
    { name: 'diff', required: false, type: AdminForthDataTypes.JSON, showIn: ['show'] },
    { name: 'record_id', required: false },
  ],
  options: {
    allowedActions: {
        edit: false,
        delete: false,
    }
  },
  plugins: [
    new importExport({}),
    new AuditLogPlugin({
        // if you want to exclude some resources from logging
        //excludeResourceIds: ['users'],
        resourceColumns: {
            resourceIdColumnName: 'resource_id',
            resourceActionColumnName: 'action',
            resourceDataColumnName: 'diff',
            resourceUserIdColumnName: 'user_id',
            resourceRecordIdColumnName: 'record_id',
            resourceCreatedColumnName: 'created_at'
        }
    }),
  ],
}