# Security

Security and privacy if adminforth users is one of the most important aspects of AdminForth.

## How long does user login last?

By default after authentication user session lasts for 24 hours. After that user is redirected to login page.
You can tweak login cookie expiration time by setting environment `ADMINFORTH_AUTH_EXPIRESIN`. For example to set it to 1 hour:

```bash
ADMINFORTH_AUTH_EXPIRESIN=1h
```

Also you can set `auth.rememberMeDays` in the config to set how long "remember me" logins will last.
For example to set it to 7 days:

```ts ./index.ts
new AdminForth({
  ...
  auth: {
    rememberMeDays: 7
  }
}
```

In this case users who will check "Remember me" checkbox will be logged in for 7 days instead of 24 hours.


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

All rules defined in password column will be also delivered to [password reset plugin](../05-Plugins/07-email-password-reset.md) if you are using it to ensure that password reset will also respect same rules.


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

So you should take additional care to make sure that this header is not spoofed.

### Using proxing CDNs

If you are using proxying CDN like Cloudflare before your app which is probably best approach for security and performance, you should 3 things:
1) Make sure you use orange cloud in Cloudflare on domain serving app to proxy all traffic through Cloudflare.

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

3) Make sure that your server is only accepting requests from CDN IP addresses (or ranges). For Cloudflare this info is here: https://www.cloudflare.com/ips/ . You can set it in firewall e.g. in AWS security group, or in software firewall like UFW. There is even a script which you can use in cron https://github.com/Paul-Reed/cloudflare-ufw (just in case if list of IPs will change in future).


### Using reverse proxy

If first client-facing point is reverse proxy like Nginx, or Traefik and there is no more proxies like CDN behind it, you should take care of reliably setting `X-Forwarded-For` header to the client IP address. 
Main trick here is to make sure that proxy strips any `X-Forwarded-For` headers that are already present in the requeqst and hardly overwrites it with client IP address coming from TCP connection (it can't be spoofed by client).


In Traefik to set `X-Forwarded-For` header you should set `forwardedHeaders` in traefik config:

```yaml

 adminforth:
    build: ./app
    environment:
      - NODE_ENV=production
      - ADMINFORTH_SECRET=!CHANGEME! # ☝️ replace with your secret
      ...
    labels:
    - "traefik.http.middlewares.sanitize-headers.headers.customRequestHeaders.X-Forwarded-For=$remote_addr"
    # enable middleware
    - "traefik.http.routers.adminforth.middlewares=sanitize-headers"
```


For nginx you should set `proxy_set_header X-Forwarded-For $remote_addr;` in your nginx config:

```nginx
server {
    ...
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```