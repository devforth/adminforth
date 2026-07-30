# AGENTS.md — AdminForth plugins

Shared guidance for every plugin in this folder (`plugins/adminforth-*`). It
applies to all of them; individual plugins should not need their own copy. The
root `AGENTS.md` holds repo-wide rules (pnpm, package naming, trust-the-contract,
no speculative coding) and still applies — this file only adds plugin-level
conventions.

Throughout this file, `<slug>` means a plugin's directory name minus the
`adminforth-` prefix (e.g. `adminforth-oauth` → `oauth`).

## What a plugin is

- A standalone package published to npm as `@adminforth/<slug>`.
- Its own git repository: `https://github.com/devforth/adminforth-<slug>`.
- Entry point `index.ts` with a **default export** class extending
  `AdminForthPlugin` from `adminforth`.
- Documented at `https://adminforth.dev/docs/tutorial/Plugins/<slug>/`.

## package.json conventions

Every plugin's `package.json` follows the same field conventions so its npm
page, docs link, and repository link stay correct. After editing one, validate:


Enforced values, for a plugin in directory `adminforth-<slug>`:

| Field | Expected |
|-------|----------|
| `name` | `@adminforth/<slug>` |
| `homepage` | `https://adminforth.dev/docs/tutorial/Plugins/<slug>/` |
| `repository.url` | `https://github.com/devforth/adminforth-<slug>` (`.git` optional) |
| `main` | `dist/index.js` |
| `types` | `dist/index.d.ts` |
| `type` | `module` |
| `license` | `MIT` |
| `author` | `DevForth (https://devforth.io)` |
| `publishConfig.access` | `public` |
| `peerDependencies.adminforth` | present |
| `version`, `description` | present and non-empty |
