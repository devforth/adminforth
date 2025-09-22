# Universal Filters

Adds a single debounced search input to List pages (rendered before action buttons) that expands into an OR group of filters across multiple configured columns.

Useful for quick, multi-field search without opening the side filter panel.

## Installation

```bash
npm i @adminforth/universal-search --save
```

## Basic Usage

Add the plugin to any resource. Place it inside the `plugins` array. It injects a component at the `beforeActionButtons` list page injection point (already available in AdminForth if you are on a recent version).

```ts title="./resources/apartments.ts"
// diff-add
import UniversalFiltersPlugin from '@adminforth/universal-search';

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
        new UniversalFiltersPlugin({
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
          debounceMs: 400, // optional (default 500)
        // diff-add
        }),
      ]
    }
  ]
});
```

Type into the input and (after debounce) a single composite filter like this is sent to backend:

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

`price` (marked `exact`) is only included if the user input is a valid number and matches fully.

Press Enter to apply immediately without waiting for the debounce delay. Clearing the input removes the universal filter group entirely.

## Options

```ts
new UniversalFiltersPlugin({
  columns: [
    {
      name: string;                // required column name
      caseSensitive?: boolean;     // default false (uses ilike when false, like when true)
      searchBy?: 'valueOnly' | 'labelOnly' | 'both'; // reserved (future enum/label support)
      exact?: boolean;             // default false
    }
  ],
  debounceMs?: number;            // default 500
});
```

## Debounce Behavior

- Default delay: 500 ms (configurable via `debounceMs`).
- Enter key: applies immediately.
- Input cleared: universal OR filter group removed.

## Roadmap / Future Enhancements

- `searchBy: 'labelOnly' | 'both'` to support enum / foreign key label text
- Local persistence of last query
- Wildcard escaping & advanced pattern modes
- Loading indicator while applying

## License

MIT
