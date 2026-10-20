# Design system adoption

Which packages follow the [design concepts](./system-concepts.md): tokens instead of palette colors, AFCL components, Lucide icons, no flowbite. Put ✓ only when the whole package is done and checked in light and dark theme.

| Package | Done |
|---|---|
| adminforth (core) | |
| @adminforth/agent | ✓ |
| @adminforth/audit-log | ✓ |
| @adminforth/auto-remove | no UI |
| @adminforth/background-jobs | ✓ |
| @adminforth/bulk-ai-flow | ✓ |
| @adminforth/clone-row | ✓ |
| @adminforth/crud-approve-plugin | ✓ |
| @adminforth/dashboard | ✓ |
| @adminforth/email-invite | ✓ |
| @adminforth/email-password-reset | ✓ |
| @adminforth/foreign-inline-list |  |
| @adminforth/foreign-inline-show | |
| @adminforth/i18n | ✓ |
| @adminforth/i18n-static | ✓ |
| @adminforth/import-export | ✓ |
| @adminforth/json-form | |
| @adminforth/list-in-place-edit | ✓ |
| @adminforth/login-captcha | |
| @adminforth/many2many | ✓ |
| @adminforth/markdown | ✓ |
| @adminforth/mcp | ✓ |
| @adminforth/oauth | ✓ |
| @adminforth/open-signup | ✓ |
| @adminforth/quick-filters | ✓ |
| @adminforth/rich-editor | ✓ |
| @adminforth/text-complete | ✓ |
| @adminforth/two-factors-auth | ✓ |
| @adminforth/universal-search | ✓ |
| @adminforth/upload | ✓ |
| @adminforth/user-sessions | ✓ |
| @adminforth/user-soft-delete | |

## Releasing an adapted plugin

- Moving a plugin to the design system makes it depend on adminforth 4 (AFCL components and Lucide icons ship with it), so apps on adminforth 3 must not get it with an update: set `peerDependencies.adminforth` to `^4.0.0` and commit with a `BREAKING CHANGE:` footer, semantic-release then publishes a new major (it ignores `feat!:`). Bump `devDependencies.adminforth` together with the lockfile once 4.0.0 is on npm, earlier `pnpm install --frozen-lockfile` fails on CI.
- Roll the release out to the live demo right away: bump the plugin (and `adminforth`, when the plugin needs a newer core) in `live-demo/app/package.json` and push to `main`, the push rebuilds demo.adminforth.dev.
- Redraw the card of the plugin on the landing page, if it has one, in the design system.

## Landing page previews

The cards of the landing gallery (`documentation/src/pages/index.tsx`) show a static HTML page of `documentation/static/landing-previews` (`preview: '<file>'`) drawn in the design system.

- Draw the screen of the plugin's core feature, not the whole page: keep one key element (an open menu, a form field, a dialog) and drop the columns, fields and buttons which don't explain the feature. A card is about 440px wide, so a screen with every column of the real page is unreadable.
- Copy the closest page (a list, an edit form, a settings tab) and take the markup, texts, Lucide icons and tokens from the components of the plugin, the shared classes are in `previews.css`.
- The screen is drawn at a fixed size of 16:10 in `.screen`, 880×550 by default, a smaller one makes the text bigger. `previews.js` scales it to the card, follows the light/dark switch of the landing page and draws the sidebar (`<aside class="side" data-active="Apartments">`).
- Icons come from the sprite `icons.svg` (`<svg class="i"><use href="icons.svg#pencil"/></svg>`), add a missing Lucide icon there as a `<symbol>`. Flags are the SVGs of `flag-icons`, small images are JPEGs in the folder.
- Check the page in both themes at the size of the card before the commit.

## Left in core

- `flowbite-datepicker` is not used by core any more: `DatePicker` and the date range filter show AFCL `Calendar` in a popover (`afcl/DateField.vue`). It stays in `spa/package.json` only for `@adminforth/i18n` up to 3.1.7, which imports it to register calendar locales, and brings `flowbite` along as its dependency; only that i18n code bundles it, core does not. Remove it at the next major of core, `TODO next major` marks it in `spa/package.json`. `flowbite` itself is gone from core with its auto-init of `data-*` attributes (`data-tooltip-target`, `data-dropdown-toggle`, …), which ran only once on window `load`, so in the SPA it never reached elements rendered later.
- Palette classes instead of tokens in `views/PageNotFound.vue`, `views/LoginView.vue`, `views/ListView.vue` (action badge), `renderers/URL.vue`, `afcl/BarChart.vue` (axis labels), the HTML in `utils/utils.ts` and a commented line in `components/Sidebar.vue`.

## Targets

- If simple - get of flowbite, prefer pure AFCL + Tailwind, move features we luck to AFCL
- Existing icon fonts apart lucide - try to get rid of them if not complex
- Core uses only Lucide icons and `flag-icons` flags (`afcl/CountryFlag.vue`). `vue-flowbite` and `vue-heroicons` stay in `spa/package.json` while plugins import them (flowbite: foreign-inline-list, user-soft-delete, and dashboard only for `flowbite:chart-pie-solid`, the old default menu icon which stored dashboard configs may name; no plugin imports heroicons any more). After plugins rework it they should disappear.
