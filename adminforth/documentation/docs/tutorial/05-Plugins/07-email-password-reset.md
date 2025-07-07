
# Email password reset

Plugin allows to reset password for admin users who forgot their password by sending email with reset link signed with secured JWT token.

> ⚠️ if users created manually in backoffice, ensuring that email is valid is responsibility of the admin which might be a security risk
> (if email is mistyped then, person who owns mistyped email can reset password and get access)

> ⚠️ If user with email does not exist, plugin will still show to user success message to prevent email enumeration.

Installation:

```bash
npm install @adminforth/email-password-reset --save
npm install @adminforth/email-adapter-aws-ses --save
```

Import plugin:

```typescript
import EmailResetPasswordPlugin from '@adminforth/email-password-reset';
```


## SES

To Setup SES, you need to have an AWS account and SES service enabled. You can follow the steps below to setup SES.

1. Go to the AWS Management Console and open the Amazon SES console at [https://console.aws.amazon.com/ses/](https://console.aws.amazon.com/ses/).
2. Make sure you are in the correct region. You can change the region from the top right corner. For example, if you are in the `us-east-1` region, you can see the region name US East (N. Virginia) in the top right corner.

3. Add your email address (any email), and verify it.
4. Add some domain you own and verify it by creating DNS records which AWS suggests. This will be used as the domain for sending emails. e.g. if you want to send from no-reply@devforth.io you need to verify `devforth.io`. 

Add plugin to user resource:

```typescript ./resources/adminuser.ts
import EmailResetPasswordPlugin from '@adminforth/email-password-reset';
import EmailAdapterAwsSes from '@adminforth/email-adapter-aws-ses';
...
plugins: [
  ...
  new EmailResetPasswordPlugin({
    // field in user resource which contains email
    emailField: 'email',

    // field in user resource which contains password constrains. Should be virtual field
    passwordField: 'password',

    // domain part should be verified in SES
    sendFrom: 'no-reply@devforth.io',

    adapter: new EmailAdapterAwsSes({
        // region where SES is setup
        region: "eu-central-1",
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      }),

  }),
]
```

Make sure to place your AWS credentials in `.env` file/environment.

```bash /.env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```


## Mailgun

To Setup Mailgun, you need to have an account and Mailgun service enabled. You can follow the steps below to setup Mailgun.

1. Go to [https://www.mailgun.com/](https://www.mailgun.com/) and create an account.
2. Add your email address (any email), and verify it.
3. Add your domain (any domain) and verify it.
4. Add your API key.

Add plugin to user resource:

```typescript ./resources/adminuser.ts
import EmailResetPasswordPlugin from '@adminforth/email-password-reset';
import EmailAdapterMailgun from '@adminforth/email-adapter-mailgun';
...
plugins: [
  ...
  new EmailResetPasswordPlugin({
    // field in user resource which contains email
    emailField: 'email',

    // field in user resource which contains password constrains. Should be virtual field
    passwordField: 'password',

    // domain part should be verified in Mailgun
    sendFrom: 'no-reply@devforth.io',

    adapter: new EmailAdapterMailgun({
        apiKey: process.env.MAILGUN_API_KEY as string,
        domain: process.env.MAILGUN_DOMAIN as string,
        //baseUrl is optional, if not provided, will default to "https://api.mailgun.net" but if you are using Mailgun EU, you should use "https://api.eu.mailgun.net" instead
        baseUrl: process.env.MAILGUN_REGION_URL as string,
      }),

  }),
]
```

Make sure to place your Mailgun credentials in `.env` file/environment.

```bash /.env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain
MAILGUN_REGION_URL=your-region-url # optional
```