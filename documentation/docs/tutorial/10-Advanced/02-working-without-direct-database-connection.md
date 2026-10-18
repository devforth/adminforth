---
description: "Guide to using AdminForth without a direct database connection: write a custom data source connector which reads and modifies data through your own GraphQL, REST, or JSON-RPC API."
---

# Working without direct database connection

Out of the box, AdminForth connects directly to your database using one of the supported drivers (PostgreSQL, MySQL, ClickHouse, MongoDB) and executes queries against it.

In some cases, you may not want to expose a direct database connection to AdminForth. Instead, you may prefer to allow AdminForth to access and modify data through your own APIs (for example, REST, GraphQL, or JSON-RPC).

With this approach, AdminForth never connects to the database and never even knows its URL. All read and write operations go through your API layer.

Why do this?

- Your API may enforce additional constraints or validation rules.
- You can precisely log all operations using your own logging or audit systems. (The built-in [Audit Log](../09-Plugins/04-AuditLog.md) tracks data modifications only and does not log read operations.)
- Your API may contain custom logic, such as distributed workflows or complex data-modification rules.

To implement this, you need to extend the data connector class and implement a small set of methods responsible for data access and mutations.

This example demonstrates how to do this using GraphQL, but the same approach can be adapted to REST or any other protocol. The code comments include detailed guidance for these cases.

Another reason to create a custom data source connector is to support a database that AdminForth does not yet support. In that case, you are welcome to submit a pull request to AdminForth to add native support for that database.

## Example: GraphQL API with two resources

We will build:

1. A minimal GraphQL API with two types, `Customer` and `Order`. It stands in for your real API.
2. `GraphQLConnector`, which lets AdminForth read and modify these types through the API.
3. Two AdminForth resources, `customers` and `orders`, which use the connector.

The example extends the app from [Getting Started](../001-gettingStarted.md). The `adminuser` resource stays in `maindb`. It can be moved to your API in the same way, because for AdminForth it is a regular resource.

### GraphQL API

Create a separate project for the API:

```bash
mkdir graphql-api && cd graphql-api
pnpm init
pnpm pkg set type=module
pnpm add graphql graphql-yoga
```

To keep the example short, the API stores data in memory. In your real API, resolvers would query the database, call other services, write audit logs, and so on.

```js title="./graphql-api/server.js"
import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';

// In-memory storage, a real API would use a database here
const db = {
  Customer: [
    { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2025-01-01T10:00:00.000Z' },
  ],
  Order: [
    { id: '2', customerId: '1', amount: 99.5, status: 'paid', createdAt: '2025-01-02T10:00:00.000Z' },
  ],
};
let nextId = 3;

const typeDefs = /* GraphQL */ `
  scalar JSON
  scalar DateTime

  type Customer {
    id: ID!
    name: String!
    email: String!
    createdAt: DateTime!
  }

  input CustomerInput {
    name: String
    email: String
  }

  type Order {
    id: ID!
    customerId: ID!
    amount: Float!
    status: String!
    createdAt: DateTime!
  }

  input OrderInput {
    customerId: ID
    amount: Float
    status: String
  }

  input SortInput {
    field: String!
    direction: String!
  }

  type Query {
    listCustomer(filter: JSON!, sort: [SortInput!]!, limit: Int!, offset: Int!): [Customer!]!
    countCustomer(filter: JSON!): Int!
    listOrder(filter: JSON!, sort: [SortInput!]!, limit: Int!, offset: Int!): [Order!]!
    countOrder(filter: JSON!): Int!
  }

  type Mutation {
    createCustomer(data: CustomerInput!): Customer!
    updateCustomer(id: ID!, data: CustomerInput!): Customer!
    deleteCustomer(id: ID!): Boolean!
    createOrder(data: OrderInput!): Order!
    updateOrder(id: ID!, data: OrderInput!): Order!
    deleteOrder(id: ID!): Boolean!
  }
