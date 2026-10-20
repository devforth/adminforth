import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Fuse from 'fuse.js';
import crypto from 'crypto';
import { AdminForthConfig, AdminForthResource, AdminForthResourceColumnInputCommon,Filters, IAdminForth, Predicate } from '../index.js';
import { RateLimiterMemory, RateLimiterAbstract } from "rate-limiter-flexible";
import { encodeRecordId, isCompositePrimaryKey } from './recordId.js';
import { PERIOD_UNITS, type PeriodString, type PeriodUnit, type HttpExtra } from '../types/Back.js';

// theme helpers live next to StylesGenerator, so it can be imported without the server
export { deepMerge, transformObject, createRGBA, parseColorForAliases, darkenRGBA, lightenRGBA, inverseRGBA } from './styleGenerator.js';

export async function getLoginPromptHTML(
  loginPrompt: string | (() => string | void | undefined | Promise<string | void | undefined>) | undefined,
): Promise<string | null> {
  if (typeof loginPrompt === 'function') {
    const resolvedLoginPrompt = await loginPrompt();
    return resolvedLoginPrompt || null;
  }

  return loginPrompt || null;
}

export function guessLabelFromName(name) {
  if (name.includes('_')) {
    return name.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  } else if (name.includes('-')) {
    return name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  } else {
    // split by capital letters
    return name.split(/(?=[A-Z])/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }
}

export const currentFileDir = (metaUrl) => {
  const __filename = fileURLToPath(metaUrl);
  let __dirname = path.dirname(__filename);
  
  // Check for dist/modules in both Unix and Windows path formats
  const normalizedDir = __dirname.replace(/\\/g, '/');
  if (normalizedDir.endsWith('/dist/modules')) {
    // in prod build we are in dist also, so make another back jump to go to sources
    __dirname = path.join(__dirname, '..');
  }
  return __dirname;
}

// in both bundeled and dev mode this always points to the root of the adminforth package (where package.json is)
export const ADMIN_FORTH_ABSOLUTE_PATH = path.join(currentFileDir(import.meta.url), '..');

const package_json = JSON.parse(fs.readFileSync(path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'package.json'), 'utf8'));

export const ADMINFORTH_VERSION: string = package_json.version;

export function getComponentNameFromPath(filePath) {
  return filePath.replace(/@/g, '').replace(/\./g, '').replace(/\//g, '');
}

export function listify(param?: Array<Function>) {
  return param || [];
}
export function parseLooseJson(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
  }

  const keywords = ['true', 'false', 'null'];
  const normalized = input
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
    .replace(/(:\s*)([A-Za-z_$][\w$]*)(?=\s*[,}\]])/g, (match, before, word) =>
      keywords.includes(word) ? match : `${before}"${word}"`
    )
    .replace(/([\[,]\s*)([A-Za-z_$][\w$]*)(?=\s*[,\]])/g, (match, before, word) =>
      keywords.includes(word) ? match : `${before}"${word}"`
    );

  return JSON.parse(normalized);
}

export function suggestIfTypo(names: string[], name: string): string {
  if (!name) {
    return null;
  }
  const options = {
    includeScore: true, // Includes score in the results to see how close matches are
    threshold: 0.3,     // Defines the fuzziness (lower values mean stricter matches)
  };
  
  const fuse = new Fuse(names.filter(
    (n) => !!n
  ), options);
  // Search for a resource
  const result = fuse.search(name);
  if (result.length > 0) {
    return result[0].item;
  }
}


/**
 * Message for an option or param removed in AdminForth 4, names what to use instead
 */
export function removedInV4(what: string, replacement: string): string {
  return `${what} is no longer supported in AdminForth 4+, use ${replacement} instead`;
}

