import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import AdminForthAdapterS3Storage from '../../adapters/adminforth-storage-adapter-amazon-s3/index.js';

import { AdminForthResourceInput } from "adminforth";
import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import { randomUUID } from 'crypto';

export default {
  dataSource: "sqlite",
  table: "cars_description_image",
  resourceId: "cars_description_images",
  label: "Description images",
  columns: [
    {
      name: "id",
      primaryKey: true,
      required: false,
      fillOnCreate: ({ initialRecord }: any) => randomUUID(),
      showIn: {
        create: false,
      },
    },
    {
      name: "created_at",
      required: false,
      fillOnCreate: ({ initialRecord }: any) => new Date().toISOString(),
      showIn: {
        create: false,
      },
    },
    { name: "resource_id", required: false },
    { name: "record_id", required: false, 
      foreignResource: {
        resourceId: "cars_sl",
        labelField: "model",
      },
     },
    { name: "image_path", required: false },
    { name: "title", required: false },
    { name: "alt_text", required: false },
  ],
  plugins: [
    new UploadPlugin({
      pathColumnName: "image_path",
      storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
        fileSystemFolder: "./db/uploads_promo_generated",
        mode: "public", // or "private"
        signingSecret: '1241245',
      }),

      // to test s3:
      //  storageAdapter: new AdminForthAdapterS3Storage({
      //   bucket: 'static.devforth.io',
      //   region: process.env.AWS_REGION || "eu-central-1",
      //   accessKeyId: process.env.AWS_ACCESS_KEY_ID || "your-access-key-id",
      //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "your-secret-access-key",
      //   s3ACL: 'public-read',
      // }),
  
  
      allowedFileExtensions: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webm",
        "exe",
        "webp",
      ],
      maxFileSize: 1024 * 1024 * 20, // 20MB


      filePath: ({ originalFilename, originalExtension, contentType }) =>
        `sqlite/cars_description_images/${+new Date()}/${originalFilename}.${originalExtension}`,

      // to test s3 public preview
      // preview: {
      //   previewUrl: ({ s3Path, filePath }: { s3Path?: string; filePath?: string }) => {
      //     const path = s3Path ?? filePath ?? '';
      //     return `https://static.devforth.io/${path}`;
      //   },
      // }

    }),
  ],
} as AdminForthResourceInput;