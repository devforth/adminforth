import pino from 'pino';

const baseLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      hideObject: true,
      messageFormat: '{layer}: {msg}',
    }
  },
});

export const logger = baseLogger.child(
  { layer: 'user_logs' },
  { level: process.env.HEAVY_DEBUG ? 'trace' : ( process.env.DEBUG_LEVEL || 'info' ) }
);

export const afLogger = baseLogger.child(
  { layer: 'af' },
  { level: process.env.HEAVY_DEBUG ? 'trace' :  ( process.env.AF_DEBUG_LEVEL || 'info' ) }
);

export const dbLogger = baseLogger.child(
  { layer: 'db' },
  { level: process.env.HEAVY_DEBUG_QUERY ? 'trace' : (process.env.DB_DEBUG_LEVEL|| 'info') }
);