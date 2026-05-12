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

This example uses **two completely separate applications**:

| App | Role | Port |
|---|---|---|
| `my-api` | GraphQL backend — owns the database, exposes CRUD over HTTP | `3001` |
| `myadmin` | AdminForth admin panel — never touches the DB, calls the API | `3500` |

AdminForth never sees the database URL. All reads and writes go through the GraphQL API.

### Part 1 — The backend API (`my-api`)

The full backend source is available as a separate repository. Follow the setup instructions there to get a GraphQL API running on `http://localhost:3001` before continuing.

> **Backend example repository:** [devforth/adminforth-graphql-api-example](https://github.com/devforth/adminforth-graphql-api-example)

Once the API is running, continue with Part 2 below.

### Part 2 — The AdminForth app (`myadmin`)

If you don't have an AdminForth app yet, create one:

```bash
npx adminforth create-app --app-name myadmin --db "sqlite://.db.sqlite"
cd myadmin
```

The `--db` flag is only used to scaffold the project. In the steps below you will replace the local database with the GraphQL API, so `myadmin` ends up with no direct database connection at all.

#### Step 1: Create the connector

Create `./datasources/graphqlConnector.ts`. This is a fully generic connector — it reads each resource's API config from `options.meta` at startup, so you never need to edit this file when adding new entities:

```ts title="./datasources/graphqlConnector.ts"
import { AdminForthBaseConnector, AdminForthDataTypes, AdminForthFilterOperators } from 'adminforth';
import type {
  AdminForthResource,
  AdminForthResourceColumn,
  IAdminForthAndOrFilter,
  IAdminForthSort,
  AdminForthConfig,
} from 'adminforth';

// A list page fires getData + getCount + getMinMaxForColumns within milliseconds.
// Cache the raw fetch so all three share one network call.
const FETCH_CACHE_TTL_MS = 500;

// Minimal gql tag — provides syntax highlighting only, no transformation.
export const gql = (strings: TemplateStringsArray, ...values: any[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');

export interface GraphqlApiDef {
  /** Name of the primary key column, e.g. `'id'`. */
  primaryKey: string;
  /** Root GraphQL query field that returns an array, e.g. `'apartments'`. */
  queryName: string;
  /** Space-separated field names to select, e.g. `'id name price country created_at'`. */
  selection: string;
  mutations?: {
    create?: {
      /** Full GQL mutation document string. */
      gql: string;
      /** Extract the mutation's input variables from the AdminForth record. */
      variables: (record: any) => Record<string, any>;
      /** Root field on the result that contains `{ id }`, e.g. `'createApartment'`. */
      resultField: string;
    };
    update?: {
      gql: string;
      /** Extract variables from (recordId, changedFields). */
      variables: (id: string, newValues: any) => Record<string, any>;
    };
    delete?: {
      gql: string;
      /** Root field on the result that holds the success boolean, e.g. `'deleteApartment'`. */
      resultField: string;
    };
  };
}

/**
 * Generic AdminForth connector for any GraphQL API.
 *
 * Each resource provides its API config in `options.meta`.
 * Register this class under a custom protocol key in `databaseConnectors`.
 */
export default class GraphqlConnector extends AdminForthBaseConnector {
  private gqlEndpoint!: string;

  // Per-table record cache keyed by table name.
  private _cache: Map<string, { records: any[]; ts: number }> = new Map();

  // API configs populated from resource.options.meta during discoverFields.
  private _apiConfigs: Map<string, GraphqlApiDef> = new Map();

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  /**
   * Strip the custom protocol prefix so the URL becomes a real HTTP(S) URL:
   *   graphql+http://127.0.0.1:3500/graphql  →  http://127.0.0.1:3500/graphql
   *   graphql://api.example.com/graphql       →  https://api.example.com/graphql
   */
  async setupClient(url: string): Promise<void> {
    this.gqlEndpoint = url.includes('+http://')
      ? 'http://' + url.split('+http://')[1]
      : 'https://' + url.split('://').slice(1).join('://');
  }

  // ── Internal HTTP ─────────────────────────────────────────────────────────────

  private async gqlRequest(query: string, variables?: Record<string, any>): Promise<any> {
    const res = await fetch(this.gqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${this.gqlEndpoint}`);
    const json: any = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0]?.message ?? 'GraphQL error');
    return json.data;
  }

  // ── Schema discovery ─────────────────────────────────────────────────────────

  async getAllTables(): Promise<string[]> {
    return [];
  }

  async getAllColumnsInTable(
    tableName: string,
  ): Promise<Array<{ name: string; isPrimaryKey?: boolean }>> {
    const def = this._apiConfigs.get(tableName);
    if (!def) return [{ name: 'id', isPrimaryKey: true }];
    return def.selection.trim().split(/\s+/).map((name) => ({
      name,
      isPrimaryKey: name === def.primaryKey,
    }));
  }

  async discoverFields(
    resource: AdminForthResource,
    _config: AdminForthConfig,
  ): Promise<{ [key: string]: AdminForthResourceColumn }> {
    const apiConfig: GraphqlApiDef | undefined = (resource.options as any)?.meta;
    if (!apiConfig) {
      throw new Error(
        `GraphqlConnector: resource '${resource.resourceId}' is missing options.meta. ` +
        `Add { primaryKey, queryName, selection, mutations } to options.meta.`
      );
    }
    this._apiConfigs.set(resource.table, apiConfig);

    const result: { [key: string]: AdminForthResourceColumn } = {};
    for (const name of apiConfig.selection.trim().split(/\s+/)) {
      result[name] = { name, type: AdminForthDataTypes.STRING, primaryKey: name === apiConfig.primaryKey };
    }
    return result;
  }

  // ── Type conversion (called per-cell by the base class) ──────────────────────

  getFieldValue(field: AdminForthResourceColumn, value: any): any {
    if (field.type === AdminForthDataTypes.DATETIME && value) return new Date(value);
    return value;
  }

  setFieldValue(field: AdminForthResourceColumn, value: any): any {
    if (field.type === AdminForthDataTypes.DATETIME && value instanceof Date) return value.toISOString();
    return value;
  }

  // ── Read ─────────────────────────────────────────────────────────────────────

  private async fetchAll(tableName: string): Promise<any[]> {
    const def = this.apiDef(tableName);
    const now = Date.now();
    const cached = this._cache.get(tableName);
    if (cached && now - cached.ts < FETCH_CACHE_TTL_MS) return cached.records;

    const query = `query { ${def.queryName} { ${def.selection} } }`;
    try {
      const data = await this.gqlRequest(query);
      const records = data[def.queryName];
      this._cache.set(tableName, { records, ts: Date.now() });
      return records;
    } catch (err: any) {
      throw new Error(`GraphqlConnector[${tableName}]: fetch failed — ${err.message}`);
    }
  }

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

  async getDataWithOriginalTypes({
    resource, limit, offset, sort, filters,
  }: {
    resource: AdminForthResource;
    limit: number;
    offset: number;
    sort: IAdminForthSort[];
    filters: IAdminForthAndOrFilter;
  }): Promise<any[]> {
    let records = await this.fetchAll(resource.table);
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
    resource, filters,
  }: {
    resource: AdminForthResource;
    filters: IAdminForthAndOrFilter;
  }): Promise<number> {
    const records = await this.fetchAll(resource.table);
    return this.applyFilters(records, filters).length;
  }

  async getMinMaxForColumnsWithOriginalTypes({
    resource, columns,
  }: {
    resource: AdminForthResource;
    columns: AdminForthResourceColumn[];
  }): Promise<{ [key: string]: { min: any; max: any } }> {
    const records = await this.fetchAll(resource.table);
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

  // ── Write ────────────────────────────────────────────────────────────────────

  async createRecordOriginalValues({
    resource, record,
  }: {
    resource: AdminForthResource;
    record: any;
  }): Promise<string> {
    const mut = this.apiDef(resource.table).mutations?.create;
    if (!mut) throw new Error(`GraphqlConnector[${resource.table}]: no create mutation defined`);
    try {
      const data = await this.gqlRequest(mut.gql, mut.variables(record));
      this._cache.delete(resource.table);
      return data[mut.resultField].id;
    } catch (err: any) {
      throw new Error(`GraphqlConnector[${resource.table}]: create failed — ${err.message}`);
    }
  }

  async updateRecordOriginalValues({
    resource, recordId, newValues,
  }: {
    resource: AdminForthResource;
    recordId: string;
    newValues: any;
  }): Promise<void> {
    const mut = this.apiDef(resource.table).mutations?.update;
    if (!mut) throw new Error(`GraphqlConnector[${resource.table}]: no update mutation defined`);
    try {
      await this.gqlRequest(mut.gql, mut.variables(recordId, newValues));
      this._cache.delete(resource.table);
    } catch (err: any) {
      throw new Error(`GraphqlConnector[${resource.table}]: update failed — ${err.message}`);
    }
  }

  async deleteRecord({
    resource, recordId,
  }: {
    resource: AdminForthResource;
    recordId: string;
  }): Promise<boolean> {
    const mut = this.apiDef(resource.table).mutations?.delete;
    if (!mut) throw new Error(`GraphqlConnector[${resource.table}]: no delete mutation defined`);
    try {
      const data = await this.gqlRequest(mut.gql, { id: recordId });
      this._cache.delete(resource.table);
      return data[mut.resultField];
    } catch (err: any) {
      throw new Error(`GraphqlConnector[${resource.table}]: delete failed — ${err.message}`);
    }
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private apiDef(tableName: string): GraphqlApiDef {
    const def = this._apiConfigs.get(tableName);
    if (!def) throw new Error(
      `GraphqlConnector: no config for '${tableName}'. Ensure options.meta is set on the resource.`
    );
    return def;
  }
}
```

#### Step 2: Create the resource files

Each resource declares its GraphQL queries and mutations in `options.meta`. The connector reads this config during startup — no entity-specific code lives in the connector itself.

Create `./resources/apartments.ts`:

```ts title="./resources/apartments.ts"
import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput } from 'adminforth';  
import { gql } from '../datasources/graphqlConnector.js';

