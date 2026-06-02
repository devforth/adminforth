# AdminForth - powerfull Agent-first Typescript admin panel framework


<a href="https://adminforth.dev"><img src="https://img.shields.io/badge/website-adminforth.dev-blue" style="height:24px"/></a> <a href="https://adminforth.dev"><img src="https://img.shields.io/npm/dw/adminforth" style="height:24px"/></a> <a href="https://devforth.io"><img src="https://raw.githubusercontent.com/devforth/OnLogs/e97944fffc24fec0ce2347b205c9bda3be8de5c5/.assets/df_powered_by.svg" style="height:28px"/></a>

[![Ask AI](http://tluma.ai/badge)](http://tluma.ai/ask-ai/devforth/adminforth)

* [Try live demo](https://demo.adminforth.dev/) 

* [YouTube video: build agentic admin panel in a minutes](https://www.youtube.com/watch?v=4tB8uzY__uk)

* [Hello world in 5 minutes](https://adminforth.dev/docs/tutorial/gettingStarted) with AdminForth

* [Tutorial](https://adminforth.dev/docs/tutorial/Customization/branding/)

<br/>

<div align="center">
  <img src="https://github.com/user-attachments/assets/775c527d-65c3-4d9c-bb0c-3692462f2818"
 alt="AdminForth Agent" width="90%">
</div>


<br/>

Why AdminForth:

* Init AdminForth project with `npx adminforth create-app` and pass your database URL, import the tables you wish to see in admin using `npx adminforth resource`, and get fully functional UI for your data (filter, create, edit, remove)
* Modern look and simple Tailwind-ish ability to adjust it
* Supports Postgres, MySQL, Mongo, SQLite, Clickhouse
* Define Vue components to change look of various parts of admin using `npx adminforth component` (edit data cells, edit fields, add something above the table, inject something to header or sidebar, add custom page with charts or custom components)
* Build-in Components library (AdminForth AFCL) with premade easy-to-use build-blocks which follow your theme
* Define express APIs and call them from your components and pages
* Use various modern back-office-must-have plugins like audit log, files/image upload, TOTP 2FA, I18N, Copilot-style AI writing and image generation and many more
* AdminForth is always free and open-source (no paid versions, no cloud subscriptions sh*t)


## Project initialisation

To create an AdminForth project, run:

```bash
npx adminforth create-app
```

During the interactive initialization process, AdminForth will ask you to provide a local database URL.

### Integrating AdminForth into your existing application

If you want to build an admin panel for an existing project that already has a database with tables, you can provide the connection URL to your existing development database, such as a local or deployed one.

After that, you may want to generate AdminForth resource files from your existing database tables:

```bash
npx adminforth resource
```

Resource files are needed for AdminForth to “know” about your tables and define how to work with them.

Use the command above every time you add new tables or change their schema.

### Starting from scratch

If you do not have a database yet, start an empty local database, for example PostgreSQL in Docker, and provide its URL to the AdminForth CLI.

If the adminforth CLI does not detect any tables, it will suggest adding Prisma as a migration tool. Prisma is not related to AdminForth, but it is one of the most convenient migration tools.

Please follow [getting started](https://adminforth.dev/docs/tutorial/gettingStarted/).

# For AdminForth developers

> Follow this section only if you want to make changes to the AdminForth framework or develop a plugin.

The most convenient way to add new features or fixes is to use `dev-demo`. It imports the repository source code and plugins, so you can edit them and see changes on the fly.

## Requirements

- **Node.js 20**
- **Docker**
- **pnpm**
- **Taskfile**

To run dev demo:
```sh
cd dev-demo

pnpm setup-dev-demo
pnpm migrate:all

pnpm start
```

## Adding columns to a database in dev-demo

Open `./migrations` folder. There is prisma migration folder for the sqlite, postgres and mysql and `clickhouse_migrations` folder for the clickhouse:

### Migrations for the MySQL, SQLite and Postgres
To make migration add to the .prisma file in folder with database you need and add new tables or columns. Then run:


```
pnpm makemigration:sqlite -- --name init
```

and 

```
pnpm migrate:sqlite
```

to apply migration

> use :sqlite, :mysql or :postgres for you case

### Migrations for the clickhouse

In order to make migration for the clickhouse, go to the `./migrations/clickhouse_migrations` folder and add migration file to the folder.

Then run
```
pnpm migrate:clickhouse
```

to apply the migration.

## Testing CLI commands during development


Make sure you have not `adminforth` globally installed. If you have it, remove it:


```sh
pnpm uninstall -g adminforth
```

Then, in the root of the project, run once:

```
cd adminforth/adminforth
pnpm build
pnpm link
```

Then, go to testing app, e.g. created with CLI, and use next command:

```
npx -g adminforth <your command under development>
```

This will always run latest version of adminforth package.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=devforth/adminforth&type=date&legend=top-left)](https://www.star-history.com/#devforth/adminforth&type=date&legend=top-left)
