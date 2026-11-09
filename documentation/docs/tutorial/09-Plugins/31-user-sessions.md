---
title: User Sessions
description: "Guide to the User Sessions plugin: show admin users their active sessions, revoke sessions from other devices, and invalidate auth tokens on logout."
slug: /tutorial/Plugins/user-sessions
---

# User Sessions

By default an AdminForth auth token stays valid until it expires: logging out only removes the cookie
from the browser, and there is no way to tell which devices are signed in.

This plugin stores every issued session in a key-value adapter, shows them to the admin user on a
settings page, and lets them revoke any session. Logout revokes the session too, so its token stops
working right away. Requests made with API keys, e.g. of the MCP plugin, are not sessions: they are not
listed and can't be revoked here.

![Active sessions page](/img/previews/user_sessions.png)

## Installation

```bash
pnpm add @adminforth/user-sessions @adminforth/key-value-adapter-redis
```

The plugin needs AdminForth 4.24.0 or later.

The plugin is global, so add it to `globalPlugins`:

```ts title="./index.ts"
import UserSessionsPlugin from '@adminforth/user-sessions';
import RedisKeyValueAdapter from '@adminforth/key-value-adapter-redis';

export const admin = new AdminForth({
  ...
  globalPlugins: [
    new UserSessionsPlugin({
      keyValueAdapter: new RedisKeyValueAdapter({
        redisUrl: process.env.REDIS_URL,
      }),
    }),
  ],
  ...
});
```

That is all: an "Active sessions" page appears in the user menu settings, where every session is
listed with its device, IP, country, sign-in time and last usage, and can be revoked one by one or
all at once.

## Letting a superadmin manage sessions of other users

Pass `canManageOtherUsersSessions` to decide which users are allowed to do it:

```ts title="./index.ts"
new UserSessionsPlugin({
  keyValueAdapter,
  canManageOtherUsersSessions: async (adminUser) => adminUser.dbUser.role === 'superadmin',
})
```

For those users an "Active sessions" block appears on the show page of every user in the users
resource, listing that user's sessions and allowing to revoke them one by one or all at once.
The callback is called on every such request, so removing a role takes effect immediately.

When the option is not set, the block is not added to the show page at all, and the endpoints
refuse to touch sessions of anybody but the caller.

## Revoking sessions of all users

To sign out everybody at once, e.g. after a security incident, call `revokeAllSessions` of the plugin
from your code:

```ts
import UserSessionsPlugin from '@adminforth/user-sessions';

const revoked = await admin.getPluginByClassName<UserSessionsPlugin>('UserSessionsPlugin').revokeAllSessions();
```