export default {
  dataSource: 'myApi',
  table: 'apartments',
  resourceId: 'apartments',
  label: 'Apartments',
  options: {
    meta: {
      primaryKey: 'id',
      queryName: 'apartments',
      selection: 'id name price country created_at',
      mutations: {
        create: {
          gql: gql`
            mutation CreateApartment($name: String!, $price: Float!, $country: String!) {
              createApartment(name: $name, price: $price, country: $country) { id }
            }
          `,
          variables: (r: any) => ({ name: r.name, price: r.price, country: r.country }),
          resultField: 'createApartment',
        },
        update: {
          gql: gql`
            mutation UpdateApartment($id: ID!, $name: String, $price: Float, $country: String) {
              updateApartment(id: $id, name: $name, price: $price, country: $country) { id }
            }
          `,
          variables: (id: string, v: any) => ({ id, name: v.name, price: v.price, country: v.country }),
        },
        delete: {
          gql: gql`
            mutation DeleteApartment($id: ID!) { deleteApartment(id: $id) }
          `,
          resultField: 'deleteApartment',
        },
      },
    },
  },
  columns: [
    {
      name: 'id',
      type: AdminForthDataTypes.STRING,
      primaryKey: true,
      showIn: { list: false, show: true, create: false, edit: false, filter: false },
    },
    { name: 'name',    type: AdminForthDataTypes.STRING,   label: 'Name',         required: { create: true, edit: true } },
    { name: 'price',   type: AdminForthDataTypes.FLOAT,    label: 'Price ($/mo)', required: { create: true, edit: true } },
    { name: 'country', type: AdminForthDataTypes.STRING,   label: 'Country',      required: { create: true, edit: true } },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      label: 'Created At',
      showIn: { list: true, show: true, filter: true, create: false, edit: false },
    },
  ],
} as AdminForthResourceInput;
```

:::tip Types are required
The connector defaults every column to `STRING`. Set `type` explicitly on columns that need numeric (`FLOAT`, `INTEGER`) or date (`DATETIME`) handling — otherwise AdminForth won't coerce values before sending them to your API.
:::

The generated `usersResource` points to the original local database. Replace it with a full resource that points to `myApi`. Create `./resources/adminuser.ts`:

```ts title="./resources/adminuser.ts"
import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminForthResource, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';
import { logger } from 'adminforth';
import { gql } from '../datasources/graphqlConnector.js';

