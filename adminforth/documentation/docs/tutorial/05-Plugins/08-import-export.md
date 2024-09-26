
# Import-Export

Import-Export is a plugin that allows you to import and export data from and to a CSV file. 

This plugin is mostly useful for next use cases:

* Move data from one environment to another (e.g. from development to production)
* Export data for various purposes (e.g. backup, analysis)

## Installation

To install the plugin:

```bash
npm install @adminforth/import-export
```

## Usage

To use the plugin, you need to import it and call the `importExport` function:

```typescript
import importExport from '@adminforth/import-export';
```

Add plugin instantiation to the `plugins` array of resource where you want to use it:

```typescript

new AdminForth({
  ...
  resources: [
    {
      resourceId: 'posts',
      plugins: [
        importExport({}),
      ],
    },
  ],
});
```