import AdminForthAdapterS3Storage from "../../adapters/adminforth-storage-adapter-amazon-s3";
import AdminForthStorageAdapterLocalFilesystem from "../../adapters/adminforth-storage-adapter-local";
import { AdminForthResourceInput } from "../../adminforth";
import UploadPlugin from "../../plugins/adminforth-upload";
import { v1 as uuid } from "uuid";

export default {
  dataSource: "maindb",
  table: "description_image",
  resourceId: "description_images",
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
    ...(process.env.AWS_ACCESS_KEY_ID
      ? [
          new UploadPlugin({
            pathColumnName: "image_path",
           
            // rich editor plugin supports only 'public-read' ACL images for SEO purposes (instead of presigned URLs which change every time)
            storageAdapter: new AdminForthAdapterS3Storage({
              region: "eu-central-1",
              bucket: "tmpbucket-adminforth",
              accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
              s3ACL: 'public-read', // ACL which will be set to uploaded file
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
            maxFileSize: 1024 * 1024 * 20, // 5MB


            filePath: ({ originalFilename, originalExtension, contentType }) =>
              `description_images/${new Date().getFullYear()}/${uuid()}/${originalFilename}.${originalExtension}`,

            preview: {
              // Used to display preview (if it is image) in list and show views instead of just path
              // previewUrl: ({s3Path}) => `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${s3Path}`,
              // show image preview instead of path in list view
              // showInList: false,
            },
          }),
        ]
      : []),
  ],
} as AdminForthResourceInput;
