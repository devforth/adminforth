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
pnpm add @adminforth/connector-Clickhouse
```

### Mongo
```bash
pnpm add @adminforth/connector-Mongo
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