async function allowedForSuperAdmin({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: 'myApi',
  table: 'adminuser',
  resourceId: 'adminuser',
  label: 'Admin Users',
  recordLabel: (r) => `👤 ${r.email}`,
  options: {
    allowedActions: {
      edit: allowedForSuperAdmin,
      delete: allowedForSuperAdmin,
    },
    meta: {
      primaryKey: 'id',
      queryName: 'adminUsers',
      selection: 'id email password_hash role created_at',
      mutations: {
        create: {
          gql: gql`
            mutation CreateAdminUser($id: ID!, $email: String!, $password_hash: String!, $role: String!) {
              createAdminUser(id: $id, email: $email, password_hash: $password_hash, role: $role) { id }
            }
          `,
          variables: (r: any) => ({ id: r.id, email: r.email, password_hash: r.password_hash, role: r.role }),
          resultField: 'createAdminUser',
        },
        update: {
          gql: gql`
            mutation UpdateAdminUser($id: ID!, $email: String, $password_hash: String, $role: String) {
              updateAdminUser(id: $id, email: $email, password_hash: $password_hash, role: $role) { id }
            }
          `,
          variables: (id: string, v: any) => ({ id, email: v.email, password_hash: v.password_hash, role: v.role }),
        },
        delete: {
          gql: gql`
            mutation DeleteAdminUser($id: ID!) { deleteAdminUser(id: $id) }
          `,
          resultField: 'deleteAdminUser',
        },
      },
    },
  },
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: ({ initialRecord, adminUser }) => randomUUID(),
      showIn: { edit: false, create: false },
    },
    {
      name: 'email',
      required: true,
      isUnique: true,
      type: AdminForthDataTypes.STRING,
      validation: [
        {
          regExp: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          message: 'Email is not valid, must be in format example@test.com'
        },
      ]
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: { edit: false, create: false },
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
    },
    {
      name: 'role',
      type: AdminForthDataTypes.STRING,
      enum: [
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'user', label: 'User' },
      ]
    },
    {
      name: 'password',
      virtual: true,
      required: { create: true },
      editingNote: { edit: 'Leave empty to keep password unchanged' },
      type: AdminForthDataTypes.STRING,
      showIn: { show: false, list: false, filter: false },
      masked: true,
      minLength: 8,
      validation: [AdminForth.Utils.PASSWORD_VALIDATORS.UP_LOW_NUM],
    },
    {
      name: 'password_hash',
      type: AdminForthDataTypes.STRING,
      backendOnly: true,
      showIn: { all: false }
    }
  ],
  hooks: {
    create: {
      beforeSave: async ({ record, adminUser, resource }: { record: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
        return { ok: true };
      }
    },
    edit: {
      beforeSave: async ({ oldRecord, updates, adminUser, resource }: { oldRecord: any, updates: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        if (oldRecord.id === adminUser.dbUser.id && updates.role) {
          return { ok: false, error: 'You cannot change your own role' };
        }
        if (updates.password) {
          updates.password_hash = await AdminForth.Utils.generatePasswordHash(updates.password);
        }
        return { ok: true }
      },
    },
  },
} as AdminForthResourceInput;
```

#### Step 3: Wire everything up in `index.ts`

Update `index.ts` — register the connector, replace the local datasource with `myApi`, and add the resources:

```ts title="./index.ts"
//diff-add
import GraphqlConnector from './datasources/graphqlConnector.js';
//diff-add
import apartmentsResource from './resources/apartments.js';
//diff-add
import usersResource from './resources/adminuser.js';

export const admin = new AdminForth({
  // ...existing config...

//diff-add
  databaseConnectors: {
//diff-add
    'graphql+http': GraphqlConnector,   // graphql+http:// → http://  (dev)
//diff-add
    'graphql':      GraphqlConnector,   // graphql://      → https:// (prod)
//diff-add
  },

  dataSources: [
//diff-remove
    { id: 'maindb', url: `${process.env.DATABASE_URL}` },
//diff-add
    {
//diff-add
      id: 'myApi',
//diff-add
      url: 'graphql+http://localhost:3001/graphql',
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

With this setup, every resource — including admin users — is backed by the GraphQL API. The `myadmin` app has no database connection of its own.

#### Step 4: Run both services

```bash
# Terminal 1 — backend API
cd my-api && npx tsx index.ts

# Terminal 2 — AdminForth
cd myadmin && pnpm start
```

Open [http://localhost:3500](http://localhost:3500). Both **Users** and **Apartments** are backed entirely by your GraphQL API — `myadmin` never connects to a database directly.


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

Called during schema discovery. Return a map of column name → base column definition. The `GraphqlConnector` implementation reads `resource.options.meta` to get the field list and defaults every type to `STRING`; the resource's `columns` config then overrides types, labels, and display options on top.

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
