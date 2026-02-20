import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Fuse from 'fuse.js';
import crypto from 'crypto';
import AdminForth, { AdminForthConfig, AdminForthResourceColumnInputCommon, Predicate } from '../index.js';
import { RateLimiterMemory, RateLimiterAbstract } from "rate-limiter-flexible";
// @ts-ignore-next-line


const csscolors = {
  "aliceblue": "#f0f8ff",
  "antiquewhite": "#faebd7",
  "aqua": "#00ffff",
  "aquamarine": "#7fffd4",
  "azure": "#f0ffff",
  "beige": "#f5f5dc",
  "bisque": "#ffe4c4",
  "black": "#000000",
  "blanchedalmond": "#ffebcd",
  "blue": "#0000ff",
  "blueviolet": "#8a2be2",
  "brown": "#a52a2a",
  "burlywood": "#deb887",
  "cadetblue": "#5f9ea0",
  "chartreuse": "#7fff00",
  "chocolate": "#d2691e",
  "coral": "#ff7f50",
  "cornflowerblue": "#6495ed",
  "cornsilk": "#fff8dc",
  "crimson": "#dc143c",
  "cyan": "#00ffff",
  "darkblue": "#00008b",
  "darkcyan": "#008b8b",
  "darkgoldenrod": "#b8860b",
  "darkgray": "#a9a9a9",
  "darkgreen": "#006400",
  "darkgrey": "#a9a9a9",
  "darkkhaki": "#bdb76b",
  "darkmagenta": "#8b008b",
  "darkolivegreen": "#556b2f",
  "darkorange": "#ff8c00",
  "darkorchid": "#9932cc",
  "darkred": "#8b0000",
  "darksalmon": "#e9967a",
  "darkseagreen": "#8fbc8f",
  "darkslateblue": "#483d8b",
  "darkslategray": "#2f4f4f",
  "darkslategrey": "#2f4f4f",
  "darkturquoise": "#00ced1",
  "darkviolet": "#9400d3",
  "deeppink": "#ff1493",
  "deepskyblue": "#00bfff",
  "dimgray": "#696969",
  "dimgrey": "#696969",
  "dodgerblue": "#1e90ff",
  "firebrick": "#b22222",
  "floralwhite": "#fffaf0",
  "forestgreen": "#228b22",
  "fuchsia": "#ff00ff",
  "gainsboro": "#dcdcdc",
  "ghostwhite": "#f8f8ff",
  "goldenrod": "#daa520",
  "gold": "#ffd700",
  "gray": "#808080",
  "green": "#008000",
  "greenyellow": "#adff2f",
  "grey": "#808080",
  "honeydew": "#f0fff0",
  "hotpink": "#ff69b4",
  "indianred": "#cd5c5c",
  "indigo": "#4b0082",
  "ivory": "#fffff0",
  "khaki": "#f0e68c",
  "lavenderblush": "#fff0f5",
  "lavender": "#e6e6fa",
  "lawngreen": "#7cfc00",
  "lemonchiffon": "#fffacd",
  "lightblue": "#add8e6",
  "lightcoral": "#f08080",
  "lightcyan": "#e0ffff",
  "lightgoldenrodyellow": "#fafad2",
  "lightgray": "#d3d3d3",
  "lightgreen": "#90ee90",
  "lightgrey": "#d3d3d3",
  "lightpink": "#ffb6c1",
  "lightsalmon": "#ffa07a",
  "lightseagreen": "#20b2aa",
  "lightskyblue": "#87cefa",
  "lightslategray": "#778899",
  "lightslategrey": "#778899",
  "lightsteelblue": "#b0c4de",
  "lightyellow": "#ffffe0",
  "lime": "#00ff00",
  "limegreen": "#32cd32",
  "linen": "#faf0e6",
  "magenta": "#ff00ff",
  "maroon": "#800000",
  "mediumaquamarine": "#66cdaa",
  "mediumblue": "#0000cd",
  "mediumorchid": "#ba55d3",
  "mediumpurple": "#9370db",
  "mediumseagreen": "#3cb371",
  "mediumslateblue": "#7b68ee",
  "mediumspringgreen": "#00fa9a",
  "mediumturquoise": "#48d1cc",
  "mediumvioletred": "#c71585",
  "midnightblue": "#191970",
  "mintcream": "#f5fffa",
  "mistyrose": "#ffe4e1",
  "moccasin": "#ffe4b5",
  "navajowhite": "#ffdead",
  "navy": "#000080",
  "oldlace": "#fdf5e6",
  "olive": "#808000",
  "olivedrab": "#6b8e23",
  "orange": "#ffa500",
  "orangered": "#ff4500",
  "orchid": "#da70d6",
  "palegoldenrod": "#eee8aa",
  "palegreen": "#98fb98",
  "paleturquoise": "#afeeee",
  "palevioletred": "#db7093",
  "papayawhip": "#ffefd5",
  "peachpuff": "#ffdab9",
  "peru": "#cd853f",
  "pink": "#ffc0cb",
  "plum": "#dda0dd",
  "powderblue": "#b0e0e6",
  "purple": "#800080",
  "rebeccapurple": "#663399",
  "red": "#ff0000",
  "rosybrown": "#bc8f8f",
  "royalblue": "#4169e1",
  "saddlebrown": "#8b4513",
  "salmon": "#fa8072",
  "sandybrown": "#f4a460",
  "seagreen": "#2e8b57",
  "seashell": "#fff5ee",
  "sienna": "#a0522d",
  "silver": "#c0c0c0",
  "skyblue": "#87ceeb",
  "slateblue": "#6a5acd",
  "slategray": "#708090",
  "slategrey": "#708090",
  "snow": "#fffafa",
  "springgreen": "#00ff7f",
  "steelblue": "#4682b4",
  "tan": "#d2b48c",
  "teal": "#008080",
  "thistle": "#d8bfd8",
  "tomato": "#ff6347",
  "turquoise": "#40e0d0",
  "violet": "#ee82ee",
  "wheat": "#f5deb3",
  "white": "#ffffff",
  "whitesmoke": "#f5f5f5",
  "yellow": "#ffff00",
  "yellowgreen": "#9acd32"
}


