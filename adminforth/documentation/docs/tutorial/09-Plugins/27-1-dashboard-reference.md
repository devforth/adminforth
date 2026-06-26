---
title: Dashboard Query Reference
description: "Reference for Dashboard widget queries, calculations, custom filters, and configuration DSL."
slug: /tutorial/Plugins/dashboard-reference
---

# Dashboard Query Reference

This reference guide details the YAML configuration syntax (DSL) used for widget queries, layout sizing, and calculations in the Dashboard plugin.

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

Use `query.source: steps` when chart data comes from different resources. Each step returns one row with `name`, `resource`, and the selected aggregate aliases.

```yaml
label: Sales Funnel
target: chart
size: large
height: 360
chart:
  type: funnel
  title: Sales funnel
query:
  source: steps
  steps:
    - name: Leads
      resource: leads
      select:
        - agg: count
          as: value
    - name: Qualified
      resource: leads
      select:
        - agg: count
          as: value
      filters:
        and:
          - field: status
            eq: qualified
    - name: Customers
      resource: orders
      select:
        - agg: count_distinct
          field: customer_id
          as: value
```

For the same numeric buckets across multiple resources, add `query.bucket` and render the result as a stacked bar chart. The dashboard runs every step once per bucket and returns rows with `label`, `name`, `resource`, and the aggregate aliases:

```yaml
label: Cars by Price Range and Database
target: chart
size: wide
height: 360
chart:
  type: stacked_bar
  x:
    field: label
  y:
    field: count
  series:
    field: name
query:
  source: steps
  bucket:
    field: price
    buckets:
      - label: Budget
        max: 3500
      - label: Mid-range
        min: 3500
        max: 7000
      - label: Premium
        min: 7000
  steps:
    - name: SQLite
      resource: cars_sl
      select:
        - agg: count
          as: count
    - name: MySQL
      resource: cars_mysql
      select:
        - agg: count
          as: count
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
