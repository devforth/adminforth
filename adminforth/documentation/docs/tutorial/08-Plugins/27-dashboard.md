---
title: Dashboard
description: "Guide to the Dashboard plugin."
slug: /tutorial/Plugins/dashboard
---

# Dashboard (WIP)

The Dashboard plugin adds configurable dashboards to AdminForth.

Each dashboard is stored as a record in your database. The plugin renders every dashboard under `/dashboard/:slug`, adds a **Dashboards** group to the sidebar, and lets superadmins configure groups and widgets directly from the UI.

Supported widgets:

- **Table**
- **Chart**: line, bar, stacked bar, pie, funnel, histogram
- **KPI Card**
- **Gauge Card**
- **Pivot Table**

## Installation

```bash
pnpm install @adminforth/dashboard --save
```

## Create Dashboard Configs Table

The plugin needs one resource to store dashboard definitions. For Prisma-based projects, add the table to your schema:

```prisma title="./schema.prisma"
model dashboard_configs {
  id        String @id
  slug      String @unique
  label     String
  revision  Int
  config    Json

  @@index([slug])
}
```

Create and apply a migration:

```bash
pnpm makemigration --name add-dashboard-configs
pnpm migrate:local
```

The generated SQL should be equivalent to:

```sql title="./migrations/.../migration.sql"
CREATE TABLE "dashboard_configs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "config" JSON NOT NULL
);

CREATE UNIQUE INDEX "dashboard_configs_slug_key" ON "dashboard_configs"("slug");
CREATE INDEX "dashboard_configs_slug_idx" ON "dashboard_configs"("slug");
```

Use the JSON column type supported by your database connector. For example, PostgreSQL migrations might use `JSONB`, while SQLite migrations can use `JSON`.

## Create Resource

Create a resource that points to the `dashboard_configs` table:

```ts title="./resources/dashboard_configs.ts"
import { randomUUID } from 'crypto';
import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'maindb',
  table: 'dashboard_configs',
  resourceId: 'dashboard_configs',
  label: 'Dashboard Configs',
  recordLabel: (record) => record.label,
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: () => randomUUID(),
      showIn: {
        list: false,
        edit: false,
        create: false,
        show: true,
        filter: false,
      },
    },
    {
      name: 'slug',
      type: AdminForthDataTypes.STRING,
      label: 'Slug',
    },
    {
      name: 'label',
      type: AdminForthDataTypes.STRING,
      label: 'Label',
    },
    {
      name: 'revision',
      type: AdminForthDataTypes.INTEGER,
      label: 'Revision',
      fillOnCreate: () => 1,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'config',
      type: AdminForthDataTypes.JSON,
      label: 'Config',
    },
  ],
} as AdminForthResourceInput;
```

Register this resource in your AdminForth app:

```ts title="./index.ts"
import dashboardConfigsResource from './resources/dashboard_configs.js';

export const admin = new AdminForth({
  // ...
  resources: [
    // ...
    dashboardConfigsResource,
  ],
});
```

## Configure Plugin

Attach the plugin to one of your resources, usually the users resource:

```ts title="./resources/adminuser.ts"
import DashboardPlugin from '@adminforth/dashboard';

export default {
  // ...
  plugins: [
    // ...
    new DashboardPlugin({
      dashboardConfigsResourceId: 'dashboard_configs',
    }),
  ],
} as AdminForthResourceInput;
```

After `admin.discoverDatabases()` runs, the plugin creates a default dashboard config if the table is empty:

```yaml
version: 1
groups:
  - id: default
    label: Default Group
    order: 1
widgets: []
```

## Usage

Open the **Dashboards** group in the sidebar and choose a dashboard page.

Superadmins can:

- add, rename, reorder, and remove groups
- add, configure, reorder, and remove widgets
- edit widget and group configs from the dashboard UI

The dashboard editors use YAML syntax, so the configuration snippets below are shown in YAML even though the data is stored in a JSON column.

Dashboard pages are generated from records in `dashboard_configs`. To add another dashboard, create a new record:

```yaml title="dashboard_configs.config"
version: 1
groups:
  - id: sales
    label: Sales
    order: 1
widgets: []
```

Use a unique `slug`, for example `sales`. The plugin will expose it as `/dashboard/sales` and add it to the **Dashboards** sidebar group.

## Widget Data Sources

Widgets can load data from any AdminForth resource by using `dataSource`.

### Resource Data Source

