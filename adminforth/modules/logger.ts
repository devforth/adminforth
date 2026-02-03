import pino from 'pino';

const baseLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    }
  },
});

export const logger = baseLogger.child(
  { name: 'User logs' },
  { level: process.env.HEAVY_DEBUG ? 'trace' : ( process.env.DEBUG_LEVEL || 'info' ) },
);

export const afLogger = baseLogger.child(
  { name: 'AF' },
  { level: process.env.HEAVY_DEBUG ? 'trace' :  ( process.env.AF_DEBUG_LEVEL || 'info' ) }
);

export const dbLogger = baseLogger.child(
  { name: 'DB' },
  { level: process.env.HEAVY_DEBUG_QUERY ? 'trace' : (process.env.DB_DEBUG_LEVEL|| 'info') }
);