
import path from 'path';
import fs from 'fs';
import { Express } from 'express';
import type { AnySchemaObject } from 'ajv';
import { apiReference } from '@scalar/express-api-reference';
import fetch from 'node-fetch';
import { AdminUserAuthorizeFunction, IAdminForth, IAdminForthExpressRouteSchema, IExpressHttpServer, HttpExtra } from '../types/Back.js';
import { WebSocketServer } from 'ws';
import { WebSocketClient } from './common.js';
import { AdminUser } from '../types/Common.js';
import http from 'http';
import type { AddressInfo } from 'net';
import { randomUUID } from 'crypto';
import { listify } from '../modules/utils.js';
import { afLogger } from '../modules/logger.js';
import * as z from 'zod';
import multer from 'multer';

function replaceAtStart(string, substring) {
  if (string.startsWith(substring)) {
    return string.slice(substring.length);
  }
  return string;
}

async function proxyTo(url, res) {
  const actual = await fetch(url);
  actual.headers.forEach((v, n) => res.setHeader(n, v));
  actual.body.pipe(res);
}

function parseCookiesString(cookiesString: string): Array<{
  key: string, 
  value: string
}> {
  const parts = cookiesString.split('; ');
  const result = [];
  parts.forEach(part => {
    const [key, value] = part.split('=');
    result.push({key, value});
  });
  return result;
}

async function parseExpressCookie(req): Promise<
  Array<{
    key: string, 
    value: string
  }>
> {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return [];
  }
  return parseCookiesString(cookies);
}

const EXPRESS_ROUTE_SCHEMA = Symbol('adminforth.express.withSchema');
const EXPRESS_REGEXP_LEADING_SLASH_RE = /^\\\//;
const EXPRESS_REGEXP_OPTIONAL_TRAILING_SLASH_RE = /\\\/\?\(\?=\\\/\|\$\)\$$/;
const EXPRESS_REGEXP_PARAM_CAPTURE_RE = /\(\?:\(\[\^\\\/]\+\?\)\)/g;
const EXPRESS_REGEXP_ESCAPED_SLASH_RE = /\\\//g;
const EXPRESS_REGEXP_TRAILING_DOLLAR_RE = /\$$/;
const EXPRESS_REGEXP_LEADING_CARET_RE = /^\^/;
type MulterParser = (req: any, res: any, callback: (error?: unknown) => void) => void;

type RegisteredExpressRouteSchema = IAdminForthExpressRouteSchema & {
  request?: AnySchemaObject;
  response?: AnySchemaObject;
};

type SchemaAnnotatedHandler = ((...args: any[]) => any) & {
  [EXPRESS_ROUTE_SCHEMA]?: RegisteredExpressRouteSchema;
};

type ZodSchemaLike = {
  _zod?: unknown;
  _def?: unknown;
  safeParse?: (...args: any[]) => any;
};

function isZodSchemaLike(schema: unknown): schema is ZodSchemaLike {
  return !!schema
    && typeof schema === 'object'
    && 'safeParse' in schema
    && typeof (schema as ZodSchemaLike).safeParse === 'function'
    && ('_zod' in schema || '_def' in schema);
}

function normalizeExpressRuntimeSchema(schema: unknown): AnySchemaObject | undefined {
  if (!schema) {
    return undefined;
  }

  if (isZodSchemaLike(schema)) {
    return z.toJSONSchema(schema as any, { target: 'openapi-3.0' }) as AnySchemaObject;
  }

  return schema as AnySchemaObject;
}

function normalizeExpressLayerRegexpSource(regexpSource: string): string {
  return regexpSource
    .replace(EXPRESS_REGEXP_LEADING_SLASH_RE, '/')
    .replace(EXPRESS_REGEXP_OPTIONAL_TRAILING_SLASH_RE, '')
    .replace(EXPRESS_REGEXP_PARAM_CAPTURE_RE, ':param')
    .replace(EXPRESS_REGEXP_ESCAPED_SLASH_RE, '/')
    .replace(EXPRESS_REGEXP_TRAILING_DOLLAR_RE, '')
    .replace(EXPRESS_REGEXP_LEADING_CARET_RE, '');
}

