# AGENTS.md — AdminForth adapters

Shared guidance for every adapter in this folder (`adapters/adminforth-*`). It
applies to all of them; individual adapters should not need their own copy. The
root `AGENTS.md` holds repo-wide rules (pnpm, package naming, trust-the-contract,
no speculative coding) and still applies — this file only adds adapter-level
conventions.

Throughout this file, `<slug>` means an adapter's directory name minus the
`adminforth-` prefix (e.g. `adminforth-email-adapter-mailgun` →
`email-adapter-mailgun`). The slug reads `<category>-adapter-<provider>`.

## What an adapter is

- A standalone, backend-only package published to npm as `@adminforth/<slug>`.
- Its own git repository: `https://github.com/devforth/adminforth-<slug>`.
- Entry point `index.ts` with a **default export** class that **implements** the
  category interface from `adminforth` for its kind — e.g. `EmailAdapter`,
  `StorageAdapter`, `CompletionAdapter` — not an `AdminForthPlugin` subclass.
- Pluggable and interchangeable: any adapter of the same category is a drop-in
  replacement, so keep to the interface and don't leak provider specifics.
- Documented as a **section on a shared per-category docs page** (e.g. all
  key-value adapters live on one `key-value-adapters` page), reached via a
  heading anchor — not one page per adapter. See the homepage table below.

## package.json conventions

Every adapter's `package.json` follows the same field conventions so its npm
page, docs link, and repository link stay correct. After editing one, validate.

Enforced values, for an adapter in directory `adminforth-<slug>`:

| Field | Expected |
|-------|----------|
| `name` | `@adminforth/<slug>` |
| `homepage` | Docs section URL — see the homepage table below |
| `repository.url` | `https://github.com/devforth/adminforth-<slug>` (`.git` optional) |
| `main` | `dist/index.js` |
| `types` | `dist/index.d.ts` |
| `type` | `module` |
| `license` | `MIT` |
| `author` | `DevForth (https://devforth.io)` |
| `publishConfig.access` | `public` |
| `peerDependencies.adminforth` | present |
| `version`, `description` | present and non-empty |

### `homepage`

Most adapters do **not** get their own docs page. They are documented as a
section on a shared per-category page, so the homepage points at that page and
the section's heading anchor. Do not guess it — derive it from the docs source.

To build (or validate) an adapter's `homepage`:

1. Find the adapter's category page under
   `adminforth/documentation/docs/tutorial/06-Adapters/*.md`. The page slug is
   the filename without its numeric prefix (e.g. `07-key-value-adapters.md` →
   `key-value-adapters`).
2. On that page, find the `##` heading for this specific adapter.
3. Turn the heading text into its Docusaurus anchor: lowercase, spaces → `-`,
   drop punctuation and parentheses (e.g. `## Gemini (Nano Banana) Image
   Generation Adapter` → `gemini-nano-banana-image-generation-adapter`).
4. Compose:
   `https://adminforth.dev/docs/tutorial/Adapters/<page-slug>/#<anchor>`.

Exceptions to the shared-page-plus-anchor rule:

- **Own docs page** — if the category `.md` has a custom `slug:` in its
  frontmatter, the adapter has a dedicated page; use that page URL with no
  anchor (e.g. `adminforth-chat-surface-adapter-telegram` →
  `https://adminforth.dev/docs/tutorial/Adapters/chat-surface-adapter-telegram/`).
- **Documented elsewhere** — if the adapter is only documented on another
  section's page (e.g. inside a plugin page), point at that page + its anchor
  (e.g. `adminforth-audio-adapter-openai` →
  `https://adminforth.dev/docs/tutorial/Plugins/agent/#turn-on-audio-chat-support`).
- **No docs section** — if no page has a heading for the adapter, it has no
  valid target. Do not invent an anchor; leave `homepage` absent until a docs
  section exists.
