import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';
import ForeignInlineListPlugin from '../../../plugins/adminforth-foreign-inline-list/index.js';

export default {
  dataSource: 'sqlite',
  table: 'sessions',
  resourceId: 'sessions',
  label: 'Sessions',
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
      name: 'title',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'turns',
      type: AdminForthDataTypes.INTEGER,
    },
    {
      name: 'asker_id',
      type: AdminForthDataTypes.STRING,
      foreignResource: {
        resourceId: 'adminuser',
        labelField: 'id'
      }
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
      showIn: {
        edit: false,
        create: false,
      }
    },
  ],
  plugins: [
    new ForeignInlineListPlugin({
      foreignResourceId: 'turns',
    }),
  ],
} as AdminForthResourceInput;