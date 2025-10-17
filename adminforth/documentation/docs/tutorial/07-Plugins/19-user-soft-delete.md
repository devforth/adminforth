# User soft delete

Allows to deactivate users accound without deleting it.


## Instalation

To install the plugin:

```bash
npm install @adminforth/bulk-ai-flow --save
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

new UserSoftDelete({
    activeFieldName: "is_active",
    //in canDeactivate we pass a function, that specify adminusers roles, which can seactivate other adminusers  
    canDeactivate: async (adminUser: AdminUser) => {
    if (adminUser.dbUser.role === "superadmin") {
        return true;
    }
    return false;
    }
}),

    ...

columns[

    ...

    {
        name: "is_active",
        type: AdminForthDataTypes.BOOLEAN,
        label: "Is Active",
        fillOnCreate: () => true,
        filterOptions: {
            multiselect: false,
        },
        showIn: {
        list: true,
        filter: true,
        show: true,
        create: false,
        edit: true,
    },

    ...

]
```

> ☝️Note that by default deactivated users hidden by filters, so if you want to see them, you'll have to change filters