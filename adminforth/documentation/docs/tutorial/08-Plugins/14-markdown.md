# Markdown

The Markdown plugin enables Markdown support in AdminForth, allowing users to create and edit fields using Markdown syntax and save rich content in Markdown syntax. 

Also, it allows previewing of Markdown fields in the show page.

## Installation

To install the plugin:

```bash
npm install @adminforth/markdown --save
```

### Usage

Instantiate the plugin in your apartments resource file for 'description' field.

```typescript title="./resources/apartments.ts"
import MarkdownPlugin from '@adminforth/markdown';

// ... existing resource configuration ...

plugins: [
  new MarkdownPlugin({fieldName: "description"}),
]
```

> Please note that plugin can only work on TEXT and STRING fields

Here is how it looks in the create view:

![alt text](markdown.png)

Here is how it looks in show view:

![alt text](markdown-show1.png)
![alt text](markdown-show2.png)

### Images in Markdown

First, you need to create resource for images:
```prisma title="schema.prisma"
model description_image {
    id          String   @id
    created_at  DateTime
    resource_id String
    record_id   String
    image_path  String
}
```

```bash
npm run makemigration -- --name add_description_image ; npm run migrate:local
```

```bash
npm i @adminforth/upload --save
npm i @adminforth/storage-adapter-local --save
```

```typescript title="./resources/description_images.ts"
import AdminForthStorageAdapterLocalFilesystem from "@adminforth/storage-adapter-local";
import { AdminForthResourceInput } from "adminforth";
import UploadPlugin from "@adminforth/upload";
import { randomUUID } from 'crypto';

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
    { name: "record_id", required: false },
    { name: "image_path", required: false },
  ],
  plugins: [
    new UploadPlugin({
      pathColumnName: "image_path",
      
      // rich editor plugin supports only 'public-read' ACL images for SEO purposes (instead of presigned URLs which change every time)
      storageAdapter: new AdminForthStorageAdapterLocalFilesystem({
        fileSystemFolder: "./db/uploads/description_images", // folder where files will be stored on disk
        adminServeBaseUrl: "static/source", // the adapter not only stores files, but also serves them for HTTP requests
        mode: "public", // public if all files should be accessible from the web, private only if could be accesed by temporary presigned links
        signingSecret: process.env.ADMINFORTH_SECRET, // secret used to generate presigned URLs
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
        `description_images/${new Date().getFullYear()}/${randomUUID()}/${originalFilename}.${originalExtension}`,

      preview: {
        // Used to display preview (if it is image) in list and show views instead of just path
        // previewUrl: ({s3Path}) => `https://tmpbucket-adminforth.s3.eu-central-1.amazonaws.com/${s3Path}`,
        // show image preview instead of path in list view
        // showInList: false,
      },
    }),
  ],
} as AdminForthResourceInput;
```
Next, add new resource to `index.ts`:

```typescript title="./index.ts"
// diff-add
import descriptionImage from './resources/description_images.js';

...

  resources: [
    usersResource,
    apartments,
    // diff-add
    descriptionImage
  ],
```

Next, add attachments to Markdown plugin:

```typescript title="./resources/apartments.ts"
import MarkdownPlugin from '@adminforth/markdown';

// ... existing resource configuration ...

plugins: [
  new MarkdownPlugin({
    fieldName: "description",
// diff-add
    attachments: {
// diff-add
        attachmentResource: "description_images",
// diff-add
        attachmentFieldName: "image_path",
// diff-add
        attachmentRecordIdFieldName: "record_id",
// diff-add
        attachmentResourceIdFieldName: "resource_id",
// diff-add
      },
    }),
]
```