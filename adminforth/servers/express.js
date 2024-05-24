
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function replaceAtStart(string, substring) {
  if (string.startsWith(substring)) {
    return string.slice(substring.length);
  }
  return string;
}

async function proxyTo(url, res) {
  const r = await fetch(url);
  const body = await r.text();
  res.status(r.status);
  r.headers.forEach((value, name) => {
    res.setHeader(name, value);
  });
  res.send(body);
}

async function parseExpressCookie(req) {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return {};
  }
  const parts = cookies.split('; ');
  const result = {};
  parts.forEach(part => {
    const [key, value] = part.split('=');
    result[key] = value;
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
class ExpressServer {
  constructor(adminforth) {
    this.adminforth = adminforth;
  }

  setupSpaServer() {
    const prefix = this.adminforth.config.baseUrl

    const slashedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    if (this.adminforth.config.runningHotReload) {
      const handler = async (req, res) => {
        // proxy using fetch to webpack dev server
        try {
          await proxyTo(`http://localhost:5173${req.url}`, res);
        } catch (e) {
          res.status(500).send(respondNoServer('AdminForth SPA is not ready yet', 'Vite is still starting up. Please wait a moment...'));
          return;
        }
      }
      this.expressApp.get(`${slashedPrefix}assets/*`, handler);
      this.expressApp.get(`${prefix}*`, handler);

    } else {
      this.expressApp.get(`${slashedPrefix}assets/*`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'spa', 'dist', replaceAtStart(req.url, prefix)))
      })

      this.expressApp.get(`${prefix}*`, async (req, res) => {
        const fullPath = path.join(__dirname, '..', 'spa', 'dist', 'index.html');
        
        let fileExists = true;
        try { 
          await fs.promises.access(fullPath, fs.constants.F_OK);
        } catch (e) {
          fileExists = false;
        }
        console.log('fileExists', fileExists);
        if (!fileExists) {
          res.status(500).send(respondNoServer(`${this.adminforth.config.brandName} is still warming up`, 'Please wait a moment...'));
          return;
        }
        res.sendFile(fullPath);
      });
    }
  }

  serve(app) {
    this.expressApp = app;
    this.adminforth.setupEndpoints(this);
    this.setupSpaServer();
  }

  authorize(handler) {
    return (req, res, next) => {
      // read ADMINFORTH_AUTH cookie

      const cookies = parseExpressCookie(req);
      const jwt = cookies.ADMINFORTH_AUTH;
      if (!jwt) {
        res.status(401).send('Unauthorized by AdminForth');
      }
      const adminforthUser = this.adminforth.auth.verify(jwt);
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

      const input = { body, query, adminUser, headers, _raw_express_req: req, _raw_express_res: res};

      try {
        const output = await handler(input);
      } catch (e) {
        console.error('Error in handler', e);
        // print full stack trace 
        console.error(e.stack);
        
        res.status(500).send('Internal server error');
        return;
      }
      res.json(output);
      output.headers?.forEach((value, name) => {
        res.setHeader(name, value);
      })
      res.status(output.status || 200);
    }

    console.log(`Adding endpoint ${method} ${fullPath}`);
    this.expressApp[method.toLowerCase()](fullPath, noAuth ? expressHandler : this.authorize(expressHandler));
  }

}

export default ExpressServer;