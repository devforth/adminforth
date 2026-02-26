import { nextTick, onMounted, ref, resolveComponent } from 'vue';
import type { CoreConfig } from '../spa_types/core';
import type { ValidationObject } from '../types/Common.js';
import router from "../router";
import { useCoreStore } from '../stores/core';
import { useUserStore } from '../stores/user';
import { Dropdown } from 'flowbite';
import adminforth from '../adminforth';
import sanitizeHtml  from 'sanitize-html'
import debounce from 'debounce';
import type { AdminForthResourceColumnInputCommon, Predicate } from '@/types/Common';
import { i18nInstance } from '../i18n'
import { useI18n } from 'vue-i18n';




const LS_LANG_KEY = `afLanguage`;
const MAX_CONSECUTIVE_EMPTY_RESULTS = 2;
const ITEMS_PER_PAGE_LIMIT = 100;

export async function callApi({path, method, body, headers, silentError = false}: {
  path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' 
  body?: any
  headers?: Record<string, string>
  silentError?: boolean
}): Promise<any> {
  const t = i18nInstance?.global.t || ((s: string) => s)
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'accept-language': localStorage.getItem(LS_LANG_KEY) || 'en',
      ...headers
    },
    body: JSON.stringify(body),
  };
  const fullPath = `${import.meta.env.VITE_ADMINFORTH_PUBLIC_PATH || ''}${path}`;
  try {
    const r = await fetch(fullPath, options);
    if (r.status == 401 ) {
      useUserStore().unauthorize();
      useCoreStore().resetAdminUser();
      const currentPath = router.currentRoute.value.path;
      const homeRoute = router.getRoutes().find(route => route.name === 'home');
      const homePagePath = (homeRoute?.redirect as string) || '/';
      let next = '';
      if (currentPath !== '/login' && currentPath !== homePagePath) {
        if (Object.keys(router.currentRoute.value.query).length > 0) {
          next = currentPath + '?' + Object.entries(router.currentRoute.value.query).map(([key, value]) => `${key}=${value}`).join('&');
        } else {
          next = currentPath;
        }
        await router.push({ name: 'login', query: { next: next } });
      } else {
        await router.push({ name: 'login' });
      }
      return null;
    } 
    return await r.json();
  } catch(e) {
    // if it is internal error, say to user
    if (e instanceof TypeError && e.message === 'Failed to fetch') {
      // this is a network error
      if (!silentError) {
        adminforth.alert({variant:'danger', message: t('Network error, please check your Internet connection and try again'),})
      }
      return null;
    }

    if (!silentError) {
      adminforth.alert({variant:'danger', message: t('Something went wrong, please try again later'),})
    }
    console.error(`error in callApi ${path}`, e);
  }
}

export async function callAdminForthApi({ path, method, body=undefined, headers=undefined, silentError = false }: {
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any,
  headers?: Record<string, string>,
  silentError?: boolean
}): Promise<any> {
  try {
    return callApi({path: `/adminapi/v1${path}`, method, body, headers, silentError} );
  } catch (e) {
    console.error('error', e);
    return { error: `Unexpected error: ${e}` };
  }
}

