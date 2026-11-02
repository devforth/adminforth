import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';
import UploadPlugin from '@adminforth/upload';
import AdminForthAdapterS3Storage from '@adminforth/storage-adapter-amazon-s3';

async function allowedForSuperAdmins({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

const turnsResource: AdminForthResourceInput = {
  dataSource: 'maindb',
  table: 'turns',
  resourceId: 'turns',
  label: 'Turns',
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: () => randomUUID(),
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
      type: AdminForthDataTypes.DATETIME,
      fillOnCreate: () => new Date().toISOString(),
      showIn: {
        edit: false,
        create: false,
      },
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
      name: 'checkpoint_id',
      type: AdminForthDataTypes.STRING,
      showIn: {
        list: false,
        show: true,
        edit: false,
        create: false,
        filter: false,
      },
    },
    {
      name: 'attachments',
      type: AdminForthDataTypes.JSON,
      isArray: {
        enabled: true,
        itemType: AdminForthDataTypes.STRING,
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
  plugins: [
    // images users send to the agent; private, the agent and the chat read them with signed URLs
    new UploadPlugin({
      pathColumnName: 'attachments',
      storageAdapter: new AdminForthAdapterS3Storage({
        bucket: 'demo-static.adminforth.dev',
        region: 'eu-north-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        strictContentType: true,
      }),
      allowedFileExtensions: ['png', 'jpg', 'jpeg', 'webp'],
      maxFileSize: 1024 * 1024 * 5,
      filePath: ({ originalExtension }) => `agent_attachments/${randomUUID()}.${originalExtension}`,
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

export default turnsResource;
