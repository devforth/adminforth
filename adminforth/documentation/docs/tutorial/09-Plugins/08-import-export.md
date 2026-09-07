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


## Choosing columns to export

By default every column of the resource is exported, except virtual ones (nothing stores them) and `backendOnly` ones (they never leave the server).

Pass `columnsToExport` to control the file precisely. The list is **exact and ordered** — only the named columns are exported, in the order they are named, so the option doubles as the file layout:

```typescript
new ImportExport({
  columnsToExport: ['id', 'model', 'price'],
})
```

```csv
id,model,price
a1b2c3,Tesla Model 3,42000
```

Because the list is exact, a column added to the resource later does not show up in the file until it is added here too. Names are checked at startup: an unknown name fails with a `suggestIfTypo` hint, a duplicated name fails, and an empty array fails (remove the option instead to export everything).

Virtual columns may be named here as well — that is the only way to get them into a file. They are not filled by anything on their own, so pair them with the hook below; if a virtual column is exported without a `hooks.export.beforeWrite`, the plugin warns at startup that the column will be empty:

```typescript
new ImportExport({
  columnsToExport: ['id', 'model', 'price', 'owner_email'], // owner_email is virtual
  hooks: { export: { beforeWrite: fillOwnerEmail } },
})
```

Two things to keep in mind:

- `backendOnly` columns are rejected at startup even when named explicitly. If you really need such a column in a file, drop `backendOnly` from the column definition.
- Leaving the primary key out is allowed — useful for reports that should not leak internal ids — but then an import of that file creates new records instead of updating existing ones, because there is no key to match them by.

`columnsToExport` affects export only. Import keeps accepting every column described in the resource, so a narrower export still imports back, and a file which still carries an exported virtual column imports cleanly too: virtual columns are dropped from every imported row, because there is no place in the database to store them.

## Transforming records before they are written

`hooks.export.beforeWrite` is called with every batch of records right before they are serialized into the file. Records are passed as a mutable array, so the hook fills virtual columns, rewrites values, or drops rows:

```typescript
import { Filters } from 'adminforth';

new ImportExport({
  virtualColumnsToExport: ['owner_email'],
  hooks: {
    export: {
      beforeWrite: async ({ records, adminforth }) => {
        // one request per batch, not per record
        const owners = await adminforth.resource('users').list(
          Filters.IN('id', records.map((record) => record.owner_id))
        );
        const emailById = Object.fromEntries(owners.map((owner) => [owner.id, owner.email]));

        records.forEach((record) => {
          record.owner_email = emailById[record.owner_id] ?? '';
        });
      },
    },
  },
})
```

The hook receives:

| Param | Description |
| --- | --- |
| `records` | Records about to be written, mutated in place by the hook |
| `columns` | Columns which will be written, in the order they appear in the file |
| `resource` | Resource being exported |
| `adminforth` | AdminForth instance |
| `adminUser` | User who started the export (absent when the export was started programmatically without one) |
| `fileFormat` | `'csv'` or `'xlsx'` |
| `exportMode` | `'classical'` for the REST export, `'upload'` for the background job export |
| `batchOffset` | Zero-based index of the first record of the batch within the whole export |

Batching differs per export mode: classical export calls the hook once with the whole dataset, while upload export calls it once per `readChunkSize` chunk. Write the hook so it works for both, and batch external requests per call instead of doing one request per record.

Records can be dropped from or pushed into the array, and whatever the array holds when the hook returns is what gets written. Database paging is not affected by that, so upload export keeps reading `readChunkSize` records per iteration regardless.

Returning `{ ok: false, error }` aborts the export: classical export responds with the error, and upload export fails the background job with it.

An array of functions is accepted as well, and they are called in order.

:::info
The `classicalUploadLimitMiB` check runs before the hook, on the data as it comes from the database. A hook which adds a lot of data to every record (e.g. a long virtual column) makes the response bigger than the estimate, so leave some headroom in the limit.
:::

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
