
import ExpressServer from './servers/express.js';
import Auth from './auth.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

class AdminForth {
  constructor(config) {
    this.config = config;
    this.validateConfig();
    this.express = new ExpressServer(this);
    this.auth = new Auth();
  }

  validateConfig() {
    const errors = [];
    if (errors.length > 0) {
      throw new Error(`Invalid AdminForth config: ${errors.join(', ')}`);
    }
  }

  async init() {
    console.log('AdminForth init');
  }

  async bundlenow(verbose = false) {
    console.log('AdminForth bundling');
    const nodeBinary = process.execPath; // Path to the Node.js binary running this script
    const npmPath = path.join(path.dirname(nodeBinary), 'npm'); // Path to the npm executable

    const env = {
      ADMINFORTH_PUBLIC_PATH: this.config.baseUrl,
      ...process.env,
    };
    const cwd = path.join(__dirname, 'spa');
    console.time('Running npm ci...');
    const { stdout: ciOut, stderr: ciErr } = await execAsync(`${nodeBinary} ${npmPath} ci`, {
      cwd,
      env,
    });
    console.timeEnd('Running npm ci...');

    if (verbose) {
      console.log('npm ci output:', ciOut);
    }
    if (ciErr) {
      console.error('npm ci errors/warnings:', ciErr);
    }

    console.time('Running npm run build...');
    const { stdout: buildOut, stderr: buildErr } = await execAsync(`${nodeBinary} ${npmPath} run build`, {
      cwd,
      env,
    });
    console.timeEnd('Running npm run build...');

    if (verbose) {
      console.log('npm run build output:', buildOut);
    }
    if (buildErr) {
      console.error('npm run build errors/warnings:', buildErr);
    }
    
  }
}

export default AdminForth;