export function getCustomComponent({ file, meta }: { file: string, meta?: any }) {
  const name = file.replace(/@/g, '').replace(/\./g, '').replace(/\//g, '');
  return resolveComponent(name);
}

export function getIcon(icon: string) {
  // icon format is "feather:icon-name". We need to get IconName in pascal case
  if (!icon.includes(':')) {
    throw new Error('Icon name should be in format "icon-set:icon-name"');
  }
  const [iconSet, iconName] = icon.split(':');
  const compName = 'Icon' + iconName.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  return resolveComponent(compName);
}

export const loadFile = (file: string) => {
  if (file.startsWith('http')) {
    return file;
  }
  let path;
  let baseUrl = '';
  if (file.startsWith('@/')) {
    path = file.replace('@/', '');
    baseUrl = new URL(`../${path}`, import.meta.url).href;
  } else if (file.startsWith('@@/')) {
    path = file.replace('@@/', '');
    baseUrl = new URL(`../custom/${path}`, import.meta.url).href;
  } else {
    baseUrl = new URL(`../${file}`, import.meta.url).href;
  }
  return baseUrl;
}


export function checkEmptyValues(value: any, viewType: 'show' | 'list' ) {
  const config: CoreConfig | {} | null = useCoreStore().config;
  let emptyFieldPlaceholder = '';
  if (config && 'emptyFieldPlaceholder' in config) {
    const efp = (config as CoreConfig).emptyFieldPlaceholder;
    if(typeof efp === 'string') {
      emptyFieldPlaceholder = efp;
    } else {
       emptyFieldPlaceholder = efp?.[viewType] || '';
    }
    if (value === null || value === undefined || value === '') {
      return emptyFieldPlaceholder;
    }
  }
  return value;
}

export function checkAcessByAllowedActions(allowedActions:any, action:any ) {
  if (!allowedActions) {
    console.warn('allowedActions not set');
    return;
  }
  if(allowedActions[action] === false) {
    console.warn(`Action ${action} is not allowed`);
    router.back();
  }
}

export function initThreeDotsDropdown() {
  const threeDotsDropdown: HTMLElement | null = document.querySelector('#listThreeDotsDropdown');
  if (threeDotsDropdown) {
    // this resource has three dots dropdown
    const dd = new Dropdown(
      threeDotsDropdown, 
      document.querySelector('[data-dropdown-toggle="listThreeDotsDropdown"]') as HTMLElement,
      { placement: 'bottom-end' }
    );
    adminforth.list.closeThreeDotsDropdown = () => {
      dd.hide();
    }
  }
}

export function applyRegexValidation(value: any, validation: ValidationObject[] | undefined) {

  if ( validation?.length ) {
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

export function currentQuery() {
  return router.currentRoute.value.query;
}

export function setQuery(query: any) {
  const currentQuery = { ...router.currentRoute.value.query, ...query };
  router.replace({
    query: currentQuery,
  });
}

export function verySimpleHash(str: string): string {
  return `${str.split('').reduce((a, b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)}`;
}

export function humanifySize(size: number) {
  if (!size) {
    return '';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(1)} ${units[i]}`
}

export function protectAgainstXSS(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "address", "article", "aside", "footer", "header", "h1", "h2", "h3", "h4",
      "h5", "h6", "hgroup", "main", "nav", "section", "blockquote", "dd", "div",
      "dl", "dt", "figcaption", "figure", "hr", "li", "main", "ol", "p", "pre",
      "ul", "a", "abbr", "b", "bdi", "bdo", "br", "cite", "code", "data", "dfn",
      "em", "i", "kbd", "mark", "q", "rb", "rp", "rt", "rtc", "ruby", "s", "samp",
      "small", "span", "strong", "sub", "sup", "time", "u", "var", "wbr", "caption",
      "col", "colgroup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", 'img', 'video', 'source'
    ],
    allowedAttributes: {
      'li': [ 'data-list' ],
      'img': [ 'src', 'srcset', 'alt', 'title', 'width', 'height', 'loading' ],
      'video': [ 'src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'width', 'height', 'autoplay', 'playsinline' ],
      'source': [ 'src', 'type' ],
      // Allow  markup on spans (classes & styles), and
      // generic data/aria/style attributes on any element. (e.g. for KaTeX-related previews)
      'span': [ 'class', 'style' ],
      '*': [ 'data-*', 'aria-*', 'style' ]
    },
  });
}

export function isPolymorphicColumn(column: any): boolean {
  return !!(column.foreignResource?.polymorphicResources && column.foreignResource.polymorphicResources.length > 0);
}

export function handleForeignResourcePagination(
  column: any,
  items: any[],
  emptyResultsCount: number = 0,
  isSearching: boolean = false
): { hasMore: boolean; emptyResultsCount: number } {
  const isPolymorphic = isPolymorphicColumn(column);
  
  if (isPolymorphic) {
    if (isSearching) {
      return {
        hasMore: items.length > 0,
        emptyResultsCount: 0
      };
    } else {
      if (items.length === 0) {
        const newEmptyCount = emptyResultsCount + 1;
        return {
          hasMore: newEmptyCount < MAX_CONSECUTIVE_EMPTY_RESULTS, // Stop loading after 2 consecutive empty results
          emptyResultsCount: newEmptyCount
        };
      } else {
        return {
          hasMore: true,
          emptyResultsCount: 0
        };
      }
    }
  } else {
    return {
      hasMore: items.length === ITEMS_PER_PAGE_LIMIT,
      emptyResultsCount: 0
    };
  }
}

export async function loadMoreForeignOptions({
  columnName,
  searchTerm = '',
  columns,
  resourceId,
  columnOptions,
  columnLoadingState,
  columnOffsets,
  columnEmptyResultsCount
}: {
  columnName: string;
  searchTerm?: string;
  columns: any[];
  resourceId: string;
  columnOptions: any;
  columnLoadingState: any;
  columnOffsets: any;
  columnEmptyResultsCount: any;
}) {
  const column = columns?.find(c => c.name === columnName);
  if (!column || !column.foreignResource) return;
  
  const state = columnLoadingState[columnName];
  if (state.loading || !state.hasMore) return;
  
  state.loading = true;
  
  try {
    const list = await callAdminForthApi({
      method: 'POST',
      path: `/get_resource_foreign_data`,
      body: {
        resourceId,
        column: columnName,
        limit: 100,
        offset: columnOffsets[columnName],
        search: searchTerm,
      },
    });
    
    if (!list || !Array.isArray(list.items)) {
      console.warn(`Unexpected API response for column ${columnName}:`, list);
      state.hasMore = false;
      return;
    }
    
    if (!columnOptions.value) {
      columnOptions.value = {};
    }
    if (!columnOptions.value[columnName]) {
      columnOptions.value[columnName] = [];
    }
    columnOptions.value[columnName].push(...list.items);
    
    columnOffsets[columnName] += 100;
    
    const paginationResult = handleForeignResourcePagination(
      column,
      list.items,
      columnEmptyResultsCount[columnName] || 0,
      false // not searching
    );
    
    columnEmptyResultsCount[columnName] = paginationResult.emptyResultsCount;
    state.hasMore = paginationResult.hasMore;
    
  } catch (error) {
    console.error('Error loading more options:', error);
  } finally {
    state.loading = false;
  }
}

export async function searchForeignOptions({
  columnName,
  searchTerm,
  columns,
  resourceId,
  columnOptions,
  columnLoadingState,
  columnOffsets,
  columnEmptyResultsCount
}: {
  columnName: string;
  searchTerm: string;
  columns: any[];
  resourceId: string;
  columnOptions: any;
  columnLoadingState: any;
  columnOffsets: any;
  columnEmptyResultsCount: any;
}) {
  const column = columns?.find(c => c.name === columnName);

  if (!column || !column.foreignResource || !column.foreignResource.searchableFields) {
    return;
  }
  
  const state = columnLoadingState[columnName];
  if (state.loading) return;
  
  state.loading = true;
  
  try {
    const list = await callAdminForthApi({
      method: 'POST',
      path: `/get_resource_foreign_data`,
      body: {
        resourceId,
        column: columnName,
        limit: 100,
        offset: 0,
        search: searchTerm,
      },
    });
    
    if (!list || !Array.isArray(list.items)) {
      console.warn(`Unexpected API response for column ${columnName}:`, list);
      state.hasMore = false;
      return;
    }
    
    if (!columnOptions.value) {
      columnOptions.value = {};
    }
    columnOptions.value[columnName] = list.items;
    columnOffsets[columnName] = 100;
    
    const paginationResult = handleForeignResourcePagination(
      column,
      list.items,
      columnEmptyResultsCount[columnName] || 0,
      true // is searching
    );
    
    columnEmptyResultsCount[columnName] = paginationResult.emptyResultsCount;
    state.hasMore = paginationResult.hasMore;

  } catch (error) {
    console.error('Error searching options:', error);
  } finally {
    state.loading = false;
  }
}

export function createSearchInputHandlers(
  columns: any[],
  searchFunction: (columnName: string, searchTerm: string) => void,
  getDebounceMs?: (column: any) => number
) {
  if (!columns) return {};

  return columns.reduce((acc, c) => {
    if (c.foreignResource && c.foreignResource.searchableFields) {
      const debounceMs = getDebounceMs ? getDebounceMs(c) : 300;
      return {
        ...acc,
        [c.name]: debounce((searchTerm: string) => {
          searchFunction(c.name, searchTerm);
        }, debounceMs),
      };
    }
    return acc;
  }, {} as Record<string, (searchTerm: string) => void>);
}

export function checkShowIf(c: AdminForthResourceColumnInputCommon, record: Record<string, any>, allColumns: AdminForthResourceColumnInputCommon[]) {
  if (!c.showIf) return true;
  const recordCopy = { ...record };
  for (const col of allColumns) {
    if (!recordCopy[col.name]) {
      recordCopy[col.name] = null;
    }
  }
  const evaluatePredicate = (predicate: Predicate): boolean => {
    const results: boolean[] = [];

    if ("$and" in predicate) {
      results.push(predicate.$and.every(evaluatePredicate));
    }

    if ("$or" in predicate) {
      results.push(predicate.$or.some(evaluatePredicate));
    }

    const fieldEntries = Object.entries(predicate).filter(([key]) => !key.startsWith('$'));
    if (fieldEntries.length > 0) {
      const fieldResult = fieldEntries.every(([field, condition]) => {
        const recordValue = recordCopy[field];

        if (condition === undefined) {
          return true;
        }
        if (typeof condition !== "object" || condition === null) {
          return recordValue === condition;
        }

        if ("$eq" in condition) return recordValue === condition.$eq;
        if ("$not" in condition) return recordValue !== condition.$not;
        if ("$gt" in condition) return recordValue > condition.$gt;
        if ("$gte" in condition) return recordValue >= condition.$gte;
        if ("$lt" in condition) return recordValue < condition.$lt;
        if ("$lte" in condition) return recordValue <= condition.$lte;
        if ("$in" in condition) return (Array.isArray(condition.$in) && condition.$in.includes(recordValue));
        if ("$nin" in condition) return (Array.isArray(condition.$nin) && !condition.$nin.includes(recordValue));
        if ("$includes" in condition)
          return (
            Array.isArray(recordValue) &&
            recordValue.includes(condition.$includes)
          );
        if ("$nincludes" in condition)
          return (
            Array.isArray(recordValue) &&
            !recordValue.includes(condition.$nicludes)
          );

        return true;
      });
      results.push(fieldResult);
    }

    return results.every(result => result);
  };

  return evaluatePredicate(c.showIf);
}

export function btoa_function(source: string): string {
  return btoa(source);
}

export function atob_function(source: string): string {
  return atob(source);
}

export function compareOldAndNewRecord(oldRecord: Record<string, any>, newRecord: Record<string, any>): {ok: boolean, changedFields: Record<string, {oldValue: any, newValue: any}>} {
  const newKeys = Object.keys(newRecord);
  const coreStore = useCoreStore();
  const changedColumns: Record<string, { oldValue: any, newValue: any }> = {};

  for (const key of newKeys) {
    const oldValue = typeof oldRecord[key] === 'object' && oldRecord[key] !== null ? JSON.stringify(oldRecord[key]) : oldRecord[key];
    const newValue = typeof newRecord[key] === 'object' && newRecord[key] !== null ? JSON.stringify(newRecord[key]) : newRecord[key];
    if (oldValue !== newValue) {
      if (  
            ( 
              oldValue === undefined || 
              oldValue === null || 
              oldValue === '' || 
              (Array.isArray(oldValue) && oldValue.length === 0) ||
              oldValue === '[]' 
            ) 
              &&            
            ( 
              newValue === undefined || 
              newValue === null || 
              newValue === '' || 
              (Array.isArray(newValue) && newValue.length === 0) || 
              newValue === '[]'
            )
      ) {
        // console.log(`Value for key ${key} is considered equal (empty)`)
        continue;
      }

      const column = coreStore.resource?.columns.find((c) => c.name === key);
      if (column?.foreignResource) {
        if (newRecord[key] === oldRecord[key]?.pk) {
          // console.log(`Value for key ${key} is considered equal (foreign key)`)
          continue;
        }
      }
      // console.log(`Value for key ${key} is different`, { oldValue: oldValue, newValue: newValue });
      changedColumns[key] = { oldValue, newValue };
    }
  }
  return { ok: Object.keys(changedColumns).length !== 0, changedFields: changedColumns };
}

export function generateMessageHtmlForRecordChange(changedFields: Record<string, { oldValue: any, newValue: any }>, t: ReturnType<typeof useI18n>['t']): string {
  const coreStore = useCoreStore();

  const escapeHtml = (value: any) => {
    if (value === null || value === undefined || value === '') return `<em>${t('empty')}</em>`;
    let s: string;
    if (typeof value === 'object') {
      try {
        s = JSON.stringify(value);
      } catch (e) {
        s = String(value);
      }
    } else {
      s = String(value);
    }
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  const items = Object.keys(changedFields || {}).map(key => {
    const column = coreStore.resource?.columns?.find((c: any) => c.name === key);
    const label = column?.label || key;
    const oldV = escapeHtml(changedFields[key].oldValue);
    const newV = escapeHtml(changedFields[key].newValue);
    return `<li class="truncate"><strong>${escapeHtml(label)}</strong>: <span class="af-old-value text-muted">${oldV}</span> &#8594; <span class="af-new-value">${newV}</span></li>`;
  }).join('');

  const listHtml = items ? `<ul class="mt-2 list-disc list-inside">${items}</ul>` : '';
  const messageHtml = `<div>${escapeHtml(t('There are unsaved changes. Are you sure you want to leave this page?'))}${listHtml}</div>`;
  return messageHtml; 
}

export function getTimeAgoString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'} ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}