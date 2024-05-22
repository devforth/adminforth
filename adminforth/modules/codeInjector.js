import fs from 'fs';
import fsExtra from 'fs-extra';
import filewatcher from 'filewatcher';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '..');

const execAsync = promisify(exec);



class CodeInjector {
  constructor(adminforth) {
    this.adminforth = adminforth;
  }

  async runNpmShell({command, verbose = false, cwd}) {
    const nodeBinary = process.execPath; // Path to the Node.js binary running this script
    const npmPath = path.join(path.dirname(nodeBinary), 'npm'); // Path to the npm executable

    const env = {
      VUE_APP_ADMINFORTH_PUBLIC_PATH: this.adminforth.config.baseUrl,
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

  async rmTmpDir() {
    // remove spa_tmp folder if it is exists
    const spaTmpPath = path.join(__dirname, 'spa_tmp');
    try {
      await fs.promises.rm(spaTmpPath, { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  async prepareSources(filesUpdated) {
    const spaTmpPath = path.join(__dirname, 'spa_tmp');

    // create spa_tmp folder, or ignore if it exists
    try {
      await fs.promises.mkdir(spaTmpPath);
    } catch (e) {
      // ignore
    }

    if (filesUpdated) {
      // copy only updated files
      await Promise.all(filesUpdated.map(async (file) => {
        const src = path.join(__dirname, 'spa', file);
        const dest = path.join(spaTmpPath, file);
        await fsExtra.copy(src, dest);
      }));
    } else {
      await fsExtra.copy(path.join(__dirname, 'spa'), spaTmpPath, {
        filter: (src) => {
          return !src.includes('/node_modules') && !src.includes('/dist');
        },
      });
    }

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
    collectIcons(this.adminforth.config.menu);


    const uniqueIcons = Array.from(new Set(icons));

    // icons are collectionName:iconName. Get list of all unique collection names:
    const collections = new Set(icons.map((icon) => icon.split(':')[0]));

    // package names @iconify-prerendered/vue-<collection name>
    const packageNames = Array.from(collections).map((collection) => `@iconify-prerendered/vue-${collection}`);

    // check packages installed in spa_tmp/package.json
    const packageJsonPath = path.join(spaTmpPath, 'package.json');
    const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

    // get packages that need to be installed
    const packagesToInstall = packageNames.filter((packageName) => {
      return !packageJson.dependencies[packageName];
    });

    if (packagesToInstall.length > 0) {
      const npmInstallCommand = `install ${packagesToInstall.join(' ')}`;
      await this.runNpmShell({command: npmInstallCommand, cwd: spaTmpPath});
    }
    
    // for each icon generate import statement
    const iconImports = uniqueIcons.map((icon) => {
      const [ collection, iconName ] = icon.split(':');
      const PascalIconName = 'Icon' + iconName.split('-').map((part, index) => {
        return part[0].toUpperCase() + part.slice(1);
      }).join('');
      return `import { ${PascalIconName} } from '@iconify-prerendered/vue-${collection}';`;
    }).join('\n');

    // Generate Vue.component statements for each icon
    const iconComponents = uniqueIcons.map((icon) => {
      const [ collection, iconName ] = icon.split(':');
      const PascalIconName = 'Icon' + iconName.split('-').map((part, index) => {
        return part[0].toUpperCase() + part.slice(1);
      }).join('');
      return `app.component('${PascalIconName}', ${PascalIconName});`;
    }).join('\n');

    // inject that code into spa_tmp/src/App.vue
    const appVuePath = path.join(spaTmpPath, 'src', 'main.ts');
    let appVueContent = await fs.promises.readFile(appVuePath, 'utf-8');
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMIFORTH IMPORTS */', iconImports + '\n');
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMIFORTH COMPONENT REGISTRATIONS */', iconComponents + '\n');
    console.log('!!iconImports', appVueContent);

    await fs.promises.writeFile(appVuePath, appVueContent);
  }

  async watchForReprepare() {
    const spaPath = path.join(__dirname, 'spa');
    // get list of all subdirectories in spa recursively
    const directories = [];
    const collectDirectories = async (dir) => {
      const files = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isDirectory() && ['node_modules', 'dist'].indexOf(file.name) === -1) {
          directories.push(path.join(dir, file.name));
          await collectDirectories(path.join(dir, file.name));
        }
      }
    };
    await collectDirectories(spaPath);

    console.log('👌👌Watching for changes in:', directories.join('\n '))

    const watcher = filewatcher();
    directories.forEach((dir) => {
      watcher.add(dir);
    });

    watcher.on(
      'change',
      async (file) => {
        console.log(`File ${file} changed, preparing sources...`);
        await this.prepareSources([file.replace(spaPath + '/', '')]);
      }
    )
    process.on('exit', () => {
      watcher.removeAll();
    });
  }

  async bundleNow({hotReload = false, verbose = false}) {
    this.adminforth.config.runningHotReload = hotReload;

    await this.prepareSources();
    await this.watchForReprepare();
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
        VUE_APP_ADMINFORTH_PUBLIC_PATH: this.adminforth.config.baseUrl,
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
}

export default CodeInjector;