
# Standard pages tuning



## Fields Grouping
 

In some cases, you may want to organize data fields into specific groups for better structure and clarity. For example, you could create a "Main Info" group to include columns like title, description, country, and apartment_image. Another group, "Characteristics," could hold attributes such as price, square_meter, number_of_rooms, and listed. Any values without a specified group will be categorized under "Other.

```typescript title="./resources/apartments.ts"
export default {
      ...
      options: {
        ...
          //diff-add
        fieldGroups: [
          //diff-add
          {
          //diff-add
            groupName: 'Main info',
          //diff-add
            columns: ['id','title', 'description', 'country', 'apartment_image']
          //diff-add
          },
          //diff-add
          {
          //diff-add
            groupName: 'Characteristics',
          //diff-add
            columns: ['price', 'square_meter', 'number_of_rooms', "listed"]
          //diff-add
          }
          //diff-add
        ],
      }
    }
```
Here is how it looks:
![alt text](<createEditGroups.png>)

You can also specify on which page you want to create or delete groups. If you assign null, the groups will disappear from this page.

```typescript title="./resources/apartments.ts"
export default {
      ...
      options: {
        //diff-add
        createFieldGroups: [
          //diff-add
          {
          //diff-add
            groupName: 'Main info',
          //diff-add
            columns: ['id','title']
          //diff-add
          },
          //diff-add
          {
          //diff-add
            groupName: 'Characteristics',
          //diff-add
            columns: ['description', 'country', 'price', 'square_meter', 'number_of_rooms', "listed"]
          //diff-add
          }
          //diff-add
        ],
          //diff-add
        editFieldGroups: null,
          //diff-add
        showFieldGroups: null,
      }
    }
```
## List


### Default Sorting

```typescript title="./resources/apartments.ts"
import { AdminForthSortDirections } from 'adminforth';

...
export default {
  resourceId: 'aparts',
  options: {
//diff-add
    defaultSort: {
//diff-add
      columnName: 'created_at',
//diff-add
      direction: AdminForthSortDirections.asc, 
//diff-add
    }
  }
}
```

### Page size 

use `options.listPageSize` to define how many records will be shown on the page

```typescript title="./resources/apartments.ts"
export default {
      resourceId: 'aparts',
      options: {
        ...
//diff-add
        listPageSize: 10,
      }
    }
  ]
```

### Custom row click action

By default, when you click on a record in the list view, the show view will be opened. 

You can change this behavior by using `options.listTableClickUrl`.

To disable any action (don't open show) return null:

```typescript title="./resources/apartments.ts"
export default {
      resourceId: 'aparts',
      options: {
        ...
//diff-add
        listTableClickUrl: async (record, adminUser) => null,
      }
    }
  ]
```

To open a custom page, return URL to the custom page (can start with https://, or relative adminforth path):

```typescript title="./resources/apartments.ts"
      options: {
        ...
//diff-add
        listTableClickUrl: async (record, adminUser) => {
          return `https://google.com/search?q=${record.name}`;
        }
      }
```

If you wish to open the page in a new tab, add `target=_blank` get param to the returned URL:

```typescript title="./resources/apartments.ts"
      options: {
        ...
//diff-add
        listTableClickUrl: async (record, adminUser) => {
          return `https://google.com/search?q=${record.name}&target=_blank`;
        }
      }
```


### Auto-refresh records


`options.listRowsAutoRefreshSeconds` might be used to silently refresh records that are loaded (no new records will be fetched if
they appear)
  
```typescript title="./resources/apartments.ts"
export default {
        resourceId: 'aparts',
        hooks: {
//diff-add
          list: {
//diff-add
            afterDatasourceResponse: async ({ response }: { response: any }) => { 
//diff-add
              response.forEach((r: any) => {
//diff-add
                // substitute random country on any load
//diff-add
                const countries = [ 'US', 'DE', 'FR', 'GB', 'NL', 'IT', 'ES', 'DK', 'PL', 'UA', 
//diff-add
                  'CA', 'AU', 'BR', 'JP', 'CN', 'IN', 'KR', 'TR', 'MX', 'ID']
//diff-add
                r.country = countries[Math.floor(Math.random() * countries.length)];
//diff-add
              })
//diff-add
              return { ok: true, error: "" }
//diff-add
            }
//diff-add
          }
        },
        options: {
          ...
//diff-add
          listRowsAutoRefreshSeconds: 1,
        }
      }
  ]
  ```

  ![alt text](<silent refresh.gif>)




      

     


## Creating

### Fill with default values

Sometimes you want to generate some field value without asking user to fill it. For example createdAt oftenly store time of creation of the record. You can do this by using fillOnCreate:


```typescript title="./resources/apartments.ts" 

