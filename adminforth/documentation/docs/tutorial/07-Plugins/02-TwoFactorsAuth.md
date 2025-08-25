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

## Request 2FA on custom Actions

You might want to to allow to call some custom critical/money related actions with additional 2FA approval. This eliminates risk that user cookies might be stolen by some virous/doorway software after login.

To do it you first need to create custom component which will call `window.adminforthTwoFaModal.getCode(cb?)` frontend API exposed by this plugin. This is awaitable call wich shows 2FA popup and asks user to enter a code.

```ts title='/custom/RequireTwoFaGate.vue'
<template>
  <div class="contents" @click.stop.prevent="onClick">
    <slot />  <!-- render action defgault contend - button/icon -->
  </div>
</template>

<script setup lang="ts">
  const emit = defineEmits<{ (e: 'callAction', payload?: any): void }>();
  const props = defineProps<{ disabled?: boolean; meta?: Record<string, any> }>();

  async function onClick() {
    if (props.disabled) return;
  
    const code = await window.adminforthTwoFaModal.getCode();  // this will ask user to enter code
    emit('callAction', { code }); // then we pass this code to action (from fronted to backend)
  }
  </script>
```

Now we need to read code entered on fronted on backend and verify that is is valid and not expired, on backend action handler:

```ts title='/adminuser.ts'
options: {
  actions: [
    {
      name: 'Auto submit',
      icon: 'flowbite:play-solid',
      allowed: () => true,
      action: async ({ recordId, adminUser, adminforth, extra }) => {
        //diff-add
        const code = extra?.code
        //diff-add
        if (!code) {
          //diff-add
          return { ok: false, error: 'No TOTP code provided' };
        //diff-add
        }
        //diff-add
        const t2fa = adminforth.getPluginByClassName<TwoFactorsAuthPlugin>('TwoFactorsAuthPlugin');
        //diff-add
        const result = await t2fa.verify(code, { adminUser });

        //diff-add
        if (!result?.ok) {
          //diff-add
          return { ok: false, error: result?.error ?? 'TOTP code is invalid' };
          //diff-add
        }
        //diff-add
        await adminforth
        //diff-add
          .getPluginByClassName<AuditLogPlugin>('AuditLogPlugin')
          //diff-add
          .logCustomAction({
            //diff-add
            resourceId: 'aparts',
            //diff-add
            recordId: null,
            //diff-add
            actionId: 'visitedDashboard',
            //diff-add
            oldData: null,
            //diff-add
            data: { dashboard: 'main' },
            //diff-add
            user: adminUser,
            //diff-add
          });

          //your critical action logic 
      
        return { ok: true, successMessage: 'Auto submitted' };
      },
      showIn: { showButton: true, showThreeDotsMenu: true, list: true },
      //diff-add
      customComponent: '@@/RequireTwoFaGate.vue',
    },
  ],
}
```

## Request 2FA from custom components

Imagine you have some button which does some API call

```ts
<template>
  <Button @click="callAdminAPI">Call critical API</Button>
</template>
  

<script setup lang="ts">
import { callApi } from '@/utils';
import adminforth from '@/adminforth';

async function callAdminAPI() {
  const code = await window.adminforthTwoFaModal.getCode();

  const res = await callApi({
    path: '/myCriticalAction',
    method: 'POST',
    body: { param: 1 },
  });
}
</script>
```

On backend you have simple express api

```ts
app.post(`${ADMIN_BASE_URL}/myCriticalAction`,
  admin.express.authorize(
    async (req: any, res: any) => {

      // ... your critical logic ...

      return res.json({ ok: true, successMessage: 'Action executed' });
    }
  )
);
```

You might want to protect this call with a TOTP code. To do it, we need to make this change

```ts
<template>
  <Button @click="callAdminAPI">Call critical API</Button>
</template>
  

<script setup lang="ts">
import { callApi } from '@/utils';
import adminforth from '@/adminforth';

async function callAdminAPI() {
  const code = await window.adminforthTwoFaModal.getCode();

  // diff-remove
  const res = await callApi({
  // diff-remove
    path: '/myCriticalAction',
  // diff-remove
    method: 'POST',
  // diff-remove
    body: { param: 1 },
  // diff-remove
  });

  // diff-add
  const res = await callApi({
  // diff-add
    path: '/myCriticalAction',
  // diff-add
    method: 'POST',
  // diff-add
    body: { param: 1, code: String(code) },
  // diff-add
  });

  // diff-add
  if (!res?.ok) {
  // diff-add
    adminforth.alert({ message: res.error, variant: 'danger' });
  // diff-add
  }
}
</script>

```

And oin API call we need to verify it:


```ts
app.post(`${ADMIN_BASE_URL}/myCriticalAction`,
  admin.express.authorize(
    async (req: any, res: any) => {

      // diff-remove
      // ... your critical logic ...

      // diff-remove
      return res.json({ ok: true, successMessage: 'Action executed' });

      // diff-add
      const { adminUser } = req;
      // diff-add
      const { param, code } = req.body ?? {};
      // diff-add
      const token = String(code ?? '').replace(/\D/g, '');
      // diff-add
      if (token.length !== 6) {
      // diff-add
        return res.status(401).json({ ok: false, error: 'TOTP must be 6 digits' });
      // diff-add
      }
      // diff-add
      const t2fa = admin.getPluginByClassName<TwoFactorsAuthPlugin>('TwoFactorsAuthPlugin');
      // diff-add
      const verifyRes = await t2fa.verify(token, { adminUser });
      // diff-add
      if (!('ok' in verifyRes)) {
      // diff-add
        return res.status(400).json({ ok: false, error: verifyRes.error || 'Wrong or expired OTP code' });
      // diff-add
      }
      // diff-add
      await admin.getPluginByClassName<AuditLogPlugin>('AuditLogPlugin').logCustomAction({
      // diff-add
        resourceId: 'aparts',
      // diff-add
        recordId: null,
      // diff-add
        actionId: 'myCriticalAction',
      // diff-add
        oldData: null,
      // diff-add
        data: { param },
      // diff-add
        user: adminUser,
      // diff-add
      });

      // diff-add
      // ... your critical logic ...

      // diff-add
      return res.json({ ok: true, successMessage: 'Action executed' });
    }
  )
);
```
