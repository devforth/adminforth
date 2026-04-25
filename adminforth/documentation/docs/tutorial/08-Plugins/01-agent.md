---
title: Agent
slug: /tutorial/Plugins/agent
sidebar_position: 0
---

> TODO: this plugin tutorial is in progress, some information might be missing, we are actively working on it now. If you have any questions regarding this plugin, please reach out to us in GitHub issues


# Agent Plugin

This plugin adds an AI agent with a chat surface to AdminForth which is capable of default skills like searching/editing data and extending with custom skills. 

It stores session history in your own resources and generates responses using one of the configured `modes`.

## Installation

```bash
pnpm i @adminforth/agent --save
pnpm i @adminforth/completion-adapter-openai-responses --save
```

Add your LLM credentials to `.env`:

```env title=.env
...
OPENAI_API_KEY=your_key
```

Each mode accepts any AdminForth completion adapter, so you can replace the OpenAI adapter with another adapter from [List of adapters](/docs/tutorial/ListOfAdapters/).

## Setup

First create two resources for sessions and turns:

```ts title="./resources/agent_resources/sessions.ts"
import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';

async function allowedForSuperAdmins({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: 'sqlite',
  table: 'sessions',
  resourceId: 'sessions',
  label: 'Sessions',
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: () => randomUUID(),
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'title',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'turns',
      type: AdminForthDataTypes.INTEGER,
    },
    {
      name: 'asker_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      fillOnCreate: () => (new Date()).toISOString(),
      showIn: {
        edit: false,
        create: false,
      },
    },
  ],
  options: {
    allowedActions: {
      list: allowedForSuperAdmins,
      show: allowedForSuperAdmins,
      create: false,
      edit: false,
      delete: false,
    },
  },
} as AdminForthResourceInput;
```

```ts title="./resources/agent_resources/turns.ts"
import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';

async function allowedForSuperAdmins({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: 'sqlite',
  table: 'turns',
  resourceId: 'turns',
  label: 'Turns',
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: () => randomUUID(),
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'session_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATE,
      fillOnCreate: () => (new Date()).toISOString(),
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'prompt',
      type: AdminForthDataTypes.TEXT,
    },
    {
      name: 'response',
      type: AdminForthDataTypes.TEXT,
    },
  ],
  options: {
    allowedActions: {
      list: allowedForSuperAdmins,
      show: allowedForSuperAdmins,
      create: false,
      edit: false,
      delete: false,
    },
  },
} as AdminForthResourceInput;
```

`asker_id` must store the current admin user's primary key, and `created_at` should be filled automatically because the plugin sorts sessions and turns by it. The `turns` field can stay nullable, but the plugin configuration still expects it.

Add matching tables to your schema:

```prisma title='./schema.prisma'
model sessions {
  id         String   @id
  title      String
  turns      Int?
  asker_id   String
  created_at DateTime
}

model turns {
  id         String   @id
  session_id String
  created_at DateTime
  prompt     String?
  response   String?
}
```

Run migration:

```bash
pnpm makemigration --name add-adminforth-agent-tables ; pnpm migrate:local
```

Register both resources in your app:

```ts title="./index.ts"
import sessions_resource from './resources/agent_resources/sessions.js';
import turns_resource from './resources/agent_resources/turns.js';

export const admin = new AdminForth({
  ...
  resources: [
    ...
    sessions_resource,
    turns_resource,
  ],
  ...
});
```

Then attach the plugin once, usually to your `adminuser` resource:

Configure the plugin with `modes`. The legacy top-level `completionAdapter` setup is no longer used.

