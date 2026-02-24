# Auto Remove Plugin

This plugin removes records from resources based on **count-based** or **time-based** rules.

It is designed for cleaning up:

* old records
* logs
* demo/test data
* temporary entities

---

## Instalation

To install the plugin:

```bash
npm install @adminforth/auto-remove
```

Import it into your resource:
```bash
import AutoRemovePlugin from '../../plugins/adminforth-auto-remove/index.js';
```

## Plugin Options

```ts
export interface PluginOptions {
 createdAtField: string;

  /**
   * - count-based: Delete items > maxItems
   * - time-based: Delete age > maxAge
   */
  mode: AutoRemoveMode;

  /**
   * for count-based mode (100', '1k', '10k', '1m')
   */
  keepAtLeast?: HumanNumber;

  /**
   * Minimum number of items to always keep in count-based mode.
   * This acts as a safety threshold together with `keepAtLeast`.
   * Example formats: '100', '1k', '10k', '1m'.
   * 
   * Validation ensures that minItemsKeep <= keepAtLeast. 
  */
  minItemsKeep?: HumanNumber;

  /**
   * Max age of item for time-based mode ('1d', '7d', '1mon', '1y')
   */
  deleteOlderThan?: HumanDuration;

  /**
   * Interval for running cleanup (e.g. '1h', '1d')
   * Default '1d'
   */
  interval?: HumanDuration;
}
```
---

## Usage
To use the plugin, add it to your resource file. Here's an example:

for count-based mode
```ts
new AutoRemovePlugin({
        createdAtField: 'created_at',   
        mode: 'count-based',            
        keepAtLeast: '200',                  
        interval: '30d',                  
        minItemsKeep: '180',       
      }),
```

for time-based mode
```ts
new AutoRemovePlugin({
        createdAtField: 'created_at',
        mode: 'time-based',
        deleteOlderThan: '1y',
        interval: '30d',  
      }),
```

---

## Result
After running **AutoRemovePlugin**, old or excess records are deleted automatically:

- **Count-based mode:** keeps the newest `keepAtLeast` records, deletes older ones.  
  Example: `keepAtLeast = 500` → table with 650 records deletes 150 oldest.

- **Time-based mode:** deletes records older than `deleteOlderThan`.  
  Example: `deleteOlderThan = '7d'` → removes records older than 7 days.

- **Manual cleanup:** `POST /plugin/{pluginInstanceId}/cleanup`, returns `{ "ok": true }`.

Logs show how many records were removed per run.