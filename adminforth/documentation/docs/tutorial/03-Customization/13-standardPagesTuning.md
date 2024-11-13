
# Standard pages tuning



## Fields Grouping
 

In some cases, you may want to organize data fields into specific groups for better structure and clarity. For example, you could create a "Main Info" group to include columns like title, description, country, and apartment_image. Another group, "Characteristics," could hold attributes such as price, square_meter, number_of_rooms, property_type, and listed. Any values without a specified group will be categorized under "Other."

```typescript title="./resources/appartments.ts"
 resources: [
    {
      ...
      options: {
        ...
          //diff-add
        createEditGroups: [
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
            columns: ['price', 'square_meter', 'number_of_rooms', "property_type", "listed"]
          //diff-add
          }
          //diff-add
        ],
      }
    }
 ]
```
Here is how it looks:
![alt text](<createEditGroups.png>)



## List


### Default Sorting

```typescript title="./resources/appartments.ts"
import { AdminForthSortDirections } from 'adminforth';

...
  resources: [
    {
      resourceId: 'aparts',
      options: {
//diff-add
        defaultSort: {
//diff-add
          columnName: 'created_at',
//diff-add
          direction: AdminForthSortDirections.ASC, 
//diff-add
        }
      }
    }
  ]
```

### Page size 

use `options.listPageSize` to define how many records will be shown on the page

```typescript title="./resources/appartments.ts"
  resources: [
    {
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

```typescript title="./resources/appartments.ts"
  resources: [
    {
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

```typescript title="./resources/appartments.ts"
      options: {
        ...
//diff-add
        listTableClickUrl: async (record, adminUser) => {
          return `https://google.com/search?q=${record.name}`;
        }
      }
```

If you wish to open the page in a new tab, add `target=_blank` get param to the returned URL:

```typescript title="./resources/appartments.ts"
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
  
```typescript title="./resources/appartments.ts"
  resources: [
      {
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


```typescript title="./resources/appartments.ts" 

new AdminForth({
  ...
  resources: [
    {
      name: 'appartments',
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


Also you can assign adminUser ID by adminUser.dbUser.id in same hook:

```typescript title="./resources/appartments.ts"
new AdminForth({
  ...
  resources: [
    {
      name: 'appartments',
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

