# AdminForth - NodeJS Admin Panel framework on Vue & Tailwind


<a href="https://adminforth.dev"><img src="https://img.shields.io/badge/website-adminforth.dev-blue" style="height:24px"/></a> <a href="https://adminforth.dev"><img src="https://img.shields.io/npm/dw/adminforth" style="height:24px"/></a> <a href="https://devforth.io"><img src="https://raw.githubusercontent.com/devforth/OnLogs/e97944fffc24fec0ce2347b205c9bda3be8de5c5/.assets/df_powered_by.svg" style="height:28px"/></a>


[TRY LIVE DEMO](https://demo.adminforth.dev/)  (Read-only mode)

[Hello world in 5 minutes](https://adminforth.dev/docs/tutorial/gettingStarted) with AdminForth.

Full API reference [here](https://adminforth.dev/docs/api/).

## Previews

[List](https://adminforth.dev/docs/tutorial/gettingStarted):

![localhost_3500_resource_aparts (6) 1 (1)](https://github.com/user-attachments/assets/ba7fd3f1-b080-48f7-a96f-29e5dbc83f3a)

[Custom Dashboard](https://adminforth.dev/docs/tutorial/Customization/customPages):

![dashboard_size](https://github.com/user-attachments/assets/9aa716a2-79f5-464d-8cdd-f53f28684315)

[Chat-GPT plugin](https://adminforth.dev/docs/tutorial/Plugins/chat-gpt):

![dashboard_test2 (1)](https://github.com/user-attachments/assets/c42a889f-03fa-4934-8032-dc2a97938db6)

# For developers

```
cd adminforth
npm ci
npm run build
npm link

cd plugins/audit-log
npm ci
# repeat for each plugin
cd plugins/chat-gpt
npm ci

cd dev-demo
npm ci && npm start
```
