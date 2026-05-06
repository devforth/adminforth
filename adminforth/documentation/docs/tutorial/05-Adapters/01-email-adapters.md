---
description: "Reference page for AdminForth email adapters, with setup instructions for AWS SES and Mailgun integrations used by plugins that send transactional email."
---

# Email Adapters

Used to send emails.

[Email adapter base class](https://github.com/devforth/adminforth/blob/917d897c866975a4aee29273377f2c07cb6ddf81/adminforth/types/adapters/EmailAdapter.ts#L17)

## AWS SES Email Adapter

```bash
pnpm i @adminforth/email-adapter-aws-ses
```

Enables email delivery via [Amazon Simple Email Service (SES)](https://aws.amazon.com/ses/), suitable for high-volume, programmatic email sending.

## Mailgun Email Adapter

```bash
pnpm i @adminforth/email-adapter-mailgun
```

Allows sending transactional or marketing emails using [Mailgun](https://www.mailgun.com/), a developer-friendly email service.