`;

// Filter comes in AdminForth format:
// { operator: 'and', subFilters: [{ field: 'status', operator: 'eq', value: 'paid' }] }
const OPERATORS = {
  and: (row, f) => f.subFilters.every((sub) => matches(row, sub)),
  or: (row, f) => f.subFilters.some((sub) => matches(row, sub)),
  eq: (row, f) => row[f.field] === f.value,
  ne: (row, f) => row[f.field] !== f.value,
  gt: (row, f) => row[f.field] > f.value,
  gte: (row, f) => row[f.field] >= f.value,
  lt: (row, f) => row[f.field] < f.value,
  lte: (row, f) => row[f.field] <= f.value,
  like: (row, f) => String(row[f.field]).includes(f.value),
  ilike: (row, f) => String(row[f.field]).toLowerCase().includes(f.value.toLowerCase()),
  in: (row, f) => f.value.includes(row[f.field]),
  nin: (row, f) => !f.value.includes(row[f.field]),
  isEmpty: (row, f) => row[f.field] == null,
  isNotEmpty: (row, f) => row[f.field] != null,
};
const matches = (row, filter) => OPERATORS[filter.operator](row, filter);

const compare = (a, b, { field, direction }) =>
  (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * (direction === 'asc' ? 1 : -1);

const resolvers = { Query: {}, Mutation: {} };

for (const type of Object.keys(db)) {
  resolvers.Query[`list${type}`] = (_, { filter, sort, limit, offset }) => db[type]
    .filter((row) => matches(row, filter))
    .sort((a, b) => sort.reduce((result, rule) => result || compare(a, b, rule), 0))
    .slice(offset, offset + limit);

  resolvers.Query[`count${type}`] = (_, { filter }) => db[type].filter((row) => matches(row, filter)).length;

  resolvers.Mutation[`create${type}`] = (_, { data }) => {
    // API owns id and createdAt generation
    const row = { ...data, id: String(nextId++), createdAt: new Date().toISOString() };
    db[type].push(row);
    return row;
  };

  resolvers.Mutation[`update${type}`] = (_, { id, data }) =>
    Object.assign(db[type].find((row) => row.id === id), data);

  resolvers.Mutation[`delete${type}`] = (_, { id }) => {
    const sizeBefore = db[type].length;
    db[type] = db[type].filter((row) => row.id !== id);
    return db[type].length < sizeBefore;
  };
}

const yoga = createYoga({ schema: createSchema({ typeDefs, resolvers }) });

createServer(yoga).listen(4000, () => {
  console.log('GraphQL API is running on http://localhost:4000/graphql');
});
```

Every type follows the same convention, and the connector relies on it. For the `Customer` type:

| Operation | Purpose |
|---|---|
| `listCustomer(filter, sort, limit, offset)` | Returns one page of records |
| `countCustomer(filter)` | Returns the number of records, used for pagination |
| `createCustomer(data: CustomerInput)` | Creates a record. The API generates `id` and `createdAt` |
| `updateCustomer(id, data: CustomerInput)` | Updates only the fields passed in `data` |
| `deleteCustomer(id)` | Deletes a record |

`filter` is the AdminForth filter tree passed as JSON, so the API evaluates it directly. If your API already has its own filter format, keep it and convert filters in the connector.

Start the API:

```bash
node server.js
```

You can explore the schema and run queries in GraphiQL at http://localhost:4000/graphql.

### Connector

Go back to the AdminForth app and create the connector. It extends `AdminForthBaseConnector`, which already handles everything around the data access: filter validation and normalization, `fillOnCreate`, unique checks, reading the created record back, and so on. The connector only moves data between AdminForth and the API.

Each method has a short comment and an example of what it returns.

