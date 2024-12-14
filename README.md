# AdminForth - fully free Node.js admin panel framework on Vue & Tailwind


<a href="https://adminforth.dev"><img src="https://img.shields.io/badge/website-adminforth.dev-blue" style="height:24px"/></a> <a href="https://adminforth.dev"><img src="https://img.shields.io/npm/dw/adminforth" style="height:24px"/></a> <a href="https://devforth.io"><img src="https://raw.githubusercontent.com/devforth/OnLogs/e97944fffc24fec0ce2347b205c9bda3be8de5c5/.assets/df_powered_by.svg" style="height:28px"/></a>


* [Try live demo](https://demo.adminforth.dev/)  (Read-only mode)

* [Hello world in 5 minutes](https://adminforth.dev/docs/tutorial/gettingStarted) with AdminForth.

* [Full API reference](https://adminforth.dev/docs/api/).

<div align="center">
  <img src="https://github.com/user-attachments/assets/5921f5f3-feef-40a8-9b82-3df19ac2eedd" alt="Image description" width="800px">
</div>

Features:
* AdminForth is always free and open-source (no paid versions, no cloud subscriptions sh*t)
* Init AdminForth with your database URL in Node.js file, easily describe the tables you wish to see in admin, and get fully functional UI for your data (filter, create, edit, remove)
* Define Vue components to any part (place in data cell, instead of row, add something above the table, inject something to header or sidebar, add custom page with charts)
* Define express APIs and call them from your components and pages
* Use various modern back-office-must-have plugins like audit log, files/image upload, TOTP 2FA, Copilot-style AI writing and images generation

## Previews



[Custom Dashboard](https://adminforth.dev/docs/tutorial/Customization/customPages):

<div align="center">
  <img src="https://github.com/user-attachments/assets/aa899196-f7f3-4582-839c-2267f2e9e197" alt="AdminForth Dashboard demo" width="500px">
</div>

[Chat-GPT plugin](https://adminforth.dev/docs/tutorial/Plugins/chat-gpt):

<div align="center">
  <img src="https://github.com/user-attachments/assets/cfa17cbd-3a53-4725-ab46-53c7c7666028" alt="AdminForth ChatGPT demo" width="500px">
</div>

[Image DALEE Generation](https://adminforth.dev/docs/tutorial/Plugins/upload/#image-generation)

<div align="center">
  <img src="https://github.com/user-attachments/assets/b923e044-7e29-46ff-ab91-eeca5eee2b0a" alt="AdminForth DALE-E image generator demo" width="500px">
</div>


# For developers

```
cd adminforth
npm ci
npm run build

# create link to built "adminforth" package in local system
npm link

# this will install deps in all plugins and link adminforth package
npm run ci-plugins

# this will install deps in all plugins and link adminforth package
npm run ci-adapters

# this is dev demo for development
cd dev-demo
cp .env.sample .env
npm ci
npm run migrate
npm start
```

Add some columns to a database. Open .prisma file, modify it, and run:

```
npm run namemigration -- --name desctiption_of_changes
```


