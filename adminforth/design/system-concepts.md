# Design system concepts

Rules for the AdminForth UI (the "Hairline" theme). States and variants of every component are drawn in [system.html](./system.html), the progress of core and plugins is tracked in [adoption.md](./adoption.md). Add a concept here when a design decision should apply everywhere.

## Theme lives in tokens

- Colors, shadows, radius and fonts are tokens in `adminforth/modules/styles.ts` (`light*` / `dark*` pairs, `alias:` points one token to another). Apps override them via `customization.styles`, so token names are a public contract: change values, never rename or remove tokens.
- Components color themselves with tokens (`bg-lightListTableHeading dark:bg-darkListTableHeading`). Tailwind palette colors (`text-gray-400`, `bg-red-50`, `border-emerald-200`, `zinc-*`, …) are not used in core and plugins at all: they ignore `customization.styles` and drift from the theme. `black` and `white` appear only as a translucent tint over any surface (`hover:bg-black/5`), and only where no token fits.
- Keep the token list short. Reuse a token with the same role before adding one: muted icons and secondary text `InputIconColor`, faint text and empty values (`-`) `InputPlaceholderText`, subtle fill `SecondaryDarken` / `SecondaryLighten`, page dimming behind dialogs, modals and drawers `Scrim` (a photo lightbox stays `bg-black/*`, it is dark in both themes), a softer variant of a token is its opacity modifier (`stroke-lightPrimary/50`). Add a token for a new role, not for a new component, always as a `light*` / `dark*` pair.
- Statuses use `Success`, `Warning` and `Danger` tokens: the base one for text and icons, `*Soft` for the background, `*Border` for the border. Badges, alerts, toasts and diffs take them, e.g. `bg-lightSuccessSoft text-lightSuccess border-lightSuccessBorder`.
- Gray ground, white surfaces, 1px hairline borders. Shadows only on layers that float above the page: popovers, menus, dialogs.
- One ink (near-black) primary button for the main action of a screen, everything else is `secondary`, destructive actions are `danger`. The accent color is the `primary` token: links, focus rings, selection, active states. An app which wants its brand color on the primary button aliases the `Buttons*` tokens to `Primary` in `customization.styles` (see the branding docs); core and plugins keep styling a button with the `Buttons*` tokens, never with `Primary`.
- Fonts are Geist and Geist Mono (`@fontsource-variable/*`, OFL), the default radius is 6px (`rounded-default`).
- Controls are 34px high: buttons, icon buttons, inputs, selects, date pickers and the header controls (theme toggle, avatar, plugin buttons). Small buttons (`size="sm"`) and the pagination of tables are 28px.
- Focus ring is 3px of the `FocusRing` token. Buttons, checkboxes and toggles show it only on keyboard focus (`focus:outline-none focus-visible:ring-[3px]`), so a mouse click leaves no ring. Text fields show it on any focus (`focus:ring-[3px]`), the user types there next. A clickable element is a `<button>`, not a `<span>` or `<div>` with `@click`, so it gets keyboard focus at all.

## `af-` and `afcl-` classes are a contract

Apps restyle and test AdminForth by `af-*` and `afcl-*` classes. A restyle never removes such class and never moves it to another element. A new component gets its own `afcl-*` root class. Naming after af-<> is unique and clear. If you see it is missing for elements which are key for restyling anchoring - add it.

## AFCL first

- Build UI in core and plugins from AFCL components (`@/afcl`). A plugin may adjust a few classes of a component via `class` or props like `contentClass`.
- When the same piece of UI shows up in several places, or a piece clearly is a component, add it to AFCL instead of copying markup. Follow AFCL conventions: typed props with `withDefaults`, slots for content, `v-model` for state, `defineExpose` for an imperative API, `mergeClasses` for class overrides, tokens for colors, an `afcl-*` root class.
- A new AFCL component gets a section on the page of its category in the AFCL docs (`documentation/docs/tutorial/03-Customization/15-afcl/`, a link in its `index.md` as well) and its states and variants in [system.html](./system.html). Docs examples are live, not screenshots: wrap the code blocks of an example into `<AfclPreview id="...">` and the docs build renders them with real AFCL (see `documentation/afcl-preview/vite.config.ts`). Nothing is registered globally, an example imports every AFCL component it uses from `@/afcl`, otherwise the build fails.
- Example: `DropdownMenu` and `DropdownMenuItem` replaced the hand-made menus of the list (⋯ in the header and in rows), the user menu and the import-export plugin.

## AFCL works inside a shadow root

The live examples of the docs render AFCL in shadow roots of the docs page (`documentation/afcl-preview/mount.ts`). Code which reaches out of the tree of a component breaks there, so an AFCL component:

- teleports popups, modals, tooltips and pickers to `useTeleportTarget()` from `afcl/shadowRoot.ts`, never `to="body"`. The target is `body` in an app and an element of the shadow root in the docs, content teleported out of the root loses its styles;
- takes the clicked or scrolled element as `e.composedPath()[0]` in `document` and `window` listeners (outside click, scroll), `e.target` there is the shadow host;
- reads the focus with `activeElementIn(el)`, `document.activeElement` there is the shadow host as well;
- finds its own elements by template refs, not by `document.getElementById` or `document.querySelector`.

In an app these give exactly what `body`, `e.target` and `document.activeElement` give, so apps see no difference.

## Disabled state

