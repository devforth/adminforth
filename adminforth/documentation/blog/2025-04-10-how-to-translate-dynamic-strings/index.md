---
slug: dynamic-strings-translation
title: "How to translate dynamic strings in AdminForth API"
authors: ivanb
tags: [keycloak, authentication]
description: "Simple example of how to translate dynamic strings from database in AdminForth API"
# image: "/ogs/ga-tf-aws.jpg"
---

When you are using [AdminForth i18n plugin for external Apps translation](https://adminforth.dev/docs/tutorial/Plugins/i18n/#translating-external-application) you might face a case when you need to translate some data stored in your database which potentially can be changed in future.
<!-- truncate -->

Let's consider simple example where we have a Page resource 

```ts
import { AdminForthResourceInput } from "adminforth";

export default {
  dataSource: "maindb",
  table: "pages",
  resourceId: "pages",
  label: "Pages",
  columns: [
    {
      name: "url",
      primaryKey: true,
      showIn: { all: false },
    },
    {
      name: "meta_title",
      label: "Meta Title",
      type: "string",
      showIn: { all: true },
    },
    {
      name: "meta_desc",
      label: "Meta Description",
      type: "string",
      showIn: { all: true },
    },
  ]
} as AdminForthResourceInput;
```

You might have this page and return it in your API for nuxt:

```ts
app.get(`${admin.config.baseUrl}/api/get_page`,
    async (req:any, res: Response): Promise<void> => {
      const pageUrl = req.query.pageUrl;
      if (!pageUrl) {
        res.status(400).json({ error: "pageUrl is required" });
        return;
      }
      const page = await admin.resource("pages").get([Filters.EQ("url", pageUrl)]);
      if (!page) {
        res.status(404).json({ error: `Page not found ${pageUrl}` });
        return;
      }
      res.json({
        meta_title: page.meta_title,
        meta_desc: page.meta_desc,
      });
    }
  ) 
);
```

Now you want to translate page meta title and meta description. You can do this by using `i18n` plugin for AdminForth.

```ts
import { AdminForth } from "adminforth";

export const SEO_PAGE_CATEGORY = "seo_page_config";

app.get(`${admin.config.baseUrl}/api/get_page`,\
//diff-add
 admin.express.translatable(
    async (req:any, res: Response): Promise<void> => {
      const pageUrl = req.query.pageUrl;
      if (!pageUrl) {
        res.status(400).json({ error: "pageUrl is required" });
        return;
      }
      const page = await admin.resource("pages").get([Filters.EQ("url", pageUrl)]);
      if (!page) {
        res.status(404).json({ error: `Page not found ${pageUrl}` });
        return;
      }

//diff-add
      const translateKeys = [ "meta_title", "meta_desc", ];
//diff-add
      const [meta_title, meta_desc] = 
//diff-add
          await Promise.all(translateKeys.map((key: string) => req.tr(page[key], SEO_PAGE_CATEGORY)));
        

      res.json({
  //diff-remove
        meta_title: page.meta_title,
  //diff-add
        meta_title,
  //diff-remove
        meta_desc: page.meta_desc,
  //diff-add
        meta_desc,
      });
    }
//diff-add
  ) 
);
```

Looks straightforward, but here are 2 issues:

# Issue one - you need to call `req.tr` for each string before translating it in Admin

Since translation strings are created only when first time you call `req.tr` function, you need to ensure you will call this API for all your pages (in all envs e.g. local, dev, staging, prod ), this might be not convinient - you have to call this API, then go to translation page and translate it with bulk action LLM or manually, but you might forget one page or so.

To fix this we suggest next, go to Page resource and add next function on top level:

```ts
//diff-remove
import { AdminForthResourceInput } from "adminforth";
//diff-add
import AdminForth, { AdminForthResourceInput, Filters, IAdminForth } from "adminforth";
//diff-add
import I18nPlugin from "@adminforth/i18n/index.js";

//diff-add
import { SEO_PAGE_CATEGORY } from "../api.ts";

//diff-add
export async function feedAllPageTranslations(adminforth: IAdminForth) {
//diff-add
  const i18nPlugin = adminforth.getPluginByClassName<I18nPlugin>('I18nPlugin');
//diff-add
  const pages = await adminforth.resource('pages').list([]);
//diff-add
  await Promise.all(
    //diff-add
    pages.map(async (page: any) => {
  //diff-add
      await Promise.all(
  //diff-add
      ['meta_title', 'meta_desc'].map(async (key) => {
  //diff-add
        if (page[key]) {
  //diff-add
          await i18nPlugin.feedCategoryTranslations(
    //diff-add
            [{ en_string: page[key], source: `pages.${page.url}.${key}` }], SEO_PAGE_CATEGORY
    //diff-add
          );
  //diff-add
        }
//diff-add
      })
//diff-add
    );
//diff-add
  })
//diff-add
  );
//diff-add
}

export default {
  dataSource: "maindb",
  table: "pages",
  resourceId: "pages",
  ...
```

This function will iterate all pages and call `feedCategoryTranslations` function for each page and each key. This will create translation strings in your database for each page and each key. If translation objects already exist, it will skip them (**will not** create duplicates and **will not** overwrite translations).

Now we need to call this function in hooks:

```ts
export default {
  dataSource: "maindb",
  table: "pages",
  resourceId: "pages",
  label: "Pages",
//diff-add
  hooks: {
//diff-add
    create: {
//diff-add
      afterSave: async ({ record, adminforth }: { record: Record<string, string>, adminforth: IAdminForth }) => {
//diff-add
        feedAllPageTranslations(adminforth);
//diff-add
        return { ok: true };
//diff-add
      },
//diff-add
    },
//diff-add
    edit: {
//diff-add
      afterSave: async ({ oldRecord, updates, adminforth }: { oldRecord: Record<string, string>, updates: Record<string, string>, adminforth: IAdminForth }) => {
//diff-add
        feedAllPageTranslations(adminforth);
//diff-add
        return { ok: true }; 
//diff-add
      },
//diff-add
    },
  },  
  columns: [
    ...
```

> Please note that we run this function without await, so it will not block your API. SO function will be called in background when hook will already return and user will not wait for it.


Now every time you will create or edit page, it will call `feedAllPageTranslations` function and create translation strings for each page and each key. 
You can also import this function into index script and run after database discover, if you already have pages in your database and you want to create translation strings for them even without clicking on create or edit button.

# Issue 2 - after modification of page attributes old translation strings will not be removed

You can mitigate this by adding couple of lines into edit hook:

```ts
    edit: {
      afterSave: async ({ oldRecord, updates, adminforth }: { oldRecord: Record<string, string>, updates: Record<string, string>, adminforth: IAdminForth }) => {
       //diff-add
         if (Object.keys(updates).length) {
       //diff-add
          // find old strings which were edited and which are not used anymore
       //diff-add
        const oldStrings = await adminforth.resource('translations').list([
       //diff-add
            Filters.AND([
       //diff-add
              Filters.EQ('category', 'seo_page_config'),
       //diff-add
              Filters.IN('en_string', Object.keys(updates).map((key: string) => oldRecord[key]))
       //diff-add
            ])
       //diff-add
          ]);
       //diff-add
          // delete them
       //diff-add
          await Promise.all(
       //diff-add
            oldStrings.map((oldString: any) => {
       //diff-add
              return adminforth.resource('translations').delete(oldString.id);
       //diff-add
            })
       //diff-add
          );
       //diff-add
        }
        feedAllPageTranslations(adminforth);
        return { ok: true }; 
      },
    },
```

This will delete all old translation strings which are not used anymore.

If your have ability to delete pages, you can also add delete hook, you can do this as a homework.


# Conclusion

In this article we have shown how to translate dynamic strings in AdminForth API. We have also shown how to create translation strings for each page and each key in your database.
We have also shown how to delete old translation strings which are not used anymore. This will help you to keep your translation strings clean and up to date.