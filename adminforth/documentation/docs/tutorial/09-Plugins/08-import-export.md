---
title: Import Export
description: "Guide to the Import-Export plugin for CSV-based data transfer, including installation, import flow, export flow, and resource-level usage."
slug: /tutorial/Plugins/import-export
---

# Import-Export

Import-Export is a plugin that allows you to import data from and export data to a CSV file.

This plugin is mostly useful for the following use cases:

* Move data from one environment to another (e.g. from development to production)
* Export data for various purposes (e.g. backup, analysis)


There are two export modes:
- Classic (REST)
- Upload

If you are exporting light datasets (less than 5 MiB), you can use classic mode. It returns the data in JSON format in the API response.
You can increase the maximum dataset size with the `classicalUploadLimitMiB` param (5 MiB is the default). But if you set a big limit, the export can consume all the RAM of your server and crash it.

So if you want to export big databases, use the `exportViaUpload` param. It uses the Background Jobs plugin and AWS S3 multipart upload, so it does not overload the server.

## Installation

To install the plugin:

```bash
pnpm install @adminforth/import-export --save
```

## Setup

To use the plugin, you need to import it and instantiate the `ImportExport` class:

```typescript
import ImportExport from '@adminforth/import-export';
```

Add the plugin instantiation to the `plugins` array of the resource where you want to use it:

```typescript

export default {
  resourceId: 'aparts',
  plugins: [
    ...
    new ImportExport({}),
  ],
  ...
}
  
```


## Upload export

1) First, set up the Background Jobs plugin: go to the [Background Jobs Plugin page](/docs/tutorial/Plugins/background-jobs) and complete the setup.

2) Install the AWS S3 adapter:

```bash
pnpm add @adminforth/storage-adapter-amazon-s3
```

3) Update the plugin setup:

```typescript
import ImportExport from '@adminforth/import-export';
import AdminForthAdapterS3Storage from '@adminforth/storage-adapter-amazon-s3'
```

Add the plugin instantiation to the `plugins` array of the resource where you want to use it:

```typescript

export default {
  resourceId: 'aparts',
  plugins: [
    ...
    new ImportExport({
      exportViaUpload: {
        storageAdapter: new AdminForthAdapterS3Storage({
          bucket: process.env.AWS_BUCKET_NAME as string,
          region: process.env.AWS_REGION as string,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
          s3ACL: "public-read"
        })
      }
    }),
  ],
  ...
}
  
```
