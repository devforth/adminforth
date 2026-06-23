---
slug: open-source-agent-existing-database
title: "Your Database Already Breathes: Connect an Open-Source Agent to It"
authors: ivanb
tags: [agent, database, plugin]
---

<div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', marginBottom: '2rem' }}>
  <iframe
    src="https://www.youtube.com/embed/4tB8uzY__uk"
    title="AdminForth video demo"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
  />
</div>

Your data is already there.
Your database is already breathing.
But your back office is still buried under weeks of repetitive work.

AdminForth breaks the cage.

It lets you build secure, powerful, agent-ready admin panels on top of your existing database without surrendering your code, your architecture, or your freedom to a closed SaaS.

Not a rented dashboard.
Not another CRUD graveyard.
Not a black box between you and your data.

Your back office. Your rules. Your agents.

<!-- truncate -->

## Agent-first, not agent-themed

The point is not to glue a chatbot onto a table and call it innovation.

The point is to let agents do real work inside a real back office.

Inside AdminForth, agents can search, analyze, explain, mutate, automate, and help operate business data through the same system your team already uses. The [Agent plugin](/docs/tutorial/Plugins/agent/) adds the AI chat surface, persistent sessions in your own database, and the ability to extend the system with custom skills.

Because the system stays yours, the agent stays grounded in your rules:

- your schema
- your permissions
- your audit trail
- your deployment
- your custom logic

That matters. Useful AI in operations is not decoration. It is constrained power.

## Open source and fully yours

No vendor lock.
No hidden control plane.
No rented future.

AdminForth gives you a strong foundation, but the system remains yours: your code, your database, your infrastructure, your deployment pipeline, your custom pages, your Vue components, your npm packages, your actions, your dashboards.

AdminForth is not here to limit your architecture.
It is here to become part of it.

## Built for serious systems

Sooner or later, every internal tool grows teeth. That is when throwaway admin panels start collapsing under the weight of reality.

AdminForth starts where serious systems usually end up:

- authentication and authorization
- roles and access control
- audit logs
- file uploads
- background jobs
- imports and exports
- Markdown and rich text editors
- AI completion and AI automation
- developer-native Vue 3 customization

And around that core sits a growing plugin arsenal for real operations: Agent, Two-Factor Authentication, Foreign Inline List, Foreign Inline Show, Audit Log, Upload, Markdown, Rich Editor, Email Password Reset, Email Invite, Import Export, Open Signup, i18n, OAuth Authentication, Inline Create, List In-Place Edit, Text Complete, Bulk AI Flow, Universal Search, Quick Filters, Login Captcha, User Soft Delete, Clone Row, Many2Many, Background Jobs, and Auto Remove.

## A short path from existing database to working back office

If you already have a local-running database you can point AdminForth at, you can have a working back office in minutes.


### No database yet or you don't trust yours yet?

Then do not stop here. Ask your coding agent to run this prompt:

- [Create PG with orders prompt](https://gist.github.com/ivictbor/077c2442ce03ece5fd1a092752eabbff)

That prompt brings up a minimal Postgres instance in Docker Compose on port `54322`, creates an `orders` table, fills it with 1000 random rows, and verifies the result with `psql`.

After that, come back and point `create-app` at it.


## Creating app

Here is a small example with an existing Postgres database that already contains an `orders` table:

```bash
npx adminforth create-app --app-name orders-backoffice --db "postgresql://pg:1@localhost:54322/app"
cd orders-backoffice
```

This command scaffolds the app, installs dependencies, writes the base AdminForth files, creates the default `adminuser` resource config, adds environment files, ships Dockerfile and agent-facing docs hints such as `AGENTS.md`, and points the project at your existing database URL.

If you omit the flags and run just `npx adminforth create-app`, the CLI asks for:

- app name
- database URL
- package manager
- whether to include Prisma migrations

In this repo and in AdminForth examples we use `pnpm`, so choose `pnpm` when prompted.

For this article's flow, choose `No` when the CLI asks `Include Prisma migrations? >`. The reason is simple: you already have an existing database URL and you already manage schema changes yourself, so this back office should attach to that database instead of introducing a second migration flow.

The important part in this article is the flow: your database already exists, and you keep managing its schema with the migration tool or process you already trust.

If you are starting from a brand-new empty database with no existing schema and no business data yet, the Prisma-backed getting-started flow is usually the better fit. It is useful when you want AdminForth to help bootstrap a fresh back office from zero. This post is about the opposite case: an existing database that already matters.

## If you use an existing DB, create `adminuser` yourself

This is the one part people often skip on the first pass.

`create-app` gives you the `adminuser` resource configuration, but the matching `adminuser` table still has to exist in your database, created by your own schema-management process.

At minimum it should contain:

```text
adminuser
- id - string
- email - unique string
- password_hash - string
- role - string
- created_at - datetime
```

Once that table exists, the generated app can seed the first admin account automatically on startup when the table is empty. That is what turns the door handle. Without it, there is no one to log in as.

## Import your `orders` resource

Now import the business table you actually care about:

```bash
npx adminforth resource
```

Choose `maindb.orders` in the interactive search.

The command discovers the table columns, generates `resources/orders.ts`, and injects the new resource into `index.ts` for you. From there you already have a working operational surface over your existing data, and you can refine labels, permissions, record presentation, or custom views later.

## Then let the agent in

The Agent plugin is practical, but it is not magic. It needs its own persistence layer for chat sessions and turns.

In AdminForth terms, that means creating and registering `sessions` and `turns` tables/resources, attaching `@adminforth/agent`, and configuring a completion adapter such as `@adminforth/completion-adapter-openai-responses` together with your `OPENAI_API_KEY`.

If you are using a coding agent, give it this short prompt:

```text
Add the AdminForth Agent plugin to this app, create the required sessions and turns tables/resources for it to work using this project's existing schema-management flow, register them, attach the plugin to adminuser, and add the needed env vars.
```

That is enough context for a strong coding agent to wire the plugin in correctly while staying inside the AdminForth contract.



## Who this is for

For individuals and small teams: ship before others finish planning. AdminForth gives small teams a serious back-office foundation without losing weeks to boilerplate.

For professionals and larger teams: when operations grow, chaos grows with them. AdminForth gives teams a controlled, extensible system for data, users, permissions, workflows, automation, and audit trails without forcing the company into someone else's platform.

For agent-native products: your product already has data, your team already has questions, and your users already need actions. AdminForth gives agents a safe, structured place to work with real back-office data.

## Why teams keep it

Move faster. Skip the admin panel grind and start from a serious foundation.

Stay in control. Your code. Your database. Your infrastructure. Your rules.

Unlock AI automation. Bring agents into the back office where they can actually save time: searching, analyzing, filling, translating, generating, and helping operate your data.

Scale without chaos. Roles, permissions, audit logs, background jobs, filters, uploads, and custom workflows keep the system understandable when the company gets larger.

Build without compromise. Open-source power. No vendor lock. No black boxes. No surrender.

Your data is already there.

Now give it a back office that can work.