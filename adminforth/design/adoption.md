# Design system adoption

Which packages follow the [design concepts](./system-concepts.md): tokens instead of palette colors, AFCL components, Lucide icons, no flowbite. Put ✓ only when the whole package is done and checked in light and dark theme.

| Package | Done |
|---|---|
| adminforth (core) | |
| @adminforth/agent | ✓ |
| @adminforth/audit-log | ✓ |
| @adminforth/auto-remove | no UI |
| @adminforth/background-jobs | ✓ |
| @adminforth/bulk-ai-flow | |
| @adminforth/clone-row | |
| @adminforth/crud-approve-plugin | |
| @adminforth/dashboard | |
| @adminforth/email-invite | |
| @adminforth/email-password-reset | |
| @adminforth/foreign-inline-list | |
| @adminforth/foreign-inline-show | |
| @adminforth/i18n | |
| @adminforth/i18n-static | no UI |
| @adminforth/import-export | ✓ |
| @adminforth/inline-create | |
| @adminforth/json-editor | |
| @adminforth/json-form | |
| @adminforth/list-in-place-edit | ✓ |
| @adminforth/login-captcha | |
| @adminforth/many2many | |
| @adminforth/markdown | |
| @adminforth/mcp | ✓ |
| @adminforth/oauth | ✓ |
| @adminforth/open-signup | |
| @adminforth/quick-filters | ✓ |
| @adminforth/rich-editor | |
| @adminforth/text-complete | ✓ |
| @adminforth/two-factors-auth | |
| @adminforth/universal-search | |
| @adminforth/upload | |
| @adminforth/user-sessions | ✓ |
| @adminforth/user-soft-delete | |

## Releasing an adapted plugin

- Moving a plugin to the design system makes it depend on adminforth 4 (AFCL components and Lucide icons ship with it), so apps on adminforth 3 must not get it with an update: set `peerDependencies.adminforth` to `^4.0.0` and commit with a `BREAKING CHANGE:` footer, semantic-release then publishes a new major (it ignores `feat!:`). Bump `devDependencies.adminforth` together with the lockfile once 4.0.0 is on npm, earlier `pnpm install --frozen-lockfile` fails on CI.
- Roll the release out to the live demo right away: bump the plugin (and `adminforth`, when the plugin needs a newer core) in `live-demo/app/package.json` and push to `main`, the push rebuilds demo.adminforth.dev.

## Left in core

- `afcl/Tooltip.vue` uses the flowbite `Tooltip`, `afcl/DatePicker.vue` and `components/CustomDateRangePicker.vue` use `flowbite-datepicker`.
- The Tooltip import is the last place where core loads `flowbite`, and loading it also runs flowbite's auto-init of `data-*` attributes (`data-tooltip-target`, `data-dropdown-toggle`, …) on page load. Apps and plugins may rely on it (foreign-inline-list uses `data-tooltip-target`), so a native Tooltip has to come together with moving those usages to AFCL.
- Palette classes instead of tokens in `views/PageNotFound.vue`, `views/LoginView.vue`, `views/ListView.vue` (action badge), `renderers/URL.vue`, `afcl/BarChart.vue` (axis labels), the HTML in `utils/utils.ts` and a commented line in `components/Sidebar.vue`.

## Targets

- If simple - get of flowbite, prefer pure AFCL + Tailwind, move features we luck to AFCL
- Existing icon fonts apart lucide - try to get rid of them if not complex
- Core uses only Lucide icons and `flag-icons` flags (`afcl/CountryFlag.vue`). `vue-flowbite` and `vue-heroicons` stay in `spa/package.json` while plugins import them (flowbite: bulk-ai-flow, clone-row, dashboard, email-invite, email-password-reset, foreign-inline-list, inline-create, json-editor, markdown, open-signup, two-factors-auth, user-soft-delete; heroicons: dashboard, markdown). After plugins rework it they should disappear.
- i18n shows language flags with its own `flag-icon-css`, a 445 KB stylesheet loaded on every page: move `LanguageFlag.vue` to AFCL `CountryFlag`.