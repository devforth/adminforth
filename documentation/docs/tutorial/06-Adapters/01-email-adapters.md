---
description: "Reference page for AdminForth email adapters, with setup instructions for AWS SES, Mailgun and SMTP integrations used by plugins that send transactional email."
---

# Email Adapters

Used to send emails.

[Email adapter base class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/EmailAdapter.ts#L17)

## AWS SES Email Adapter

```bash
pnpm add @adminforth/email-adapter-aws-ses
```

Enables email delivery via [Amazon Simple Email Service (SES)](https://aws.amazon.com/ses/), suitable for high-volume, programmatic email sending.

## Mailgun Email Adapter

```bash
pnpm add @adminforth/email-adapter-mailgun
```

Allows sending transactional or marketing emails using [Mailgun](https://www.mailgun.com/), a developer-friendly email service.

## SMTP Email Adapter

```bash
pnpm add @adminforth/email-adapter-smtp
```

Sends emails through any SMTP server: your own mail server, Google Workspace, Microsoft 365, or the SMTP endpoint of an email service. Built on [Nodemailer](https://nodemailer.com/).

```ts
import EmailAdapterSmtp from '@adminforth/email-adapter-smtp';

const adapter = new EmailAdapterSmtp({
  host: 'smtp.example.com',
  // 587 for STARTTLS, 465 for TLS from the start of the connection
  port: 587,
  // omit for servers that accept mail without authentication
  auth: {
    user: process.env.SMTP_USER as string,
    pass: process.env.SMTP_PASS as string,
  },
});
```

Pass the adapter to a plugin that sends emails, for example [Email password reset](../09-Plugins/07-email-password-reset.md).

Optional settings:

| Option | Default | Description |
|---|---|---|
| `secure` | `true` for port 465, `false` otherwise | Use TLS from the start of the connection. When `false`, the connection is upgraded with STARTTLS. |
| `requireTLS` | `true` | Refuse to send if the connection can't be encrypted. |
| `connectionTimeout` | `10000` | How long to wait for the connection to open, in milliseconds. |
| `greetingTimeout` | `10000` | How long to wait for the server's greeting once connected, in milliseconds. |
| `socketTimeout` | `60000` | How long to wait for the server to respond before sending fails, in milliseconds. |

Many cloud providers block outgoing connections on port 25, so use port 587 or 465.

For local development with a mail catcher such as [Mailpit](https://mailpit.axllent.org/), which has no TLS, turn off `requireTLS`:

```ts
const adapter = new EmailAdapterSmtp({
  host: 'localhost',
  port: 1025,
  requireTLS: false,
});
```

Don't turn it off in production: credentials and email contents would go over the network unencrypted.