A disabled control gets the native `disabled` attribute (`aria-disabled` on a link, which then has no `href`), not `pointer-events-none`: the attribute also blocks the keyboard and form submit, is announced by screen readers and does not pass the click to a parent. Hover styles are left out for a disabled control.

## Dialogs on phones

Below `sm` (640px) a Dialog or Modal docks to the bottom edge as a sheet: full width, 16px top corners, actions stacked full width with the last (main) one on top. Width classes an app passes (`class="w-96"`) apply from `sm` up. The panel and footer classes live in `afcl/dialogStyles.ts`, so an overlay built on `Modal` gets the sheet without extra code.

## Container width, not viewport width

A page gets less than the screen: the sidebar and the agent panel squeeze it on wide screens too. Layouts which stack follow their container with Tailwind container queries (`@container` on the parent, `@4xl:` on children), not the viewport with `md:` or `lg:`. Such a grid gets `grid-cols-1` as its base, otherwise a wide chart or table stretches its single column past the page.

The header of the list page is a container named `header`. Below 896px (`@4xl/header`) components from `beforeActionButtons` take a full row under the title and the buttons, from 896px all share one row. Below 512px (`@lg/header`) Home and Filter keep only their icons. Such a component fills its row and takes a fixed width from `@4xl/header:`, like the fields of quick-filters.

## Bulk actions bar

Checking rows never moves the table or the header and never changes the height of the table. Bulk actions of checked rows show up in a dark floating bar in place of the pagination: the pagination turns invisible and keeps its room, changing the page drops the checked rows anyway. The bar takes no room itself and sticks to the bottom of the screen over a long table. It holds the count, the actions as ghost buttons, Clear. All actions stay in sight, no sideways scroll: on a narrow screen they wrap between the count and Clear, left aligned, and the bar grows up over the last rows. The bar is an ink layer like a tooltip and takes the `Tooltip*` tokens, so it is light in the dark theme. A destructive action on it takes the `Danger` token of the opposite theme.

## Field tables

The show, create and edit views list fields as a two-column table on a card: a 224px label column and the value next to it. Lines follow one order of weight: the card border (`FormBorder`), lighter dividers between rows (`ShowTableBodyBorder`, in forms too), the stronger border of an input. There is no "Field / Value" header row and no filled band behind a group name, a group name is a plain semibold title inside its card.

- Labels sit on the first line of the value, not in the middle of a tall row: 13px medium in forms, 13px `InputIconColor` in the show view, where values take `ShowTableBodyText`.
- Core inputs don't stretch over the whole row: text up to 576px (`max-w-xl`), selects 320px (`max-w-xs`), text areas 672px (`max-w-2xl`), numbers 160px. A custom field component sets its own width.
- A `showRow` component renders the whole `<tr>` content (`<td colspan="2">`), so the table stays a `<table>`.

## Lucide icons

- Use Lucide: `@iconify-prerendered/vue-lucide` in components (`IconPencil`, `IconTrash2`), `lucide:<name>` in config (`icon: 'lucide:download'`).
- 16px (`w-4 h-4`) in controls and menus. Icons are muted (`text-lightInputIconColor`), destructive items color their icon too.
- Don't add icons from other sets; replace flowbite, heroicons and humbleicons icons with Lucide when you touch a component. The old sets stay installed because apps and older plugins still import them.
- Don't draw icons with inline `<svg>` or keep them as own `.vue` files, take the Lucide component. Inline SVG is only for graphics which are not icons: the two-tone `Spinner` ring, the `Toast` timer ring, charts.

## Country flags and lazy loading

- Flags are the 4:3 SVGs of `flag-icons`, shown by AFCL `<CountryFlag :countryCode="'ua'" />`. Core and plugins use this component and don't bring their own flag packages or flag CSS.
- A set of assets (flags, illustrations) never goes into the main bundle as a whole. `CountryFlag` loads the map of flag URLs (`afcl/countryFlagUrls.ts`, 7 KB gzip) with a dynamic `import()` when the first flag is shown, then the browser downloads only the SVGs of the shown flags, 0.2–10 KB each. The former `@iconify-prerendered/vue-flag` brought 1.1 MB gzip with the first flag.
- An eager `import.meta.glob` belongs to a module which is imported dynamically. `@/afcl` is a barrel, so in an AFCL component such glob makes the dev server load every matched file on every page. Glob assets with `query: '?url&no-inline'`, otherwise Vite inlines files under 4 KB into JS as data URIs, and with `exhaustive: true` when the files are in `node_modules`, which the glob skips by default.

## Moving off flowbite

flowbite is being removed step by step. Don't add new flowbite usages (`flowbite` JS components, `flowbite-datepicker`, `data-*-toggle` attributes). When you touch code which uses it, replace it with a native Vue implementation, usually an AFCL component. Example: the user menu moved from flowbite `Dropdown` to AFCL `DropdownMenu`.

A floating layer is a `popover` element positioned by CSS anchor positioning, like `afcl/Tooltip.vue`. The top layer frees it from z-index and the overflow of parents. Browsers without anchor positioning (Safari before 26, Firefox before 147) get the position from `getBoundingClientRect` under `CSS.supports('anchor-name: --a')`.

## SPA dependencies

Fonts and icons are dependencies of `adminforth/spa`. Apps install the SPA with npm or pnpm, so a new SPA dependency goes to both `spa/package-lock.json` and `spa/pnpm-lock.yaml`.
