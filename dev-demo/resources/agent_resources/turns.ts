import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';
import UploadPlugin from '../../../plugins/adminforth-upload/index.js';
import AdminForthStorageAdapterLocalFilesystem from '../../../adapters/adminforth-storage-adapter-local/index.js';
import AdminForthAdapterS3Storage from '../../../adapters/adminforth-storage-adapter-amazon-s3/index.js';

export default {
  dataSource: 'sqlite',
  table: 'turns',
  resourceId: 'turns',
  label: 'Turns',
  // written by the agent only; edits here would bypass its checks and its file bookkeeping
  options: {
    allowedActions: {
      create: false,
      edit: false,
      delete: false,
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
    new UploadPlugin({
      pathColumnName: 'attachments',
      storageAdapter: process.env.USE_S3 !== 'true' ? new AdminForthStorageAdapterLocalFilesystem({
        fileSystemFolder: './db/uploads_agent_attachments',
        mode: 'private',
        signingSecret: '1241245',
      }) : new AdminForthAdapterS3Storage({
        bucket: process.env.AWS_BUCKET_NAME as string,
        region: process.env.AWS_REGION as string,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        strictContentType: true,
      }),
      allowedFileExtensions: ['png', 'jpg', 'jpeg', 'webp'],
      maxFileSize: 1024 * 1024 * 5,
      filePath: ({ originalExtension }) => `agent_attachments/${randomUUID()}.${originalExtension}`,
    }),
  ],
} as AdminForthResourceInput;
