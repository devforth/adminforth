# Email Invite

Email Invite plugin allows administrators to create users without setting passwords. Instead, the plugin sends an email invitation to the newly created user, asking them to set their own password. This is more secure and user-friendly than having administrators set passwords for users.

## Installation

To install the plugin:

```bash
npm install @adminforth/email-invite --save
```

You'll also need an email adapter. For AWS SES:

```bash
npm install @adminforth/email-adapter-aws-ses --save
```

## SES

To Setup SES, you need to have an AWS account and SES service enabled. You can follow the steps below to setup SES.

1. Go to the AWS Management Console and open the Amazon SES console at [https://console.aws.amazon.com/ses/](https://console.aws.amazon.com/ses/).
2. Make sure you are in the correct region. You can change the region from the top right corner. For example, if you are in the `us-east-1` region, you can see the region name US East (N. Virginia) in the top right corner.

3. Add your email address (any email), and verify it.
4. Add some domain you own and verify it by creating DNS records which AWS suggests. This will be used as the domain for sending emails. e.g. if you want to send from no-reply@devforth.io you need to verify `devforth.io`. 

## Basic Usage

```typescript title="./resources/adminuser.ts"
import EmailInvitePlugin from '@adminforth/email-invite';
import EmailAdapterAwsSes from '@adminforth/email-adapter-aws-ses';

export default {
  dataSource: 'maindb',
  table: 'adminuser',
  resourceId: 'adminuser',
  columns: [
    { name: 'id', primaryKey: true },
    { name: 'email', required: true },
    { name: 'password_hash', showIn: [] }, // Hide from UI

    { name: 'role' },

    {
          name: 'password',
          virtual: true,
          required: { create: true },
          editingNote: { edit: 'Leave empty to keep password unchanged' },
          minLength: 8,
          type: AdminForthDataTypes.STRING,
          showIn: {
// hide password column - but don't remove whole column it because it has constrains for password field!
// diff-remove
            show: false,
// diff-remove
            list: false,
// diff-remove
            filter: false,
// diff-add
            all: false,
          },
          masked: true,
        },

    // ... other columns
  ],
  hooks: {
    create: {
      beforeSave: async ({ record, adminUser, resource }: { record: any, adminUser: AdminUser, resource: AdminForthResource }) => {
// since we don't show password input in resource - no sense to hande it in hook anymore!       
//diff-remove   
          record.password_hash = await AdminForth.Utils.generatePasswordHash(record.password);
          return { ok: true };
        }
    },
    edit: {
      beforeSave: async ({ oldRecord, updates, adminUser, resource }: { oldRecord: any, updates: any, adminUser: AdminUser, resource: AdminForthResource }) => {
        console.log('Updating user', updates);
        if (oldRecord.id === adminUser.dbUser.id && updates.role) {
          return { ok: false, error: 'You cannot change your own role' };
        }
// also no sense to have updatres - we dont allow edit password by admin anymore
//diff-remove  
        if (updates.password) {
//diff-remove  
          updates.password_hash = await AdminForth.Utils.generatePasswordHash(updates.password);
//diff-remove  
        }
        return { ok: true }
      },
    },
  },
  plugins: [
    new EmailInvitePlugin({
      emailField: 'email',
      sendFrom: 'noreply@yourapp.com',
      adapter: new EmailAdapterAwsSes({
        region: 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }),
    }),
  ],
};
```

Please note that previously (in defauklt CLI setup) we needed it to allow admins to set passwords when created new users (to invite them). Also Admens were able to edit passwords of users.
Now since we added this plugin, user will have email link on which he will get form to enter password by hiumself.
Please note that the form for user will still use constraints from password virtual field, that is why we just hid it using showIn - not remove it.

To allow users to edit their passwords please use [email password reset plugin](https://adminforth.dev/docs/tutorial/Plugins/email-password-reset/)

## Email Confirmation boolean flag

This plugin can write into the database the fact that invited user was able to set password and as a result confirmed that he owns his email.
To enable email this behaviour, first add a boolean field to your user table:

```prisma title="./schema.prisma"
model adminuser {
  id             String   @id @default(cuid())
  email          String   @unique
  password_hash  String
  role           String   @default("user")
  //diff-add
  email_confirmed Boolean? @default(false)
  // ... other fields
}
```

Run the migration:

```bash
npx prisma migrate dev --name add-email-confirmed
```

Then update your resource configuration:

```typescript title="./resources/adminuser.ts"
export default {
  // ... existing config
  columns: [
    { name: 'id', primaryKey: true },
    { name: 'email', required: true },
    { name: 'password_hash', showIn: [] },
    { name: 'role' },
    //diff-add
    { name: 'email_confirmed', type: AdminForthDataTypes.BOOLEAN },
    // ... other columns
  ],
  plugins: [
    new EmailInvitePlugin({
      emailField: 'email',
      sendFrom: 'noreply@yourapp.com',
      adapter: new EmailAdapterAwsSes(/* ... */),
      //diff-add
      emailConfirmedField: 'email_confirmed', // Enable email confirmation
    }),
  ],
};
```

