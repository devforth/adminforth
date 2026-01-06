# Data API

AdminForth Data API is a minimal set of methods to manipulate the data in the database. 
With Data API you can make very basic operations like `get`, `list`, `create`, `update`, `delete`, `count` on the resources.

## Motivation

Since AdminForth has internal DataSource Connectors with unified & secure interface to work with different databases, we decided
why not to expose this interface to you. 

This allows you to make basic operations on the data with AdminForth without using 3rd party ORMs or writing manual SQL queries.

> ☝️ For advanced operations like generating aggregations, joins and other complex queries you should use your own ORM or query builder.

## Usage

Basically you just import `Filters`, `Sorts` from the `adminforth` package and call the awaitable methods on the `admin.resource('adminuser')`.

```ts
import { Filters, Sorts } from 'adminforth';
...

const admin = new AdminForth({
  ...
});

// get the resource object
await admin.resource('adminuser').get(Filters.EQ('id', '1234'));
```

Here we will show you how to use the Data API with simple examples.

## Get one item from database


Signature:

```ts
.get(
  filters: <AdminForthFilterObject>,
): Promise<any>
```

Get item by ID:

```ts
const user = await admin.resource('adminuser').get(
  [Filters.EQ('id', '1234')]
);
```

Check School with name 'Hawkins Elementary' exits in DB

```ts
const schoolExists = !!(await admin.resource('schools').get(
  [Filters.EQ('name', 'Hawkins Elementary')]
));
```


Get user with name 'John' and role not 'SuperAdmin'

```ts
const user = await admin.resource('adminuser').get(
  Filters.EQ('name', 'John'), 
  Filters.NEQ('role', 'SuperAdmin')
);
```

## Get list of items from database


Signature:

```ts
.list(
  filters: <AdminForthFilterObject>,
  limit: number | null
  offset: number | null
  sort: []
): Promise<any[]>
```

Get 15 latest users which role is not Admin:

```ts
const users = await admin.resource('adminuser').list(
  [Filters.NEQ('role', 'Admin')], 15, 0, Sorts.DESC('createdAt')
);
```

Get 10 oldest users (with highest age):

```ts
const users = await admin.resource('adminuser').list([], 10, 0, Sorts.ASC('age'));
```

Get next page of oldest users:

```ts
const users = await admin.resource('adminuser').list([], 10, 10, Sorts.ASC('age'));
```

Get 10 schools, sort by rating first, then oldest by founded year:

```ts
const schools = await admin.resource('schools').list(
  [], 10, 0, [Sorts.DESC('rating'), Sorts.ASC('foundedYear')]
);
```

Get all users that have gmail address AND the ones created not in 2024

```ts
const users = await admin.resource('adminuser').list(
  Filters.AND(
    Filters.LIKE('email', '@gmail.com'),
    Filters.OR(
      Filters.LT('createdAt', '2024-01-01T00:00:00.000Z'),
      Filters.GTE('createdAt', '2025-01-01T00:00:00.000Z'),
    ),
  )
);
```

## Using a raw SQL in queries.

Rarely you might want to add ciondition for some exotic SQL but still want to keep the rest of API.
Technically it happened that AdminForth allows you to do this also

```js
const minUgcAge = 18;
const usersWithNoUgcAccess = await admin.resource('adminuser').list(
  [
    Filters.NEQ('role', 'Admin'), 
    {
       insecureRawSQL: `(user_meta->>'age') < ${sqlstring.escape(minUgcAge)}`
    }

  ], 15, 0, Sorts.DESC('createdAt')
);

This will produce next SQL query:
```

```
SELECT *
FROM "adminuser"
WHERE "role" != 'Admin'
  AND (user_meta->>'age') < 18
ORDER BY "createdAt" DESC
LIMIT 15 OFFSET 0;

```


Finds users with age less then 18 from meta field which should be a JSONB field in Postgress.

## Create a new item in database

Signature:

```ts
.create({
  <resource fields>
}): Promise<any>
```

Returns value representing created item with all fields, including fields which were populated with `fillOnCreate`.

Create a new school:

```ts
await admin.resource('schools').create({
  name: 'Hawkins Elementary',
  rating: 5,
  foundedYear: 1950,
});
```

## Count items in database

Signature:

```ts
.count(
  filters: <AdminForthFilterObject>,
): Promise<any>
```

Returns number of items in database which match the filters.

Count number of schools with rating above 4:

```ts
const schoolsCount = await admin.resource('schools').count(Filters.GT('rating', 4));
```

Create data for daily report with number of users signed up daily for last 7 days:

Note: while this is not the most efficient way to do this, it's a good example of how you can use `count` method to get the data for the report.
Plus it still should be fast enough while you have index on `createdAt` field.

```ts
const dailyReports = await Promise.all(
  Array.from({ length: 7 }, (_, i) => {
    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() - i);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    return admin.resource('adminuser').count(
      [Filters.GTE('createdAt', dateStart.toISOString()), Filters.LT('createdAt', dateEnd.toISOString())]
    );
  })
);
```

## Update item in database

Signature:

```ts
.update(
  primaryKey: string, // value of field marked as primaryKey in resource configuration
  {
    <resource fields which you want to update>
  }
): Promise<any>
```

Update school rating to 4.8

```ts
await admin.resource('schools').update('1234', { rating: 4.8 });
```

## Delete item from database

Signature:

```ts
.delete(
  primaryKey: string, // value of field marked as primaryKey in resource configuration
): Promise<boolean>
```

Delete school with ID '1234'

```ts
await admin.resource('schools').delete('1234');
```


## Performance considerations

Remember that AdminForth never creates an indexes on the database, so it is your responsibility to create them whether you need to speed up
the queries created from this Data API or to make AdminForth UI faster.

On low data volumes you will not notice the difference in performance with or without indexes, but on high data volumes it might be very and  very crucial.

Golden rule: create one index per query you are going to use often or where you see the performance issues.

For example if you have two queries:

```ts
const users = await admin.resource('adminuser').list(
  [Filters.NEQ('role', 'Admin')], 15, 0, Sorts.DESC('createdAt')
);
const users = await admin.resource('adminuser').list(
  [Filters.EQ('name', 'John'), Filters.NEQ('role', 'SuperAdmin')]
);
```
You have to create two different indexes:

```sql
CREATE INDEX idx_users_role ON users(role, createdAt);
CREATE INDEX idx_users_name_role ON users(name, role);
```

Create INDEX is just for example, you have to use your migrator / ORM to create indexes in your database.

First one covers performance for the first query, second one for the second query. 
If you did not understand how indexes are created: **get sorted tuple of all fields in filters + all fields in sort,
in order they appear in filters and sort**.