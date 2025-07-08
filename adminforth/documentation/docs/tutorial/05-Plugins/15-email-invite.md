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
    // ... other columns
  ],
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

## Email Confirmation

To enable email confirmation, first add a boolean field to your user table:

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

