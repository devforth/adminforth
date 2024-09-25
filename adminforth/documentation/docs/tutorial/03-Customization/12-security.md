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