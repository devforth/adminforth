

## Badge

You can add a badge near the menu item title (e.g. to get coubnt of unread messages). To do this, you need to add a `badge` field to the menu item configuration:

```ts title='./index.ts'
{
  ...
  menu: {
    items: [
      {
        badge:  (adminUser: AdminUser) => {
          return 10
        },
        ...,
      },
    ],
  },
  ...
}
```