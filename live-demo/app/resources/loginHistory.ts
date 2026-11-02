import { AdminForthDataTypes, AdminForthSortDirections } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import AutoRemovePlugin from '@adminforth/auto-remove';
import { randomUUID } from 'crypto';

async function allowedForSuperAdmins({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

const loginHistoryResource: AdminForthResourceInput = {
  dataSource: 'maindb',
  table: 'login_history',
  resourceId: 'login_history',
  label: 'Login History',
  columns: [
    { name: 'id', primaryKey: true, fillOnCreate: () => randomUUID(), showIn: { all: false } },
    { name: 'created_at', type: AdminForthDataTypes.DATETIME },
    { name: 'user_id', foreignResource: { resourceId: 'users' } },
    { name: 'success', type: AdminForthDataTypes.BOOLEAN },
    { name: 'attempts', type: AdminForthDataTypes.INTEGER },
    { name: 'ip', required: false },
    { name: 'country', required: false },
    { name: 'user_agent', required: false, showIn: { list: false } },
    // substring search finds failed attempts by an IP inside the JSON
    { name: 'ips', type: AdminForthDataTypes.JSON, required: false, filterOptions: { substringSearch: true } },
  ],
  options: {
    allowedActions: {
      list: allowedForSuperAdmins,
      show: allowedForSuperAdmins,
      filter: allowedForSuperAdmins,
      create: false,
      edit: false,
      delete: false,
    },
    defaultSort: { columnName: 'created_at', direction: AdminForthSortDirections.desc },
  },
  plugins: [
    new AutoRemovePlugin({
      createdAtField: 'created_at',
      mode: 'time-based',
      deleteOlderThan: '3mo',
      interval: '1d',
    }),
  ],
};

export default loginHistoryResource;
