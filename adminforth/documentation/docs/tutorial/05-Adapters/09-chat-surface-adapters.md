---
title: Telegram Chat Surface Adapter (WIP)
description: "Reference page for AdminForth Agent chat surface adapters, including Telegram bot setup and webhook configuration."
slug: /tutorial/Adapters/chat-surface-adapter-telegram
sidebar_position: 8
---

# Telegram Chat Surface Adapter

Chat surface adapters connect external chat products to the [Agent plugin](/docs/tutorial/Plugins/agent/). They only receive and send chat messages. User linking is handled through OAuth connected accounts.

For Telegram you need both adapters:

```bash
pnpm i @adminforth/chat-surface-adapter-telegram
pnpm i @adminforth/oauth-adapter-telegram
```

Create a Telegram bot with BotFather and add the token to `.env`:

```env title=".env"
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username_without_at
TELEGRAM_WEBHOOK_SECRET=your_random_secret
```

The webhook secret confirms that the request came through Telegram.

## External identity `externalUserId`

External chat accounts are resolved through OAuth connected accounts. The Telegram OAuth adapter writes the Telegram user id into `externalUserId` on the external identities resource. The Agent plugin then uses that field to map incoming Telegram messages to AdminForth users.

Add the field to your external identities resource:

```ts
{
  name: 'externalUserId',
  type: AdminForthDataTypes.STRING,
},
```

Also add the matching column to your database schema and run a migration. For example, with Prisma and PostgreSQL:

```prisma title="schema.prisma"
model AdminUserExternalIdentity {
  // existing fields
  externalUserId String?
}
```

Then create and apply the migration using your app's migration scripts:

```bash
pnpm makemigration --name add-external-identity-external-user-id
pnpm migrate:local
```

Configure the OAuth plugin with Telegram OAuth:

```ts title="./resources/adminuser.ts"
import OAuthPlugin from '@adminforth/oauth';
import TelegramOauthAdapter from '@adminforth/oauth-adapter-telegram';

new OAuthPlugin({
  emailField: 'email',
  externalIdentityResource: {
    resourceId: 'admin_user_external_identities',
    phoneField: 'phone',
    fullNameField: 'fullName',
    avatarUrlField: 'avatarUrl',
    metaField: 'meta',
  },
  adapters: [
    new TelegramOauthAdapter({
      clientID: process.env.TELEGRAM_CLIENT_ID as string,
      clientSecret: process.env.TELEGRAM_CLIENT_SECRET as string,
      redirectUri: process.env.TELEGRAM_OAUTH_REDIRECT_URI as string,
      scopes: ['openid', 'profile', 'phone'],
    }),
  ],
});
```

Then register the Telegram chat surface adapter in the Agent plugin:

```ts
import AdminForthAgent from '@adminforth/agent';
import TelegramChatSurfaceAdapter from '@adminforth/chat-surface-adapter-telegram';

new AdminForthAgent({
  modes: [
    // your modes
  ],
  sessionResource: {
    // your session resource config
  },
  turnResource: {
    // your turn resource config
  },
  //diff-add
  chatSurfaceAdapters: [
    //diff-add
    new TelegramChatSurfaceAdapter({
      //diff-add
      botToken: process.env.TELEGRAM_BOT_TOKEN as string,
      //diff-add
      botUsername: process.env.TELEGRAM_BOT_USERNAME,
      //diff-add
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
      //diff-add
    }),
    //diff-add
  ],
  //diff-add
  chatExternalIdentityResource: {
    //diff-add
    resourceId: 'admin_user_external_identities',
    //diff-add
    surfaces: {
      //diff-add
      telegram: {
        //diff-add
        provider: 'AdminForthAdapterTelegramOauth2',
        //diff-add
      },
      //diff-add
    },
    //diff-add
  },
});
```

External chat users are resolved through OAuth connected accounts. Configure OAuth `externalIdentityResource` and Agent `chatExternalIdentityResource`, then let users connect Telegram from **Connected Accounts**.

The `provider` value must match the Telegram OAuth adapter class name. Users must connect Telegram in **Settings -> Connected Accounts** before the Telegram bot can identify them.

## Adapter options

All options for `new TelegramChatSurfaceAdapter(options)`:

- `botToken` (string, required) — Telegram bot token from BotFather.
- `botUsername` (string, optional) — bot username. OAuth connected accounts are used for user linking.
- `webhookSecret` (string, optional) — secret token configured in Telegram `setWebhook`.
- `streamingMode` (`draft` | `typing` | `off`, optional) — streaming behavior for Telegram responses.
  - Default: `draft`.
  - Note: Telegram drafts work only in private chats. In non-private chats the adapter automatically falls back from `draft` to `typing`.
- `draftUpdateIntervalMs` (number, optional) — throttle for draft preview updates.
  - Default: `650`.

The plugin exposes this webhook endpoint:

```txt
/adminapi/v1/agent/surface/telegram/webhook
```

Set it in Telegram:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/adminapi/v1/agent/surface/telegram/webhook",
    "secret_token": "'"${TELEGRAM_WEBHOOK_SECRET}"'"
  }'
```

Telegram does not provide a user time zone in message updates, so the adapter sends `UTC` as `userTimeZone`.
