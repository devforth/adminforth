import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';
import BackgroundJobsPlugin from '../../plugins/adminforth-background-jobs/index.js';

async function allowedForSuperAdmin({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: 'sqlite',
  table: 'jobs',
  resourceId: 'jobs',
  label: 'Jobs',
  options: {
    allowedActions: {
      edit: allowedForSuperAdmin,
      delete: allowedForSuperAdmin,
    },
  },
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
      name: 'name',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: {
        edit: false,
        create: false,
      },
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
    },
    {
      name: 'finished_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'started_by',
      type: AdminForthDataTypes.STRING,
      foreignResource: {
        resourceId: 'adminuser',
        searchableFields: ["id", "email"],
      }
    },
    {
      name: 'state',
      type: AdminForthDataTypes.JSON,
    },
    {
      name: 'progress',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'status',
      type: AdminForthDataTypes.STRING,
      enum: [
        {
          label: 'IN_PROGRESS',
          value: 'IN_PROGRESS',
        },
        {
          label: 'DONE',
          value: 'DONE',
        },
        {
          label: 'DONE_WITH_ERRORS',
          value: 'DONE_WITH_ERRORS',
        },
        {
          label: 'CANCELLED',
          value: 'CANCELLED',
        }
      ]
    },
    {
      name: 'job_handler_name',
      type: AdminForthDataTypes.STRING,
    },
  ],
  plugins: [
    new BackgroundJobsPlugin({
      createdAtField: 'created_at',
      finishedAtField: 'finished_at',
      startedByField: 'started_by',
      stateField: 'state',
      progressField: 'progress',
      statusField: 'status',
      nameField: 'name',
      jobHandlerField: 'job_handler_name',
    })
  ]
} as AdminForthResourceInput;