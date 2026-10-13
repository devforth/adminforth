---
title: Static Translations (i18n Static)
description: "Guide to the i18n Static plugin: translate the AdminForth admin panel using JSON files kept in git, sync translation keys from sources with a CLI command and fill them with a coding agent."
slug: /tutorial/Plugins/i18n-static
---

# Static Translations (i18n Static)

This plugin translates the AdminForth admin panel using plain JSON files, one file per language. No database resource is needed:
translations live in your repository next to the code, go through code review and are deployed together with the app.

Main features:
- One flat `<language code>.json` file per language, e.g. `langs/uk.json`.
- A CLI command finds every translation key in the admin SPA sources and adds the new keys to all language files. It does not need to build the SPA.
- Edits are applied after a page reload. No restart is needed.
- Ships an agent skill, so a coding agent can fill in missing translations for you.
- Adds a language selector to the login page and the user menu.
- Supports ISO 639-1 codes and BCP-47 tags with a region (e.g. `en-GB`, `pt-BR`), plus pluralization, Slavic forms included.

:::tip i18n Static or i18n?
Use this plugin if developers maintain the translations and you want them in git.
If translators edit strings in the admin panel itself, or you want built-in LLM translation and translations for an external app,
use the [i18n plugin](/docs/tutorial/Plugins/i18n/) instead.
:::

## Installation

```bash
pnpm add @adminforth/i18n-static
```

The plugin is global, so register it in `globalPlugins` rather than on a resource:

```ts title='./index.ts'
import I18nStaticPlugin from '@adminforth/i18n-static';

export const admin = new AdminForth({
  ...
  globalPlugins: [
    new I18nStaticPlugin({
      supportedLanguages: ['en', 'uk', 'ja', 'fr', 'es'],
    }),
  ],
});
```

Now create the language files:

```bash
pnpm exec adminforth-i18n-static sync
```

