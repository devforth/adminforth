
import ExpressServer from './servers/express.js';
import Auth from './auth.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import fsExtra from 'fs-extra';

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

    if (!this.config.baseUrl) {
      this.config.baseUrl = '';
    }
    if (errors.length > 0) {
      throw new Error(`Invalid AdminForth config: ${errors.join(', ')}`);
    }
  }

  async init() {
    console.log('AdminForth init');
  }

  async runNpmShell({command, verbose = false, cwd}) {
    const nodeBinary = process.execPath; // Path to the Node.js binary running this script
    const npmPath = path.join(path.dirname(nodeBinary), 'npm'); // Path to the npm executable

    const env = {
      VUE_APP_ADMINFORTH_PUBLIC_PATH: this.config.baseUrl,
      FORCE_COLOR: '1',
      ...process.env,
    };

    console.time(`Running npm ${command}...`);
    const { stdout: out, stderr: err } = await execAsync(`${nodeBinary} ${npmPath} ${command}`, {
      cwd,
      env,
    });
    console.timeEnd(`Running npm ${command}...`);

    if (verbose) {
      console.log(`npm ${command} output:`, out);
    }
    if (err) {
      console.error(`npm ${command} errors/warnings:`, err);
    }
  }

  async prepareSources() {
    // remove spa_tmp folder if it is exists
    const spaTmpPath = path.join(__dirname, 'spa_tmp');
    try {
      await fs.promises.rm(spaTmpPath, { recursive: true });
    } catch (e) {
      // ignore
    }

    // copy spa folder to spa_tmp. Ignore node_modules and dist
    await fs.promises.mkdir(spaTmpPath);
    await fsExtra.copy(path.join(__dirname, 'spa'), spaTmpPath, {
      filter: (src) => {
        return !src.includes('node_modules') && !src.includes('dist');
      },
    });

    // collect all 'icon' fields from config
    const icons = [];
    const collectIcons = (menu) => {
      menu.forEach((item) => {
        if (item.icon) {
          icons.push(item.icon);
        }
        if (item.children) {
          collectIcons(item.children);
        }
      });
    };
    collectIcons(this.config.menu);

    // icons are collectionName:iconName. Get list of all unique collection names:
    const collections = new Set(icons.map((icon) => icon.split(':')[0]));

    // generate npm install command to install all @iconify-prerendered/vue-<collection name>	
    const npmInstallCommand = `install ${Array.from(collections).map((collection) => `@iconify-prerendered/vue-${collection}`).join(' ')}`;
    
    await this.runNpmShell({command: npmInstallCommand, cwd: spaTmpPath});

    // for each icon generate import statement
    const iconImports = icons.map((icon) => {
      const [ collection, iconName ] = icon.split(':');
      const PascalIconName = iconName.split('-').map((part, index) => {
        return part[0].toUpperCase() + part.slice(1);
      }).join('');
      return `import { ${PascalIconName} } from '@iconify-prerendered/vue-${collection}';`;
    }).join('\n');

    // inject that code into spa_tmp/src/App.vue
    const appVuePath = path.join(spaTmpPath, 'src', 'App.vue');
    const appVueContent = await fs.promises.readFile(appVuePath, 'utf-8');
    const newAppVueContent = appVueContent.replace('/* IMPORTANT:ICON IMPORTS */', iconImports);
    await fs.promises.writeFile(appVuePath, newAppVueContent);

  }



  async bundleNow({hotReload = false, verbose = false}) {
    this.config.runningHotReload = hotReload;

    await this.prepareSources();
    console.log('AdminForth bundling');
    
    const cwd = path.join(__dirname, 'spa_tmp');
    
    await this.runNpmShell({command: 'ci', verbose, cwd});

    if (!hotReload) {
      await this.runNpmShell({command: 'run build', verbose, cwd});
    } else {
      const command = 'run dev';
      console.time(`Running npm ${command}...`);
      const nodeBinary = process.execPath; 
      const npmPath = path.join(path.dirname(nodeBinary), 'npm');
      const env = {
        VUE_APP_ADMINFORTH_PUBLIC_PATH: this.config.baseUrl,
        FORCE_COLOR: '1',
        ...process.env,
      };

      const devServer = spawn(`${nodeBinary}`, [`${npmPath}`, ...command.split(' ')], {
        cwd,
        env,
      });
      devServer.stdout.on('data', (data) => {
        console.log(`[AdminForth SPA]:`);
        process.stdout.write(data);
      });
      devServer.stderr.on('data', (data) => {
        console.error(`[AdminForth SPA ERR]:`);
        process.stdout.write(data);

      });

      console.timeEnd(`Running npm ${command}...`);
    }
  }

  setupEndpoints(server) {
    server.endpoint({
      noAuth: true, // TODO
      method: 'GET',
      path: '/get_menu_config',
      handler: (input) => {
        return {
          resources: this.config.resources,
          menuGroups: this.config.menuGroups,
        };
      },
    });
  }


}

export default AdminForth;