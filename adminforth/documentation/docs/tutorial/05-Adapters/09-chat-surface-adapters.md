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
TELEGRAM_WEBHOOK_SECRET=your_random_secret
```

The webhook secret confirms that the request came through Telegram. Your app should still map the Telegram user id to a real AdminForth admin user before running the agent.

## Admin user field `telegramId`

To map Telegram users to AdminForth admin users, the adapter looks up an admin user record by Telegram user id.
By default it expects the admin user resource to have a field named `telegramId`.

Add this field to your `adminuser` resource:

```ts
{
  name: 'telegramId',
  type: AdminForthDataTypes.STRING,
  showIn: ['show', 'edit', 'create'],
},
```

If your field is named differently, configure `adminUserTelegramIdField` option (see below).

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
      webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
      //diff-add
      adminUserTelegramIdField: 'telegramId',
      //diff-add
    }),
    //diff-add
  ],
});
```

## Adapter options

All options for `new TelegramChatSurfaceAdapter(options)`:

- `botToken` (string, required) — Telegram bot token from BotFather.
- `webhookSecret` (string, optional) — secret token configured in Telegram `setWebhook`.
- `streamingMode` (`draft` | `typing` | `off`, optional) — streaming behavior for Telegram responses.
  - Default: `draft`.
  - Note: Telegram drafts work only in private chats. In non-private chats the adapter automatically falls back from `draft` to `typing`.
- `draftUpdateIntervalMs` (number, optional) — throttle for draft preview updates.
  - Default: `650`.
- `adminUserTelegramIdField` (string, optional) — admin user field that stores Telegram user id.
  - Default: `telegramId`.
- `adminUserResourceId` (string, optional) — AdminForth resource id that stores admin users.
  - Default: `adminuser`.

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
