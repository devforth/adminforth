import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import AutoRemovePlugin from '@adminforth/auto-remove';

async function allowedForSuperAdmins({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

const checkpointsResource: AdminForthResourceInput = {
  dataSource: 'maindb',
  table: 'agent_checkpoints',
  resourceId: 'agent_checkpoints',
  label: 'Agent Checkpoints',
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'thread_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'checkpoint_namespace',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'checkpoint_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'parent_checkpoint_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'row_kind',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'task_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'sequence',
      type: AdminForthDataTypes.INTEGER,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'checkpoint_payload',
      type: AdminForthDataTypes.TEXT,
    },
    {
      name: 'metadata_payload',
      type: AdminForthDataTypes.TEXT,
    },
    {
      name: 'writes_payload',
      type: AdminForthDataTypes.TEXT,
    },
    {
      name: 'schema_version',
      type: AdminForthDataTypes.INTEGER,
    },
  ],
  plugins: [
    new AutoRemovePlugin({
      createdAtField: 'created_at',
      mode: 'time-based',
      deleteOlderThan: '15m',
      interval: '5m',
    }),
  ],
  options: {
    allowedActions: {
      list: allowedForSuperAdmins,
      show: allowedForSuperAdmins,
      create: false,
      edit: false,
      delete: false,
    },
  },
};

export default checkpointsResource;