const respondNoServer = (title, explanation) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AdminForth</title>
    </head>
    <body>
      <div class="center">
        <h1>Oops!</h1>
        <h2>${title}</h2>
        <p>${explanation}</p>
      </div>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
          margin: 0;
          padding: 0;
        }
        .center {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100dvh;
          flex-direction: column;
        }
      </style>
      <script>
        setTimeout(() => {
          location.reload();
        }, 1500);
      </script>
    </body>
    `;
}

class ExpressServer implements IExpressHttpServer {

  expressApp: Express;
  adminforth: IAdminForth;
  server: http.Server;
  schemaAwareRouteRegistrationPatched = false;
  uploadParser: MulterParser;

  constructor(adminforth: IAdminForth) {
    this.adminforth = adminforth;
    this.uploadParser = multer({
      storage: multer.memoryStorage(),
    }).any();
  }

  setupSpaServer() {
    const prefix = this.adminforth.config.baseUrl

    const slashedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    if (this.adminforth.runningHotReload) {
      const handler = async (req, res) => {
        // proxy using fetch to webpack dev server 
        try {
          if (this.adminforth.codeInjector.devServerPort === null) {
            throw new Error('Dev server port is not set');
          }
          await proxyTo(`http://localhost:${this.adminforth.codeInjector.devServerPort}${req.url}`, res);
        } catch (e) {
          res.status(500).send(respondNoServer('AdminForth SPA is not ready yet', 'Vite is still starting up. Please wait a moment...'));
          return;
        }
      }
      this.expressApp.get(`${slashedPrefix}assets/*`, handler);
      afLogger.trace(`®️ Registering SPA serve handler', ${slashedPrefix}assets/*`);
      this.expressApp.get(`${prefix}*`, handler);
     

    } else {
      const codeInjector = this.adminforth.codeInjector;
      this.expressApp.get(`${slashedPrefix}assets/*`, (req, res) => {
        res.sendFile(
          path.join(codeInjector.getServeDir(), replaceAtStart(req.url, prefix)),
          {
            cacheControl: false,
            // store for a year
            headers: {
              'Cache-Control': 'public, max-age=31536000',
              'Pragma': 'public',
            }
          }
        , (err) => {
          if (err && err.message.includes('ENOENT')) {
            res.status(404).send('Not found');
          }
        });
      })

      this.expressApp.get(`${prefix}*`, async (req, res) => {
        const fullPath = path.join(codeInjector.getServeDir(), 'index.html');
        
        let fileExists = true;
        try { 
          await fs.promises.access(fullPath, fs.constants.F_OK);
        } catch (e) {
          fileExists = false;
        }
        if (!fileExists) {
          res.status(500).send(respondNoServer(`${this.adminforth.config.customization.brandName} is still warming up`, 'Please wait a moment...'));
          return;
        }
        res.sendFile(fullPath, { 
          cacheControl: false,
          headers: { 
            'Content-Type': 'text/html', 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
         } });
      });
    }
  }

  setupWsServer() {
    let base = this.adminforth.config.baseUrl || '';
    if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }

    this.server = http.createServer(this.expressApp);
    const wss = new WebSocketServer({ server: this.server, path: `${base}/afws` });
    afLogger.info(`${this.adminforth.formatAdminForth()} 🌐 WebSocket server started`);
    // Handle WebSocket connections
    wss.on('connection', async (ws, req) => {
      try {
        // get cookies and parse
        let adminUser: AdminUser | null = null;
        const cookies = req.headers.cookie;
        if (cookies) {
          const parsedCookies = parseCookiesString(cookies);
          // find adminforth_jwt
          const brandSlug = this.adminforth.config.customization.brandNameSlug;
          const jwt = parsedCookies.find(({key}) => key === `adminforth_${brandSlug}_jwt`);
          if (jwt) {
            adminUser = await this.adminforth.auth.verify(jwt.value, 'auth');
          }
        }

        this.adminforth.websocket.registerWsClient(
          new WebSocketClient({
            id: randomUUID(),
            adminUser,
            send: (data) => ws.send(data),
            close: () => ws.close(),
            onMessage: (handler) => ws.on('message', handler),
            onClose: (handler) => ws.on('close', handler),
          })
        );
      } catch (e) {
        afLogger.error(`Failed to handle WS connection ${e}`);
        
      }
    });
  }

  serve(app) {
    this.expressApp = app;
    this.patchSchemaAwareRouteRegistration();
    const stack = (this.expressApp as any)?._router?.stack;
    if (Array.isArray(stack)) {
      this.registerSchemaAwareStack(stack, '');
    }
    this.setupWsServer();
    this.adminforth.setupEndpoints(this);
    this.setupOpenApiRoutes();
    this.setupSpaServer();
  }

  listen(...args) {
    this.server.listen(...args);
  }

  getInternalApiOrigin(): string | undefined {
    const address = this.server?.address();

    if (!address || typeof address === 'string') {
      return undefined;
    }

    return `http://127.0.0.1:${(address as AddressInfo).port}`;
  }

  async processAuthorizeCallbacks(adminUser: AdminUser, toReturn: { error?: string, allowed: boolean }, response: Response, extra: HttpExtra) {
    const adminUserAuthorize = this.adminforth.config.auth.adminUserAuthorize as (AdminUserAuthorizeFunction[] | undefined);

    for (const hook of listify(adminUserAuthorize)) {
      const resp = await hook({ 
        adminUser, 
        response,
        adminforth: this.adminforth,
        extra,
      });
      if (resp?.allowed === false || resp?.error) {
        // delete all items from toReturn and add these:
        toReturn.allowed = resp?.allowed;
        toReturn.error = resp?.error;
        break;
      }
    }
  }
  

  authorize(handler) {
    return async (req, res, next) => {
      const cookies = await parseExpressCookie(req);
      const brandSlug = this.adminforth.config.customization.brandNameSlug;
      // check if multiple adminforth_jwt providerd and show warning
      const jwts = cookies.filter(({key}) => key === `adminforth_${brandSlug}_jwt`);
      if (jwts.length > 1) {
        afLogger.error('Multiple adminforth_jwt cookies provided');
      }

      const jwt = jwts[0]?.value;

      if (!jwt) {
        res.status(401).send('Unauthorized by AdminForth');
        return
      }
      let adminforthUser;
      try {
        adminforthUser = await this.adminforth.auth.verify(jwt, 'auth');
      } catch (e) {
        // this might happen if e.g. database intialization in progress.
        // so we can't answer with 401 (would logout user)
        // reproduced during usage of listRowsAutoRefreshSeconds
        afLogger.error(e.stack);
        res.status(500).send('Failed to verify JWT token - something went wrong');
        return;
      }
      if (!adminforthUser) {
        res.status(401).send('Unauthorized by AdminForth');
      } else {
        req.adminUser = adminforthUser;
        const toReturn: { error?: string, allowed: boolean } = { allowed: true };
        await this.processAuthorizeCallbacks(adminforthUser, toReturn, res, {
          body: req.body,
          query: req.query,
          headers: req.headers,
          cookies: cookies as any,
          requestUrl: req.url,
          meta: {},
          response: res
        });
        if (!toReturn.allowed) {
          res.status(401).send('Unauthorized by AdminForth');
        } else {
          handler(req, res, next);
        }
      }
    };
  }

  withSchema(schema, handler) {
    const wrapped = ((...args: any[]) => handler(...args)) as SchemaAnnotatedHandler;
    wrapped[EXPRESS_ROUTE_SCHEMA] = {
      ...schema,
      request: normalizeExpressRuntimeSchema(schema.request),
      response: normalizeExpressRuntimeSchema(schema.response),
    };
    return wrapped;
  }

  translatable(handler) {
    // same as authorize, but injects tr function into request
    return async (req, res, next) => {
      const tr = (msg: string, category: string, params: any, pluralizationNumber?: number): Promise<string> => this.adminforth.tr(msg, category, req.headers['accept-language'], params, pluralizationNumber);
      req.tr = tr;
      handler(req, res, next);
    }
  }

  patchSchemaAwareRouteRegistration() {
    if (this.schemaAwareRouteRegistrationPatched) {
      return;
    }

    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

    methods.forEach((method) => {
      const original = this.expressApp[method]?.bind(this.expressApp);
      if (!original) {
        return;
      }

      this.expressApp[method] = ((path, ...handlers) => {
        this.registerSchemaAwareRoute([method], path, handlers);
        return original(path, ...handlers);
      }) as any;
    });

    const originalUse = this.expressApp.use?.bind(this.expressApp);
    if (originalUse) {
      this.expressApp.use = ((...args) => {
        const [firstArg, ...restArgs] = args;
        const path = typeof firstArg === 'string' || Array.isArray(firstArg)
          ? firstArg
          : '';
        const handlers = path ? restArgs : args;

        this.flattenHandlers(handlers).forEach((handler) => {
          if (Array.isArray((handler as any)?.stack)) {
            this.registerSchemaAwareStack((handler as any).stack, path);
          }
        });
        return originalUse(...args);
      }) as any;
    }

    this.schemaAwareRouteRegistrationPatched = true;
  }

  registerSchemaAwareRoute(methods, path, handlers) {
    const flatHandlers = this.flattenHandlers(handlers);
    const schema = flatHandlers.find((handler) => (handler as SchemaAnnotatedHandler)?.[EXPRESS_ROUTE_SCHEMA])?.[EXPRESS_ROUTE_SCHEMA];

    if (!schema || (!schema.request && !schema.response)) {
      return;
    }

    const normalizedMethods = methods.filter((method, index, allMethods) => {
      if (!method || method === '_all') {
        return false;
      }

      if (method === 'head' && allMethods.includes('get')) {
        return false;
      }

      return allMethods.indexOf(method) === index;
    });

    const routePaths = Array.isArray(path) ? path : [path];
    routePaths.forEach((routePath) => {
      if (typeof routePath !== 'string') {
        return;
      }

      normalizedMethods.forEach((method) => {
        this.adminforth.openApi.registerApiSchema({
          method: method.toUpperCase(),
          path: routePath,
          description: schema.description,
          request_schema: schema.request,
          response_schema: schema.response,
          meta: schema.meta,
          handler: undefined as never,
        });
      });
    });
  }

  registerSchemaAwareStack(stack, prefix) {
    const prefixes = this.flattenPaths(prefix);

    stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods || {}).filter((method) => layer.route.methods[method]);
        const handlers = (layer.route.stack || []).map((routeLayer) => routeLayer.handle);
        this.registerSchemaAwareRoute(methods, this.combineRoutePaths(prefixes, layer.route.path), handlers);
        return;
      }

      const nestedStack = layer.handle?.stack;
      if (!Array.isArray(nestedStack)) {
        return;
      }

      const layerPath = this.extractLayerPath(layer);
      const nestedPrefix = this.combineRoutePaths(prefixes, layerPath);
      this.registerSchemaAwareStack(nestedStack, nestedPrefix);
    });
  }

  combineRoutePaths(prefixes, paths) {
    return prefixes.flatMap((prefix) => this.flattenPaths(paths).map((path) => {
      if (!prefix) return path || '/';
      if (!path || path === '/') return prefix;
      return `${prefix.endsWith('/') ? prefix.slice(0, -1) : prefix}${path.startsWith('/') ? path : `/${path}`}`;
    }));
  }

  extractLayerPath(layer) {
    if (typeof layer.path === 'string') {
      return layer.path;
    }

    const regexpSource = layer.regexp?.source;
    if (typeof regexpSource !== 'string') {
      return '';
    }

    if (layer.regexp?.fast_slash) {
      return '';
    }

    return normalizeExpressLayerRegexpSource(regexpSource);
  }

  flattenHandlers(handlers) {
    return handlers.flat(Infinity);
  }

  flattenPaths(paths) {
    const flattened = (Array.isArray(paths) ? paths : [paths]).flat(Infinity);
    const stringPaths = flattened.filter((path): path is string => typeof path === 'string');
    return stringPaths.length ? stringPaths : [''];
  }

  setupOpenApiRoutes() {
    this.expressApp.get('/api/v1/openapi.json', (req, res) => {
      res.json(this.adminforth.openApi.renderOpenApiDocument());
    });

    this.expressApp.use('/api-docs', apiReference({
      url: '/api/v1/openapi.json',
      theme: 'saturn',
    }));
  }

  endpoint(options) {
    const {
      method='GET',
      path,
      handler,
      noAuth=false,
      description,
      request_schema,
      response_schema,
      responce_schema,
      target='json'
    } = options;
    if (!path.startsWith('/')) {
      throw new Error(`Path must start with /, got: ${path}`);
    }
    const fullPath = `${this.adminforth.config.baseUrl}/adminapi/v1${path}`;
    const normalizedResponseSchema = response_schema ?? responce_schema;
    const registeredApiSchema = (request_schema || normalizedResponseSchema)
      ? this.adminforth.openApi.registerApiSchema({
        method,
        noAuth,
        path: fullPath,
        description,
        request_schema,
        response_schema: normalizedResponseSchema,
        handler,
      })
      : null;

    const expressHandler = async (req, res) => {
      const abortController = new AbortController();
      res.on('close', () => {
        if(req.destroyed) {
          abortController.abort();
        }
      });
      // Enforce JSON-only for mutation HTTP methods
      // AdminForth API endpoints accept only application/json for POST, PUT, PATCH, DELETE
      // If you need other content types, use a custom server endpoint.
      const method = (req.method || '').toUpperCase();
      const contentTypeHeader = (req.headers?.['content-type'] || '').toString();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const expectedContentType = target === 'upload' ? 'multipart/form-data' : 'application/json';
        const hasExpectedContentType = contentTypeHeader.toLowerCase().startsWith(expectedContentType);
        if (!hasExpectedContentType) {
          const passed = contentTypeHeader || 'undefined';
          res.status(415).send(`AdminForth API endpoint supports only requests with Content-Type: ${expectedContentType}, when you passed: ${passed}. Please use custom server endpoint if you really need this content type`);
          return;
        }
      }
      if (target === 'upload') {
        try {
          await new Promise<void>((resolve, reject) => {
            this.uploadParser(req, res, (error?: unknown) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          });
          if (!(req as any).file && Array.isArray((req as any).files) && (req as any).files.length) {
            (req as any).file = (req as any).files[0];
          }
        } catch (error) {
          afLogger.error(`Failed to parse multipart form-data body, ${error}`);
          res.status(400).send('Invalid multipart/form-data body');
          return;
        }
      }
      let body = req.body || {};
      if (typeof body === 'string' && target === 'json') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          afLogger.error(`Failed to parse body, ${e}`);
          res.status(400).send('Invalid JSON body');
          return;
        }
      }

      const requestValidation = this.adminforth.openApi.validateRequestSchema(registeredApiSchema, body);
      if (!requestValidation.valid) {
        res.status(400).json({
          error: 'Request body validation failed',
          details: requestValidation.errors,
        });
        return;
      }
      
      const query = req.query;
      const adminUser = req.adminUser;
      // lower request headers
      const headers = req.headers;
      const cookies = await parseExpressCookie(req);

      const response = {
        headers: [],
        status: 200,
        message: undefined,

        setHeader(name, value) {
          afLogger.trace(`🪲Setting header, ${name}, ${value}`);
          this.headers.push([name, value]);
        },
        
        setStatus(code, message) {
          this.status = code;
          this.message = message;
        },

        blobStream() {
          return res;
        }
        
      };

      const requestUrl = req.url;

      const acceptLang = headers['accept-language'];
      const tr = (msg: string, category: string, params: any, pluralizationNumber?: number): Promise<string> => this.adminforth.tr(msg, category, acceptLang, params, pluralizationNumber);
      const input = { body, query, headers, cookies, adminUser, response, requestUrl, _raw_express_req: req, _raw_express_res: res, tr, abortSignal: abortController.signal};
      
      let output;
      try {
        output = await handler(input);
      } catch (e) {
        afLogger.error(`Error in handler ${e}`);
        // print full stack trace 
        afLogger.error(e.stack);
        res.status(500).send('Internal server error');
        return;
      }
      response.headers.forEach(([name, value]) => {
        res.setHeader(name, value);
      });
      res.status(response.status);
      if (response.message) {
        res.send(response.message);
        return;
      }
      if (output === null) {
        // nothing should be returned anymore
        return;
      }

      const responseValidation = this.adminforth.openApi.validateResponseSchema(registeredApiSchema, output);
      if (!responseValidation.valid) {
        res.status(500).json({
          error: 'Response validation failed',
          details: responseValidation.errors,
        });
        return;
      }

      res.json(output);
    }

    afLogger.trace(`👂 Adding endpoint ${method} ${fullPath}`);
    this.expressApp[method.toLowerCase()](fullPath, noAuth ? expressHandler : this.authorize(expressHandler));
  }

}

export default ExpressServer;
