---
description: "Guide to AdminForth security settings, including session lifetime, password policies, trusted proxy configuration, HTTPS, CSRF scope, and hardening recommendations."
---

# Security

Security and privacy if adminforth users is one of the most important aspects of AdminForth.

## How long does user login last?

By default after authentication user session lasts for 24 hours. After that user is redirected to login page.
You can tweak login cookie expiration time by setting environment `ADMINFORTH_AUTH_EXPIRESIN`. For example to set it to 1 hour:

```bash
ADMINFORTH_AUTH_EXPIRESIN=1h
```

Also you can set `auth.rememberMeDuration` in the config to set how long "remember me" logins will last.
For example to set it to 7 days:

```ts ./index.ts
new AdminForth({
  ...
  auth: {
    rememberMeDuration: '7d' // '7d' for 7 days, '24h' for 24 hours, '30m' for 30 minutes, etc.
  }
}
```

In this case users who will check "Remember me" checkbox will be logged in for 7 days instead of 24 hours.


## Login rate limits

AdminForth rate-limits login attempts by client IP using `auth.rateLimit`. Password login, OAuth login, and passkey login use the same configured limits, but each login method has its own independent rate-limit bucket.

By default AdminForth uses:

```ts
['500/5m', '5000/1h', '10000/1d']
```

You can override it in the app config:

```ts ./index.ts
new AdminForth({
  ...
  auth: {
    rateLimit: ['10/5m', '100/1h', '500/1d']
  }
})
```

The format is `requests/period`, where period can use `s`, `m`, `h`, or `d`.
Because rate limits are keyed by client IP, configure `auth.clientIpHeader` when AdminForth runs behind a trusted CDN or reverse proxy. See [Trusting client IP addresses](#trusting-client-ip-addresses).
> It is important to provide '`auth.clientIpHeader`, because otherwise adminforth will automatically detect client IP in headers and if you don't use proxy, hacker can change IP like `x-forwarded-for: 1.1.1.1` in request headers and skip rate limit 


## Password strength

AdminForth allows to set validation RegExp based rules for any field. This can be reused for password strength validation.
[Getting started](../001-gettingStarted.md) guide suggests you to set next parameters for password field:

```ts ./index.ts
  minLength: 8,
  validation: [
    AdminForth.Utils.PASSWORD_VALIDATORS.UP_LOW_NUM,
  ],
```

So when admin user will create another user, password will be validated against next rules:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

For improving requirement you might also request special character:

```ts ./index.ts
  minLength: 8,
  validation: [
    AdminForth.Utils.PASSWORD_VALIDATORS.UP_LOW_NUM_SPECIAL
  ],
```

Also you can add custom rules. For example to prevent popular words:

```ts ./index.ts
  minLength: 8,
  validation: [
    {
      regExp: '^(?!.*(?:qwerty|password|user|login|qwerty|123456)).*$',
      message: 'Password cannot contain easily guessed words'
    },
    AdminForth.Utils.PASSWORD_VALIDATORS.UP_LOW_NUM_SPECIAL,
  ],
```

All rules defined in password column will be also delivered to [password reset plugin](../09-Plugins/07-email-password-reset.md) if you are using it to ensure that password reset will also respect same rules.

## Normalizing identity columns

Use the optional column-level `normalize` callback to store an identity value in one canonical form. Email addresses are a common example:

```ts title="./resources/adminuser.ts"
{
  name: 'email',
  required: true,
  isUnique: true,
  type: AdminForthDataTypes.STRING,
  normalize: (value: string) => value.trim().toLowerCase(),
}
```

This is opt-in. It is especially important for the column configured as `auth.usernameField`: without it, password login compares the submitted username exactly as written. That makes login case-sensitive and lets `User@example.com` and `user@example.com` be created as separate accounts when the database treats them as distinct values.

`normalize` is deliberately a write-time feature, except for the core password-login lookup:

| Path | When `normalize` runs |
| --- | --- |
| AdminForth CRUD (`createResourceRecord`, `updateResourceRecord`) | Before validation and `beforeSave` hooks |
| Data API (`admin.resource(...).create()` and `.update()`) | Before the record reaches the connector |
| Core password login | On the submitted value of `auth.usernameField`, before the user lookup |
| Reads and filters | Never — this includes `get`, `list`, `count`, search, and `Filters.EQ` |

Plugins that create or update records through the Data API use the same normalization. Code that calls a data connector's `createRecord` or `updateRecord` directly bypasses it, so those callers must normalize the value themselves or use the Data API instead.

### Enabling it on an existing table

`normalize` affects **new writes only**. It never rewrites stored user data automatically. Existing rows keep their current casing, so migrating them is the operator's responsibility.

> Warning: if a stored email is `User@example.com`, enabling this normalizer changes a submitted `User@example.com` to `user@example.com` before login looks it up. The existing row does not become lowercase on its own, so existing identity data must be migrated.

Before enabling it, check for values that would collide after normalization. For an `adminuser.email` column, run this query with your normalizer's equivalent SQL expression:

```sql
SELECT LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS account_count
FROM adminuser
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;
```

Resolve every reported collision before continuing. For example, `User@example.com` and `user@example.com` remain different rows until you explicitly merge, rename, or remove one of them. Enabling the callback does not make reads case-insensitive; a future normalized lookup could match both rows and choose an arbitrary account.

After taking a backup and confirming the query returns no rows, add `normalize` to the resource and run a database migration such as:

```sql
UPDATE adminuser
SET email = LOWER(TRIM(email))
WHERE email <> LOWER(TRIM(email));
```

Replace `adminuser`, `email`, and `LOWER(TRIM(...))` with the table, column, and database expression that match your configuration. Run this as a tested migration in a maintenance window when identity data is sensitive. The migration and the callback together ensure both existing records and future writes use the same canonical value.

For the complete CRUD behavior, see [Normalize values before saving](./13-standardPagesTuning.md#normalize-values-before-saving).


## Trusting client IP addresses

Adminforth provides `admin.auth.getClientIp(headers)` function to get client IP address. 

This function is used for:
- Rate limiting in some standard plugins like those who are using OpenAI to protect against abuse
- Securely logging user actions e.g. in Audit Log plugin
- Can be used by your own code e.g. hooks to write first login/last login IP address to db

By default it reads `X-Forwarded-For` header from request headers to determine client IP address. 
AdminForth does not understand whether this header can be trusted or no. In some cases it might be spoofed by client like this:

```
curl -H "X-Forwarded-For: <made-out IP>" http://your-server/api...
```

So you should take additional care to make sure that this header is not spoofed (see below for examples and  best practices depending on your setup).

### Using proxing CDNs

If you are using proxying CDN like Cloudflare in front of your app, which is probably best approach for security and performance, you should do 3 things:

1) Make sure you see "orange cloud icon" in Cloudflare on domain serving app to proxy all traffic through Cloudflare.

2) Set config auth.clientIpHeader to the header that CDN uses to pass client IP address. 
For Cloudflare it is `CF-Connecting-IP`: 

