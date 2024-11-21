# Open Signup

Open Signup plugin allows users to register in adminforth by them-selfs without admin. 
This is useful when you want to allow anyone to sign up and assign some low-level permissions to them.

## Installation

To install the plugin:

```bash
npm install @adminforth/open-signup
```


## Usage

To use the plugin, instantiate to to user resource:

```typescript title="./resources/user.ts"
import OpenSignupPlugin from '@adminforth/open-signup';
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

