import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';


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
  if (__dirname.endsWith('/dist/modules')) {
    // in prod build we are in dist also, so make another back jump to go true sorces
    __dirname = path.join(__dirname, '..');
  }
  return __dirname;
}

export const ADMIN_FORTH_ABSOLUTE_PATH = path.join(currentFileDir(import.meta.url), '..');

const package_json = JSON.parse(fs.readFileSync(path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'package.json'), 'utf8'));

export const ADMINFORTH_VERSION: string = package_json.version;

export function getComponentNameFromPath(filePath) {
  return filePath.replace(/@/g, '').replace(/\./g, '').replace(/\//g, '');
}

export function listify(param?: Array<Function>) {
  return param || [];
}

export function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) {
      return source;
  }

  for (let key in source) {
      if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && source[key] !== null) {
              if (!target[key]) {
                  target[key] = {};
              }
              deepMerge(target[key], source[key]);
          } else {
              target[key] = source[key];
          }
      }
  }

  return target;
}

function toCamelCase(str) {
  return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
}

export function transformObject(obj, parentKey = '', result = {}) {
  for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
          const camelCaseKey = toCamelCase(parentKey ? `${parentKey}_${key}` : key);
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              transformObject(obj[key], camelCaseKey, result);
          } else {
              result[camelCaseKey] = obj[key];
          }
      }
  }
  //remove 'Default' from keys
  for (const key in result) {
    if (key.includes('Main')) {
      const newKey = key.replace('Main', '');
      result[newKey] = result[key];
      delete result[key];
    }
  }

  return result;
}