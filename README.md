# AdminForth - free powerfull Node.js admin panel framework on Vue & Tailwind


<a href="https://adminforth.dev"><img src="https://img.shields.io/badge/website-adminforth.dev-blue" style="height:24px"/></a> <a href="https://adminforth.dev"><img src="https://img.shields.io/npm/dw/adminforth" style="height:24px"/></a> <a href="https://devforth.io"><img src="https://raw.githubusercontent.com/devforth/OnLogs/e97944fffc24fec0ce2347b205c9bda3be8de5c5/.assets/df_powered_by.svg" style="height:28px"/></a>


* [Try live demo](https://demo.adminforth.dev/)  (Read-only mode)

* [Hello world in 5 minutes](https://adminforth.dev/docs/tutorial/gettingStarted) with AdminForth

* [Tutorial](https://adminforth.dev/docs/tutorial/Customization/branding/)

<br/>

<div align="center">
  <img src="https://github.com/user-attachments/assets/e643caad-1daa-4085-b125-cc940557a2ec"
 alt="AdminForth Dashboard" width="90%">
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

```
mkdir myadmin && cd myadmin
npx adminforth create-app
```

## Previews


<a href="https://adminforth.dev/docs/tutorial/Customization/customPages">Custom Dashboard</a>
<br/>
<img src="https://github.com/user-attachments/assets/aa899196-f7f3-4582-839c-2267f2e9e197" alt="AdminForth Dashboard demo" width="80%" />

<a href="https://adminforth.dev/docs/tutorial/Plugins/chat-gpt">Chat-GPT plugin</a>
<br/>

<img src="https://github.com/user-attachments/assets/cfa17cbd-3a53-4725-ab46-53c7c7666028" alt="AdminForth ChatGPT demo" width="80%" />

<a href="https://adminforth.dev/docs/tutorial/Plugins/upload/#image-generation">Image DALEE Generation</a>
  <br/>
<img src="https://github.com/user-attachments/assets/b923e044-7e29-46ff-ab91-eeca5eee2b0a" alt="AdminForth DALE-E image generator demo" width="80%">




# For developers

The most convenient way to add new features or fixes is using `dev-demo`. It imports the source code of the repository and plugins so you can edit them and see changes on the fly.

Fork repo, pull it and do next:


```sh
cd adminforth
npm ci
npm run build
```

To run dev demo:
```sh
cd dev-demo
cp .env.sample .env

# this will install all official plugins and link adminforth package, if plugin installed it will git pull and npm ci
npm run install-plugins

# same for official adapters
npm run install-adapters

npm ci

./run_inventory.sh

npm run migrate:local
npm start
```

## Adding columns to a database in dev-demo

Open `.prisma` file, modify it, and run:

```
npm run namemigration -- --name desctiption_of_changes
```


### Testing CLI commands during development


Make sure you have not `adminforth` globally installed. If you have it, remove it:


```sh
npm uninstall -g adminforth
```

Then, in the root of the project, run once:

```
cd adminforth/adminforth
npm run build
```

This will automatically make an npm link to the `adminforth` package in the root of the project.

Then, go to testing app, e.g. created with CLI, and use next command:

```
npx -g adminforth <your command under development>
```

This will always run latest version of adminforth package.
