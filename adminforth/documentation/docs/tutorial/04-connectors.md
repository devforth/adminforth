---
description: "Connectors setup for AdminForth with peer dependency installation and datasource configuration."
---

# Connectors

## General logic
The connectors is distributed as a separate package and loaded by AdminForth automatically.
You do not need to instantiate or import the connector manually in your app config.

AdminForth resolves connectors by datasource URL scheme, so when it sees `sqlite://...` it tries to load `@adminforth/connector-sqlite`.

## Setup
### SQLite
```bash
pnpm add @adminforth/connector-sqlite
```

That is enough for connector wiring because connectors are integrated through the peer dependency system.

### Postgres
```bash
pnpm add @adminforth/connector-postgres
```

### MySQL
```bash
pnpm add @adminforth/connector-mysql
```
### Clickhouse
```bash
pnpm add @adminforth/connector-clickhouse
```

### Mongo
```bash
pnpm add @adminforth/connector-congo
```

### Qdrant
```bash
pnpm add @adminforth/connector-qdrant
```

## How peer dependency loading works

AdminForth keeps connectors optional and attempts to import only the connector that matches your datasource type.

For SQLite this means:

1. You set datasource URL to `sqlite://...`
2. AdminForth attempts to import `@adminforth/connector-sqlite`
3. Connector is used automatically for schema discovery and CRUD operations

No extra connector registration is required in the usual setup.

## Composite primary keys in connectors

Resources can have several columns marked with `primaryKey: true` (see
[Composite primary keys](/docs/tutorial/Customization/compositePrimaryKeys/)). Core encodes values of all such
columns into single `recordId` string and decodes it back for connectors, but connector still has to build
`WHERE` clause over several columns.

Connector declares support with one field and uses `pkValues` argument which base connector passes to it:

```ts
export default class PostgresConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

  supportsCompositePrimaryKey = true;

  async updateRecordOriginalValues({ resource, recordId, newValues, pkValues }) {
    const pkEntries = Object.entries(pkValues ?? { [this.getPrimaryKey(resource)]: recordId });
    const setClause = Object.keys(newValues).map((col, i) => `"${col}" = $${i + 1}`).join(', ');
    const whereClause = pkEntries
      .map(([col], i) => `"${col}" = $${Object.keys(newValues).length + i + 1}`)
      .join(' AND ');
    await this.client.query(
      `UPDATE ${resource.table} SET ${setClause} WHERE ${whereClause}`,
      [...Object.values(newValues), ...pkEntries.map(([, value]) => value)],
    );
  }

  async deleteRecord({ resource, recordId, pkValues }): Promise<boolean> {
    const pkEntries = Object.entries(pkValues ?? { [this.getPrimaryKey(resource)]: recordId });
    const whereClause = pkEntries.map(([col], i) => `"${col}" = $${i + 1}`).join(' AND ');
    const res = await this.client.query(
      `DELETE FROM ${resource.table} WHERE ${whereClause}`,
      pkEntries.map(([, value]) => value),
    );
    return res.rowCount > 0;
  }
}
```

Notes:

* `pkValues` is a map of primary key column name to value already casted with `setFieldValue`, and it works for
  single primary key resources too, so the same code path serves both cases.
* Optional `deleteMany({ resource, recordIds })` should build `OR` of per-record `AND` conditions for composite
  keys, e.g. `WHERE (a = $1 AND b = $2) OR (a = $3 AND b = $4)`. Use `this.getPrimaryKeyValues(resource, recordId)`
  to split each record id.
* `discoverFields` should mark every column of table primary key with `primaryKey: true` (in Postgres these are
  columns of the `PRIMARY KEY` constraint), otherwise users have to set it manually in resource config.

If connector does not set `supportsCompositePrimaryKey`, AdminForth throws on startup when it meets a resource
with composite primary key, instead of silently updating or deleting wrong rows.
