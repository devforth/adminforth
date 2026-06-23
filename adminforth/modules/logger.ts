import pino from 'pino';

export interface AdminForthLoggerConfig {
  singleLine?: boolean;

  levels?: {
    user?: string;
    af?: string;
    db?: string;
  };

  customLevels?: Record<string, number>;
  customColors?: Record<string, string>;
}

function envBool(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

const ENV_USER_LEVEL = process.env.HEAVY_DEBUG ? 'trace' : (process.env.DEBUG_LEVEL || 'info');
const ENV_AF_LEVEL = process.env.HEAVY_DEBUG ? 'trace' : (process.env.AF_DEBUG_LEVEL || 'info');
const ENV_DB_LEVEL = process.env.HEAVY_DEBUG_QUERY ? 'trace' : (process.env.DB_DEBUG_LEVEL || 'info');

let userLoggerImpl: pino.Logger;
let afLoggerImpl: pino.Logger;
let dbLoggerImpl: pino.Logger;

function buildLoggers(config: AdminForthLoggerConfig = {}): void {
  const singleLine = config.singleLine ?? envBool(process.env.LOG_SINGLE_LINE);

  const customLevelsStr = config.customLevels
    ? Object.entries(config.customLevels).map(([level, value]) => `${level}:${value}`).join(',')
    : undefined;
  const customColorsStr = config.customColors
    ? Object.entries(config.customColors).map(([level, color]) => `${level}:${color}`).join(',')
    : undefined;

  const baseLogger = pino({
    ...(config.customLevels ? { customLevels: config.customLevels } : {}),
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        singleLine,
        ...(customLevelsStr ? { customLevels: customLevelsStr } : {}),
        ...(customColorsStr ? { customColors: customColorsStr } : {}),
        ...((customLevelsStr || customColorsStr) ? { useOnlyCustomProps: false } : {}),
      },
    },
  });

  userLoggerImpl = baseLogger.child({ name: 'User logs' }, { level: config.levels?.user ?? ENV_USER_LEVEL });
  afLoggerImpl = baseLogger.child({ name: 'AF' }, { level: config.levels?.af ?? ENV_AF_LEVEL });
  dbLoggerImpl = baseLogger.child({ name: 'DB' }, { level: config.levels?.db ?? ENV_DB_LEVEL });
}

buildLoggers();

export function configureLogger(config: AdminForthLoggerConfig): void {
  buildLoggers(config);
}

function makeLoggerProxy(resolve: () => pino.Logger): pino.Logger {
  return new Proxy({} as pino.Logger, {
    get(_target, prop) {
      const target = resolve();
      const value = (target as any)[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(_target, prop, value) {
      (resolve() as any)[prop] = value;
      return true;
    },
  });
}

export const logger = makeLoggerProxy(() => userLoggerImpl);
export const afLogger = makeLoggerProxy(() => afLoggerImpl);
export const dbLogger = makeLoggerProxy(() => dbLoggerImpl);