export default {
      name: 'apartments',
      fields: [
        ...
        {
          name: 'created_at',
          type: AdminForthDataTypes.DATETIME,
//diff-add
          showIn: {
//diff-add
            all: true,
//diff-add
            create: false,  // don't show field in create form
//diff-add
          }
//diff-add
          fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
        },
      ],
    },
    ...
  ],
```


Also you can assign adminUser ID by `adminUser.dbUser.id`:

```typescript title="./resources/apartments.ts"
export default {
      name: 'apartments',
      fields: [
        ...
        {
          name: 'created_by',
          type: AdminForthDataTypes.STRING,
//diff-add
          showIn: {
//diff-add
            all: true,
//diff-add
            create: false,  // don't show field in create form
//diff-add
          }
//diff-add
          fillOnCreate: ({ initialRecord, adminUser }) => adminUser.dbUser.id,
        },
      ],
    },
    ...
  ],
```

> Same effect can be achieved by using [hooks](/docs/tutorial/Customization/hooks/#example-modify-the-created-object-before-it-is-saved-to-the-database). But `fillOnCreate` might be shorter and more readable.

### Suggest default value in create form

You can suggest a default value for a field in the create form which user can instantly change even before creating record.
This might be used to give user some example value or to suggest some default value.

```typescript title="./resources/apartments.ts"
export default {
      name: 'apartments',
      fields: [
        ...
        {
          name: 'description',
//diff-add
          suggestOnCreate: 'Great apartment in the heart of the city',
        },
      ],
    },
    ...
```

A difference between `fillOnCreate` and `suggestOnCreate`:

* `fillOnCreate` is called on the backend when the record is saved to a database. Value returned by `fillOnCreate` will be saved to the database. 
* `suggestOnCreate` is just a single value that will be substituted in create form. User can change it before saving the record.
* `fillOnCreate` should be used when `showIn.create` is a `false` value because if it is `true`, the input will be shown in the create form but then(during actual save to db) it will be overwritten by the value returned by `fillOnCreate`.
* `suggestOnCreate` should be used with `showIn.create` set to true because if it is not set, the input will not be shown in the create form and default suggestion will not make sense.

### Link to create form with preset values

Sometimes you might need to create a link that will open the create form with some fields pre-filled. For example, you might want to create a link that will open the create form with the realtor_id field pre-filled with the current user's ID.

```html title="./resources/Dashboard.vue
<template>
  ...
  <LinkButton
    :to="{
      name: 'resource-create',
      params: {
        resourceId: 'aparts',
      },
      query: {
        values: encodeURIComponent(JSON.stringify({
          realtor_id: coreStore?.adminUser.dbUser.id 
        })),
      },
    }"
  >
    {{$t('Create new apartment')}}
  </LinkButton>
  ...
</template>

<script setup lang="ts">
import { LinkButton } from '@afcl';
import { useCoreStore } from '@/stores/core';

const coreStore = useCoreStore();
</script>
```


## Editing

You can set a column `editReadonly` so it will be shown in the edit form but will be disabled.  
This might be useful to better identify the record during editing or to show some additional information that should not be changed but can help to edit the record.

```typescript title="./resources/apartments.ts"
export default {
      name: 'apartments',
      fields: [
        ...
        {
          name: 'created_at',
          type: AdminForthDataTypes.DATETIME,
//diff-add
          editReadonly: true,
        },
      ],
    },
    ...
  ],
``` 

> `editReadonly` is check enforced both on fronted and backend. So it is safe to use it to make sure that data will be never changes.



### minValue and maxValue

You can add `minValue` and `maxValue` limits to columns, so it will show an error below an input when entered value is out of bounds.

```typescript title="./resources/apartments.ts"
export default {
      name: 'apartments',
      columns: [
        ...
        {
          name: 'square_meter',
          label: 'Square',
          minValue: 3,
          maxValue: 1000,
        },
      ],
    },
    ...
  ],
