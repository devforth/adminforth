
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
          fillOnCreate: ({ initialRecord, adminUser }) => adminUser.dbUser.id,
        },
      ],
    },
    ...
  ],
```

> Same effect can be achieved by using [hooks](/docs/tutorial/Customization/hooks/#modify-the-data-before-it-is-saved-to-the-database). But `fillOnCreate` might be shorter and more readable.


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

[Documentation in progress]

### Foreign resources

[Documentation in progress]
