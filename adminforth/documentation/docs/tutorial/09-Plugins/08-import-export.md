---
title: Import Export
description: "Guide to the Import Export plugin for CSV and XLSX data transfer, including installation, import flow, export flow, and resource-level usage."
slug: /tutorial/Plugins/import-export
---

# Import-Export

Import Export is a plugin that allows you to import and export resource data as CSV or Excel (`.xlsx`) files.

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
pnpm add @adminforth/import-export --save
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

CSV import and export are enabled by default.

## File format

Set `fileFormat` on each plugin instance to choose the format used by both import and export:

```typescript
new ImportExport({
  fileFormat: 'xlsx',
})
```

Supported values are:

- `'csv'` (default)
- `'xlsx'`

For XLSX imports, the first row of each non-empty worksheet is treated as the column header. Rows from multiple worksheets are combined, but all non-empty worksheets must have the same columns in the same order.

Both classic and upload export support XLSX. A background XLSX export that exceeds Excel's limit of 1,048,575 data rows per worksheet is automatically split into multiple worksheets, with the header repeated on each worksheet.

## Export-only mode

Import is enabled by default. To expose only the export action, set `importEnabled` to `false`:

```typescript
new ImportExport({
  importEnabled: false,
})
```

This removes the import action from the resource UI and does not register the import endpoints. Export remains available in the selected `fileFormat`.


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
      fileFormat: 'xlsx', // optional; defaults to 'csv'
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

The upload mode supports the same `fileFormat` values as classic export. You can also tune memory usage and database read size:

```typescript
new ImportExport({
  exportViaUpload: {
    storageAdapter,
    bufferSizeMb: 10, // defaults to 5 MiB; minimum is 5 MiB
    readChunkSize: 500, // defaults to 100 records
  },
})
```
