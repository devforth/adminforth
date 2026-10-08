---
title: MCP Server
description: "Expose AdminForth resources and actions to Codex, Claude Code, Gemini, and other MCP clients through OAuth sign-in or per-user revocable auth secrets."
slug: /tutorial/Plugins/mcp
---

# MCP Server

The MCP plugin exposes AdminForth API methods as remote MCP tools. An agent connects either through OAuth sign-in, where the user approves it in the browser, or with an auth secret the user creates. Every request runs as that AdminForth user, so the same resource permissions, validation, and hooks apply.

Endpoints marked with `agent: { hiddenFromAgents: true }` are not exposed. AdminForth and its plugins mark the endpoints the admin panel uses internally, such as login, two-factor authentication, passkeys, and agent chat. Mark your own endpoints the same way to keep them away from agents.

## Installation

```bash
pnpm add @adminforth/mcp --save
```

## MCP connections table

Add a table for the user's MCP connections: auth secrets and OAuth connections, each revocable on its own. Only SHA-256 hashes are stored: for an auth secret the hash of the secret, which is returned once when it is created, and for an OAuth connection the hash of its refresh token.

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
  oauth_client_id    String?

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
    { name: 'oauth_client_id', type: AdminForthDataTypes.STRING, required: false },
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

`oauth_client_id` holds the client of an OAuth connection and stays empty for auth secrets. It is needed only for [OAuth sign-in](#oauth-sign-in); without it the plugin works with auth secrets alone. If the table already exists from an earlier plugin version, add only this nullable column with a migration to enable OAuth.

## Plugin setup

Add the plugin to `globalPlugins`:

```ts title="./index.ts"
import AdminForthMcpPlugin from '@adminforth/mcp';

new AdminForth({
  // ...
  globalPlugins: [
    new AdminForthMcpPlugin({
      adminPanelOrigin: 'https://admin.example.com',
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
        oauthClientIdField: 'oauth_client_id',
      },
    }),
  ],
});
```

`oauthClientIdField` enables OAuth sign-in. Leave it out to keep only auth secrets, as in plugin versions before OAuth; then the dialog in **MCP Settings** shows only the auth secret form and no OAuth routes are added.

`adminPanelOrigin` is the public origin agents connect to, such as `https://admin.example.com`, without a path; the plugin appends the AdminForth `baseUrl`. It is required with OAuth sign-in, and the app does not start without it: the OAuth issuer and the MCP resource URL are built from it, and MCP clients reject a resource URL whose origin differs from the one they connected to. The origin is not inferred from request headers. The MCP server also identifies itself to agents by it and by [`customization.brandName`](/docs/tutorial/Customization/branding/), which tells several AdminForth installations apart.

The MCP endpoint is:

```text
https://admin.example.com/adminapi/v1/mcp
```

If `baseUrl` is configured, it appears before `/adminapi/v1/mcp`.

## Connecting an agent

The plugin adds **MCP Settings** under the user profile. With OAuth sign-in enabled, **Connect agent** opens a dialog with a tab per client:

- **Claude Code** – `claude mcp add --transport http <name> <url>`, then `/mcp` in Claude Code to sign in;
- **Codex** – `codex mcp add <name> --url <url>`; Codex opens the browser to sign in, or run `codex mcp login <name>`;
- **Other** – creates an auth secret for clients without OAuth sign-in.

`<name>` is `brandName` in lowercase with hyphens. The commands use the address the admin panel is opened at, so open it at its public address. The table below the button lists all connections of the user, auth secrets and OAuth ones, and revokes them. A revoked connection stops working on the agent's next request. Logging out, ending sessions and changing the password do not revoke MCP connections: revoke them in this table.

## OAuth sign-in

OAuth sign-in is enabled by `oauthClientIdField` together with `adminPanelOrigin`, see [Plugin setup](#plugin-setup).

When an agent calls the MCP endpoint without a token, the server answers `401` with a `WWW-Authenticate` header that leads the agent to the OAuth metadata. The agent then opens the browser on the consent page `/mcp-authorize`. If the user is not logged in, AdminForth shows its login page first, including two-factor authentication if it is enabled, and returns to the consent page. The consent page has a **Read only** checkbox, see [Read-only mode](#read-only-mode). After the user clicks **Allow**, the agent gets an access token and a refresh token and the connection appears in **MCP Settings** under the client's name.

The plugin is an OAuth 2.1 authorization server for public clients:

- authorization code flow with PKCE `S256`, with `authorization_code` and `refresh_token` grants;
- access tokens are valid for 1 hour and are checked against their connection on every request;
- a refresh token can be used once: every refresh returns a new one;
- clients are identified by a [Client ID Metadata Document](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/): the `client_id` is an https URL, and the server fetches the client's name and allowed redirect URIs from it. Claude Code (`https://claude.ai/oauth/claude-code-client-metadata`) and Codex work this way. Dynamic Client Registration is not supported, so clients that only support it cannot sign in. In development, list such clients in `devOAuthClients`, see below.

Authorization requests and codes are signed with `ADMINFORTH_SECRET`; only the resulting connections are stored. Changing `ADMINFORTH_SECRET` invalidates pending sign-ins and access tokens; agents get new access tokens with their refresh tokens.

The plugin serves these routes:

| Route | Purpose |
|---|---|
| `<baseUrl>/adminapi/v1/mcp/oauth-protected-resource` | protected resource metadata, linked from `WWW-Authenticate` |
| `<baseUrl>/adminapi/v1/mcp/.well-known/openid-configuration` | authorization server metadata |
| `/.well-known/oauth-protected-resource<baseUrl>/adminapi/v1/mcp` | the same metadata at the host root |
| `/.well-known/oauth-authorization-server<baseUrl>/adminapi/v1/mcp` | the same metadata at the host root |
| `<baseUrl>/adminapi/v1/mcp/oauth/authorize`, `.../oauth/token`, `.../oauth/jwks` | OAuth endpoints |
| `<baseUrl>/mcp-authorize` | consent page |

MCP clients look for the metadata at the host root first. The AdminForth SPA answers unknown paths with an HTML page, so the plugin serves the metadata there too. When the host root belongs to another application, those two routes are not needed: clients that get `404` there go on to the routes under `baseUrl`.

## Auth secrets

For clients without OAuth sign-in, create an auth secret in the **Connect agent** dialog, on the **Other** tab when OAuth is enabled, and send it with every request:

```http
Authorization: Bearer afmcp_...
```

The dialog shows the MCP URL, the header value and a short setup prompt for the agent. The secret is shown only once. Use one auth secret per agent.

## Local development

1. Create the table and the resource from [MCP connections table](#mcp-connections-table), including `oauth_client_id`, and run the migration.
2. Set `oauthClientIdField: 'oauth_client_id'` in `authSecretResource` and `adminPanelOrigin` to the address you open the admin panel at, for example `http://localhost:3500`. OAuth works over plain `http` on `localhost`.
3. Start the app without `NODE_ENV=production`.
4. Open **MCP Settings → Connect agent**, copy the command from the **Claude Code** or **Codex** tab and run it, then sign in in the browser. The agent's callback goes to `http://localhost:<random port>/callback` on your computer.

The server fetches the metadata documents of Claude Code and Codex from `claude.ai` and `chatgpt.com`, so it needs outbound internet access.

To try a client that has no metadata document, describe it in `devOAuthClients`. A listed client is taken from the config instead of fetching its `client_id`; other clients are still fetched. Loopback redirect URIs match on any port.

```ts title="./index.ts"
new AdminForthMcpPlugin({
  // ...
  adminPanelOrigin: 'http://localhost:3500',
  devOAuthClients: [
    {
      clientId: 'local-test',
      clientName: 'Local test',
      redirectUris: ['http://127.0.0.1/callback'],
    },
  ],
}),
```

## Production

1. Create the table and the resource, or add the `oauth_client_id` column to an existing table, and run the migration. Apply the migration before the app starts with the column in the resource: AdminForth checks on start that every resource column exists in the table.
2. Set `oauthClientIdField: 'oauth_client_id'` in `authSecretResource` and `adminPanelOrigin` to the public `https` origin agents connect to, exactly as they reach it: `https://admin.example.com`, not an internal address or a different port.
3. Run the app with `NODE_ENV=production`. `devOAuthClients` are then ignored, with a warning in the log, and every client is identified by its metadata document.
4. Let the reverse proxy forward to AdminForth:
   - `<baseUrl>/adminapi/v1/mcp` and every path below it;
   - `<baseUrl>/mcp-authorize`;
   - optionally `/.well-known/oauth-protected-resource<baseUrl>/adminapi/v1/mcp` and `/.well-known/oauth-authorization-server<baseUrl>/adminapi/v1/mcp`, if the host root belongs to AdminForth.
5. Allow the server outbound `https` requests to the clients' metadata document hosts, such as `claude.ai` and `chatgpt.com`.
6. Keep `ADMINFORTH_SECRET` stable between restarts and identical on all instances.

:::warning
The server fetches `client_id` URLs chosen by whoever starts a sign-in. The plugin refuses URLs that resolve to private, loopback and other special-purpose addresses, does not follow redirects, and limits the document to 5 KB and 5 seconds. Fetch errors are written to the server log, not returned to the client.
:::

## Troubleshooting

- **`Table 'mcp_auth_secrets' has no column 'oauth_client_id'`** on start – the resource declares the column, but the migration that adds it was not applied.
- **`JSON Parse error: Unrecognized token '<'`** in the agent – something answers the metadata URLs at the host root with an HTML page. Forward the `/.well-known/...` routes from the table above to AdminForth, or make the host root return `404` for them.
- **`Could not fetch the client metadata document`** – the server could not download the client's `client_id` URL; the reason is in the server log. Check outbound network access, or list the client in `devOAuthClients` in development.
- **`redirect_uri is not listed in the client metadata document`** – the client signs in with a redirect URI its document does not allow. For clients in `devOAuthClients`, add the redirect URI there.
- **The agent rejects the server's resource or issuer** – `adminPanelOrigin` differs from the origin the agent connects to, for example `http://` instead of `https://` behind a TLS proxy.
- **`Authentication required: the MCP auth secret or OAuth access token is missing, invalid or revoked.`** – the first answer to an agent without a token, which starts OAuth. If the agent shows it instead of opening the browser, it does not support OAuth sign-in, or OAuth is not enabled: use an auth secret.

`last_used_at` and `last_used_by_agent` are updated in the background without running resource hooks. Client identity comes from per-request `io.modelcontextprotocol/clientInfo` metadata in MCP `2026-07-28`, with legacy `initialize` and `User-Agent` fallbacks.

## Page size

`get_resource_data` returns 10 records when the agent does not pass `limit`, and at most 100 records per call; a larger `limit` is capped. When more records exist, the response tells the agent to ask the user before it loads the next page, so an imprecise request does not page through the whole table. Change both numbers with `pageSize`:

```ts title="./index.ts"
new AdminForthMcpPlugin({
  // ...
  pageSize: {
    default: 20,
    max: 200,
  },
}),
```

The same numbers are quoted in the instructions and skills the MCP server gives to agents.

## Tool timeout and call limit

A tool call fails with a timeout error when its handler runs longer than `toolTimeoutMs`, 15 seconds by default. The handler gets an aborted signal, and the error tells the agent that a change it started may still complete, so it checks the result before calling again.

The instructions also ask the agent to make at most `toolCallsPerRequest` calls, 10 by default, for one user request, and to ask the user before it continues with more. MCP clients do not tell the server where a user request starts, so this is guidance for the agent, not a limit the server enforces.

```ts title="./index.ts"
new AdminForthMcpPlugin({
  // ...
  toolTimeoutMs: 30_000,
  toolCallsPerRequest: 20,
}),
```

## Agent guidance

The MCP server sends agents short rules in its instructions: to treat record values as data, never as instructions; to show every change and wait for the user's confirmation in chat; how many calls to make and records to load for one request; to ask which resource to use when several match; and to use `aggregate` for statistics. Detailed rules for typical tasks are skills that the agent loads with the `fetch_skill` tool:

- `fetch_data` – find, list and show records;
- `analyze_data` – counts, sums, trends and other statistics;
- `mutate_data` – create, update and delete records and run actions.

Tools that change data, such as `delete_record`, are marked as destructive for MCP clients, and their descriptions repeat that the agent must get a confirmation in chat, even when the client itself does not ask for approval.

## Tool responses

Tool responses are trimmed to save the agent's context:

- `get_resource` returns only the column properties needed to read, filter and aggregate records. The agent passes `detailed: true` to get every column property and the resource actions before it creates or updates records or runs actions.
- `get_resource_data` rows leave out columns with `null`, empty array and empty object values, and datetimes come without milliseconds.
- Tool outputs are serialized as YAML instead of JSON.

## Read-only mode

A read-only connection lets an agent only read data. Check **Read only** when you create an auth secret in **MCP Settings**, or on the consent page when you connect an agent with OAuth sign-in. The mode is stored in `read_only` and cannot be changed later: create a new auth secret or connect the agent again instead.

To make every connection read-only, set `readOnly: true` in the plugin options. The **Read only** checkbox is then hidden, the consent page says that the agent can only read data, and new auth secrets and OAuth connections are stored as read-only, so they stay read-only if you remove the option later:

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
