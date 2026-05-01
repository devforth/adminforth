# Working without direct database connection

Out of the box, AdminForth connects directly to your database using one of the supported drivers (PostgreSQL, MySQL, ClickHouse, MongoDB) and executes queries against it.

In some cases, you may not want to expose a direct database connection to AdminForth. Instead, you may prefer to allow AdminForth to access and modify data through your own APIs (for example, REST, GraphQL, or JSON-RPC).

With this approach, AdminForth never connects to the database and never even knows its URL. All read and write operations go through your API layer.

Why do this?

- Your API may enforce additional constraints or validation rules.
- You can precisely log all operations using your own logging or audit systems.
- Your API may contain custom logic, such as distributed workflows or complex data-modification rules.

## How it works

AdminForth picks the connector class based on the protocol prefix of the `url` field in `dataSources`. For example, `sqlite://` uses the SQLite connector, `postgresql://` uses the PostgreSQL connector.

You can register your own connector class under any custom protocol key using the `databaseConnectors` option in the AdminForth config. Then reference it from your datasource with a matching URL prefix.

## Example: connecting to a GraphQL API

If you don't have an app yet, create one with the CLI:

```bash
npx adminforth create-app --app-name myadmin --db "sqlite://.db.sqlite"
cd myadmin
```

We will add a GraphQL API for **Apartments** data (fields: `id`, `name`, `price`, `country`, `created_at`) and write a connector that wires up full create, edit, and delete in AdminForth — without AdminForth ever touching your database directly.

### Step 1: Install dependencies

```bash
pnpm add graphql graphql-request @prisma/adapter-better-sqlite3
pnpm add -D prisma @types/better-sqlite3
```

- `graphql` + `graphql-request` — GraphQL server and client.
- `@prisma/adapter-better-sqlite3` — Prisma v7 driver adapter for SQLite.

### Step 2: Add the Apartment model to your Prisma schema

```prisma title="./schema.prisma"
model Apartment {
  id         String   @id
  name       String
  price      Float
  country    String
  created_at DateTime @default(now())
}
```


Generate and run the migration, then regenerate the Prisma client:

```bash
pnpm makemigration --name add_apartment_table && pnpm migrate:local && pnpm prisma generate
```

### Step 3: Add a GraphQL endpoint to your server

Add this to your existing `api.ts`. Prisma handles the database — AdminForth never touches it directly. `created_at` is set by the database automatically on insert, so the `createApartment` mutation does not accept it.

```ts title="./api.ts"
import { buildSchema, graphql as gqlExecute } from 'graphql';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Prisma v7 requires an explicit driver adapter.
const adapter = new PrismaBetterSqlite3({ url: process.env.PRISMA_DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const schema = buildSchema(`
  type Apartment {
    id: ID!
    name: String!
    price: Float!
    country: String!
    created_at: String!
  }
  type Query {
    apartments: [Apartment!]!
  }
  type Mutation {
    createApartment(name: String!, price: Float!, country: String!): Apartment!
    updateApartment(id: ID!, name: String, price: Float, country: String): Apartment!
    deleteApartment(id: ID!): Boolean!
  }
`);

// Prisma returns created_at as a Date — serialize to ISO string for GraphQL.
const serialize = (row: any) => ({ ...row, created_at: row.created_at.toISOString() });

const rootValue = {
  apartments: async () => {
    const rows = await prisma.apartment.findMany({ orderBy: { created_at: 'desc' } });
    return rows.map(serialize);
  },
  createApartment: async ({ name, price, country }: any) => {
    const row = await prisma.apartment.create({ data: { id: randomUUID(), name, price, country } });
    return serialize(row);
  },
  updateApartment: async ({ id, name, price, country }: any) => {
    const row = await prisma.apartment.update({
      where: { id },
      data: {
        ...(name    !== undefined && { name }),
        ...(price   !== undefined && { price }),
        ...(country !== undefined && { country }),
      },
    });
    return serialize(row);
  },
  deleteApartment: async ({ id }: any) => {
    try {
      await prisma.apartment.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};

export function initApi(app: Express, admin: IAdminForth) {
  // Must be registered BEFORE admin.express.serve(app).
  app.post('/graphql', async (req, res) => {
    const { query, variables } = req.body;
    const result = await gqlExecute({ schema, source: query, rootValue, variableValues: variables });
    res.json({ data: result.data, errors: result.errors });
  });

  // ...rest of your routes
}
```

