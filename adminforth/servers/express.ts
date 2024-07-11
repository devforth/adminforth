
import path from 'path';
import fs from 'fs';
import CodeInjector from '../modules/codeInjector.js';
import { Express } from 'express';
import fetch from 'node-fetch';
import { IAdminForth, IExpressHttpServer } from '../types/AdminForthConfig.js';


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
  const parts = cookies.split('; ');
  const result = [];
  parts.forEach(part => {
    const [key, value] = part.split('=');
    result.push({key, value});
  });
  return result;
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
          height: 100vh;
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
          await proxyTo(`http://localhost:5173${req.url}`, res);
        } catch (e) {
          // console.log('Failed to proxy', e);
          res.status(500).send(respondNoServer('AdminForth SPA is not ready yet', 'Vite is still starting up. Please wait a moment...'));
          return;
        }
      }
      this.expressApp.get(`${slashedPrefix}assets/*`, handler);
      this.expressApp.get(`${prefix}*`, handler);

    } else {
      this.expressApp.get(`${slashedPrefix}assets/*`, (req, res) => {
        res.sendFile(
          path.join(CodeInjector.SPA_TMP_PATH, 'dist', replaceAtStart(req.url, prefix)),
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
        const fullPath = path.join(CodeInjector.SPA_TMP_PATH, 'dist', 'index.html');
        
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

  serve(app) {
    this.expressApp = app;
    this.adminforth.setupEndpoints(this);
    this.setupSpaServer();
  }

  authorize(handler) {
    return async (req, res, next) => {
      const cookies = await parseExpressCookie(req);

      // check if multiple adminforth_jwt providerd and show warning
      const jwts = cookies.filter(({key}) => key === 'adminforth_jwt');
      if (jwts.length > 1) {
        console.error('Multiple adminforth_jwt cookies provided');
      }

      const jwt = jwts[0]?.value;

      if (!jwt) {
        res.status(401).send('Unauthorized by AdminForth');
        return
      }
      const adminforthUser = await this.adminforth.auth.verify(jwt, 'auth');
      if (!adminforthUser) {
        res.status(401).send('Unauthorized by AdminForth');
      } else {
        req.adminUser = adminforthUser;
        handler(req, res, next);
      }
    };
  }

  endpoint({ method='GET', path, handler, noAuth=false }) {
    if (!path.startsWith('/')) {
      throw new Error(`Path must start with /, got: ${path}`);
    }
    const fullPath = `${this.adminforth.config.baseUrl}/adminapi/v1${path}`;

    const expressHandler = async (req, res) => {
      let body = req.body || {};
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse body', e);
          res.status(400).send('Invalid JSON body');
        }
      }
      
      const query = req.query;
      const adminUser = req.adminUser;
      const headers = req.headers;
      const cookies = await parseExpressCookie(req);

      const response = {
        headers: [],
        status: 200,
        message: undefined,
        setHeader(name, value) {
          process.env.HEAVY_DEBUG && console.log(' 🪲Setting header', name, value);
          this.headers.push([name, value]);
        },
        
        setStatus(code, message) {
          this.status = code;
          this.message = message;
        }
      };
      const input = { body, query, headers, cookies, adminUser, response, _raw_express_req: req, _raw_express_res: res};

      let output;
      try {
        output = await handler(input);
      } catch (e) {
        console.error('Error in handler', e);
        // print full stack trace 
        console.error(e.stack);
        
        res.status(500).send('Internal server error');
        return;
      }
      response.headers.forEach(([name, value]) => {
        res.setHeader(name, value);
      });
      const resp = res.status(response.status);
      if (response.message) {
        resp.send(response.message);
        return;
      }
      res.json(output);
    }

    console.log(`Adding endpoint ${method} ${fullPath}`);
    this.expressApp[method.toLowerCase()](fullPath, noAuth ? expressHandler : this.authorize(expressHandler));
  }

}

export default ExpressServer;