import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csscolors from 'css-color-names';






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


function hexToRGBA(hex,opacity){
  var c;
  if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c= hex.substring(1).split('');
      if(c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c= '0x'+c.join('');
      return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')';
  }
  throw new Error('Bad Hex');
}

 export function createRGBA(color:string, opacity:number) {
  if(!color) return
  else if (color.startsWith("rgba")) {
    //add opacity to existing rgba color
    const rgb = color.match(/[\d.]+/g);
    console.log('rgb',rgb)
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Number(rgb[3]) * opacity})`;
  }
  else if (color.startsWith("rgb")) {
    const rgb = color.match(/\d+/g);
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
  }
  else if (color.startsWith("#")) {
    return hexToRGBA(color, opacity);
  }
  else if (csscolors[color]) {
    return hexToRGBA(csscolors[color], opacity);
  }
  else {
    return color;
  }
}

export function parseColorForAliases(str){
  const aliasRegex = /alias:([^ ]+)/;
  const opacityRegex = /opacity:([0-9.]+)/;
  const darkenRegex = /darken/;
  const lightenRegex = /lighten/;

  // Extract alias and properties
  const aliasMatch = str.match(aliasRegex);
  const opacityMatch = str.match(opacityRegex)
  const darkenMatch = str.match(darkenRegex)
  const lightenMatch = str.match(lightenRegex)
  return {aliasMatch,opacityMatch,darkenMatch,lightenMatch}
}

export function darkenRGBA(rgba) {
  let amount = 0.2
  // Extract the RGBA components
  let [r, g, b, a] = rgba.match(/\d+/g).map(Number);

  // Ensure amount is between 0 and 1
  amount = Math.max(0, Math.min(1, amount));

  // Calculate the new RGB values
  r = Math.max(0, r * (1 - amount));
  g = Math.max(0, g * (1 - amount));
  b = Math.max(0, b * (1 - amount));

  // Return the new RGBA color
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

export function lightenRGBA(rgba) {
  let amount = 0.2
  // Extract the RGBA components
  let [r, g, b, a] = rgba.match(/\d+/g).map(Number);

  // Ensure amount is between 0 and 1
  amount = Math.max(0, Math.min(1, amount));

  // Calculate the new RGB values
  r = Math.min(255, r * (1 + amount));
  g = Math.min(255, g * (1 + amount));
  b = Math.min(255, b * (1 + amount));

  // Return the new RGBA color
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}



