import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';

async function allowedForSuperAdmins({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: 'sqlite',
  table: 'key_values',
  resourceId: 'key_values',
  label: 'Key values',
  columns: [
    {
      name: 'key',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'value',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'collection',
      type: AdminForthDataTypes.STRING,
    }
  ],
  options: {
    allowedActions: {
      list: allowedForSuperAdmins,
      show: allowedForSuperAdmins,
      create: allowedForSuperAdmins,
      edit: allowedForSuperAdmins,
      delete: allowedForSuperAdmins,
    },
  },
} as AdminForthResourceInput;