import CRUDApprovePlugin from '../../plugins/af-crud-approve-plugin/index.js';
import { AdminForthDataTypes } from '../../adminforth/index.js';
import type { AdminForthResourceInput, AdminUser } from '../../adminforth/index.js';

async function allowedForSuperAdmin({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export const crudApprovePlugin = new CRUDApprovePlugin({
  resourceColumns: {
    idColumnName: 'id',
    recordIdColumnName: 'record_id',
    resourceIdColumnName: 'resource_id',
    actionColumnName: 'action',
    dataColumnName: 'data',
    userIdColumnName: 'user_id',
    responserIdColumnName: 'responser_id',
    statusColumnName: 'status',
    createdAtColumnName: 'created_at',
    extraColumnName: 'extra',
  },
  // dev-demo is usually used with a single superadmin login, so allow the author
  // of the request to approve it himself. Never do this in production: it makes
  // the four-eyes principle void.
  allowSelfApproval: true,
});

export default {
  dataSource: 'sqlite',
  table: 'crud_manual_approve',
  resourceId: 'crud_manual_approve',
  label: 'CRUD approvals',
  recordLabel: (r: any) => `${r.resource_id} / ${r.action}`,
  columns: [
    {
      name: 'id',
      primaryKey: true,
      showIn: { list: false, show: true, edit: false, create: false },
    },
    {
      name: 'record_id',
      label: 'Record ID',
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'resource_id',
      label: 'Resource',
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'action',
      enum: [
        { value: 'create', label: 'Create' },
        { value: 'edit', label: 'Edit' },
        { value: 'delete', label: 'Delete' },
      ],
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'data',
      type: AdminForthDataTypes.JSON,
      sortable: false,
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'user_id',
      label: 'Requested by',
      foreignResource: {
        resourceId: 'adminuser',
      },
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'responser_id',
      label: 'Responded by',
      foreignResource: {
        resourceId: 'adminuser',
      },
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'status',
      enum: [
        { value: 1, label: 'Pending' },
        { value: 2, label: 'Approved' },
        { value: 3, label: 'Rejected' },
      ],
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      allowMinMaxQuery: true,
      showIn: { all: true, edit: false, create: false },
    },
    {
      name: 'extra',
      type: AdminForthDataTypes.JSON,
      showIn: { all: false },
      backendOnly: true,
    },
  ],
  options: {
    listPageSize: 10,
    allowedActions: {
      create: false,
      edit: false,
      delete: false,
      // this is not only a UI matter: the plugin resolves `show` on every
      // approve/reject request, so it is the actual approval permission
      show: allowedForSuperAdmin,
      filter: allowedForSuperAdmin,
    },
  },
  // cast for the same reason as in adminuser.ts: the plugin repo has its own
  // adminforth copy, so its IAdminForthPlugin is a different type identity
  plugins: [crudApprovePlugin] as any,
} as AdminForthResourceInput;