```

> `minValue` and `maxValue` checks are enforced both on frontend and backend.


### Validation

In cases when column values must follow certain format, you can add `validation` to it.
`validation` is an array of rules, each containing `regExp` that defines a format for a value and `message` that will be displayed in case when entered value does not pass the check.

```typescript title="./resources/adminuser.ts"
export default {
      name: 'adminuser',
      columns: [
        ...
        {
          name: 'email',
          required: true,
          isUnique: true,
          validation: [
            {
              regExp: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              message: 'Email is not valid, must be in format example@test.com',
            },
          ],
        },
      ],
    },
    ...
  ],
```

> `validation` checks are enforced both on frontend and backend.

### Input prefix and suffix

You can add prefix or suffix to inputs by adding `inputPrefix` or `inputSuffix` fields to a column.

```typescript title="./resources/users.ts"
export default {
      name: 'users',
      columns: [
        ...
        {
          name: "price",
          inputSuffix: "USD",
          allowMinMaxQuery: true,
        },
      ],
    },
    ...
  ],
```

These fields can only be used with following `AdminForthDataTypes`: `DECIMAL`, `FLOAT`, `INTEGER`, `STRING` and `JSON` (only if `JSON` column is an array with appropriate `itemType`).

### Editing note

You can add `editingNote` to a column to show a note below the input field.

```typescript title="./resources/adminuser.ts"
export default {
      name: 'adminuser',
      columns: [
        ...
        {
          name: "password",
          editingNote: { edit: "Leave empty to keep password unchanged" },
        },
      ],
    },
    ...
  ],
```

### Filling an array of values

Whenever you want to have a column to store not a single value but an array of values you have to set column as `AdminForthDataTypes.JSON`. This way when you are creating or editing a record you can type in a JSON array into a textfield. To simplify this process and allow you to create and edit separate items you can add `isArray` to a column.

```typescript title="./resources/adminuser.ts"
export default {
      name: 'adminuser',
      columns: [
        ...
        {
          name: "room_sizes",
          type: AdminForthDataTypes.JSON,
//diff-add
          isArray: {
//diff-add
            enabled: true,
//diff-add
            itemType: AdminForthDataTypes.FLOAT,
//diff-add
          },
        },
      ],
    },
    ...
  ],
```

Doing so, will result in UI displaying each item of the array as a separate input corresponding to `isArray.itemType` on create and edit pages.

`itemType` value can be any of `AdminForthDataTypes` except `JSON` and `RICHTEXT`.

By default it is forbidden to store duplicate values in an array column. To change that you can add `allowDuplicateItems: true` to `isArray`, like so:

```typescript title="./resources/adminuser.ts"
export default {
      name: 'adminuser',
      columns: [
        ...
        {
          name: "room_sizes",
          type: AdminForthDataTypes.JSON,
          isArray: {
            enabled: true,
            itemType: AdminForthDataTypes.FLOAT,
//diff-add
            allowDuplicateItems: true,
          },
        },
      ],
    },
    ...
  ],
```

All validation rules, such as `minValue`, `maxValue`, `minLength`, `maxLength` and `validation` will be applied not to array itself but instead to each item.

Note: array columns can not be marked as `masked`, be a `primaryKey` and at the time can not be linked to a foreign resource.


### Foreign resources

When you want to create a connection between two resources, you need to add `foreignResource` to a column, like so:

```typescript title="./resources/adminuser.ts"
export default {
      name: 'adminuser',
      columns: [
        ...
        {
          name: "realtor_id",
          foreignResource: {
            resourceId: 'adminuser',
          },
        },
      ],
    },
    ...
  ],
```

This way, when creating or editing a record you will be able to choose value for this field from a dropdown selector and on list and show pages this field will be displayed as a link to a foreign resource.

### Unset label

When foreign resource column is not required, selector will have an 'Unset' option that will set field to `null`. You can change label for this option using `unsetLabel`, like so:

```typescript title="./resources/apartments.ts"
export default {
      name: 'apartments',
      columns: [
        ...
        {
          name: "realtor_id",
          foreignResource: {
            resourceId: 'adminuser',
//diff-add
            unsetLabel: 'No realtor',
          },
        },
      ],
    },
    ...
  ],