:::warning Register the route before `admin.express.serve(app)`
`admin.express.serve(app)` catches all unmatched routes. If your `app.post('/graphql', ...)` is registered after it, Express never reaches it and returns 404.

```ts title="./index.ts"
// ✅ correct order
initApi(app, admin);          // registers /graphql first
admin.express.serve(app);     // catches everything else

// ❌ wrong order
admin.express.serve(app);     // catches /graphql before it's registered
initApi(app, admin);
```
:::

### Step 4: Create the connector

Create `./datasources/apartmentsConnector.ts`:

```ts title="./datasources/apartmentsConnector.ts"
import { AdminForthBaseConnector, AdminForthDataTypes, AdminForthFilterOperators } from 'adminforth';
import type {
  AdminForthResource,
  AdminForthResourceColumn,
  IAdminForthAndOrFilter,
  IAdminForthSort,
  AdminForthConfig,
} from 'adminforth';
import { GraphQLClient, gql } from 'graphql-request';

// A list page triggers getData + getCount + getMinMaxForColumns — all within
// milliseconds of each other. Cache the raw fetch so all three share one call.
const FETCH_CACHE_TTL_MS = 500;

export default class ApartmentsGraphqlConnector extends AdminForthBaseConnector {
  private gqlClient!: GraphQLClient;
  private _cache: { records: any[]; ts: number } | null = null;

  // Called once on startup. `url` is the datasource URL from your config,
  // including the custom protocol prefix. Strip it to get the real HTTP(S) URL.
  async setupClient(url: string): Promise<void> {
    const httpUrl = url
      .replace('apartments+http://', 'http://')   // local / dev
      .replace('apartments://', 'https://');       // production
    this.gqlClient = new GraphQLClient(httpUrl);
  }

  // Declare which columns exist in the API response and their AdminForth types.
  async discoverFields(
    _resource: AdminForthResource,
    _config: AdminForthConfig,
  ): Promise<{ [key: string]: AdminForthResourceColumn }> {
    // AdminForthResourceColumn includes fields that AdminForth fills in during
    // normalization (e.g. computed showIn shape). We only provide the input-level
    // subset here, which is all discoverFields needs. The double cast makes the
    // narrowing explicit rather than suppressing it silently with `as any`.
    return {
      id:         { name: 'id',         type: AdminForthDataTypes.STRING,   primaryKey: true },
      name:       { name: 'name',       type: AdminForthDataTypes.STRING   },
      price:      { name: 'price',      type: AdminForthDataTypes.FLOAT    },
      country:    { name: 'country',    type: AdminForthDataTypes.STRING   },
      created_at: { name: 'created_at', type: AdminForthDataTypes.DATETIME },
    } as unknown as { [key: string]: AdminForthResourceColumn };
  }

  // Convert raw API values to AdminForth types after each read.
  // DATETIME fields come back as ISO strings — convert to Date objects.
  getFieldValue(field: AdminForthResourceColumn, value: any): any {
    if (field.type === AdminForthDataTypes.DATETIME && value) {
      return new Date(value);
    }
    return value;
  }

  // Convert AdminForth values back to the format the API accepts before each write.
  setFieldValue(field: AdminForthResourceColumn, value: any): any {
    if (field.type === AdminForthDataTypes.DATETIME && value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }

  // Client-side filter helper — used because the API returns all records at once.
  // Replace with server-side filtering variables if your API supports it.
  private applyFilters(records: any[], filters: IAdminForthAndOrFilter): any[] {
    if (!filters?.subFilters?.length) return records;
    return records.filter((record) =>
      filters.subFilters.every((f: any) => {
        if (f.subFilters) return this.applyFilters([record], f).length > 0;
        const val = record[f.field];
        switch (f.operator) {
          case AdminForthFilterOperators.EQ:           return val == f.value;
          case AdminForthFilterOperators.NE:           return val != f.value;
          case AdminForthFilterOperators.GT:           return val > f.value;
          case AdminForthFilterOperators.LT:           return val < f.value;
          case AdminForthFilterOperators.GTE:          return val >= f.value;
          case AdminForthFilterOperators.LTE:          return val <= f.value;
          case AdminForthFilterOperators.LIKE:
          case AdminForthFilterOperators.ILIKE:
            return String(val ?? '').toLowerCase().includes(String(f.value).toLowerCase());
          case AdminForthFilterOperators.IN:           return f.value.includes(val);
          case AdminForthFilterOperators.NIN:          return !f.value.includes(val);
          case AdminForthFilterOperators.IS_EMPTY:     return val == null || val === '';
          case AdminForthFilterOperators.IS_NOT_EMPTY: return val != null && val !== '';
          default: return true;
        }
      })
    );
  }

  // Fetches all records from the API. Results are cached for FETCH_CACHE_TTL_MS
  // so that getDataWithOriginalTypes, getCount, and getMinMaxForColumns all share
  // a single network call per page load.
  private async fetchAll(): Promise<any[]> {
    const now = Date.now();
    if (this._cache && now - this._cache.ts < FETCH_CACHE_TTL_MS) {
      return this._cache.records;
    }
    const query = gql`
      query {
        apartments { id name price country created_at }
      }
    `;
    try {
      const data: any = await this.gqlClient.request(query);
      this._cache = { records: data.apartments, ts: Date.now() };
      return this._cache.records;
    } catch (err: any) {
      throw new Error(`ApartmentsGraphqlConnector: failed to fetch apartments — ${err.message}`);
    }
  }

  // Fetch all records and apply filter/sort/pagination in memory.
  // If your API supports server-side filtering, pass the filter tree as query variables instead.
  async getDataWithOriginalTypes({
    resource: _resource,
    limit,
    offset,
    sort,
    filters,
  }: {
    resource: AdminForthResource;
    limit: number;
    offset: number;
    sort: IAdminForthSort[];
    filters: IAdminForthAndOrFilter;
  }): Promise<any[]> {
    let records = await this.fetchAll();
    records = this.applyFilters(records, filters);

    if (sort?.length) {
      const { field, direction } = sort[0];
      records = records.sort((a, b) => {
        if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return records.slice(offset, offset + limit);
  }

  async getCount({
    resource: _resource,
    filters,
  }: {
    resource: AdminForthResource;
    filters: IAdminForthAndOrFilter;
  }): Promise<number> {
    const records = await this.fetchAll();
    return this.applyFilters(records, filters).length;
  }

  async getMinMaxForColumnsWithOriginalTypes({
    resource: _resource,
    columns,
  }: {
    resource: AdminForthResource;
    columns: AdminForthResourceColumn[];
  }): Promise<{ [key: string]: { min: any; max: any } }> {
    const records = await this.fetchAll();
    const result: any = {};
    for (const col of columns) {
      const vals = records.map((r) => r[col.name]).filter((v) => v != null);
      result[col.name] = {
        min: vals.length ? vals.reduce((a: any, b: any) => (a < b ? a : b)) : null,
        max: vals.length ? vals.reduce((a: any, b: any) => (a > b ? a : b)) : null,
      };
    }
    return result;
  }

  // POST to the API. Return the primary key of the created record.
  // created_at is omitted — the server sets it automatically.
  async createRecordOriginalValues({
    resource: _resource,
    record,
  }: {
    resource: AdminForthResource;
    record: any;
  }): Promise<string> {
    const mutation = gql`
      mutation CreateApartment($name: String!, $price: Float!, $country: String!) {
        createApartment(name: $name, price: $price, country: $country) {
          id
        }
      }
    `;
    try {
      const data: any = await this.gqlClient.request(mutation, {
        name:    record.name,
        price:   record.price,
        country: record.country,
      });
      return data.createApartment.id;
    } catch (err: any) {
      throw new Error(`ApartmentsGraphqlConnector: createApartment failed — ${err.message}`);
    }
  }

  // PATCH to the API with only the changed fields.
  async updateRecordOriginalValues({
    resource: _resource,
    recordId,
    newValues,
  }: {
    resource: AdminForthResource;
    recordId: string;
    newValues: any;
  }): Promise<void> {
    const mutation = gql`
      mutation UpdateApartment($id: ID!, $name: String, $price: Float, $country: String) {
        updateApartment(id: $id, name: $name, price: $price, country: $country) {
          id
        }
      }
    `;
    try {
      await this.gqlClient.request(mutation, {
        id:      recordId,
        name:    newValues.name,
        price:   newValues.price,
        country: newValues.country,
      });
    } catch (err: any) {
      throw new Error(`ApartmentsGraphqlConnector: updateApartment failed — ${err.message}`);
    }
  }

  // DELETE via the API. Return true on success.
  async deleteRecord({
    resource: _resource,
    recordId,
  }: {
    resource: AdminForthResource;
    recordId: string;
  }): Promise<boolean> {
    const mutation = gql`
      mutation DeleteApartment($id: ID!) {
        deleteApartment(id: $id)
      }
    `;
    try {
      const data: any = await this.gqlClient.request(mutation, { id: recordId });
      return data.deleteApartment;
    } catch (err: any) {
      throw new Error(`ApartmentsGraphqlConnector: deleteApartment failed — ${err.message}`);
    }
  }

  // These two methods are used during AdminForth schema discovery. Return values
  // must match what discoverFields returns — same table name and same column names.
  async getAllTables(): Promise<string[]> {
    return ['apartments'];
  }

  async getAllColumnsInTable(
    _tableName: string,
  ): Promise<Array<{ name: string; type?: string; isPrimaryKey?: boolean; sampleValue?: any }>> {
    return [
      { name: 'id',         isPrimaryKey: true },
      { name: 'name' },
      { name: 'price' },
      { name: 'country' },
      { name: 'created_at' },
    ];
  }
}
```