```ts ./index.ts
new AdminForth({
  ...
  auth: {
    clientIpHeader: 'CF-Connecting-IP'
  }
}
```

3) Adittionally ensure that your server is only accepting requests from CDN IP addresses (& ranges) and block all other IPs. For Cloudflare this info is here: https://www.cloudflare.com/ips/ . You can set it in firewall e.g. in AWS security group, or in software firewall like UFW. There is even a script which you can use in cron https://github.com/Paul-Reed/cloudflare-ufw (just in case if list of IPs will change in future).


### Using reverse proxy

If first client-facing point is reverse proxy like Nginx or Traefik and there is no more proxies like CDN behind it, you should take care of reliably setting `X-Forwarded-For` header to the client IP address. 
Main trick here is to make sure that proxy strips any `X-Forwarded-For` headers that are already present in the requeqst and hardly overwrites it with client IP address coming from TCP connection (so it can't be spoofed by client).


In Traefik to set `X-Forwarded-For` header you should set `forwardedHeaders` in traefik config:

```yaml

 adminforth:
    build: ./app
    environment:
      - NODE_ENV=production
      ...
    labels:
//diff-add
    - "traefik.http.middlewares.sanitize-headers.headers.customRequestHeaders.X-Forwarded-For=$remote_addr"
//diff-add
    # enable middleware
//diff-add
    - "traefik.http.routers.adminforth.middlewares=sanitize-headers"
```

For nginx you should set `proxy_set_header X-Forwarded-For $remote_addr;` in your nginx config:

```nginx
server {
    ...
    location / {
        proxy_pass http://localhost:3000;
//diff-add
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```


### Backend-only fields

Some fields should never be accessed on frontend. For example, `hashed_password` field which is always created using CLI initial app, should never be passed to frontend due to security reasons.
If any user of system can read `hashed_password` of another user, it can lead to account compromise.

To eliminate it we have 2 options:

1) Do not list `password_hash` in the `columns` array of the resource. Basic mantra: If AdminForth knows nothing about field it will never pass this field to frontend and will never "touch" it in any way.
2) Define `password_hash` in columns way but set `backendOnly`. This allows adminforth to provide full support for this field in backend but will never pass it to frontend.

