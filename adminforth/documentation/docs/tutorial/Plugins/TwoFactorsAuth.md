# Two-Factor Authentication Plugin

The Two-Factor Authentication Plugin provides an additional layer of security to the application by requiring users to provide a second form of authentication in addition to their password. This plugin supports  authenticator apps.

## Installation


Plugin is already installed into adminforth, to import:
    
```ts
import TwoFactorsAuthPlugin from '../adminforth/plugins/TwoFactorsAuthPlugin/index.ts';
``` 

Plugin required some aditional setup, to make it work properly. It should be added to the resource auth resource. In our example we will add it to the user resource .

```ts title='./index.ts'
{   
    //... other resource configurations
    auth:{resourceId: 'users'
    //... other resource configurations
    }
    dataSource: 'maindb',
    table: 'users',
    plugins: [
        new TwoFactorsAuthPlugin ({ twoFaSecretFieldName: 'secret2fa' }),
    ],
}
```
Please make sure that auth resource includes the following field: 'twoFaSecretFieldName' in the table.

Thats it! Two-Factor Authentication is now enabled 
< Please add screnshots of the 2FA setup and login page here >
 