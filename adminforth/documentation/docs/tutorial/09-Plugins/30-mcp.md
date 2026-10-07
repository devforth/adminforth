---
title: MCP Server
description: "Expose AdminForth resources and actions to Codex, Claude Code, Gemini, and other MCP clients with per-user revocable auth secrets."
slug: /tutorial/Plugins/mcp
---

# MCP Server

The MCP plugin exposes AdminForth API methods as remote MCP tools. Every request runs as the AdminForth user who created the auth secret, so the same resource permissions, validation, and hooks apply.

Endpoints marked with `agent: { hiddenFromAgents: true }` are not exposed. AdminForth and its plugins mark the endpoints the admin panel uses internally, such as login, two-factor authentication, passkeys, and agent chat. Mark your own endpoints the same way to keep them away from agents.

## Installation

```bash
pnpm add @adminforth/mcp --save
```

## MCP auth secret table

Add a table for independently revocable MCP auth secrets. Only the SHA-256 secret hash is stored; the secret itself is returned once when it is created.

```prisma title="./schema.prisma"
model mcp_auth_secrets {
  id                 String    @id
  name               String
  secret_hash        String    @unique
  user_id            String
  created_at         DateTime
  last_used_at       DateTime?
  last_used_by_agent String?
  read_only          Boolean   @default(false)

  @@index([user_id])
}
```

Run the migration:

```bash
pnpm makemigration --name add-mcp-auth-secrets
pnpm migrate:local
```

Create the resource:

```ts title="./resources/mcpAuthSecrets.ts"
import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'maindb',
  table: 'mcp_auth_secrets',
  resourceId: 'mcp_auth_secrets',
  label: 'MCP Auth Secrets',
  columns: [
    { name: 'id', primaryKey: true, type: AdminForthDataTypes.STRING },
    { name: 'name', type: AdminForthDataTypes.STRING },
    { name: 'secret_hash', type: AdminForthDataTypes.STRING, backendOnly: true },
    { name: 'user_id', type: AdminForthDataTypes.STRING },
    { name: 'created_at', type: AdminForthDataTypes.DATETIME },
    { name: 'last_used_at', type: AdminForthDataTypes.DATETIME, required: false },
    { name: 'last_used_by_agent', type: AdminForthDataTypes.STRING, required: false },
    { name: 'read_only', type: AdminForthDataTypes.BOOLEAN },
  ],
  options: {
    allowedActions: {
      list: false,
      show: false,
      create: false,
      edit: false,
      delete: false,
    },
  },
} as AdminForthResourceInput;
```

Register `mcpAuthSecrets` in the application's `resources` array.

## Plugin setup

Add the plugin to `globalPlugins`:

```ts title="./index.ts"
import AdminForthMcpPlugin from '@adminforth/mcp';

new AdminForth({
  // ...
  globalPlugins: [
    new AdminForthMcpPlugin({
      adminPanelOrigin: 'https://your-adminforth-host.example.com',
      authSecretResource: {
        resourceId: 'mcp_auth_secrets',
        idField: 'id',
        nameField: 'name',
        secretHashField: 'secret_hash',
        userIdField: 'user_id',
        createdAtField: 'created_at',
        lastUsedAtField: 'last_used_at',
        lastUsedByAgentField: 'last_used_by_agent',
        readOnlyField: 'read_only',
      },
    }),
  ],
});
```

The MCP server identifies itself to agents as the AdminForth admin panel for the configured [`customization.brandName`](/docs/tutorial/Customization/branding/). Set `adminPanelOrigin` when the same agent uses several AdminForth installations. Pass only the public origin, such as `https://admin.example.com`; the plugin appends the existing AdminForth `baseUrl` path. The origin is optional and is not inferred from request headers.

The plugin adds **MCP Settings** under the user profile. A user can create or revoke auth secrets there and copy the short setup prompt. Use one auth secret per agent.

The MCP endpoint is:

```text
https://your-adminforth-host.example/adminapi/v1/mcp
```

If `baseUrl` is configured, it appears before `/adminapi/v1/mcp`. Authenticate every request with:

```http
Authorization: Bearer afmcp_...
```

`last_used_at` and `last_used_by_agent` are updated in the background without running resource hooks. Client identity comes from per-request `io.modelcontextprotocol/clientInfo` metadata in MCP `2026-07-28`, with legacy `initialize` and `User-Agent` fallbacks.

## Read-only mode

A read-only auth secret lets an agent only read data. Check **Read only** when you create the auth secret in **MCP Settings**. The mode is stored in `read_only` and cannot be changed later: create a new auth secret instead.

To make every auth secret read-only, set `readOnly: true` in the plugin options. The **Read only** checkbox is then hidden, and new auth secrets are stored as read-only, so they stay read-only if you remove the option later:

```ts
new AdminForthMcpPlugin({
  readOnly: true,
  // ...
}),
```

In read-only mode the server exposes only endpoints marked with `agent: { onlyReadsData: true }`, such as `get_resource`, `get_resource_data`, and `aggregate`. Creating, updating, and deleting records and running actions are not available. To make your own endpoint available in read-only mode, mark it with `onlyReadsData: true`.

## Audit attribution

To show which agent acted on behalf of a user, add a nullable field to the audit log table:

```prisma
executed_by String?
```

Add the column to the audit log resource and map it in `AuditLogPlugin`:

```ts
new AuditLogPlugin({
  resourceColumns: {
    // existing mappings...
    resourceExecutedByColumnName: 'executed_by',
  },
});
```

MCP actions store the agent, version, and auth secret name, for example `codex@1.2.3 | Production Codex`. Actions from `@adminforth/agent` store `af-agent`. Regular user actions leave the field empty. If the mapping is omitted, Audit Log behavior remains unchanged.
