# Open Signup

Open Signup plugin allows users to register in adminforth by them-selfs without admin. 
This is useful when you want to allow anyone to sign up and assign some low-level permissions to them.

## Installation

To install the plugin:

```bash
npm install @adminforth/open-signup --save
```


## Usage

To use the plugin, instantiate to to user resource:

```typescript title="./resources/adminuser.ts"
import OpenSignupPlugin from '@adminforth/open-signup';
```

Like this:

```typescript title="./resources/adminuser.ts"
new OpenSignupPlugin({
    emailField: 'email',
    passwordField: 'password',
    passwordHashField: 'password_hash',
    defaultFieldValues: {
      role: 'user',
    },
  }),
```

Please note that in this mode users will be able to sign up without email verification. For enabling email verification, see below.

## Email verification

First, you need to migrate the `adminuser` table in `./schema.prisma`:

```ts title='./schema.prisma'
model adminuser {
  ...
  //diff-add
  email_confirmed Boolean? @default(false)
}
```

And prisma migrate:

```bash
npm run makemigration -- --name add-email-confirmed-to-adminuser ; npm run migrate:local


```

Next, install the `@adminforth/email-adapter-aws-ses` package:

```bash
npm i @adminforth/email-adapter-aws-ses --save
```

Also, update the resource configuration in `./resources/adminuser.ts`:

```ts title='./resources/adminuser.ts'
...
//diff-add
import EmailAdapterAwsSes from '@adminforth/email-adapter-aws-ses';

export default {
  dataSource: 'maindb',
  table: 'adminuser',
  resourceId: 'adminuser',
  label: 'Users',
  recordLabel: (r) => `👤 ${r.email}`,
  columns: [
    ...
    //diff-add
    { name: 'email_confirmed' }
  ],
  ...
  plugins: [
    ...
    new OpenSignupPlugin({
      emailField: "email",
      passwordField: "password",
      passwordHashField: "password_hash",
      defaultFieldValues: {
        role: "user",
      },
      //diff-add
      confirmEmails: {
        //diff-add
        emailConfirmedField: "email_confirmed",
        //diff-add
        sendFrom: "no-reply@devforth.io",
        //diff-add
        adapter: new EmailAdapterAwsSes({
          //diff-add
          region: "eu-central-1",
          //diff-add
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          //diff-add
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
          //diff-add
        }),
        //diff-add
      },
    }),
    ...
  ],
  ...
}
```