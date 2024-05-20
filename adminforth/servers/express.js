
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function replaceAtStart(string, substring) {
  if (string.startsWith(substring)) {
    return string.slice(substring.length);
  }
  return string;
}
  

class ExpressServer {
  constructor(adminforth) {
    this.adminforth = adminforth;
  }

  serve(app) {
    const prefix = this.adminforth.config.baseUrl || '/'

    const slashedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    if (this.adminforth.config.runningHotReload) {
      app.get(`${slashedPrefix}assets/*`, async (req, res) => {
        // proxy using fetch to webpack dev server
        try {
          const r = await fetch(`http://localhost:5173${req.url}`);
          const body = await r.text();
          res.status(r.status);
          r.headers.forEach((value, name) => {
            res.setHeader(name, value);
          });

          res.send(body);
        } catch (e) {
          res.status(500).send(`Did not get response from Vite dev server: ${e}`);
        }
      });
      app.get(`${prefix}*`, async (req, res) => {
        // proxy using fetch to webpack dev server
        try {
          const r = await fetch(`http://localhost:5173${req.url}`);
          const body = await r.text();
          res.status(r.status);
          r.headers.forEach((value, name) => {
            res.setHeader(name, value);
          });
          res.send(body);
        } catch (e) {
          res.status(500).send(`Did not get response from Vite dev server: ${e}`);
        }
      });

    } else {
      app.get(`${slashedPrefix}assets/*`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'spa', 'dist', replaceAtStart(req.url, prefix)))
      })

      app.get(`${prefix}*`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'spa', 'dist', 'index.html'));
      });
    }
  }

  authorize(handler) {
    return (req, res, next) => {
      // read ADMINFORTH_AUTH cookie
      const jwt = req.cookies.ADMINFORTH_AUTH;

      const adminforthUser = this.adminforth.auth.verify(jwt);
      if (!adminforthUser) {
        res.status(401).send('Unauthorized by AdminForth');
      } else {
        req.adminUser = adminforthUser;
        handler(req, res, next);
      }
    };
  }
}

export default ExpressServer;