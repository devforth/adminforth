---
description: "How to use resources with composite (multi-column) primary keys in AdminForth."
---

# Composite primary keys

Most resources have one column marked with `primaryKey: true`. AdminForth also supports tables where
record is identified by several columns, e.g. a Prisma model like this:

```prisma
model AssetNetwork {
  assetSymbol String
  networkCode String

  withdrawalFee Decimal @db.Decimal(36, 18)

  @@id([assetSymbol, networkCode])
}
```

To use such table, mark every key column with `primaryKey: true`:

```ts
{
  table: 'AssetNetwork',
  resourceId: 'asset_network',
  dataSource: 'maindb',
  columns: [
    { name: 'assetSymbol', primaryKey: true },
    { name: 'networkCode', primaryKey: true },
    { name: 'withdrawalFee' },
  ],
}
```

Order of primary key columns in `columns` defines order of parts in record id (see below), so don't
reorder them after links to records were shared.

## Record id format

Everywhere in AdminForth (urls, REST API, hooks, plugins) a record is identified by one value called
record id:

* resource with **single** primary key: record id is the raw column value, e.g. `42`. Nothing changed
  here, all existing code works as before.
* resource with **composite** primary key: record id is a string which glues URI-encoded values of all
  primary key columns with `~`, e.g. `BTC~ERC20`. Show page url looks like
  `/resource/asset_network/show/BTC~ERC20`.

Values which contain `~` are escaped (`%7E`), so parts are always unambiguous.

If you need to build or parse record id in your own code, use exported helpers instead of gluing
strings manually:

```ts
import { encodeRecordId, decodeRecordId, isCompositePrimaryKey } from 'adminforth';

const recordId = encodeRecordId(resource, record);      // 'BTC~ERC20'
const pkValues = decodeRecordId(resource, recordId);    // { assetSymbol: 'BTC', networkCode: 'ERC20' }
```

In hooks and actions `recordId`/`selectedIds` already contain this value, and
`adminforth.resource('asset_network').update(recordId, {...})` /
`.delete(recordId)` accept it as well.

## Creating records

All primary key columns must have values when record is created (there is no auto-generation for
composite keys), otherwise creation fails with an error.

## Connector support

Composite primary key requires data source connector which knows how to build `WHERE` clause from
several columns. Such connector sets `supportsCompositePrimaryKey = true` and uses `pkValues`
argument of `updateRecordOriginalValues` and `deleteRecord`.

If connector does not support it, AdminForth fails on startup with explicit error, so you will not get
silently wrong updates or deletions.

## Limitations

* `foreignResource` can't point to a resource with composite primary key yet.
* Resource used in `auth.usersResourceId` must have single primary key.