```yaml
type: resource
resourceId: cars
columns:
  - model
  - price
  - body_type
sort:
  field: price
  direction: desc
```

Resource data source fields:

- `resourceId`: AdminForth `resourceId`
- `columns`: optional list of columns returned to the widget
- `sort`: optional sort field and direction
- `filters`: optional AdminForth filter tree

### Aggregate Data Source

```yaml
type: aggregate
resourceId: cars
aggregations:
  value:
    operation: count
groupBy:
  type: field
  field: body_type
```

Aggregate data source fields:

- `aggregations`: named aggregation rules exposed to widgets as output fields
- `groupBy`: optional grouping rule; use `field` for raw values or `date_trunc` for time buckets
- grouped aggregate rows expose the grouping key as `group`
- `filters`: optional AdminForth filter tree

### Legacy Query Format

The legacy `query` shape is still supported for backwards compatibility.

```yaml
resource: cars
select:
  - model
  - price
  - body_type
order:
  field: price
  direction: desc
limit: 10
```

Legacy query fields:

- `resource`: AdminForth `resourceId`
- `select`: optional list of columns returned to the widget
- `order`: optional sort field and direction
- `limit`: optional maximum number of records

## Widget Examples

The examples below are widget configs as they appear in the dashboard widget editor. When you edit the whole `dashboard_configs.config` record directly, every widget also needs its persisted `id`, `group_id`, and `order` fields.

### Table

```yaml
label: Latest Cars
target: table
size: wide
height: 360
table:
  columns:
    - model
    - price
    - body_type
    - production_year
  pageSize: 10
dataSource:
  type: resource
  resourceId: cars
  columns:
    - model
    - price
    - body_type
    - production_year
  sort:
    field: production_year
    direction: desc
```

Table widgets use backend pagination by default. Set `table.pageSize` to choose how many rows each backend request loads, or `table.pagination` to `false` to request all rows at once. If you still use legacy `query`, `query.limit` is used as the maximum number of rows available across all pages.

### Pie Chart

When a chart uses aggregate data with `groupBy`, the grouped key is available in the `group` field.

```yaml
label: Cars by Body Type
target: chart
size: medium
height: 360
chart:
  type: pie
  label_field: group
  value_field: value
dataSource:
  type: aggregate
  resourceId: cars
  aggregations:
    value:
      operation: count
  groupBy:
    type: field
    field: body_type
```

### Bar Chart

```yaml
label: Cars by Production Year
target: chart
size: wide
height: 360
chart:
  type: bar
  label_field: group
  value_field: value
dataSource:
  type: aggregate
  resourceId: cars
  aggregations:
    value:
      operation: count
  groupBy:
    type: field
    field: production_year
```

### KPI Card

```yaml
label: Average Car Price
target: kpi_card
size: small
kpi_card:
  value_field: value
  prefix: $
dataSource:
  type: aggregate
  resourceId: cars
  aggregations:
    value:
      operation: avg
      field: price
```

### Gauge Card

```yaml
label: Average Car Price
target: gauge_card
size: small
gauge_card:
  value_field: value
  min_field: min
  max_field: max
  suffix: $
  color: '#2563eb'
dataSource:
  type: aggregate
  resourceId: cars
  aggregations:
    value:
      operation: avg
      field: price
    min:
      operation: min
      field: price
    max:
      operation: max
      field: price
```

### Pivot Table

```yaml
label: Cars Summary by Body Type
target: pivot_table
size: full
height: 420
pivot_table:
  row_field: group
dataSource:
  type: aggregate
  resourceId: cars
  aggregations:
    total_cars:
      operation: count
    avg_price:
      operation: avg
      field: price
  groupBy:
    type: field
    field: body_type
```

For aggregate pivot examples, the grouping key is available as `group`, and aggregation aliases such as `total_cars` and `avg_price` become table columns.

## Layout

Widgets support these layout fields:

```yaml
size: small
width: 320
height: 360
minWidth: 240
maxWidth: 640
```

`size` can be `small`, `medium`, `large`, `wide`, or `full`. Explicit `width`, `height`, `minWidth`, and `maxWidth` can be used when a widget needs more precise sizing.

## Agent Plugin Integration

When `@adminforth/agent` is installed in the same app, the agent can work with dashboard configs too. You can ask it to create dashboard groups, add widgets, or adjust widget settings, and it will update the Dashboard plugin configuration through AdminForth resources and dashboard endpoints.