You will get one file per language in the `langs` folder, with all admin panel strings as keys and empty values. In `en.json` values are filled with the keys.
The language selector appears on the login page and in the user menu. Until you translate the strings, they are shown in English.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `supportedLanguages` | – | Required. Language codes to support: ISO 639-1 (`uk`) or BCP-47 with a region (`pt-BR`). The app does not start if a code is invalid. |
| `primaryLanguage` | `'en'` | Language shown by default. See [Primary language](#primary-language). |
| `translationsDir` | `'langs'` | Folder with language files. A relative path is resolved from the current working directory. Created by the `sync` command. |
| `loginPageLanguageSelectorOrder` | `0` | Order of the language selector among other components under the login button. |

## Language files

Every supported language has its own flat JSON file. Keys are the original English strings, values are translations:

```json title='./langs/uk.json'
{
  "Sign out": "Вийти",
  "Save": "Зберегти",
  "Showing {from} to {to} of {total} entries": "Показано з {from} по {to} з {total} записів",
  "Apartment | Apartments": "квартир | квартира | квартири | квартир",
  "Open sidebar": ""
}
```

- An empty value means "not translated yet", and the original English key is shown instead.
- Keep the variables in curly brackets exactly as they are in the key, and do not translate them.
- `sync` fills `en.json` values with the keys, so English is complete right away. You can edit a value there to rephrase an English text without changing the source code.
- Files are read on every request, so you can edit a file and reload the page to see the result.

The plugin checks all language files on startup. If a file is not valid JSON, or is not a flat object with string values,
the app does not start and prints the file path and the position of the error:

```
Error: Translations file /app/langs/uk.json is not valid JSON: Expected double-quoted property name in JSON at position 20 (line 1 column 21)
```

## Syncing keys

Run `sync` every time you add or change `$t(...)` strings in custom components, add a plugin or upgrade AdminForth:

```bash
pnpm exec adminforth-i18n-static sync
```

The command loads your admin instance from the `.ts` file in the current folder that contains `export const admin`
(it tries `index.ts` first), and reads `.env.local` and `.env`. Then it collects `$t()` keys from the same sources the AdminForth bundler uses:
the core SPA, the custom folders of all plugins and your `customComponentsDir`.

```
🌐 Extracting translation keys...
📄 langs/en.json  515 total  +2 added  0 stale  ✔ all translated
📄 langs/uk.json  515 total  +2 added  0 stale  2 untranslated
✨ langs/es.json  created  515 total  +515 added  0 stale  515 untranslated
```

- **added**: new keys, appended to the end of the file with an empty value (in `en.json`, with the key itself). Existing keys and their order are kept.
- **stale**: keys that are no longer found in the sources. They are only reported, never removed, so you decide whether to delete them.
- **untranslated**: keys with an empty value, stale ones included.
- **wrong plural**: plural translations with a wrong number of forms, listed below the file line. They are shown only when there are some.

:::note
The CLI imports your admin `index.ts`. Make sure importing it does not start the HTTP server: keep `admin.express.serve(app)`
behind the `if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))` check, as the AdminForth app template does.
:::

## Translating with a coding agent

On the first `sync` the plugin copies its skill into `.agents/skills/adminforth-i18n-static/SKILL.md`.
An existing file is never overwritten, so you can adjust the skill to your project.

The skill teaches an agent the translation workflow: run `sync`, fill only the empty values, keep variables and plural forms, look up unclear short keys
in the sources, and run `sync` again until `untranslated` is 0. Ask your agent something like:

```
Translate the admin panel to Japanese and French
```

Review the result like any other code change before you commit it.

## Translation for custom components

Wrap strings in custom components with `$t`, then run `sync`:

```html title='./custom/CustomLoginFooter.vue'
<template>
  <div class="text-center text-gray-500 text-sm mt-4">
    {{ $t('By logging in, you agree to our') }} <a href="#" class="text-blue-500">{{ $t('Terms of Service') }}</a>
  </div>
</template>
```

Prefer whole sentences with variables over sentences glued together from fragments, because translators (and agents) need the context:

```html
{{ $t('Showing {from} to {to} of {total} entries', { from, to, total }) }}
```

Keys built from template literals with variables, like `` $t(`Hello ${name}`) ``, are skipped by `sync`, because they produce a different key every time.

### Pluralization

Pluralization uses the vue-i18n rules. Separate the forms with `|`:

```html
{{ $t('Apartment last 7 days | Apartments last 7 days', data.totalAparts) }}
```

Most languages use the same number of forms as English. Slavic languages (`uk`, `ru`, `be`, `pl`, `cs`, `sk`, `bg`, `sr`, `hr`, `mk`, `sl`) need 4 forms:
zero, one, 2-4 and 5+, e.g. `"квартир | квартира | квартири | квартир"`.

The plugin checks plural translations on startup:

- A translation with a single form (no `|`) breaks the page when it is rendered, so the app does not start:

  ```
  Error: Translations file /app/langs/uk.json has plural translations which break the page when rendered:
    "Apartment | Apartments": "Квартир" — expected 4 forms (zero | singular | 2-4 | 5+), found 1
  ```

- A translation with a different wrong number of forms, e.g. 2 forms for Ukrainian, does not break the page, but some numbers are shown
  with the wrong word form. The app starts with a warning in the console, and `sync` reports such strings as `wrong plural`.

Untranslated plural strings (empty values) are fine: they are shown with the English forms.

## Primary language

`primaryLanguage` sets the language shown to users by default. If a user requests a language that is not in `supportedLanguages`,
the plugin falls back to `primaryLanguage`, then to English.

```ts
new I18nStaticPlugin({
  primaryLanguage: 'pt-BR',
  supportedLanguages: ['pt-BR', 'en', 'es'],
}),
```

English stays the source language: keys in all files are English strings, even if `primaryLanguage` is different.

## Deployment

Language files are read at runtime from `translationsDir`, so commit them and make sure they are included in your Docker image or deployment artifact.
If you run the app from a different working directory, pass an absolute path in `translationsDir`.

## Limitations

The plugin translates the frontend: strings from `$t()` in the admin SPA, plugins and your custom components.
Backend translations made with `tr()` (menu labels, backend error messages, `tr` in custom APIs) are not supported yet and are shown as they are written in the config.
If you need them, use the [i18n plugin](/docs/tutorial/Plugins/i18n/#translations-in-custom-apis).
