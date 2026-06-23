---
description: "Guide to the AdminForth logger, including custom log messages, log levels, and SPA debugging for frontend troubleshooting."
---

# Usage of the logger

There are cases when you might want to debug an Adminforth app or add custom logs.

## Adding custom logs

> These logs are used only on the backend.

> ❗️Do not combine them with `console.log()` because it can cause an unpredictable order of logs.

To add a custom log, import the logger and use the desired level:

```ts
import { logger } from 'adminforth';

logger.trace("This is trace log");
logger.debug("This is debug log");
logger.info("This is info log");
logger.warn("This is warn log");
logger.error("This is error log");
```

Depending on the active log level, some messages will be filtered out.


## Changing logging level and debugging the Adminforth SPA

There are three types of logs: user logs, Adminforth logs, and database logs.
Use separate environment variables to control each type.

Logger has 5 debug levels:

```ts
"trace"
"debug"
"info"
"warn"
"error"
```

By default, the logger uses the `info` level.

To change it, set the environment variable for the logger you want to see:

- `DEBUG_LEVEL=trace` - user logs at `trace` level
- `AF_DEBUG_LEVEL=debug` - Adminforth logs at `debug` level
- `DB_DEBUG_LEVEL=trace` - database logs at `trace` level

Or run the Adminforth app like this:

```bash
DB_DEBUG_LEVEL=trace pnpm start
```

And the logs will be visible as well.

## Single-line logs

By default, log records that contain additional data objects are printed across multiple lines (pretty-printed).
If you prefer each log record to be printed on a single line (for example, to make logs easier to grep or to fit
log collectors), set the `LOG_SINGLE_LINE` environment variable:

```bash
LOG_SINGLE_LINE=true pnpm start
```

Accepted truthy values are `true` and `1`. When unset, logs use the default multi-line pretty format.

## Configuring the logger from the AdminForth config

Instead of (or in addition to) environment variables, you can configure the logger programmatically via the
`logger` field of the AdminForth config. Anything you set here overrides the corresponding environment variable.

```ts
const admin = new AdminForth({
  // ...
  logger: {
    // Print each record on a single line (same as LOG_SINGLE_LINE=true)
    singleLine: true,

    // Per-logger levels (override DEBUG_LEVEL / AF_DEBUG_LEVEL / DB_DEBUG_LEVEL)
    levels: {
      user: 'debug', // your own `logger` calls
      af: 'info',    // internal AdminForth logs
      db: 'trace',   // database logs
    },

    // Add custom log levels on top of the standard ones.
    // The key becomes a method (e.g. `logger.audit(...)`) and the value is its numeric priority.
    // 35 sits between `debug` (20) and `info` (30).
    customLevels: { audit: 35 },

    // Optional colors for custom (or standard) levels in the pretty output.
    customColors: { audit: 'magenta' },
  },
});
```

After this, your custom level is available on the exported logger:

```ts
import { logger } from 'adminforth';

logger.audit({ userId: 42 }, 'User performed an audited action');
```

:::tip
The `logger` config is applied at the very start of the AdminForth constructor, so a handful of early
internal trace logs (emitted before the config is read) still use the environment-variable defaults.
If you need full control from the very first log line, you can also call `configureLogger(...)` yourself
before creating the AdminForth instance:

```ts
import { configureLogger } from 'adminforth';

configureLogger({ singleLine: true, customLevels: { audit: 35 } });
```
:::





