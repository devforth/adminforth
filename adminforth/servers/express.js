
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
    // server ../spa/dist index.html without cache and all other files in dist folder with cache
    app.get(`${slashedPrefix}assets/*`, (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'spa', 'dist', replaceAtStart(req.url, prefix)))
    })

    console.log(123, `${prefix}*`)
    app.get(`${prefix}*`, (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'spa', 'dist', 'index.html'));
    });
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