export async function getLoginPromptHTML(loginPrompt: string | Function) {
  if(typeof loginPrompt === 'function') {
    loginPrompt = await loginPrompt();
    if (!loginPrompt) {
      return null;
    }
  }
  return loginPrompt;
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
  const inverseRegex = /inverse/;

  // Extract alias and properties
  const aliasMatch = str.match(aliasRegex);
  const opacityMatch = str.match(opacityRegex)
  const darkenMatch = str.match(darkenRegex)
  const lightenMatch = str.match(lightenRegex)
  const inverseMatch = str.match(inverseRegex)
  return {aliasMatch,opacityMatch,darkenMatch,lightenMatch, inverseMatch}
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


export function inverseRGBA(rgba) {
  // return white or black depending on the brightness of the color
  let [r, g, b] = rgba.match(/\d+/g).map(Number);
  let brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';
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


// TODO, remove, legacy
export function getClientIp(headers: object) {
  throw new Error('getClientIp is deprecated, use admin.auth.getClientIp. If this error dropped from plugin, please update the plugin');
}

export function md5hash(str:string) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export function convertPeriodToSeconds(period: string): number {
    const periodChar = period.slice(-1);
    const duration = parseInt(period.slice(0, -1));
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


  durStringToSeconds(rate: string): number {
    if (!rate) {
      throw new Error('Rate duration is required');
    }


    return convertPeriodToSeconds(rate);
  }


  constructor(rate: string) {
    const [points, duration] = rate.split('/');
    const durationSeconds = this.durStringToSeconds(duration);
    const opts = {
      points: parseInt(points),
      duration: durationSeconds, // Per second
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