```ts title="./graphqlConnector.ts"
import {
  AdminForthBaseConnector,
  AdminForthDataTypes,
  AdminForthFilterOperators,
  AdminForthSortDirections,
} from 'adminforth';
import type {
  AdminForthResource,
  AdminForthResourceColumn,
  IAdminForthAndOrFilter,
  IAdminForthDataSourceConnector,
  IAdminForthSort,
} from 'adminforth';

// GraphQL scalar -> AdminForth column type
const GRAPHQL_TYPES: Record<string, AdminForthDataTypes> = {
  ID: AdminForthDataTypes.STRING,
  String: AdminForthDataTypes.STRING,
  Int: AdminForthDataTypes.INTEGER,
  Float: AdminForthDataTypes.FLOAT,
  Boolean: AdminForthDataTypes.BOOLEAN,
  DateTime: AdminForthDataTypes.DATETIME,
  JSON: AdminForthDataTypes.JSON,
};

/**
 * Connector relies on simple naming convention of GraphQL API, where `resource.table` is GraphQL type name (e.g. `Customer`):
 *  - queries `listCustomer(filter, sort, limit, offset)` and `countCustomer(filter)`
 *  - mutations `createCustomer(data)`, `updateCustomer(id, data)`, `deleteCustomer(id)`
 *  - input type `CustomerInput` for create and update
 *  - every type has `id: ID!` field which is primary key
 */
export default class GraphQLConnector extends AdminForthBaseConnector implements IAdminForthDataSourceConnector {

  endpoint!: string;

  /**
   * Called once on startup with `url` of data source. Nothing to connect to, so we only remember API endpoint:
   * `graphql://localhost:4000/graphql` -> `http://localhost:4000/graphql`
   * REST: remember base URL (and API token if needed) the same way.
   * Returns: nothing
   */
  async setupClient(url: string): Promise<void> {
    this.endpoint = url.replace('graphql://', 'http://');
  }

  /**
   * Helper which is not a part of connector contract: sends GraphQL request and returns its `data`.
   * REST: replace it with fetch() calls to your endpoints.
   * Returns: { "rows": [{ "id": "1" }] }
   */
  async request(query: string, variables: Record<string, unknown>): Promise<any> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const { data, errors } = await response.json();
    if (errors) {
      throw new Error(`GraphQL API error: ${errors.map((e: { message: string }) => e.message).join(', ')}`);
    }
    return data;
  }

  /**
   * Called once per resource on startup to get columns of `resource.table` and their types.
   * GraphQL API describes itself, so we just read fields of type via introspection.
   * REST: return hardcoded object or build it from OpenAPI spec of your API.
   * Returns: { "id": { "type": "string", "primaryKey": true }, "name": { "type": "string", "primaryKey": false } }
   */
  async discoverFields(resource: AdminForthResource): Promise<{ [key: string]: AdminForthResourceColumn }> {
    const { __type } = await this.request(
      `query ($name: String!) { __type(name: $name) { fields { name type { name ofType { name } } } } }`,
      { name: resource.table },
    );
    return Object.fromEntries(__type.fields.map((field: any) => [field.name, {
      // non-null field `String!` comes as { name: null, ofType: { name: 'String' } }
      type: GRAPHQL_TYPES[field.type.name ?? field.type.ofType.name],
      primaryKey: field.name === 'id',
    }]));
  }

  /**
   * Converts value received from API to AdminForth format, e.g. datetime should be ISO string.
   * GraphQL API already returns values in suitable format, so nothing to convert.
   * REST: e.g. convert unix timestamp to ISO string here.
   * Returns: "2025-01-01T10:00:00.000Z"
   */
  getFieldValue(field: AdminForthResourceColumn, value: any): any {
    return value;
  }

  /**
   * Opposite to getFieldValue: converts AdminForth value to API format. Applied to record values and filter values.
   * Returns: "2025-01-01T10:00:00.000Z"
   */
  setFieldValue(field: AdminForthResourceColumn, value: any): any {
    return value;
  }

  /**
   * Returns one page of records. Used by list and show pages, foreign resource dropdowns, Data API etc.
   * `filters` come as AdminForth filter tree, which our API accepts as is:
   *   { "operator": "and", "subFilters": [{ "field": "status", "operator": "eq", "value": "paid" }] }
   * If your API uses other filter format (e.g. `where: { status: { _eq: "paid" } }`), convert filters here.
   * REST: GET /customers?filter=<json>&sort=<json>&limit=10&offset=0
   * Returns: [{ "id": "1", "name": "John Doe", "email": "john@example.com", "createdAt": "2025-01-01T10:00:00.000Z" }]
   */
  async getDataWithOriginalTypes({ resource, limit, offset, sort, filters, columns }: {
    resource: AdminForthResource,
    limit: number,
    offset: number,
    sort: IAdminForthSort[],
    filters: IAdminForthAndOrFilter,
    columns?: AdminForthResourceColumn[],
  }): Promise<any[]> {
    const fields = (columns ?? resource.dataSourceColumns).map((column) => column.name).join(' ');
    const { rows } = await this.request(
      `query ($filter: JSON!, $sort: [SortInput!]!, $limit: Int!, $offset: Int!) {
        rows: list${resource.table}(filter: $filter, sort: $sort, limit: $limit, offset: $offset) { ${fields} }
      }`,
      { filter: filters, sort, limit, offset },
    );
    return rows;
  }

  /**
   * Returns number of records which match filters. Used for pagination.
   * REST: GET /customers/count?filter=<json>
   * Returns: 42
   */
  async getCount({ resource, filters }: { resource: AdminForthResource, filters: IAdminForthAndOrFilter }): Promise<number> {
    const { count } = await this.request(
      `query ($filter: JSON!) { count: count${resource.table}(filter: $filter) }`,
      { filter: filters },
    );
    return count;
  }

  /**
   * Returns min and max values for columns with `allowMinMaxQuery: true` (used by range filters).
   * Called on every list page open, `columns` is empty array if no column has this option.
   * Instead of separate API method we take first record sorted in both directions.
   * Returns: { "amount": { "min": 5, "max": 990 } }
   */
  async getMinMaxForColumnsWithOriginalTypes({ resource, columns }: {
    resource: AdminForthResource,
    columns: AdminForthResourceColumn[],
  }): Promise<{ [key: string]: { min: any, max: any } }> {
    const firstValue = async (column: AdminForthResourceColumn, direction: AdminForthSortDirections) => {
      const [row] = await this.getDataWithOriginalTypes({
        resource,
        limit: 1,
        offset: 0,
        sort: [{ field: column.name, direction }],
        filters: { operator: AdminForthFilterOperators.AND, subFilters: [] },
        columns: [column],
      });
      // row is undefined when there are no records
      return row?.[column.name];
    };
    return Object.fromEntries(await Promise.all(columns.map(async (column) => [column.name, {
      min: await firstValue(column, AdminForthSortDirections.asc),
      max: await firstValue(column, AdminForthSortDirections.desc),
    }])));
  }

  /**
   * Creates record and returns its primary key. AdminForth then loads created record by this key.
   * `record` contains only values filled on create page (or by fillOnCreate): { "name": "Jane", "email": "jane@example.com" }
   * REST: POST /customers
   * Returns: "3"
   */
  async createRecordOriginalValues({ resource, record }: { resource: AdminForthResource, record: any }): Promise<string> {
    const { created } = await this.request(
      `mutation ($data: ${resource.table}Input!) { created: create${resource.table}(data: $data) { id } }`,
      { data: record },
    );
    return created.id;
  }

  /**
   * Updates record. `newValues` contains only changed fields: { "status": "shipped" }
   * REST: PATCH /customers/:id
   * Returns: nothing
   */
  async updateRecordOriginalValues({ resource, recordId, newValues }: {
    resource: AdminForthResource,
    recordId: string,
    newValues: any,
  }): Promise<void> {
    await this.request(
      `mutation ($id: ID!, $data: ${resource.table}Input!) { update${resource.table}(id: $id, data: $data) { id } }`,
      { id: recordId, data: newValues },
    );
  }

  /**
   * Deletes record, returns true if record was deleted.
   * REST: DELETE /customers/:id
   * Returns: true
   */
  async deleteRecord({ resource, recordId }: { resource: AdminForthResource, recordId: any }): Promise<boolean> {
    const { deleted } = await this.request(
      `mutation ($id: ID!) { deleted: delete${resource.table}(id: $id) }`,
      { id: recordId },
    );
    return deleted;
  }
}
```

### Registering the connector

Register the connector in `databaseConnectors` and add a data source for the API. AdminForth uses the part of the data source `url` before `:` (here `graphql`) to pick the connector class, and passes the whole `url` to `setupClient`:

```ts title="./index.ts"
import usersResource from "./resources/adminuser.js";
//diff-add
import customersResource from './resources/customers.js';
//diff-add
import ordersResource from './resources/orders.js';
//diff-add
import GraphQLConnector from './graphqlConnector.js';