```ts title="./resources/adminuser.ts"
import AdminForthAgent from '@adminforth/agent';
import CompletionAdapterOpenAIResponses from '@adminforth/completion-adapter-openai-responses';

...

plugins: [
  ...
  new AdminForthAgent({
    // optional, can be used to suggest example prompts in the UI
    // placeholderMessages: async ({ adminUser, httpExtra }) => {
    //   return [
    //     'What is a cars count in SQLite',
    //     'Build average car price by days chart in SQLite',
    //   ];
    // },
    modes: [
      {
        name: 'Balanced',
        completionAdapter: new CompletionAdapterOpenAIResponses({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: 'gpt-5.4-mini',
          extraRequestBodyParameters: {
            reasoning: {
              effort: 'medium',
            },
          },
        }),
      },
      {
        name: 'Fast',
        completionAdapter: new CompletionAdapterOpenAIResponses({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: 'gpt-5.4-mini',
          extraRequestBodyParameters: {
            reasoning: {
              effort: 'low',
            },
          },
        }),
      },
      {
        name: 'Smart Thinking',
        completionAdapter: new CompletionAdapterOpenAIResponses({
          openAiApiKey: process.env.OPENAI_API_KEY as string,
          model: 'gpt-5.4',
          extraRequestBodyParameters: {
            reasoning: {
              effort: 'xhigh',
            },
          },
        }),
      },
    ],
    maxTokens: 10000,
    sessionResource: {
      resourceId: 'sessions',
      idField: 'id',
      titleField: 'title',
      turnsField: 'turns',
      askerIdField: 'asker_id',
      createdAtField: 'created_at',
    },
    turnResource: {
      resourceId: 'turns',
      idField: 'id',
      sessionIdField: 'session_id',
      createdAtField: 'created_at',
      promptField: 'prompt',
      responseField: 'response',
      // optional
      // debugField: 'debug',
    },
    // optional, see the "Persistent checkpointer" section below
    // checkpointResource: { ... },
  }),
]
```

Each item in `modes` defines a user-selectable preset in the chat UI. The selected mode is sent to the backend and the plugin uses that mode's `completionAdapter` for the response.

The plugin adds a chat surface to the admin UI, keeps session history per admin user, and shows a mode picker when `modes` are configured.

# Using with self-hosted models

