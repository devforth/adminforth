import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';

export default {
  dataSource: 'sqlite',
  table: 'turns',
  resourceId: 'turns',
  label: 'Turns',
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: ({ initialRecord, adminUser }) => randomUUID(),
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'session_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATE,
      fillOnCreate: () => new Date(),
    },
    {
      name: 'prompt',
      type: AdminForthDataTypes.TEXT,
    },
    {
      name: 'response',
      type: AdminForthDataTypes.TEXT,
    },
  ],
} as AdminForthResourceInput;