### Step 5: Register the connector and add the resource

Create `./resources/apartments.ts`:

```ts title="./resources/apartments.ts"
import type { AdminForthResource } from 'adminforth';

export default {
  dataSource: 'apartments',
  table: 'apartments',
  resourceId: 'apartments',
  label: 'Apartments',
  columns: [
    {
      name: 'id',
      primaryKey: true,
      showIn: { list: false, show: true, create: false, edit: false, filter: false },
    },
    { name: 'name',       label: 'Name',         required: { create: true, edit: true } },
    { name: 'price',      label: 'Price ($/mo)',  required: { create: true, edit: true } },
    { name: 'country',    label: 'Country',       required: { create: true, edit: true } },
    {
      name: 'created_at',
      label: 'Created At',
      // Hide on create/edit — the server sets this field automatically.
      showIn: { list: true, show: true, filter: true, create: false, edit: false },
    },
  ],
} as AdminForthResource;
```

Then wire it up in `index.ts`:

```ts title="./index.ts"
//diff-add
import ApartmentsGraphqlConnector from './datasources/apartmentsConnector.js';
//diff-add
import apartmentsResource from './resources/apartments.js';

export const admin = new AdminForth({
  // ...existing config...

//diff-add
  databaseConnectors: {
//diff-add
    'apartments+http': ApartmentsGraphqlConnector,
//diff-add
  },

  dataSources: [
    { id: 'maindb', url: `${process.env.DATABASE_URL}` },
//diff-add
    {
//diff-add
      id: 'apartments',
//diff-add
      url: 'apartments+http://localhost:3500/graphql',
//diff-add
    },
  ],

  resources: [
    usersResource,
//diff-add
    apartmentsResource,
  ],

  menu: [
    // ...existing menu...
//diff-add
    {
//diff-add
      label: 'Apartments',
//diff-add
      icon: 'flowbite:home-solid',
//diff-add
      resourceId: 'apartments',
//diff-add
    },
  ],
});
```

