import pino from 'pino';
import { PinoPretty } from "pino-pretty";

export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      hideObject: true,
      messageFormat: '[{level}] ({layer}) {msg}',
    }
  },
  level: process.env.HEAVY_DEBUG ? 'trace' : ( process.env.DEBUG_LEVEL || 'info' )
});

export const afLogger = logger.child(
  { layer: 'adminforth' },
  { level: process.env.HEAVY_DEBUG ? 'trace' :  ( process.env.DEBUG_LEVEL || 'info' ) }
);

export const dbLogger = logger.child(
  { layer: 'db' },
  { level: process.env.HEAVY_DEBUG_QUERY ? 'trace' : (process.env.DEBUG_LEVEL_DB_QUERY || 'info') }
);