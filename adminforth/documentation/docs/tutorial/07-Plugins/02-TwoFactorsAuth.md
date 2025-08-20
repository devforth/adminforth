# Two-Factor Authentication Plugin

The Two-Factor Authentication Plugin provides an additional layer of security to the application by requiring users to provide a second form of authentication in addition to their password. This plugin supports  authenticator apps.

## Installation

``` bash
npm i @adminforth/two-factors-auth --save
```

Plugin is already installed into adminforth, to import:

```ts title="/adminuser.ts"
import TwoFactorsAuthPlugin from '@adminforth/two-factors-auth';
```

Plugin required some additional setup, to make it work properly. It should be added to the resource auth resource. In our example we will add it to the user resource .

```ts title='./schema.prisma'
model adminuser {
  id            String     @id
  created_at    DateTime
  email         String   @unique
  role          String
  password_hash String
//diff-add
  secret2fa     String?
}
```

Then:

```bash
npm run makemigration -- --name add-2fa-secret ; npm run migrate:local


```

And add it to `adminuser.ts`

```ts tittle="./resources/adminuser.ts"
{
    table: 'adminuser',
//diff-add
    plugins: [
//diff-add
        new TwoFactorsAuthPlugin ({ twoFaSecretFieldName: 'secret2fa', timeStepWindow: 1 }),
//diff-add
    ],
    columns: [
        ...
//diff-add
        {
//diff-add
            name: 'secret2fa',
//diff-add
            showIn: { all: false },
//diff-add
            backendOnly: true,
//diff-add
        }
    ],
  }
```

> 💡 **Note**: Time-Step Size
>
> By default, `timeStepWindow` is set to `1`, which means the Two-Factor Authentication Plugin will check the current 30-second time-step, as well as one step before and after, to validate a TOTP code. This aligns with [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) best practices to accommodate slight clock drift between the server and the user's device.
>
> For example, if a code is generated between **12:00:00** and **12:00:30**, it will typically expire at **12:00:30**. However, with a `timeStepWindow` of `1`, the plugin will continue to accept it up to **12:00:59** (the “next” 30-second step), preventing users from being locked out if their device clock is a few seconds off. Once the clock hits **12:01:00**, that previous code will be treated as expired.
>
> If you find users frequently encountering code mismatches due to clock drift, you can increase `timeStepWindow` to `2`. **However, be cautious: larger windows can reduce overall security!**
>
> ❗ With a `timeStepWindow` set to `0`, the plugin will pass all the expired codes, which is not secure and should only be used for testing purposes.

Thats it! Two-Factor Authentication is now enabled:
![alt text](image-1.png)

## Disabling Two-Factor Authentication locally

If it is not convenient to enter the code every time you log in during local development, you can disable Two-Factor Authentication
for the dev environment using `usersFilterToApply` option.

```ts title='./index.ts'

    plugins: [
        new TwoFactorsAuthPlugin ({
          twoFaSecretFieldName: 'secret2fa',
//diff-add
          usersFilterToApply: (adminUser: AdminUser) => {
//diff-add
            // if this method returns true, 2FA will be enforced for this user, if returns false - 2FA will be disabled
//diff-add
            if (process.env.NODE_ENV === 'development') {
//diff-add
              return false;
//diff-add
            }
//diff-add
            return true;
//diff-add
          },
        }),
    ],
```

## Select which users should use Two-Factor Authentication

By default plugin enforces Two-Factor Authentication for all users.

If you wish to enforce 2FA only for specific users, you can again use `usersFilterToApply` option:

```ts title='./adminuser.ts'
  usersFilterToApply: (adminUser: AdminUser) => {
    // disable 2FA for users which email is 'adminforth' or 'adminguest'
    return !(['adminforth', 'adminguest'].includes(adminUser.dbUser.email));
  },
```

You can even add a boolean column to the user table to store whether the user should use 2FA or not:

In `schema.prisma`:

