# Two-Factor Authentication Plugin

The Two-Factor Authentication Plugin provides an additional layer of security to the application by requiring users to provide a second form of authentication in addition to their password. This plugin supports  authenticator apps.

## Installation


Plugin is already installed into adminforth, to import:
    
```ts
import TwoFactorsAuthPlugin from '../adminforth/plugins/TwoFactorsAuthPlugin/index.ts';
``` 

Plugin required some additional setup, to make it work properly. It should be added to the resource auth resource. In our example we will add it to the user resource .

```ts title='./index.ts'

export const admin = new AdminForth({
    //... other resource configurations
    auth: {
        resourceId: 'users'
        //... other resource configurations
    },
    dataSource: 'maindb',
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
            type: String,
//diff-add
            showIn: [],
//diff-add
            backendOnly: true,
//diff-add
        }
    ],
}

//diff-add
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

Thats it! Two-Factor Authentication is now enabled 
< Please add screnshots of the 2FA setup and login page here >
 