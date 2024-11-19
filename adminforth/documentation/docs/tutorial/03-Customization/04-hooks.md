
# Hooks

Hooks are used to:

- modify the data before it is saved to the database on create or update
- execute something after data were saved or deleted
- change the query before fetching items from the database
- modify the fetched data before it is displayed in the list and show
- prevent the request to db depending on some condition (Better use [allowedActions](./05-limitingAccess.md) for this)


## Modify the data before it is saved to the database

Let's add reference to `adminUser` when user creates a new apartment:

```ts title='./resources/apartments.ts'
// diff-add
import type { AdminUser } from  'adminforth';

{
  ...
  resourceId: 'aparts',
  columns: [
    ...
    {
      name: 'realtor_id',
      ...
//diff-add
      showIn: ['list', 'show', 'edit'], // don't even show this field in create
      ...
    },
    ...
  ],
  ...
//diff-add
  hooks: {
//diff-add
    create: {
//diff-add
      beforeSave: async ({ adminUser, record }: { adminUser: AdminUser, record: any }) => {
//diff-add
        record.realtor_id = adminUser.dbUser.id;
//diff-add
        return { ok: true, record };
//diff-add
      }
//diff-add
    }
//diff-add
  }
}
```


## Limiting access to user-related data


### List of entities

For example we can prevent the user to see Apartments created by other users. Superadmin user still can see all:

```ts title='./resources/aparts.ts'
{
  ...
  hooks: {
    list: {
      beforeDatasourceRequest: async ({
        query, adminUser, resource,
      }: {
        query: any; adminUser: AdminUser; resource: AdminForthResource;
      }) => {
        if (adminUser.dbUser.role === "superadmin") {
          return { ok: true };
        }
        if (!query.filters || query.filters.length === 0) {
          query.filters = [];
        }
        // skip existing realtor_id filter if it comes from UI Filters (right panel)
        query.filters = query.filters.filter((filter: any) => filter.field !== "realtor_id");
        query.filters.push({
          field: "realtor_id",
          value: adminUser.dbUser.id,
          operator: "eq",
        });
        return { ok: true };
      },
    },
  },
}
```

This hook will prevent the user to see Apartments created by other users in list, however user if will be able to discover
the appartment id, will be able to use show page to see the appartment details. Let's limit it as well:

### Dropdown list of foreignResource

By default if there is `foreignResource` like we use for demo on `realtor_id` column, the filter will suggest a
select dropdown with list of all Realtors. This might be a leak to get id's of other users. Let's limit it:

```ts title='./resources/aparts.ts'
{
  ...
  hooks: {
    dropdownList: {
      beforeDatasourceRequest: async ({ adminUser, query }: { adminUser: AdminUser, query: any }) => {
        if (adminUser.dbUser.role !== "superadmin") {
          query.filters = [{field: "id", value: adminUser.dbUser.id, operator: "eq"}];
        };
        return {
          "ok": true,
        };
      }
    },
  },
}
```

In our case we limit the dropdown list to show only the current user, however you can use same sample to list only objects who are related to the current user in case if you will have relation configurations which require to show related objects which belongs to the current user.

### Show entity

```ts title='./resources/aparts.ts'
{
  ...
  hooks: {
    show: {
      afterDatasourceResponse: async ({
        adminUser, response,
      }: {
        adminUser: AdminUser; response: any;
      }) => {
        if (adminUser.dbUser.role === "superadmin") {
          return { ok: true, response };
        }
        if (response[0].realtor_id.pk !== adminUser.dbUser.id) {
          return { ok: false, error: "You are not allowed to see this record" };
        }
        return { ok: true, response };
      }
    }
  }
}
```

> 👆 Please note that we use `response[0].realtor_id.pk` because this fiel has `foreignResource` in column option is set
> Otherwise you would use  just `response[0].realtor_id`

Important notice: when using hook to filter out list of items for list page or list of items on dropdown makes a lot of sense (because gives ability to change filter of database request), using hook for show page is not reasonable:

First of all it sematicaly better aligns with using allowedActions interface. For this particular case you must use [allowedActions.show](./05-limitingAccess.md#disable-showing-the-resource-based-on-owner)

Secondly limiting access from this hook will not prevent executing other hooks (e.g. beforeDatasourceRequest), when allowedActions check
always performed before any hooks and any database requests. 

## All hooks

Check all hooks in the [API reference](/docs/api/types/Back/interfaces/AdminForthResource).