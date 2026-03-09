# Universal Search

Ephemeral, debounced multi‑column search for List pages. A lightweight input (injected at `beforeActionButtons`) sends the term with each list request; a hook expands it server‑side into a single `OR` filter group over your configured columns. The term never enters the standard filter store, so:

- No extra badge count
- No URL pollution
- No UI filter chips to manage

Ideal for quick, multi‑field lookup without opening the filter panel.

## Installation

```bash
npm i @adminforth/universal-search --save
```

## Basic Usage

Add the plugin to any resource. Place it inside the `plugins` array. It injects a component at the `beforeActionButtons` list page injection point (already available in AdminForth if you are on a recent version).

```ts title="./resources/apartments.ts"
// diff-add
import UniversalSearchPlugin from '@adminforth/universal-search';

export const admin = new AdminForth({
  ...,
  resources: [
    {
      resourceId: 'aparts',
      table: 'apartments',
      columns: [
        { name: 'id', primaryKey: true },
        { name: 'title' },
        { name: 'description' },
        { name: 'country' },
        { name: 'price' },
      ],
      plugins: [
        // diff-add
        new UniversalSearchPlugin({
        // diff-add
          columns: [
        // diff-add
            { name: 'title' },
        // diff-add
            { name: 'description' },
        // diff-add
            { name: 'country', caseSensitive: true },
        // diff-add
            { name: 'price', exact: true },
        // diff-add
          ],
        // diff-add
          debounceMs: 400,          // optional (default 500)
        // diff-add
          placeholder: 'Search apartments…' // optional (default empty string)
        // diff-add
        }),
      ]
    }
  ]
});
```

Type into the input and (after debounce) the backend receives the term (as an internal field) and the plugin hook rewrites it into a single composite filter like this:

```json
{
  "operator": "or",
  "subFilters": [
    { "field": "title",       "operator": "ilike", "value": "%pent%" },
    { "field": "description", "operator": "ilike", "value": "%pent%" },
    { "field": "country",     "operator": "like",  "value": "%pent%" }
  ]
}
```

`price` (marked `exact`) will be compared for exact match (no wildcards). Numeric heuristics may be applied in future versions (current implementation sends the same OR group regardless of numeric content — adjust logic in hook if you need number detection).

Press Enter to apply immediately without waiting for the debounce delay. Clearing the input removes the universal filter group entirely.

## Options

```ts
new UniversalSearchPlugin({
  columns: [
    {
      name: string;            // required column name
      caseSensitive?: boolean; // default false
      exact?: boolean;         // exact match (no wildcards)
      searchBy?: 'valueOnly' | 'keyOnly' | 'both'  (reserved; not exposed yet in public docs)
    }
  ],
  debounceMs?: number;         // default 500
  placeholder?: string;        // input placeholder (default "")
});
```

Notes:
- The virtual field name (`_universal_search`) and ephemeral behavior are fixed and not configurable.
- The input does not create visible filters; clearing it removes internal search state.

## Debounce Behavior

- Default delay: 500 ms (configurable via `debounceMs`).
- Enter key: applies immediately.
- Input cleared: universal OR filter group removed.

## How It Works Internally

1. Component writes the current term to a transient global (`adminforth.__universalSearchTerm`).
2. List request body includes `__universal_search_term`.
3. Plugin `beforeDatasourceRequest` hook adds a temporary virtual filter.
4. Hook expands that virtual filter to an `OR` group across configured columns.
5. The expanded group is executed; the temporary filter is not shown in the UI.

This means the UI stays clean while the backend still receives a standard filter structure.

## Roadmap / Future Enhancements

- Optional multi-term splitting (turn "foo bar" into two groups)
- Enum label / foreign key label search exposure
- Loading indicator & progress feedback
- Optional persistence of the last term per resource

## License

MIT