```ts title='./schema.prisma'
model adminuser {
  id            String     @id
  created_at    DateTime
  email         String   @unique
  role          String
  password_hash String
  secret2fa     String?
//diff-add
  use2fa        Boolean?  @default(false)
}
```

Then run:

```bash
npm run makemigration -- --name add-use2fa ; npm run migrate:local
```

Then in `adminuser.ts`:


```ts title='./adminuser.ts'
{
    resourceId: 'adminuser',
    ...
    columns: [
        ...
        {
            name: 'use2fa',
        }
        ...
    ],
    options: {
      allowedActions: {
        delete: async ({ adminUser }: { adminUser: AdminUser }) => {
          // only superadmin can delete users
          return adminUser.dbUser.role === 'superadmin';
        },
        create: async ({ adminUser }: { adminUser: AdminUser }) => {
          // only superadmin can create users
          return adminUser.dbUser.role === 'superadmin';
        },
        edit: async ({ adminUser, meta }: { adminUser: AdminUser }) => {
          // user can modify only his own record
          const { oldRecord } = meta;
          return adminUser.dbUser.id === oldRecord.id;
        },
      }
    },
    plugins: [
        new TwoFactorsAuthPlugin ({
          twoFaSecretFieldName: 'secret2fa',
          usersFilterToApply: (adminUser: AdminUser) => {
            return adminUser.dbUser.use2fa;
          },
        }),
    ],
}
```

## Allow Specific Users to Skip Two-Factor Authentication Setup

By default, all users are required to setup Two-Factor Authentication if it is enabled.

If you want to allow specific users to **skip** the 2FA setup, you can use the `usersFilterToAllowSkipSetup` option:

```ts title='./adminuser.ts'
...
plugins: [
        new TwoFactorsAuthPlugin ({
          twoFaSecretFieldName: 'secret2fa',
          ...
        //diff-add
          usersFilterToAllowSkipSetup: (adminUser: AdminUser) => {
            //diff-add
            // allow skip setup 2FA for users which email is 'adminforth' or 'adminguest'
            //diff-add
            return !(['adminforth', 'adminguest'].includes(adminUser.dbUser.email));
            //diff-add
          },
        }),
],
...
```

## Trigger 2FA from Actions via a Custom Component

Enable a one‑time 2FA prompt before running any AdminForth action by attaching a tiny Vue wrapper via `customComponent`. The plugin exposes a global modal: `window.adminforthTwoFaModal.getCode(cb?)`.

### Minimal Wrapper Component

```ts title='/custom/RequireTwoFaGate.vue'
<template>
  <div class="contents" @click.stop.prevent="onClick"><slot /></div>
</template>
<script setup lang="ts">
  import { callAdminForthApi } from '@/utils';
  const emit = defineEmits<{ (e: 'callAction'): void }>();
  const props = defineProps<{ disabled?: boolean; meta?: { verifyPath?: string; [k: string]: any } }>();

  async function verify2fa(code: string) {
  const path = props.meta?.verifyPath ?? '/plugin/twofa/verify';
  const resp = await callAdminForthApi({ method: 'POST', path, body: { code } });
    return !!resp?.ok;
  }

  async function onClick() {
  if (props.disabled) return;
  if (!window.adminforthTwoFaModal?.getCode) { emit('callAction'); return; }
  await window.adminforthTwoFaModal.getCode(verify2fa);
    emit('callAction');
  }
</script>
```

### Attach to an Action

```ts title='/adminuser.ts'
options: {
  actions: [
    {
    name: 'Auto submit',
    icon: 'flowbite:play-solid',
    allowed: () => true,
    action: async ({ recordId, adminUser }) => ({ ok: true, successMessage: 'Auto submitted' }),
    showIn: { showButton: true, showThreeDotsMenu: true, list: true },
    //diff-add
    customComponent: '@@/RequireTwoFaGate.vue',
    // or with runtime config:
    // customComponent: { name: '@@/RequireTwoFaGate.vue', meta: { verifyPath: '/plugin/twofa/verify' } },
    },
  ],
}
```
