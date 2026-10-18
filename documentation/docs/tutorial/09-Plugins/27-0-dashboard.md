---
title: Dashboard plugin
description: "Documentation for the Dashboard plugin."
slug: /tutorial/Plugins/dashboard
---

# Dashboard Plugin

The **Dashboard Plugin** adds dynamic, configurable dashboards to AdminForth. This page is a practical guide / reference demonstrating how to build and manage your dashboards using the **[Agent Plugin](/docs/tutorial/Plugins/agent)**.

While manual configuration is supported, the plugin is primarily designed to be managed via conversational prompts using the AI Agent. This is the fastest, easiest, and recommended way to create and modify your dashboards.

### Quick Start: Conversation Prompts
If you have the Agent Plugin active, you can interact with it right away using these prompts in the chat interface:
* *"Create a new dashboard named 'Sales Overview'"*
* *"Add a pie chart showing cars by body type to the Sales Overview dashboard"*
* *"Add a KPI card showing the average price of cars"*

---

## Using the Dashboard with the Agent

Once the Dashboard plugin is installed, the AI Agent has full capability to manage it. You do not need to construct YAML configurations yourself; the agent handles all database record updates and layout adjustments.

### End-to-End Prompt Examples
Here are interactive examples you can test immediately in the demo application generated via the AdminForth CLI:

#### 1. KPI Cards for Basic Metrics
* **Initial Prompt:**
  > *"Create a new dashboard group named 'Sales Stats' and add two KPI cards inside it: one for 'Total Cars' (count of all cars) and another for 'Average Price' (average car price)."*
* **Expected Result:**
  The agent creates a new group named "Sales Stats" containing two cards. One card displays the count of all records in the `cars` resource (e.g., `24`), and the second displays the average price formatted with a dollar sign (e.g., `$12,450`).
* **Follow-up Prompt:**
  > *"Change the background color of the Average Price card to blue and adjust its width to match the other card."*

#### 2. Visualizing Categories with a Bar Chart
* **Initial Prompt:**
  > *"Add a bar chart named 'Cars by Body Type' to the 'Sales Stats' group. Group it by body_type and sort by the number of cars from high to low."*
* **Expected Result:**
  A bar chart is created. It queries the `cars` resource, groups by `body_type`, and orders the bars so the body type with the most cars appears first.
* **Follow-up Prompt:**
  > *"Change the chart type to a pie chart and set its size to medium."*

#### 3. Data Table with Filters and Limits
* **Initial Prompt:**
  > *"Add a wide table widget named 'Top 5 Most Expensive Listed Cars' to my dashboard. Show the model, price, and production_year columns. Only include listed cars, and sort them by price descending."*
* **Expected Result:**
  A data table widget is added. It displays columns for model, price, and production year, filtered to only show cars where `listed` is true, limited to the top 5 most expensive.
* **Follow-up Prompt:**
  > *"Add the color column to this table, and rename the widget to 'Top 5 Premium Cars'."*

---

## Installation & Setup

Before using the dashboard, you need to perform the initial package installation and register the database tables:

### 1. Install Package

```bash
pnpm add @adminforth/dashboard --save
```

### 2. Create Dashboard Configs Table

The plugin needs one database resource to store dashboard definitions. For Prisma-based projects, add the table to your schema:

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

### 3. Create Resource

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

### 4. Configure Plugin

Register the plugin in the application's `globalPlugins` array:

```ts title="./globalPlugins.ts"
import DashboardPlugin from '@adminforth/dashboard';

export const globalPlugins = [
  new DashboardPlugin({
    dashboardConfigsResourceId: 'dashboard_configs',
  }),
];
```

#### Control Dashboard Access and Editing Permissions

By default, only users with the `superadmin` role can access dashboards. Use the `editRoles` option to grant dashboard access and editing to other roles, and the `viewRoles` option to grant read-only access:

```ts title="./globalPlugins.ts"
new DashboardPlugin({
  dashboardConfigsResourceId: 'dashboard_configs',
  editRoles: ['superadmin', 'admin'], // allow 'admin' users to edit dashboards too
  viewRoles: ['manager'], // allow 'manager' users to view dashboards without editing them
});
```

Users with a role from `viewRoles` see the **Dashboards** sidebar group and can open dashboards, but they do not get the **Edit** button and receive a `403` response from all dashboard mutation endpoints. Roles from `editRoles` can always view dashboards, so there is no need to repeat them in `viewRoles`.

Users whose role is listed in neither option do not see the **Dashboards** sidebar group and receive a `403` response from dashboard configuration and widget-data endpoints. The dashboard configs resource itself stays available only to `editRoles`.

Dashboard widget queries also respect the target resource's list access rules. Before loading data, the plugin checks `allowedActions.list`, runs the resource's `list.beforeDatasourceRequest` hooks, and applies any filters added by those hooks. A widget cannot query a column that is `backendOnly` or hidden from the current user with `showIn.list`.

When a query omits `select`, it implicitly requests every column. If the resource contains restricted columns, specify an explicit `select` containing only columns the dashboard users may list. These checks also apply to fields used only for filters, grouping, ordering, buckets, or sparklines.

Then pass it to the AdminForth configuration:

```ts title="./index.ts"
import { globalPlugins } from './globalPlugins.js';

export const admin = new AdminForth({
  // ...
  globalPlugins,
});
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

---

## Manual Configuration

If you need to configure dashboards without using the AI Agent, you can do so manually via the AdminForth interface:

1. **Access Dashboards**: Open the **Dashboards** group in the sidebar and choose a dashboard page.
2. **Interactive UI Editor**: Users with a role listed in the plugin's `editRoles` option (defaults to `superadmin`) see an **Edit** button in the dashboard header that turns on edit mode. In edit mode the **⋯** menu of every group and widget edits its YAML, moves it up or down, or removes it, and **Add group** and **Add widget** create new ones. **Done** turns edit mode off, and the dashboard looks the same as it does for read-only viewers.
3. **YAML Configuration Editor**: The dashboard builder has built-in code editors. When editing a widget or a group manually, you write configurations using a YAML-based DSL.

### Editing dashboard settings

Turn on edit mode with **Edit** and click **Settings** next to it to edit the dashboard itself. The YAML editor accepts these fields:

```yaml
label: Sales Overview
slug: sales-overview
icon: lucide:chart-pie
```

- `label` is the page title and sidebar label.
- `slug` defines the URL at `/dashboard/<slug>`. It must contain only lowercase letters, numbers, and hyphens, and must be unique.
- `icon` is an optional [Iconify](https://icon-sets.iconify.design/) icon name used in the sidebar. Remove the field to use the default dashboard icon.

Saving a changed slug redirects the browser to the new dashboard URL.

For the complete schema specifications of queries, formulas, custom variables, layout fields, and advanced chart configurations, see the **[Dashboard Query Reference](/docs/tutorial/Plugins/dashboard-reference)**.

### Adding new dashboard pages manually

To create a new dashboard page manually, add a new record to your dashboard configs resource (e.g. `dashboard_configs` table in the database):

```yaml title="dashboard_configs.config"
version: 1
icon: lucide:chart-pie
groups:
  - id: sales
    label: Sales
    order: 1
widgets: []
```

Use a unique `slug`, for example `sales`. The plugin will expose it as `/dashboard/sales` and add it to the **Dashboards** sidebar group.