`CompletionAdapterOpenAIResponses` when works with agent plugin, under the hood uses the LangChain internal proxy called `OpenAIChat` (in LangChain they call it "provider"). This proxy is capable with a fresh versions of OpenAI-compatible Responses APIs, for example [self-hosted latest versions of vLLM installations](https://devforth.io/insights/self-hosted-gpt-real-response-time-token-throughput-and-cost-on-l4-l40s-and-h100-for-gpt-oss-20b/)
To use them, just point the adapter to your local vLLM server:


```ts
completionAdapter: new CompletionAdapterOpenAIResponses({
  openAiApiKey: process.env.MY_API_KEY as string, // if you use authorization
  baseUrl: 'http://my_local_vllm_server:8000/v1',  
  model: 'gpt-oss-120b',
})
```

However some of 3rd party providers might serve outdated vLLM and still don't fully support the Responses API needed for langchain internal implmentation, for example [OVH AI Endpoints](https://www.ovhcloud.com/en/public-cloud/ai-endpoints/) in Responses mode still don't play well with langchain proxy (25 Apr 2026)

In that case you can try to use the OpenAI Complition API mode of the plugin, which is less efficient but more compatible with older APIs, you can force Chat Completions API mode with `useComplitionApi: true`:

```ts
completionAdapter: new CompletionAdapterOpenAIResponses({
  openAiApiKey: process.env.OVH_AI_ENDPOINTS_ACCESS_TOKEN as string,
  baseUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
  model: 'gpt-oss-120b',
  useComplitionApi: true,
})
```

OVH AI Endpoints still does not fully support the OpenAI `responses` API, so `useComplitionApi: false` may work unstably there.




## Writing own skills

You can write own skills by following [SKILL.md Agennt Skills](https://agentskills.io/)

For example we will write a skill which can summarizes backoffice data stats like record counts by resources and send it to user email.

It may handle prompts like

```
Please send record counts for all resources to my email
```

Or:

```
Please send record counts to all admin users
```

### Writing custom tools

To define a custom tool you should simply define an express API route in your app using `admin.express.withSchema` wrapper which makes the route available for the agent (clear and predictable schema is a crucial part of making the tool work well).

If you are using `admin.express.authorize` wrapper for authorization, adminuser will be injected atomatically from user which sits on the surface and controls the agent. In other words all permissions and access rights of the agent are defined by the admin user which is controlling this agent. At the same time all actions done by agent are automatically attributed in the audit log to the admin user which is controlling the agent.

This example uses the same email adapter pattern shown in the Email Invite and Email Password Reset plugins. The transport below uses Mailgun only to keep the snippet short; you can replace it with SES or any other adapter from [List of adapters](/docs/tutorial/ListOfAdapters/).

```ts title="./api.ts"
import type { Express, Response } from 'express';
import { Filters, type IAdminForth, type IAdminUserExpressRequest } from 'adminforth';
import * as z from 'zod';
import EmailAdapterMailgun from '@adminforth/email-adapter-mailgun';

const agentEmailAdapter = new EmailAdapterMailgun({
  apiKey: process.env.MAILGUN_API_KEY as string,
  domain: process.env.MAILGUN_DOMAIN as string,
  baseUrl: process.env.MAILGUN_REGION_URL || 'api.mailgun.net',
});
const agentSendFrom = process.env.AGENT_SEND_FROM_EMAIL as string;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderEmailHtml(body: string) {
  return `<html><body><pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(body)}</pre></body></html>`;
}

export function initApi(app: Express, admin: IAdminForth) {
  app.post('/send_email_to_user',
    admin.express.withSchema(
      {
        description: 'Send an email to one AdminForth user by id. Use this after the user row is resolved.',
        request: z.object({
          userId: z.string(),
          subject: z.string().min(1),
          body: z.string().min(1),
        }),
        response: z.object({
          ok: z.boolean(),
          email: z.string().email().optional(),
          error: z.string().optional(),
        }),
      },
      admin.express.authorize(
        async (req: IAdminUserExpressRequest, res: Response) => {
          const { userId, subject, body } = req.body as {
            userId: string;
            subject: string;
            body: string;
          };

          await agentEmailAdapter.validate();

          const user = await admin.resource('adminuser').get(
            Filters.EQ('id', userId),
          );

          if (!user || typeof user.email !== 'string' || !user.email) {
            res.status(404).json({ ok: false, error: 'User not found' });
            return;
          }

          const result = await agentEmailAdapter.sendEmail(
            agentSendFrom,
            user.email,
            body,
            renderEmailHtml(body),
            subject,
          );

          if (!result.ok) {
            res.status(500).json({ ok: false, error: result.error ?? 'Failed to send email' });
            return;
          }

          res.json({ ok: true, email: user.email });
        }
      )
    )
  );
}
```

## Define skills instructions

Custom skills live in your app's custom directory. The agent loads project skills from:

- `custom/skills/<skill_name>/SKILL.md`

Also it can load skills from plugins, it allows other plugins to expose their own skills and tools:

- `custom/plugins/adminforth-agent/skills/<skill_name>/SKILL.md`

Each skill needs YAML frontmatter with `name` and `description`. The `description` is the discovery surface, so include the phrases the admin is likely to type in chat. Skills are not loaded automcatically, agent loads them 
on demand once understands that `description` of the skill matches the user intent, so keep the description clear and concise.

Tools are also not loaded automatically, the agent loads them only if they are mentioned in the skill instructions. Then agent calls `fetch_tool_schema` meta tool to load actual schema of your custom tool.

Tool names are derived from route paths. If you want the tool name to be exactly `send_email_to_user`, register the route as `/send_email_to_user`.

The example below creates a minimal user skill which:

- resolves a user row
- reads the `total` count for each resource with `get_resource_data`
- sends the final report by email with `send_email_to_user`

Create the skill in your app custom folder:

```md title="./custom/skills/email_resource_counts/SKILL.md"
---
name: email_resource_counts
description: Email record counts for each AdminForth resource to a user. Use when the user asks to send resource counts or all-record statistics by email.
---

# Involved tools

Use `send_email_to_user` to send the final report after you have one exact target user row.

# Instructions

- For each resource in system use fetch data default skill to collect total count of records in each resource.
- Create html report in format `Resource Label (resourceId): count` for each resource on a new line, sort resources by count in descending order. 
- Use modern, stylish but compatible html formatting in the email.
- Call `send_email_to_user` with the resolved user primary key, the final subject, and the final plain text body.
- After the tool succeeds, tell the user the email was sent and include a short summary in chat.
```

This way allows to extend your agent with literally any custom instructions and tools and make it do complex tasks related to your backoffice data and operations.


## Standard skills


## Persistent checkpointer

If you do not configure `checkpointResource`, the plugin falls back to an in-memory `MemorySaver`. This is fine for local testing, but checkpoints are lost on process restart.

If you want persistent LangGraph checkpoints between requests, add a dedicated resource and pass it via `checkpointResource`.

You can use your own table and field names. The plugin does not require a specific schema name, only a mapping for these logical fields:

- `idField`
- `threadIdField`
- `checkpointNamespaceField`
- `checkpointIdField`
- `parentCheckpointIdField`
- `rowKindField`
- `taskIdField`
- `sequenceField`
- `createdAtField`
- `checkpointPayloadField`
- `metadataPayloadField`
- `writesPayloadField`
- `schemaVersionField`

Create a resource for checkpoint rows:

```ts title="./resources/agent_resources/checkpoints.ts"
import { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput } from 'adminforth';

export default {
  dataSource: 'sqlite',
  table: 'checkpoints',
  resourceId: 'checkpoints',
  label: 'Checkpoints',
  recordLabel: (record) => record.id,
  options: {
    allowedActions: {
      create: false,
      edit: false,
    },
  },
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'thread_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'checkpoint_ns',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'checkpoint_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'parent_checkpoint_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'row_kind',
      type: AdminForthDataTypes.STRING,
      enum: [
        { value: 'checkpoint', label: 'Checkpoint' },
        { value: 'writes', label: 'Writes' },
      ],
    },
    {
      name: 'task_id',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'seq',
      type: AdminForthDataTypes.INTEGER,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'checkpoint_payload',
      type: AdminForthDataTypes.JSON,
      showIn: {
        list: false,
      },
    },
    {
      name: 'metadata_payload',
      type: AdminForthDataTypes.JSON,
      showIn: {
        list: false,
      },
    },
    {
      name: 'writes_payload',
      type: AdminForthDataTypes.JSON,
      showIn: {
        list: false,
      },
    },
    {
      name: 'schema_version',
      type: AdminForthDataTypes.INTEGER,
    },
  ],
} as AdminForthResourceInput;
```

Add a matching table to your schema:

```prisma title='./schema.prisma'
model checkpoints {
  id                   String   @id
  thread_id            String
  checkpoint_ns        String
  checkpoint_id        String
  parent_checkpoint_id String?
  row_kind             String
  task_id              String?
  seq                  Int
  created_at           DateTime
  checkpoint_payload   String?
  metadata_payload     String?
  writes_payload       String?
  schema_version       Int

  @@index([thread_id, checkpoint_ns, checkpoint_id])
}
```

The payload fields can be stored as strings. The plugin serializes and deserializes checkpoint JSON on its own. The composite index on `(thread_id, checkpoint_ns, checkpoint_id)` is recommended because the checkpointer filters rows by these columns.

Run migration:

```bash
pnpm makemigration --name add-adminforth-agent-checkpoints ; pnpm migrate:local
```

Register the resource in your app:

```ts title="./index.ts"
import checkpoints_resource from './resources/agent_resources/checkpoints.js';
import sessions_resource from './resources/agent_resources/sessions.js';
import turns_resource from './resources/agent_resources/turns.js';

export const admin = new AdminForth({
  ...
  resources: [
    ...
    sessions_resource,
    turns_resource,
    checkpoints_resource,
  ],
  ...
});
```

Then connect it to the plugin:

```ts title="./resources/adminuser.ts"
new AdminForthAgent({
  modes: [
    ...
  ],
  sessionResource: {
    resourceId: 'sessions',
    idField: 'id',
    titleField: 'title',
    turnsField: 'turns',
    askerIdField: 'asker_id',
    createdAtField: 'created_at',
  },
  turnResource: {
    resourceId: 'turns',
    idField: 'id',
    sessionIdField: 'session_id',
    createdAtField: 'created_at',
    promptField: 'prompt',
    responseField: 'response',
  },
  checkpointResource: {
    resourceId: 'checkpoints',
    idField: 'id',
    threadIdField: 'thread_id',
    checkpointNamespaceField: 'checkpoint_ns',
    checkpointIdField: 'checkpoint_id',
    parentCheckpointIdField: 'parent_checkpoint_id',
    rowKindField: 'row_kind',
    taskIdField: 'task_id',
    sequenceField: 'seq',
    createdAtField: 'created_at',
    checkpointPayloadField: 'checkpoint_payload',
    metadataPayloadField: 'metadata_payload',
    writesPayloadField: 'writes_payload',
    schemaVersionField: 'schema_version',
  },
});
```

If your existing checkpoint table already uses different column names, keep your schema and only change the field mapping in `checkpointResource`.

## Reverse proxy and CDN configuration for streaming

The agent streams responses from `<baseURL>/adminapi/v1/agent/response` using server-sent events, where `<baseURL>` is your AdminForth base path or an empty string when deployed at the domain root. If your proxy buffers responses, the UI will receive the answer only after generation is finished.

For Nginx, disable response buffering on this endpoint. The critical line is `proxy_buffering off;`.

```nginx
location <baseURL>/adminapi/v1/agent/response {
  proxy_http_version 1.1;
  proxy_read_timeout 600s;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header Host $http_host;
  proxy_set_header Connection "";
  proxy_buffering off;  # required for streaming
  proxy_pass http://127.0.0.1:3500;
}
```

Traefik forwards streaming responses immediately by default. The line that must stay off this route is any buffering middleware attachment such as `traefik.http.routers.adminforth-agent.middlewares=buffering@docker`. If your main router uses extra middlewares, create a dedicated router for the agent stream endpoint and do not attach buffering to it:

```yaml title='./compose.yml'
services:
  adminforth:
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.adminforth.loadbalancer.server.port=3500"

      - "traefik.http.routers.adminforth.rule=PathPrefix(`/`)"
      - "traefik.http.routers.adminforth.tls=true"
      - "traefik.http.routers.adminforth.tls.certresolver=myresolver"
      - "traefik.http.routers.adminforth.middlewares=secure-headers,buffering@docker"

      - "traefik.http.routers.adminforth-agent.rule=Path(`<baseURL>/adminapi/v1/agent/response`)"
      - "traefik.http.routers.adminforth-agent.priority=100"
      - "traefik.http.routers.adminforth-agent.service=adminforth"
      - "traefik.http.routers.adminforth-agent.tls=true"
      - "traefik.http.routers.adminforth-agent.tls.certresolver=myresolver"
      # keep buffering OFF for SSE
      # do not add:
      # - "traefik.http.routers.adminforth-agent.middlewares=buffering@docker"
```

  Replace `<baseURL>` with the same base path you use for AdminForth. For example, when `ADMIN_BASE_URL = '/admin/'`, the endpoint becomes `/admin/adminapi/v1/agent/response`.

### CDN

  Cloudflare by default buffers responses, which breaks streaming. To fix it, create a page rule for your domain with a "Response Body Buffering" setting turned off for the agent stream endpoint (`<baseURL>/adminapi/v1/agent/response`).

![alt text](image-6.png)


