import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local/index.js";
import AdminForthAdapterS3Storage from '../../adapters/adminforth-storage-adapter-amazon-s3/index.js';

import { AdminForthResourceInput } from "adminforth";
import UploadPlugin from '../../plugins/adminforth-upload/index.js';
import { v1 as uuid } from "uuid";

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
      fillOnCreate: ({ initialRecord }: any) => uuid(),
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
    { name: "record_id", required: false },
    { name: "image_path", required: false },
  ],
  plugins: [
    new UploadPlugin({
      pathColumnName: "image_path",
      // rich editor plugin supports only 'public-read' ACL images for SEO purposes (instead of presigned URLs which change every time)
      // storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
      //   fileSystemFolder: "./images", // folder where files will be stored on disk
      //   adminServeBaseUrl: "static/source", // the adapter not only stores files, but also serves them for HTTP requests
      //   mode: "public", // public if all files should be accessible from the web, private only if could be accesed by temporary presigned links
      //   signingSecret: "TOP_SECRET", // secret used to generate presigned URLs
      // }),
      storageAdapter: new AdminForthAdapterS3Storage({
        bucket: process.env.AWS_BUCKET_NAME as string,
        region: process.env.AWS_REGION as string,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      }),
  
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
        `sqlite/cars_description_images/${new Date().getFullYear()}/${originalFilename}.${originalExtension}`,


    }),
  ],
} as AdminForthResourceInput;