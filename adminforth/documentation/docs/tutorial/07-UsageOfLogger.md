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
DB_DEBUG_LEVEL=trace npm start
```

And the logs will be visible as well.





