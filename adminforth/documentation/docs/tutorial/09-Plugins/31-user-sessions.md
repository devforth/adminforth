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
working right away.

## Installation

```bash
pnpm add @adminforth/user-sessions @adminforth/key-value-adapter-redis
```

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

## Options

| Option | Default | Description |
|---|---|---|
| `keyValueAdapter` | required | Adapter where active sessions are stored |
| `collection` | `adminforth-user-sessions` | Collection (key prefix) used in the adapter |
| `countryHeader` | `CF-IPCountry` | Header with two-letter country code set by your CDN, empty string disables it |
| `resolveCountry` | — | Called when the header did not tell the country |
| `canManageOtherUsersSessions` | — | `(adminUser) => Promise<boolean>`, decides who may see and revoke sessions of other users |
| `lastUsedThrottleSeconds` | `60` | How often `last_used_at` is refreshed. Every refresh is one write to the adapter |