### Step 6: Run

```bash
pnpm start
```

Open [http://localhost:3500](http://localhost:3500). The **Apartments** section is backed entirely by your GraphQL API — AdminForth never connects to the database directly.

## Adapting to REST

The same connector pattern works for REST APIs. The key differences are:

- In `setupClient`: create an axios or fetch client with the base URL and any auth headers.
- In `getDataWithOriginalTypes`: `GET /apartments?limit=X&offset=Y`.
- In `getCount`: `GET /apartments/count` or read a `total` field from the list response.
- In `createRecordOriginalValues`: `POST /apartments`, return `response.id`.
- In `updateRecordOriginalValues`: `PATCH /apartments/:id`.
- In `deleteRecord`: `DELETE /apartments/:id`, return `true`.

Everything else (filter application, field type mapping, AdminForth integration) stays the same.

## Connector API reference

This section describes every method of `AdminForthBaseConnector` — which ones you must implement, which are provided for free, and how they relate to each other.

### Methods you must implement

These methods throw `Error('Method not implemented.')` in the base class. Your connector must override all of them.

#### `setupClient(url: string): Promise<void>`

Called once during AdminForth initialization. `url` is the value from `dataSources[].url` in your config — including the custom protocol prefix. Strip the prefix and create your API client here.

#### `discoverFields(resource, config): Promise<{ [colName: string]: AdminForthResourceColumn }>`

Called during schema discovery. Return a map of column name → column definition. Each entry needs at minimum `name` and `type` (`AdminForthDataTypes.*`). Mark the primary key column with `primaryKey: true`.

#### `getFieldValue(field, value): any`

Called after every read, once per cell. Convert raw API values to the types AdminForth expects. For example: ISO string → `Date` for `DATETIME` fields.

#### `setFieldValue(field, value): any`

Called before every write, once per cell. Convert AdminForth values back to what your API accepts. The inverse of `getFieldValue`.

#### `getDataWithOriginalTypes({ resource, limit, offset, sort, filters }): Promise<any[]>`

Main read method. Fetch records, apply pagination/sort/filters, return raw API records. Do **not** convert types here — `getFieldValue` handles that afterward.

#### `getCount({ resource, filters }): Promise<number>`

Return the total number of records matching `filters`. Used for pagination.

#### `getMinMaxForColumnsWithOriginalTypes({ resource, columns }): Promise<{ [colName: string]: { min, max } }>`

Return min/max raw values for each column. Used for range filter UI (sliders, date pickers).

#### `createRecordOriginalValues({ resource, record }): Promise<string>`

Create a record. `record` values are already converted through `setFieldValue`. Return the new record's primary key.

#### `updateRecordOriginalValues({ resource, recordId, newValues }): Promise<void>`

Update a record. `newValues` contains only changed fields, already converted through `setFieldValue`.

#### `deleteRecord({ resource, recordId }): Promise<boolean>`

Delete a record. Return `true` on success.

#### `getAllTables(): Promise<string[]>`

Return the logical table names your connector exposes. Used during schema discovery.

#### `getAllColumnsInTable(tableName): Promise<Array<{ name, type?, isPrimaryKey?, sampleValue? }>>`

Return column metadata for a table. Used during schema discovery.

---

### Methods provided by the base class

| Method | What it does |
|---|---|
| `getData(...)` | Validates filters, calls `getDataWithOriginalTypes` + `getCount` in parallel, applies `getFieldValue` per cell. |
| `createRecord(...)` | Runs `fillOnCreate` hooks, `validateAndSetFieldValue`, uniqueness checks, then calls your `createRecordOriginalValues`. |
| `updateRecord(...)` | Runs `validateAndSetFieldValue`, uniqueness checks, calls your `updateRecordOriginalValues`, publishes live-update. |
| `getRecordByPrimaryKey(...)` | Fetches one record by PK, applies `getFieldValue`. |
| `validateAndSetFieldValue(field, value)` | Type-validates the value, then calls your `setFieldValue`. |

### Data flow

```
List page
  └─ getData()                          [base]
       ├─ getDataWithOriginalTypes()    [YOU] ← raw records
       ├─ getCount()                    [YOU]
       └─ getFieldValue() per cell      [YOU] ← type conversion

Create form submit
  └─ createRecord()                     [base]
       ├─ validateAndSetFieldValue()    [base → calls YOUR setFieldValue]
       ├─ createRecordOriginalValues()  [YOU] ← mutation
       └─ getRecordByPrimaryKey()       [base] ← fetch back

Edit form submit
  └─ updateRecord()                     [base]
       ├─ validateAndSetFieldValue()    [base → calls YOUR setFieldValue]
       └─ updateRecordOriginalValues()  [YOU] ← mutation
```

### Optional: aggregation support

Override `getAggregateWithOriginalTypes` if you want dashboard charts and the `.aggregate()` Data API to work with your connector. Not required for list/show/create/edit/delete.
