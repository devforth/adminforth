# Open Signup

Open signup plugin allows users to sign up for an account without an invitation. 
This is useful when you want to allow anyone to sign up for an account and assign some low-level permissions to them.

## Installation

To install the plugin:

```bash
npm install @adminforth/open-signup
```


## Usage

To use the plugin, instantiate to to user resource:

```typescript title="./resources/user.ts"
import OpenSignupPlugin from '../adminforth/plugins/open-signup/index.js';

```

Like this:

```typescript title="./resources/user.ts"
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

Work in progress