...

export const admin = new AdminForth({
  ...
//diff-add
  databaseConnectors: {
//diff-add
    graphql: GraphQLConnector,
//diff-add
  },
  dataSources: [
    {
      id: 'maindb',
      url: `${process.env.DATABASE_URL}`
    },
//diff-add
    {
//diff-add
      id: 'api',
//diff-add
      url: 'graphql://localhost:4000/graphql',
//diff-add
    },
  ],
  resources: [
    usersResource,
//diff-add
    customersResource,
//diff-add
    ordersResource,
  ],
  menu: [
//diff-add
    { label: 'Customers', icon: 'flowbite:users-solid', resourceId: 'customers' },
//diff-add
    { label: 'Orders', icon: 'flowbite:cart-solid', resourceId: 'orders' },
    { type: 'heading', label: 'SYSTEM' },
    ...
  ],
});
```

Now add the resources. `table` is the GraphQL type name. Column types and the primary key come from `discoverFields`, so column settings only tune the UI:

```ts title="./resources/customers.ts"
import type { AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'api',
  table: 'Customer', // GraphQL type name
  resourceId: 'customers',
  label: 'Customers',
  recordLabel: (r) => r.name,
  columns: [
    // types and primary key are discovered by connector, so we only tune what is displayed
    { name: 'id', showIn: { create: false, edit: false } },
    { name: 'name', required: true },
    { name: 'email', required: true },
    { name: 'createdAt', showIn: { create: false, edit: false } },
  ],
} as AdminForthResourceInput;
```

```ts title="./resources/orders.ts"
import type { AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'api',
  table: 'Order',
  resourceId: 'orders',
  label: 'Orders',
  columns: [
    { name: 'id', showIn: { create: false, edit: false } },
    { name: 'customerId', required: true, foreignResource: { resourceId: 'customers' } },
    { name: 'amount', required: true, allowMinMaxQuery: true },
    {
      name: 'status',
      required: true,
      enum: [
        { value: 'new', label: 'New' },
        { value: 'paid', label: 'Paid' },
        { value: 'shipped', label: 'Shipped' },
      ],
    },
    { name: 'createdAt', showIn: { create: false, edit: false } },
  ],
} as AdminForthResourceInput;
```

Start the admin app with `pnpm start` while the API is running. The Customers and Orders pages now read and modify data through the GraphQL API, including filters, sorting, pagination, and the customer dropdown on the order create page.

## Optional connector features

The connector above covers the list, show, create, edit, and delete pages, filters, and foreign resources. Some features need more:

- `getAggregateWithOriginalTypes` is needed for [aggregations](../03-Customization/11-dataApi.md#get-aggregated-data-from-database).
- `supportsCompositePrimaryKey = true` and the `pkValues` argument of `updateRecordOriginalValues` and `deleteRecord` are needed for resources with [composite primary keys](../03-Customization/17-compositePrimaryKeys.md).
- `getAllTables` and `getAllColumnsInTable` are used only by the [`resource`](../07-CLICommands.md#resource) CLI command, which generates resource files from existing tables.
