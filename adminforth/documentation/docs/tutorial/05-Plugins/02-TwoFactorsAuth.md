# Two-Factor Authentication Plugin

The Two-Factor Authentication Plugin provides an additional layer of security to the application by requiring users to provide a second form of authentication in addition to their password. This plugin supports  authenticator apps.

## Installation


```
npm i @adminforth/two-factors-auth --save
```

Plugin is already installed into adminforth, to import:
    
```ts
import TwoFactorsAuthPlugin from '@adminforth/two-factors-auth';
```

Plugin required some additional setup, to make it work properly. It should be added to the resource auth resource. In our example we will add it to the user resource .

```ts title='./index.ts'

export const admin = new AdminForth({
  //... other resource configurations
  auth: {
      resourceId: 'users'
      //... other resource configurations
  },
  ...
}

async function initDataBase() {
  ...
//diff-add
  // check column secret2fa in apartments table
//diff-add
  const columns = await db.prepare('PRAGMA table_info(users);').all();
//diff-add
  const columnExists = columns.some((c) => c.name === 'secret2fa');
//diff-add
  if (!columnExists) {
//diff-add
    await db.prepare('ALTER TABLE users ADD COLUMN secret2fa VARCHAR(255);').run();
//diff-add
  }
}
```

And add it to `users.ts`
```ts tittle="./resources/users.ts"
{
    table: 'users',
//diff-add
    plugins: [
//diff-add
        new TwoFactorsAuthPlugin ({ twoFaSecretFieldName: 'secret2fa' }),
//diff-add
    ],
    columns: [
        ...
//diff-add
        {
//diff-add
            name: 'secret2fa',
//diff-add
            showIn: [],
//diff-add
            backendOnly: true,
//diff-add
        }
    ],
  }
```

Thats it! Two-Factor Authentication is now enabled: 
![alt text](image-1.png)

## Disabling Two-Factor Authentication locally

If it is not convenient to enter the code every time you log in during local development, you can disable Two-Factor Authentication 
for the dev environment using `usersFilterToApply` option.

```ts title='./index.ts'

    plugins: [
        new TwoFactorsAuthPlugin ({ 
          twoFaSecretFieldName: 'secret2fa',
//diff-add
          usersFilterToApply: (adminUser: AdminUser) => {
//diff-add
            // if this method returns true, 2FA will be enforced for this user, if returns false - 2FA will be disabled
//diff-add
            if (process.env.NODE_ENV === 'development') {
//diff-add
              return false;
//diff-add
            }
//diff-add
            return true;
//diff-add
          },
        }),
    ],
```


## Select which users should use Two-Factor Authentication

By default plugin enforces Two-Factor Authentication for all users. 

If you wish to enforce 2FA only for specific users, you can again use `usersFilterToApply` option:

```ts title='./index.ts'
  usersFilterToApply: (adminUser: AdminUser) => {
    // disable 2FA for users which email is 'adminforth' or 'adminguest'
    return !(['adminforth', 'adminguest'].includes(adminUser.dbUser.email));
  },
```
 
You can even add a boolean column to the user table to store whether the user should use 2FA or not:

```ts title='./index.ts'
{
    resourceId: 'users',
    ...
    columns: [
        ...
        {
            name: 'use2fa',
        }
        ...
    ],
    options: {
      allowedActions: {
        delete: ({ adminUser }: { adminUser: AdminUser }) => {
          // only superadmin can delete users
          return adminUser.dbUser.role === 'superadmin';
        },
        create: ({ adminUser }: { adminUser: AdminUser }) => {
          // only superadmin can create users
          return adminUser.dbUser.role === 'superadmin';
        },
        edit: ({ adminUser, meta }: { adminUser: AdminUser }) => {
          // user can modify only his own record
          const { oldRecord } = meta;
          return adminUser.dbUser.id === oldRecord.id;
        },
      }
    },
    plugins: [
        new TwoFactorsAuthPlugin ({ 
          twoFaSecretFieldName: 'secret2fa',
          usersFilterToApply: (adminUser: AdminUser) => {
            return adminUser.dbUser.use2fa;
          },
        }),
    ],
}
```