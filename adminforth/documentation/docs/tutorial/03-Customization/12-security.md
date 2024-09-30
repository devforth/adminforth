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
