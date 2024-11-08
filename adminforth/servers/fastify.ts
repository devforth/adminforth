import path from 'path';
import fs from 'fs';
import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import fastifyStatic from 'fastify-static';
import fetch from 'node-fetch';
import { IAdminForth } from '../types/Back.js';
import GenericServer from './genericServer.js';

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

class FastifyServer extends GenericServer{
  fastifyApp: FastifyInstance;
  

  constructor(adminforth: IAdminForth) {
    super(adminforth);
    this.fastifyApp = Fastify({ logger: true });
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
          reply.status(500).send(this.respondNoServer('AdminForth SPA is not ready yet', 'Vite is still starting up. Please wait a moment...'));
          return;
        }
      };
      this.fastifyApp.get(`${slashedPrefix}assets/*`, handler);
      this.fastifyApp.get(`${prefix}*`, handler);

    } else {
      const codeInjector = this.adminforth.codeInjector;

      this.fastifyApp.register(fastifyStatic.default, {
        root: path.join(codeInjector.getServeDir(), 'dist'),
        prefix: `${slashedPrefix}assets/`, // URL path prefix
        cacheControl: false,
      });

      this.fastifyApp.get(`${slashedPrefix}assets/*`, (request, reply) => {
        reply
          .header('Cache-Control', 'public, max-age=31536000')
          .header('Pragma', 'public')
          .sendFile(
            path.join(codeInjector.getServeDir(), 'dist', replaceAtStart(request.raw.url, prefix),),
        );
      });

      this.fastifyApp.get(`${prefix}*`, async (request, reply) => {
        const fullPath = path.join(codeInjector.getServeDir(), 'index.html');
        
        let fileExists = true;
        try { 
          await fs.promises.access(fullPath, fs.constants.F_OK);
        } catch (e) {
          fileExists = false;
        }
        if (!fileExists) {
          reply.status(500).send(this.respondNoServer(`${this.adminforth.config.customization.brandName} is still warming up`, 'Please wait a moment...'));
          return;
        }
         reply
         .header('Content-Type', 'text/html')
         .header('Cache-Control', 'no-cache, no-store, must-revalidate')
         .header('Pragma', 'no-cache')
         .header('Expires', '0')
         .sendFile(fullPath);
      });
    }
  }

  serve(app: FastifyInstance): void {
    this.fastifyApp = app;
    this.adminforth.setupEndpoints(this);
    this.setupSpaServer();
  }

  authorize(handler: Function): Function {
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

  endpoint({
    method = 'GET',
    path,
    handler,
    noAuth = false,
  }: {
    method?: string;
    path: string;
    handler: Function;
    noAuth?: boolean;
  }): void {
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

      const input = {
        body,
        query: request.query,
        headers: request.headers,
        cookies: await parseFastifyCookie(request),
        adminUser: request.adminUser,
      };

      let output;
      try {
        output = await handler(input);
      } catch (e) {
        console.error('Error in handler', e);
        reply.status(500).send({ error: 'Internal server error' });
        return;
      }

      reply.status(200).send(output);
    };

    console.log(`Adding endpoint ${method} ${fullPath}`);
    this.fastifyApp[method.toLowerCase()](fullPath, noAuth ? fastifyHandler : this.authorize(fastifyHandler));
  }
}

export default FastifyServer;