```

### Polymorphic foreign resources

Sometimes it is needed for one column to be a foreign key for multiple tables. For example, given the following schema:

```prisma title="./schema.prisma"
...
model apartments {
  id                String     @id
  created_at        DateTime?
  title             String
  square_meter      Float?
  price             Decimal
  number_of_rooms   Int?
  realtor_id        String?
}

model houses {
  id                  String     @id
  created_at          DateTime?
  title               String
  house_square_meter  Float?
  land_square_meter   Float?
  price               Decimal
  realtor_id          String?
}

model sold_property {
  id                  String     @id
  created_at          DateTime?
  title               String
  property_id         String
  realtor_id          String?
}

```

Here, in `sold_property` table, column `property_id` can be a foreign key for both `apartments` and `houses` tables. If schema is set like this, the is no way to tell to what table exactly `property_id` links to. Also, if defined like usual, adminforth will link to only one of them. To make sure that `property_id` works as intended we need add one more column to `sold_property` and change the way foreign resource is defined in adminforth resource config.

```prisma title="./schema.prisma"
...

model sold_property {
  id                  String     @id
  created_at          DateTime?
  title               String
//diff-add
  property_type       String
  property_id         String
  realtor_id          String?
}

```

`property_type` column will be used to store what table id in `property_id` refers to. And in adminforth config for `sold_property` table, when describing `property_id` column, foreign resource field should be defined as follows:

```typescript title="./resources/sold_property.ts"
export default {
      name: 'sold_property',
      columns: [
        ...
        {
          name: "property_type",
          showIn: { create: false, edit: false },
        },
        {
          name: "property_id",
          foreignResource: {
            polymorphicResources: [
              {
                resourceId: 'apartments',
                whenValue: 'apartment',
              },
              {
                resourceId: 'houses',
                whenValue: 'house',
              },
            ],
            polymorphicOn: 'property_type',
          },
        },
      ],
    },
    ...
  ],
```

When defined like this, adminforth will use value in `property_type` to figure out to what table does id in `property_id` refers to and properly link them. When creating or editing a record, adminforth will figure out to what table new `property_id` links to and fill `property_type` on its own using corresponding `whenValue`. Note, that `whenValue` does not have to be the same as `resourceId`, it can be any string as long as they do not repeat withing `polymorphicResources` array. Also, since `whenValue` is a string, column designated as `polymorphicOn` must also be string. Another thing to note is that, `polymorphicOn` column (`property_type` in our case) must not be editable by user, so it must include both `create` and `edit` as `false` in `showIn` value. Even though, `polymorphicOn` column is no editable, it can be beneficial to set is as an enumerator. This will have two benefits: first, columns value displayed in table and show page can be changed to a desired one and second, when filtering on this column, user will only able to choose values provided for him.

If `beforeDatasourceRequest` or `afterDatasourceResponse` hooks are set for polymorphic foreign resource, they will be called for each resource in `polymorphicResources` array.

## Filtering

### Filter Options

You can specify the delay between filtering requests and filtering operator for a column using `filterOptions` field.

```typescript title="./resources/adminuser.ts"
export default {
      name: 'adminuser',
      columns: [
        ...
        {
          name: "title",
          required: true,
          maxLength: 255,
          minLength: 3,
//diff-add
          filterOptions: {
//diff-add
            debounceTimeMs: 500,
//diff-add
            substringSearch: false,
//diff-add
          },
        },
      ],
    },
    ...
  ],
```
`debounceTimeMs` field dictates how long (in milliseconds) to wait between inputs to send updated data request. By increasing this value, you can reduce the amount of requests set to backend. Default value for this field is set to 10ms.
`substringSearch` sets what comparison operator to use for text field. By default this field is set to `true`, which results in using case-insensitive `ILIKE` operator, that will look for records that have filter string anywhere inside field value. Setting this `substringSearch` to `false` will result in using more strict `EQ` operator, that will look for exact full-string matches.
