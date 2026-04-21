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
      foreignResource: {
        resourceId: 'sessions',
        labelField: 'id'
      }
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATE,
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
      showIn: {
        edit: false,
        create: false,
      }
    },
    {
      name: 'prompt',
      type: AdminForthDataTypes.TEXT,
    },
    {
      name: 'response',
      type: AdminForthDataTypes.TEXT,
    },
    {
      name: 'dubbug',
      type: AdminForthDataTypes.JSON,
      components: {
        show: {
          file: '@@/TurnDebugShow.vue',
        },
      },
      showIn: {
        list: false,
        show: true,
        edit: false,
        create: false,
        filter: false,
      },
    },
  ],
} as AdminForthResourceInput;
