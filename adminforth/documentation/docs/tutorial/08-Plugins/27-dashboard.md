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

## Widget Queries

Widgets load data through `query`. The same query shape supports raw rows, grouped aggregate rows, per-measure filters, ordering, and calculated fields.

```yaml
query:
  resource: cars
  select:
    - field: body_type
      as: body_type
    - agg: count
      as: total_cars
    - agg: avg
      field: price
      as: avg_price
  group_by:
    - body_type
  order_by:
    - field: total_cars
      direction: desc
```

Step-based charts use a `steps` query when each step needs its own resource, metric, and filters. Funnel charts always use this query shape.

Depending on the widget, `query` can also use `limit`, `offset`, `calcs`, `time_series`, `period`, `bucket`, and `formatting`.

Widget-scoped constants can be defined with `variables`. They are available inside `query.calcs` through `lookup($variables.path, field, default)`.

```yaml
label: Average Car Price by Database
target: chart
variables:
  price_multipliers:
    cars_sl: 0.84
    cars_mysql: 1.12
chart:
  type: bar
  x:
    field: name
  y:
    field: adjusted_value
query:
  steps:
    - name: SQLite
      resource: cars_sl
      metric:
        agg: avg
        field: price
        as: value
    - name: MySQL
      resource: cars_mysql
      metric:
        agg: avg
        field: price
        as: value
  calcs:
    - calc: value * lookup($variables.price_multipliers, resource, 1)
      as: adjusted_value
```

Define `variables` on each widget config. Dashboard root variables are not merged into widget data queries.

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
  page_size: 10
query:
  resource: cars
  select:
    - field: model
    - field: price
    - field: body_type
    - field: production_year
  order_by:
    - field: production_year
      direction: desc
```

Table widgets use pagination by default. Set `table.page_size` to choose how many rows each request loads, or `table.pagination` to `false` to request all rows at once.

### Pie Chart

```yaml
label: Cars by Body Type
target: chart
size: medium
height: 360
chart:
  type: pie
  label:
    field: body_type
  value:
    field: value
query:
  resource: cars
  select:
    - field: body_type
    - agg: count
      as: value
  group_by:
    - body_type
```

### Bar Chart

```yaml
label: Cars by Production Year
target: chart
size: wide
height: 360
chart:
  type: bar
  x:
    field: production_year
  y:
    field: value
query:
  resource: cars
  select:
    - field: production_year
    - agg: count
      as: value
  group_by:
    - production_year
```

### Chart With Multiple Sources

Use `query.steps` when funnel steps come from different resources. Each step returns one row with `name` and the metric alias.

```yaml
label: Sales Funnel
target: chart
size: large
height: 360
chart:
  type: funnel
  title: Sales funnel
query:
  steps:
    - name: Leads
      resource: leads
      metric:
        agg: count
        as: value
    - name: Qualified
      resource: leads
      metric:
        agg: count
        as: value
      filters:
        and:
          - field: status
            eq: qualified
    - name: Customers
      resource: orders
      metric:
        agg: count_distinct
        field: customer_id
        as: value
```

### KPI Card

```yaml
label: Average Car Price
target: kpi_card
size: small
card:
  value:
    field: value
    prefix: $
query:
  resource: cars
  select:
    - agg: avg
      field: price
      as: value
```

### Gauge Card

```yaml
label: Average Car Price
target: gauge_card
size: small
card:
  value:
    field: value
    suffix: $
  target:
    field: max
  color: '#2563eb'
query:
  resource: cars
  select:
    - agg: avg
      field: price
      as: value
    - agg: max
      field: price
      as: max
```

### Pivot Table

```yaml
label: Cars Summary by Body Type
target: pivot_table
size: full
height: 420
pivot:
  rows:
    - body_type
  values:
    - field: total_cars
    - field: avg_price
query:
  resource: cars
  select:
    - field: body_type
    - agg: count
      as: total_cars
    - agg: avg
      field: price
      as: avg_price
  group_by:
    - body_type
```

Aggregation aliases such as `total_cars` and `avg_price` become table columns.

## Layout

Widgets support these layout fields:

```yaml
size: small
width: 320
height: 360
min_width: 240
max_width: 640
```

`size` can be `small`, `medium`, `large`, `wide`, or `full`. Explicit `width`, `height`, `min_width`, and `max_width` can be used when a widget needs more precise sizing.

## Agent Plugin Integration

When `@adminforth/agent` is installed in the same app, the agent can work with dashboard configs too. You can ask it to create dashboard groups, add widgets, or adjust widget settings, and it will update the Dashboard plugin configuration through AdminForth resources and dashboard endpoints.
