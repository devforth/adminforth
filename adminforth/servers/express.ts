
import path from 'path';
import fs from 'fs';
import { Express } from 'express';
import fetch from 'node-fetch';
import { AdminUserAuthorizeFunction, IAdminForth, IExpressHttpServer, HttpExtra } from '../types/Back.js';
import { WebSocketServer } from 'ws';
import { WebSocketClient } from './common.js';
import { AdminUser } from '../types/Common.js';
import http from 'http';
import { randomUUID } from 'crypto';
import { listify } from '../modules/utils.js';
import { afLogger } from '../modules/logger.js';

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

  constructor(adminforth: IAdminForth) {
    this.adminforth = adminforth;
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
        )
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
    this.setupWsServer();
    this.adminforth.setupEndpoints(this);
    this.setupSpaServer();
  }

  listen(...args) {
    this.server.listen(...args);
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

  translatable(handler) {
    // same as authorize, but injects tr function into request
    return async (req, res, next) => {
      const tr = (msg: string, category: string, params: any, pluralizationNumber?: number): Promise<string> => this.adminforth.tr(msg, category, req.headers['accept-language'], params, pluralizationNumber);
      req.tr = tr;
      handler(req, res, next);
    }
  }

  endpoint({ method='GET', path, handler, noAuth=false }) {
    if (!path.startsWith('/')) {
      throw new Error(`Path must start with /, got: ${path}`);
    }
    const fullPath = `${this.adminforth.config.baseUrl}/adminapi/v1${path}`;

    const expressHandler = async (req, res) => {
      // Enforce JSON-only for mutation HTTP methods
      // AdminForth API endpoints accept only application/json for POST, PUT, PATCH, DELETE
      // If you need other content types, use a custom server endpoint.
      const method = (req.method || '').toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const contentTypeHeader = (req.headers?.['content-type'] || '').toString();
        const isJson = contentTypeHeader.toLowerCase().startsWith('application/json');
        if (!isJson) {
          const passed = contentTypeHeader || 'undefined';
          res.status(415).send(`AdminForth API endpoints support only requests with Content/Type: application/json, when you passed: ${passed}. Please use custom server endpoint if you really need this content type`);
          return;
        }
      }
      let body = req.body || {};
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          afLogger.error(`Failed to parse body, ${e}`);
          res.status(400).send('Invalid JSON body');
        }
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
      const input = { body, query, headers, cookies, adminUser, response, requestUrl, _raw_express_req: req, _raw_express_res: res, tr};
      
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
      res.json(output);
    }

    afLogger.trace(`👂 Adding endpoint ${method} ${fullPath}`);
    this.expressApp[method.toLowerCase()](fullPath, noAuth ? expressHandler : this.authorize(expressHandler));
  }

}

export default ExpressServer;