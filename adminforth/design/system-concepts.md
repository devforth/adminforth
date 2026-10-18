# Design system concepts

Rules for the AdminForth UI (the "Hairline" theme). States and variants of every component are drawn in [system.html](./system.html), the progress of core and plugins is tracked in [adoption.md](./adoption.md). Add a concept here when a design decision should apply everywhere.

## Theme lives in tokens

- Colors, shadows, radius and fonts are tokens in `adminforth/modules/styles.ts` (`light*` / `dark*` pairs, `alias:` points one token to another). Apps override them via `customization.styles`, so token names are a public contract: change values, never rename or remove tokens.
- Components color themselves with tokens (`bg-lightListTableHeading dark:bg-darkListTableHeading`). Tailwind palette colors (`text-gray-400`, `bg-red-50`, `border-emerald-200`, `zinc-*`, …) are not used in core and plugins at all: they ignore `customization.styles` and drift from the theme. `black` and `white` appear only as a translucent tint over any surface (`hover:bg-black/5`), and only where no token fits.
- Keep the token list short. Reuse a token with the same role before adding one: muted icons and secondary text `InputIconColor`, faint text and empty values (`-`) `InputPlaceholderText`, subtle fill `SecondaryDarken` / `SecondaryLighten`, page dimming behind dialogs, modals and drawers `Scrim` (a photo lightbox stays `bg-black/*`, it is dark in both themes), a softer variant of a token is its opacity modifier (`stroke-lightPrimary/50`). Add a token for a new role, not for a new component, always as a `light*` / `dark*` pair.
- Statuses use `Success`, `Warning` and `Danger` tokens: the base one for text and icons, `*Soft` for the background, `*Border` for the border. Badges, alerts, toasts and diffs take them, e.g. `bg-lightSuccessSoft text-lightSuccess border-lightSuccessBorder`.
- Gray ground, white surfaces, 1px hairline borders. Shadows only on layers that float above the page: popovers, menus, dialogs.
- One ink (near-black) primary button for the main action of a screen, everything else is `secondary`, destructive actions are `danger`. The accent color is the `primary` token: links, focus rings, selection, active states.
- Fonts are Geist and Geist Mono (`@fontsource-variable/*`, OFL), the default radius is 6px (`rounded-default`).
- Controls are 34px high: buttons, icon buttons, inputs, selects, date pickers and the header controls (theme toggle, avatar, plugin buttons). Small buttons (`size="sm"`) and the pagination of tables are 28px.
- Focus ring is 3px of the `FocusRing` token. Buttons, checkboxes and toggles show it only on keyboard focus (`focus:outline-none focus-visible:ring-[3px]`), so a mouse click leaves no ring. Text fields show it on any focus (`focus:ring-[3px]`), the user types there next. A clickable element is a `<button>`, not a `<span>` or `<div>` with `@click`, so it gets keyboard focus at all.

## `af-` and `afcl-` classes are a contract

Apps restyle and test AdminForth by `af-*` and `afcl-*` classes. A restyle never removes such class and never moves it to another element. A new component gets its own `afcl-*` root class. Naming after af-<> is unique and clear. If you see it is missing for elements which are key for restyling anchoring - add it.

## AFCL first

- Build UI in core and plugins from AFCL components (`@/afcl`). A plugin may adjust a few classes of a component via `class` or props like `contentClass`.
- When the same piece of UI shows up in several places, or a piece clearly is a component, add it to AFCL instead of copying markup. Follow AFCL conventions: typed props with `withDefaults`, slots for content, `v-model` for state, `defineExpose` for an imperative API, `mergeClasses` for class overrides, tokens for colors, an `afcl-*` root class.
- A new AFCL component gets a section in the AFCL docs (`documentation/docs/tutorial/03-Customization/15-afcl.md`) and its states and variants in [system.html](./system.html). Docs examples are live, not screenshots: wrap the code blocks of an example into `<AfclPreview id="...">` and the docs build renders them with real AFCL (see `documentation/afcl-preview/vite.config.ts`).
- Example: `DropdownMenu` and `DropdownMenuItem` replaced the hand-made menus of the list (⋯ in the header and in rows), the user menu and the import-export plugin.

## Disabled state

A disabled control gets the native `disabled` attribute (`aria-disabled` on a link, which then has no `href`), not `pointer-events-none`: the attribute also blocks the keyboard and form submit, is announced by screen readers and does not pass the click to a parent. Hover styles are left out for a disabled control.

## Dialogs on phones

Below `sm` (640px) a Dialog or Modal docks to the bottom edge as a sheet: full width, 16px top corners, actions stacked full width with the last (main) one on top. Width classes an app passes (`class="w-96"`) apply from `sm` up. The panel and footer classes live in `afcl/dialogStyles.ts`, so an overlay built on `Modal` gets the sheet without extra code.

## Lucide icons

- Use Lucide: `@iconify-prerendered/vue-lucide` in components (`IconPencil`, `IconTrash2`), `lucide:<name>` in config (`icon: 'lucide:download'`).
- 16px (`w-4 h-4`) in controls and menus. Icons are muted (`text-lightInputIconColor`), destructive items color their icon too.
- Don't add icons from other sets; replace flowbite, heroicons and humbleicons icons with Lucide when you touch a component. The old sets stay installed because apps and older plugins still import them.

## Moving off flowbite

flowbite is being removed step by step. Don't add new flowbite usages (`flowbite` JS components, `flowbite-datepicker`, `data-*-toggle` attributes). When you touch code which uses it, replace it with a native Vue implementation, usually an AFCL component. Example: the user menu moved from flowbite `Dropdown` to AFCL `DropdownMenu`.

## SPA dependencies

Fonts and icons are dependencies of `adminforth/spa`. Apps install the SPA with npm or pnpm, so a new SPA dependency goes to both `spa/package-lock.json` and `spa/pnpm-lock.yaml`.
