---
title: Telegram Chat Surface Adapter (WIP)
description: "Reference page for AdminForth Agent chat surface adapters, including Telegram bot setup and webhook configuration."
slug: /tutorial/Adapters/chat-surface-adapter-telegram
sidebar_position: 8
---

# Telegram Chat Surface Adapter

Chat surface adapters connect external chat products to the [Agent plugin](/docs/tutorial/Plugins/agent/).

```bash
pnpm i @adminforth/chat-surface-adapter-telegram
```

Create a Telegram bot with BotFather and add the token to `.env`:

```env title=".env"
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username_without_at
TELEGRAM_WEBHOOK_SECRET=your_random_secret
```

The webhook secret confirms that the request came through Telegram.

## Admin user field `externalUserId`

External chat accounts are linked by the Agent plugin, not by the Telegram adapter directly. The plugin stores linked external user ids in a JSON field on the AdminForth auth user resource.

By default this field is named `externalUserId`. Add it to your `adminuser` resource:

```ts
{
  name: 'externalUserId',
  type: AdminForthDataTypes.JSON,
},
```

Also add the matching column to your database schema and run a migration. For example, with Prisma and PostgreSQL:

```prisma title="schema.prisma"
model adminuser {
  // existing fields
  externalUserId Json?
}
```

For Prisma SQLite, store the same field as text:

```prisma title="schema.prisma"
model adminuser {
  // existing fields
  externalUserId String?
}
```

AdminForth should still define this resource column as `AdminForthDataTypes.JSON`; the SQLite connector serializes it into the text column and parses it back.

Then create and apply the migration using your app's migration scripts:

```bash
pnpm makemigration --name add-adminuser-external-user-id
pnpm migrate:local
```

When a Telegram account is linked, the field stores data like this:

```json
{
  "telegram": "123456789"
}
```

If your field is named differently, configure `chatExternalIdsField` on the Agent plugin.

Register the adapter in the Agent plugin:

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
  // optional, defaults to 'externalUserId'
  //diff-add
  chatExternalIdsField: 'externalUserId',
});
```

When `botUsername` is configured, the Agent plugin adds **Chat Surfaces** to the user menu settings pages. A logged-in AdminForth user can open that page and click **Connect**. The Telegram adapter returns a URL like:

```txt
https://t.me/<botUsername>?start=<link-token>
```

After the user starts the bot with that token, AdminForth stores the Telegram user id in `externalUserId.telegram`. The same page also supports reconnecting and disconnecting the Telegram account.

You can also prefill the JSON field manually if you do not want to use the connect page.

## Adapter options

All options for `new TelegramChatSurfaceAdapter(options)`:

- `botToken` (string, required) — Telegram bot token from BotFather.
- `botUsername` (string, optional) — bot username used to build the account-link URL for the **Chat Surfaces** settings page.
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