The second option is more explicit and should be preferred. This option is used by default in CLI-bootstrapped projects:

```ts
{
  name: 'password_hash',
  type: AdminForthDataTypes.STRING,
  showIn: { all: false },
  backendOnly: true,  // will never go to frontend
}
```

#### Dynamically hide fields depending on user ACL / role

You can use `column.showIn` to show or hide column for user depending on his role.

However even if `showIn` value (or value returned by showIn function) is `false`, record value will still go to frontend and will be visible in the Network tab, so advanced user can still access field value. We did it in this way to provide AdminForth developers with ability to quickly use any record field in custom components.

However if you need securely hide only certain fields depending on role, you should use `column.backendOnly` and pass function there.

Let's consider example:

```ts
{
  name: 'email',
  type: AdminForthDataTypes.STRING,
  showIn: { 
//diff-add
    all: false, 
//diff-add
    list: ({ adminUser }: { adminUser: AdminUser }) => adminUser.dbUser.role === 'superadmin',
  },
}
```

So if you will configure the email column in user resource like this, only superadmin will be able to see emails, and only in the list view.
However, the email will still be present in the record and can be accessed by advanced users through the Network tab.

So to completely hide the email field from all users apart superadmins, you should use `column.backendOnly` and pass a function there.

```ts
{
  name: 'email',
  type: AdminForthDataTypes.STRING,
//diff-add
  backendOnly: ({ adminUser }: { adminUser: AdminUser }) => adminUser.dbUser.role === 'superadmin',
  showIn: { 
    all: false, 
    list: ({ adminUser }: { adminUser: AdminUser }) => adminUser.dbUser.role === 'superadmin',
  },
}
```

So if you will configure the email column in user resource like this, only superadmin will be able to see emails, and only in the list view.

## Custom user authorization hook

Default user authorization checks that cookie with JWT token is valid, signed and not expired. 
You can use custom hook to decide whether to allow exections of all default and cusotm API endpoints (wraped by authorize middleware) based on user fields.

```ts title="./index.ts"
export const admin = new AdminForth({

  ...

  auth: {
    adminUserAuthorize: [
      async ({adminUser, adminforth, extra}) => {
        if (adminUser.dbUser.status === 'banned') {
          return { allowed: false, error: "User is banned" };
        }
        return { allowed: true };
      }
    ]
  }

  ...

})

```

Now, if a user’s field `status` is changed to "banned", they won’t be able to perform any actions and moreover  will be automatically logged out upon accessing the page.

## RateLimiter for API

### Import
```ts 
import { RateLimiter } from "adminforth";
```

### Usage
```ts 
import { RateLimiter } from "adminforth";

const UserRateLimiter = new RateLimiter("20/1d");

app.post(
  `${ADMIN_BASE_URL}/api/some-api/`,
  admin.express.authorize(async (req: any, res: any) => {

    const allowed = await UserRateLimiter.consume(req.user.id);

    if (!allowed) {
      res.status(429).json({
        error: "Rate limit exceeded"
      });
      return;
    }

    // your API logic here
  })
);
```

### Limit format
"20/1d"
This means that a user is allowed to make up to 20 requests within one day, and once this limit is reached, any further requests will be blocked until the 24-hour period resets.

### Supported time units
- s → seconds (10s)
- m → minutes (5m)
- h → hours (1h)
- d → days (1d)

> ☝ Сonsume(key) is used to check whether a specific key such as a userId, IP address, or any other identifier has exceeded its allowed request limit. If the limit has not been reached, it returns true, meaning the request is allowed to proceed.
