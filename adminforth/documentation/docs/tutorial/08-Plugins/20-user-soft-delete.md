# User soft delete

Allows to deactivate users accound without deleting it.


## Instalation

To install the plugin:

```bash
npm install @adminforth/user-soft-delete --save
```

## Setting up
First of all you need to add extra row in your users table:

``` .title="./schema.prisma"
model adminuser {
  id            String     @id
  email         String     @unique
  password_hash String
  role          String
  created_at    DateTime
  //diff-add
  is_active     Boolean
  //diff-add
  @@index([is_active])
}
```

and make migration:

```bash
npm run makemigration -- --name add-active-field-to-users ; npm run migrate:local
```

To setup the plugin in users resource add:

```ts .title="./adminuser"
import UserSoftDelete from "@adminforth/user-soft-delete";

    ...

columns[

    ...
    //diff-add
    {
        //diff-add
        name: "is_active",
        //diff-add
        type: AdminForthDataTypes.BOOLEAN,
        //diff-add
        label: "Is Active",
        //diff-add
        fillOnCreate: () => true,
        //diff-add
        filterOptions: {
            //diff-add
            multiselect: false,
            //diff-add
        },
        //diff-add
        showIn: {
            //diff-add
            list: true,
            //diff-add
            filter: true,
            //diff-add
            show: true,
            //diff-add
            create: false,
            //diff-add
            edit: true,
            //diff-add
        },
        //diff-add
    },

    ...

]

    ...

plugins: [
    
    ...
//diff-add
    new UserSoftDelete({
        //diff-add
        activeFieldName: "is_active",
        //diff-add
        //in canDeactivate we pass a function, that specify adminusers roles, which can seactivate other adminusers  
        //diff-add
        canDeactivate: async (adminUser: AdminUser) => {
            //diff-add
        if (adminUser.dbUser.role === "superadmin") {
            //diff-add
            return true;
            //diff-add
        }
        //diff-add
        return false;
        //diff-add
        }
        //diff-add
    }),

    ...
 
]
```

> ☝️Note that by default deactivated users hidden by filters, so if you want to see them, you'll have to change filters