export function md5hash(str:string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function isPeriodUnit(unit: string): unit is PeriodUnit {
  return (PERIOD_UNITS as readonly string[]).includes(unit);
}

function parsePositiveInteger(value: string, fieldName: string, source: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be a positive integer, got: "${source}"`);
  }
  return parsed;
}

export function convertPeriodToSeconds(period: PeriodString): number {
    const value = period.slice(0, -1);
    const periodChar = period.slice(-1);
    if (!isPeriodUnit(periodChar)) {
      throw new Error(`Invalid period: ${period}`);
    }

    const duration = parsePositiveInteger(value, 'Period', period);
    if (periodChar === 's') {
      return duration;
    } else if (periodChar === 'm') {
      return duration * 60;
    } else if (periodChar === 'h') {
      return duration * 60 * 60;
    } else if (periodChar === 'd') {
      return duration * 60 * 60 * 24;
    }
    throw new Error(`Invalid period: ${period}`);
}
export class RateLimiter {
  // constructor, accepts string like 10/10m, or 20/10s, or 30/1d


  rateLimiter: RateLimiterAbstract;

  static parseRate(rate: unknown): { points: number, duration: number } {
    if (typeof rate !== 'string') {
      throw new Error('Rate limit must be a string in format "500/5m"');
    }

    const parts = rate.split('/');
    if (parts.length !== 2) {
      throw new Error(`Rate limit must be in format "500/5m", got: "${rate}"`);
    }

    const [pointsPart, period] = parts;
    const periodValue = period.slice(0, -1);
    const periodUnit = period.slice(-1);
    if (!periodValue || !isPeriodUnit(periodUnit)) {
      throw new Error(`Rate limit must be in format "500/5m", got: "${rate}"`);
    }

    return {
      points: parsePositiveInteger(pointsPart, 'Rate limit points', rate),
      duration: convertPeriodToSeconds(period as PeriodString),
    };
  }


  constructor(rate: string) {
    const { points, duration } = RateLimiter.parseRate(rate);
    const opts = {
      points,
      duration, // Per second
    };
    this.rateLimiter = new RateLimiterMemory(opts);
  }


  async consume(key: string) {
    try {
      await this.rateLimiter.consume(key);
      return true;
    } catch (rejRes) {
      return false;
    }
  }

}

export class RAMLock {
  private locks: Map<string, { locked: boolean; queue: Function[] }>;

  constructor() {
    this.locks = new Map();
  }

  _getLock(key) {
    if (!this.locks.has(key)) {
      this.locks.set(key, { locked: false, queue: [] });
    }
    return this.locks.get(key);
  }

  async run(key, fn) {
    const lock = this._getLock(key);
    while (lock.locked) {
      await new Promise(resolve => lock.queue.push(resolve));
    }
    lock.locked = true;
    try {
      return await fn();
    } finally {
      lock.locked = false;
      if (lock.queue.length > 0) {
        const next = lock.queue.shift();
        next();
      }
    }
  }
}

export function isProbablyUUIDColumn(column: { name: string; type?: string; sampleValue?: any }): boolean {
  if (column.type?.toLowerCase() === 'uuid') return true;
  if (typeof column.sampleValue === 'string') {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(column.sampleValue);
  }

  return false;
}

export function slugifyString(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-');
}

export async function cascadeChildrenDelete(resource: AdminForthResource, primaryKey: string, context: {adminUser: any, extra?: HttpExtra}, adminforth: IAdminForth): Promise<{ error: string | null }> {
  const { adminUser, extra } = context;

  const childResources = adminforth.config.resources.filter(r =>r.columns.some(c => c.foreignResource?.resourceId === resource.resourceId));

  for (const childRes of childResources) {
    const foreignColumn = childRes.columns.find(c => c.foreignResource?.resourceId === resource.resourceId);

    if (!foreignColumn?.foreignResource?.onDelete) continue;

    const strategy = foreignColumn.foreignResource.onDelete;

    const childRecords = await adminforth.resource(childRes.resourceId).list(Filters.EQ(foreignColumn.name, primaryKey));

    const childPk = childRes.columns.find(c => c.primaryKey)?.name;
    const childRecordId = (childRecord: any) => isCompositePrimaryKey(childRes)
      ? encodeRecordId(childRes, childRecord)
      : childRecord[childPk];

    if (strategy === 'cascade') {
      for (const childRecord of childRecords) {
        const childResult = await cascadeChildrenDelete(childRes, childRecordId(childRecord), context, adminforth);
        if (childResult?.error) {
          return childResult;
        }
        const deleteChild = await adminforth.deleteResourceRecord({resource: childRes, record: childRecord, adminUser, recordId: childRecordId(childRecord), extra});
        if (deleteChild.error) return { error: deleteChild.error };
        if (childResult?.error) {
          return childResult;
        }
      }
    }

    if (strategy === 'setNull') {
      for (const childRecord of childRecords) {
        await adminforth.resource(childRes.resourceId).update(childRecordId(childRecord), {[foreignColumn.name]: null});
      }
    }
  }

  return { error: null };
}

  export function hookResponseError(hookResponse: {ok: boolean, error?: string | null}, hookName: string = 'beforeSave') {
    if (!hookResponse || typeof hookResponse.ok !== 'boolean') {
      throw new Error(`Hook ${hookName} must return { ok: boolean, error?: string | null }`);
    }
    if (hookResponse.ok === false && !hookResponse.error) {
      return { error: hookResponse.error ?? 'Operation aborted by hook' };
    }
    if (hookResponse.error) {
      return { error: hookResponse.error };
    }
    return null;
  }

export function checkIfFieldIsInsideResourceColumns(fieldName: string, resource: AdminForthResource): boolean {
  for (const column of resource.columns) {
    if (column.name === fieldName) {
      return true;
    }
  }
  return false;
}

export function applyRegexValidation(value, validation) {
  if (validation?.length) {
    const validationArray = validation;
    for (let i = 0; i < validationArray.length; i++) {
      if (validationArray[i].regExp) {
        let flags = '';
        if (validationArray[i].caseSensitive) {
          flags += 'i';
        }
        if (validationArray[i].multiline) {
          flags += 'm';
        }
        if (validationArray[i].global) {
          flags += 'g';
        }

        const regExp = new RegExp(validationArray[i].regExp, flags);
        if (value === undefined || value === null) {
          value = '';
        }
        let valueS = `${value}`;

        if (!regExp.test(valueS)) {
          return validationArray[i].message;
        }
      }
    }
  }
}

export function formatHugePluginError(message: string) {
  const RED = '\x1b[31m';
  const BG = '\x1b[41m';
  const WHITE = '\x1b[97m';
  const BOLD = '\x1b[1m';
  const RESET = '\x1b[0m';

  const horizontal = '═'.repeat(100);

  return `
    ${BG}${WHITE}${BOLD}
    ╔${horizontal}╗
    ║${' '.repeat(100)}║
    ║  🚨 PLUGIN CONFIGURATION ERROR${' '.repeat(69)}║
    ║${' '.repeat(100)}║
    ║  ${message.padEnd(98)}║
    ║${' '.repeat(100)}║
    ╚${horizontal}╝
    ${RESET}
  `;
}

export function checkIfLinkInAllowedHosts(url: string, allowedHosts: string[]) {
  if (!allowedHosts?.length) {
    return;
  }
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    throw new Error(`Invalid attachment URL: ${url}`);
  }
  const allowed = allowedHosts.some((raw) => {
    const entry = (raw || '').trim().toLowerCase().replace(/^\*/, '').replace(/\.$/, '');
    if (!entry) {
      return false;
    }
    return entry.startsWith('.') ? (hostname === entry.slice(1) || hostname.endsWith(entry)) : hostname === entry;
  });
  if (!allowed) {
    throw new Error(`Attachment host "${hostname}" is not in attachImagesAllowedHosts`);
  }
}