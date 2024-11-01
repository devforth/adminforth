import path from 'path';
import fs from 'fs';
import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import CodeInjector from '../modules/codeInjector.js';
import fetch from 'node-fetch';
import { IAdminForth, IFastifyHttpServer } from '../types/AdminForthConfig.js';

function replaceAtStart(string, substring) {
  if (string.startsWith(substring)) {
    return string.slice(substring.length);
  }
  return string;
}

async function proxyTo(url, reply) {
    const actual = await fetch(url);
    actual.headers.forEach((v, n) => reply.header(n, v));
    actual.body.pipe(reply);
  }
  

async function parseFastifyCookie(request): Promise<{key: string, value: string}[]> {
  const cookies = request.headers.cookie;
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

const respondNoServer = (title, explanation) => `
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
  </html>`;

class FastifyServer implements IFastifyHttpServer{

  fastifyApp: FastifyInstance;
  adminforth: IAdminForth;
  constructor(adminforth: IAdminForth) {
    this.fastifyApp = Fastify({ logger: true });
    this.adminforth = adminforth;
  }

  setupSpaServer() {
    const prefix = this.adminforth.config.baseUrl;
    const slashedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    if (this.adminforth.runningHotReload) {
      const handler = async (request, reply) => {
        
        try {
          await proxyTo(`http://localhost:5173${request.url}`, reply);
        } catch (e) {
            // console.log('Failed to proxy', e);
          reply.status(500).send(respondNoServer('AdminForth SPA is not ready yet', 'Vite is still starting up. Please wait a moment...'));
          return;
        }
      };
      this.fastifyApp.get(`${slashedPrefix}assets/*`, handler);
      this.fastifyApp.get(`${prefix}*`, handler);

    } else {
      this.fastifyApp.get(`${slashedPrefix}assets/*`, async (request, reply) => {
        reply.sendFile(
            path.join(CodeInjector.SPA_TMP_PATH, 'dist', replaceAtStart(request.raw.url, prefix),),
            {
                cacheControl: false,
                // store for a year
                headers: {
                    'Cache-Control': 'public, max-age=31536000',
                    'Pragma': 'public',
                }
            }
        );
      });

      this.fastifyApp.get(`${prefix}*`, async (request, reply) => {
        const fullPath = path.join(CodeInjector.SPA_TMP_PATH, 'dist', 'index.html');
        
        let fileExists = true;
        try { 
          await fs.promises.access(fullPath, fs.constants.F_OK);
        } catch (e) {
          fileExists = false;
        }
        if (!fileExists) {
          reply.status(500).send(respondNoServer(`${this.adminforth.config.customization.brandName} is still warming up`, 'Please wait a moment...'));
          return;
        }
        reply.sendFile(fullPath, { 
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
    this.fastifyApp = app;
    this.adminforth.setupEndpoints(this); 
    this.setupSpaServer(); 
  }

  authorize(handler) {
    return async (request, reply, next) => {
      const cookies = await parseFastifyCookie(request);
      const brandSlug = this.adminforth.config.customization._brandNameSlug;
      const jwts = cookies.filter(({ key }) => key === `adminforth_${brandSlug}_jwt`);

      if (jwts.length > 1) {
        console.error('Multiple adminforth_jwt cookies provided');
      }

      const jwt = jwts[0]?.value;
      if (!jwt) {
        reply.status(401).send('Unauthorized by AdminForth');
        return;
      }

      const adminforthUser = await this.adminforth.auth.verify(jwt, 'auth');
      if (!adminforthUser) {
        reply.status(401).send('Unauthorized by AdminForth');
      } else {
        request.adminUser = adminforthUser;
        await handler(request, reply, next);
      }
    };
  }

  endpoint({ method = 'GET', path, handler, noAuth = false }) {
    if (!path.startsWith('/')) {
        throw new Error(`Path must start with /, got: ${path}`);
    }
    const fullPath = `${this.adminforth.config.baseUrl}/adminapi/v1${path}`;

    const fastifyHandler = async (request, reply) => {
      let body = request.body || {};
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse body', e);
          reply.status(400).send('Invalid JSON body');
        }
      }

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
        },

        blobStream() {
          return reply;
        }
        
      };

      const input = {
        body,
        query: request.query,
        headers: request.headers,
        cookies: await parseFastifyCookie(request),
        adminUser: request.adminUser,
        response,
        _raw_request: request.raw,
        _raw_reply: reply.raw
      };
      let output;
      try {
        output = await handler(input);
      } catch (e) {
        console.error('Error in handler', e);
        // Print full stack trace
        console.error(e.stack);
        reply.status(500).send({ error: 'Internal server error' });
        return;
      }
      response.headers.forEach(([name, value]) => {
        reply.header(name, value);
      });
      
      reply.status(response.status);
      if (response.message) {
        reply.send(response.message);
        return;
      }
      
      if (output === null) {
        return;
      }
      
      reply.send(output);
    };
    console.log(`Adding endpoint ${method} ${fullPath}`);
    this.fastifyApp[method.toLowerCase()](fullPath, noAuth ? fastifyHandler : this.authorize(fastifyHandler));
  }
}

export default FastifyServer;