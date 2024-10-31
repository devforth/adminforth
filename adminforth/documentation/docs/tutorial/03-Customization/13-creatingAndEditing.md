
# Creating and Editing records

## Fill with default values

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