---
name: adminforth-i18n-static
description: "Use when asked to translate AdminForth admin panel UI, fill missing translations, or add a new admin language with @adminforth/i18n-static plugin (JSON files per language)."
user-invocable: true
---

# AdminForth Static Translations Workflow

## How Translations Work

- Every supported language has its own flat JSON file `<translationsDir>/<language code>.json` (`langs/` by default), e.g. `langs/uk.json`, `langs/pt-BR.json`.
- Keys are original English strings from admin UI, values are translations: `{ "Save": "Зберегти" }`.
- Empty value means "not translated yet", admin shows the original English key instead.
- Files are read on every request, so edits are visible after page reload without restart.

## Workflow

1. Sync keys first, so every language file contains all actual keys:
   `pnpm exec adminforth-i18n-static sync` (or `npx adminforth-i18n-static sync` for npm).
   It prints every language file with counts: `total`, `added`, `stale` and `untranslated`.
2. Fill empty values in language files the user asked for (all non-English files if not specified).
3. Run sync again and make sure `untranslated` is 0 for translated files and there is no `wrong plural` warning. Fix every listed plural string.

## Translation Rules

- Never change, add or remove keys, only write values. Keep keys order.
- Do not translate `en.json`: sync fills its values with the keys (original English strings). Change its values only if the user asks to rephrase English texts.
- Do not touch non-empty values unless the user asks to fix them.
- Do not remove stale keys (reported as `stale`), the user decides about them.
- Keep variables in curly brackets exactly as in the key and do not translate them: `"Hello {name}"` → `"Привіт {name}"`, never `{ім'я}`.
- Keys with `|` are plural forms. Keep the same number of forms separated by `|`, except Slavic languages
  (uk, ru, be, pl, cs, sk, bg, sr, hr, mk, sl) which need 4 forms "zero | singular | 2-4 | 5+",
  e.g. `"apple | apples"` in `uk.json` becomes `"яблук | яблуко | яблука | яблук"`.
- For codes with region (e.g. `pt-BR`) use regional spelling, punctuation and formatting.
- Keep translations short: they are UI labels, buttons and messages of an admin panel.
- If meaning of a key is not clear (short words like `Show`, `of`, `to`, `Your` or sentence fragments), find where it is used:
  search for the key in `$t('...')` / `t('...')` calls in project custom components and in AdminForth sources
  (`node_modules/adminforth/dist/spa/src`, `node_modules/@adminforth/*/dist/custom`). Translate by context: a button, a label
  or a part of a sentence glued with other text in the template, then the translation must fit the whole phrase.
- Keep JSON valid with 2 spaces indentation.