Every user is signed out on their next request, the one who called it included. The method returns the
number of revoked sessions. Known devices are kept, so the next sign-ins are not reported to
[`onNewLogin`](#notifying-about-sign-ins-from-new-devices) as new. Requests without a session, like API key
ones, are not affected.

## Hiding IP addresses

By default everybody who sees a session sees its IP. When many people share one account, e.g. on a public
demo, they would see IPs of each other. Pass `canSeeIps` to show IPs only to some users:

```ts title="./index.ts"
new UserSessionsPlugin({
  keyValueAdapter,
  canSeeIps: async (adminUser) => adminUser.dbUser.role === 'superadmin',
})
```

For other users the IP column shows a masked value, own sessions included. Hidden IPs are not sent to the
browser at all, so they can't be read from the network tab either.

The callback covers the "Active sessions" page and the block on the show page of a user. IPs in the
[login history](#login-history) are columns of your own resource, restrict them there, e.g. with
`allowedActions`. The [revoke page](#revoke-page) shows the IP to whoever has the link from `onNewLogin`.

## Client IP and country

IP is taken from [`adminforth.auth.getClientIp`](/docs/tutorial/Customization/security#trusting-client-ip-addresses),
so configure `auth.clientIpHeader` when AdminForth runs behind a proxy or CDN. Private addresses are
reported as unknown.

Country is read from the `CF-IPCountry` header which Cloudflare sets. For another CDN, pass its header:

```ts
new UserSessionsPlugin({
  keyValueAdapter,
  countryHeader: 'X-Vercel-IP-Country',
})
```

If you have no such header, resolve the country yourself, e.g. from a local GeoIP database:

```ts
new UserSessionsPlugin({
  keyValueAdapter,
  countryHeader: '',
  resolveCountry: async ({ ip }) => (ip ? await geoIpLookup(ip) : null),
})
```

`resolveCountry` is called only when the header did not give a country.

## Notifying about sign-ins from new devices

Pass `onNewLogin` to be told when a user signs in from a device or a country they have not signed in
from before, e.g. to post it to Slack or send an email to the user:

```ts title="./index.ts"
new UserSessionsPlugin({
  keyValueAdapter,
  onNewLogin: async ({ username, session, reasons }) => {
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: [
          `New sign-in to *${username}* (${reasons.join(', ')})`,
          `Device: ${session.device?.browser} on ${session.device?.os}`,
          `IP: ${session.ip}, country: ${session.country}`,
        ].join('\n'),
      }),
    });
  },
})
```

Don't post `revokePath` to a channel others can read: whoever has the link can sign that device out.
Send it to the user only, e.g. [by email](#sending-an-email-with-aws-ses).

How a sign-in is recognized as new:

- On every sign-in the browser gets a random device id in a long-lived cookie, and the plugin remembers
  the devices of every user in the adapter, under `<collection>-devices`.
- `new_device`: the browser has no device cookie, its id is unknown for the user, or the cookie came with
  another browser or OS than before, which means it was copied. Browser updates are not reported.
- `new_country`: no known device of the user was used from this country. Skipped when the country
  is unknown, see [Client IP and country](#client-ip-and-country).
- The IP address alone is not a reason: it changes with every mobile network or VPN. It is passed in
  `session`, so you can compare it yourself.
- The first sign-in of a user is reported too: its device and country are new. So after installing the
  plugin into a running app, every user is reported once on their next sign-in.
- A device is forgotten 2 years after its last sign-in. Chromium-based browsers keep a cookie 400 days at
  most, there a device is forgotten after 400 days without sign-ins.

The callback is not awaited, so a slow request doesn't delay the sign-in, and its errors are only logged.

### Revoke page

`revokePath` leads to a page which works without signing in. It shows the time, device, IP and country
of the sign-in and a button which signs that device out: it ends the reported session and every other
session of the same browser, including later sign-ins from it which were not reported as the device was
known by then. It also forgets the device, so the next sign-in from it is reported again.
The link works once and as long as the session would.

`revokePath` starts with `baseUrl` of your app, prepend the origin of your admin panel to make a link
of it. The plugin doesn't take the origin from the request: the sign-in request is sent by whoever signs
in, so its `Host` header could point the link to their own site.

### Sending an email with AWS SES

To email the user about the sign-in, send it with an [email adapter](/docs/tutorial/Adapters/email-adapters),
e.g. the AWS SES one:

```bash
pnpm add @adminforth/email-adapter-aws-ses
```

```ts title="./index.ts"
import AdminForth, { Filters } from 'adminforth';
import UserSessionsPlugin from '@adminforth/user-sessions';
import EmailAdapterAwsSes from '@adminforth/email-adapter-aws-ses';

const emailAdapter = new EmailAdapterAwsSes({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

export const admin = new AdminForth({
  ...
  globalPlugins: [
    new UserSessionsPlugin({
      keyValueAdapter,
      onNewLogin: async ({ pk, session, revokePath }) => {
        const user = await admin.resource('adminuser').get([Filters.EQ('id', pk)]);
        const { browser, os } = session.device ?? {};

        const text = [
          'Someone signed in to your account.',
          '',
          `When: ${new Date(session.created_at).toUTCString()}`,
          `Device: ${[browser, os].filter(Boolean).join(' on ') || 'unknown'}`,
          `IP: ${session.ip ?? 'unknown'}`,
          `Country: ${session.country ?? 'unknown'}`,
          '',
          'If this was you, you can ignore this email. Otherwise, end the session here:',
          `${process.env.ADMIN_URL}${revokePath}`,
        ].join('\n');

        const { error } = await emailAdapter.sendEmail(
          'noreply@yourapp.com', user.email, text, undefined, 'New sign-in to your account',
        );
        if (error) {
          throw new Error(error);
        }
      },
    }),
  ],
  ...
});
```

The sender address or its domain must be verified in SES, see the SES setup steps in the
[Email Invite](/docs/tutorial/Plugins/email-invite#ses) plugin docs. The example sends plain text: if you
add HTML, escape the values of `session`, the IP may come from a request header. An error thrown from the
callback is logged by the plugin and doesn't affect the sign-in.

## Detecting copied sessions

Malware on the user's computer can copy the cookies of the browser, and the copied session then works on
another machine without the password and 2FA. Pass `onSessionCopied` to be told when a session is used in two
browsers.

Use a plugin version later than 2.5.0 for it: 2.5.0 signs every user out about 6 minutes after sign-in when
this option is set.

```ts title="./index.ts"
new UserSessionsPlugin({
  keyValueAdapter,
  onSessionCopied: async ({ username, session, request }) => {
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: [
          `Session of *${username}* is used in two browsers and was ended`,
          `Signed in: ${session.device?.browser} on ${session.device?.os}, IP: ${session.ip}, country: ${session.country}`,
          `Other request: ${request.device?.browser} on ${request.device?.os}, IP: ${request.ip}, country: ${request.country}`,
        ].join('\n'),
      }),
    });
  },
})
```

How a copy is found:

- On sign-in the browser gets a `session_nonce` cookie next to the auth cookie, its value is stored with the session.
- Every 5 minutes (`nonceRotationMinutes`) a response replaces the value. A copy in another browser keeps the old one, so the old value
  coming after the new one was used tells that two browsers hold the session. It works the same way when the copy
  gets the new value first.
- The session is revoked before the callback and both browsers are signed out, as the plugin can't tell which one
  belongs to the user. `request` is the one with the old value, `session` is how the session was signed in.
- The old value is still accepted until the browser comes with the new one and for a minute after that, so parallel
  requests and a lost response don't end the session.
- It costs no extra reads: the value is checked against the session which is read on every request anyway, and a
  new value is written together with `last_used_at`.
- A copy is found only when both browsers use the session. While the computer of the user is off, the copy works
  until the user comes back or the auth token expires, a shorter session lifetime makes that time shorter.
- Only sessions signed in while the option is set are checked, so after installing it into a running app every
  session is checked from its next sign-in.

The callback is not awaited, and its errors are only logged.

## Login history

Pass `loginHistory` to store every sign-in and every failed password attempt of a user in a resource.

Create a table for it in `./schema.prisma`:

```ts title='./schema.prisma'
model login_history {
  id          String   @id
  created_at  DateTime
  user_id     String
  success     Boolean
  attempts    Int
  ip          String?
  country     String?
  user_agent  String?
  ips         String?  /// JSON with failed attempts by IP

  @@index([user_id, success, created_at])
}
```

On MySQL Prisma makes a `String` column `VARCHAR(191)`, too short for `user_agent` (up to 512 characters) and
`ips`: a longer value fails the insert, and with it the sign-in. Add `@db.Text` to both columns there.

```bash
pnpm makemigration --name add-login-history ; pnpm migrate:local
```

Add a resource for it:

```ts title='./resources/loginHistory.ts'
import { AdminForthDataTypes, AdminForthResourceInput, AdminForthSortDirections } from 'adminforth';
import { randomUUID } from 'crypto';

// the history holds IPs and user agents of every user
const superadminOnly = async ({ adminUser }) => adminUser.dbUser.role === 'superadmin';

export default {
  dataSource: 'maindb',
  table: 'login_history',
  resourceId: 'login_history',
  label: 'Login history',
  columns: [
    { name: 'id', primaryKey: true, fillOnCreate: () => randomUUID(), showIn: { all: false } },
    { name: 'created_at', type: AdminForthDataTypes.DATETIME },
    { name: 'user_id', foreignResource: { resourceId: 'adminuser' } },
    { name: 'success', type: AdminForthDataTypes.BOOLEAN },
    { name: 'attempts', type: AdminForthDataTypes.INTEGER },
    { name: 'ip' },
    { name: 'country' },
    { name: 'user_agent', showIn: { list: false } },
    // substring search finds failed attempts by an IP inside the JSON
    { name: 'ips', type: AdminForthDataTypes.JSON, filterOptions: { substringSearch: true } },
  ],
  options: {
    allowedActions: {
      create: false,
      edit: false,
      delete: false,
      list: superadminOnly,
      show: superadminOnly,
      filter: superadminOnly,
    },
    defaultSort: { columnName: 'created_at', direction: AdminForthSortDirections.desc },
  },
} as AdminForthResourceInput;
```

And point the plugin to it:

```ts title="./index.ts"
new UserSessionsPlugin({
  keyValueAdapter,
  loginHistory: {
    resourceId: 'login_history',
    resourceColumns: {
      userIdColumnName: 'user_id',
      successColumnName: 'success',
      attemptsColumnName: 'attempts',
      ipColumnName: 'ip',
      countryColumnName: 'country',
      userAgentColumnName: 'user_agent',
      ipsColumnName: 'ips',
      createdAtColumnName: 'created_at',
    },
  },
})
```

A sign-in is stored right away, with `attempts` set to 1 and its IP, country and user agent.

Failed attempts are stored in a way which keeps the database safe from a bruteforce:

- Only attempts with a wrong password of an existing user are stored. Attempts with an unknown username
  are skipped: anybody could create records for them at will, and a mistyped username is often the password.
  Attempts rejected by `auth.rateLimit` or a [captcha](/docs/tutorial/Plugins/login-captcha) are skipped too.
- Attempts are counted in memory and written once per `failedLogsInterval` (`1m` by default) as one record
  per user: `attempts` is their total, `ips` is a JSON object like
  `{ "1.2.3.4": { "attempts": 3, "country": "DE" } }`. So 5000 attempts in a minute cost one write.
- `ips` keeps up to `maxIpsPerLog` IPs (100 by default), attempts from other IPs are still counted in `attempts`.
- Only `maxFailedLogsPerUser` newest failed attempts records of a user are kept (100 by default), older ones
  are deleted.
- Attempts counted since the last write are lost when the app restarts.

Sign-ins are not limited, remove old records by age with the [Auto Remove](/docs/tutorial/Plugins/auto-remove) plugin:

```ts title='./resources/loginHistory.ts'
import AutoRemovePlugin from '@adminforth/auto-remove';

export default {
  ...
  plugins: [
    new AutoRemovePlugin({
      createdAtField: 'created_at',
      mode: 'time-based',
      deleteOlderThan: '3mo',
      interval: '1d',
    }),
  ],
} as AdminForthResourceInput;
```

### Showing country flags

`country` holds a two-letter country code, so it can be rendered as a flag with the pre-made
[Country Flag](/docs/tutorial/Customization/customFieldRendering/#country-flag) renderer:

```ts title='./resources/loginHistory.ts'
  columns: [
    ...
    {
      name: 'country',
  //diff-add
      components: {
  //diff-add
        list: '@/renderers/CountryFlag.vue',
  //diff-add
        show: {
  //diff-add
          file: '@/renderers/CountryFlag.vue',
  //diff-add
          meta: { showCountryName: true },
  //diff-add
        },
  //diff-add
      },
    },
    ...
  ],
```

In the list the country name is shown in a tooltip of the flag, on the show page it is written next to it.

## Options

| Option | Default | Description |
|---|---|---|
| `keyValueAdapter` | required | Adapter where active sessions are stored |
| `collection` | `adminforth-user-sessions` | Collection (key prefix) used in the adapter. Known devices are kept in `<collection>-devices`, used revoke links in `<collection>-used-links` |
| `countryHeader` | `CF-IPCountry` | Header with two-letter country code set by your CDN, empty string disables it |
| `resolveCountry` | — | Called when the header did not tell the country |
| `canManageOtherUsersSessions` | — | `(adminUser) => Promise<boolean>`, decides who may see and revoke sessions of other users |
| `canSeeIps` | — | `(adminUser) => Promise<boolean>`, decides who sees IPs of sessions, see [Hiding IP addresses](#hiding-ip-addresses) |
| `lastUsedThrottleSeconds` | `60` | How often `last_used_at` is refreshed. Every refresh is one write to the adapter |
| `onNewLogin` | — | `({ pk, username, session, reasons, revokePath }) => Promise<void>`, called after a sign-in from a new device or country, see [Notifying about sign-ins from new devices](#notifying-about-sign-ins-from-new-devices) |
| `onSessionCopied` | — | `({ pk, username, session, request }) => Promise<void>`, called after a session used in two browsers was revoked, see [Detecting copied sessions](#detecting-copied-sessions) |
| `nonceRotationMinutes` | `5` | How often the nonce cookie of `onSessionCopied` is replaced. Every replacement is two writes to the adapter |
| `loginHistory.resourceId` | — | Resource where sign-ins and failed attempts are stored, see [Login history](#login-history) |
| `loginHistory.resourceColumns` | required with `loginHistory` | Names of the columns of that resource |
| `loginHistory.failedLogsInterval` | `1m` | How often counted failed attempts are written, one record per user |
| `loginHistory.maxIpsPerLog` | `100` | How many IPs are kept in `ips` of one failed attempts record |
| `loginHistory.maxFailedLogsPerUser` | `100` | How many failed attempts records are kept for one user |
