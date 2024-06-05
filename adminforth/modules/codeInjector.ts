import fs from 'fs';
import fsExtra from 'fs-extra';
import filewatcher from 'filewatcher';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import os from 'os';
import AdminForth from '../index.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '..');

let TMP_DIR;

try {
  TMP_DIR = os.tmpdir();
} catch (e) {
  TMP_DIR = '/tmp';
}


const execAsync = promisify(exec);

function hashify(obj) {
  return crypto.createHash
    ('sha256').update(JSON.stringify(obj)).digest('hex');
}

class CodeInjector {

  adminforth: AdminForth;

  static SPA_TMP_PATH = path.join(TMP_DIR, 'adminforth', 'spa_tmp');

  constructor(adminforth) {
    this.adminforth = adminforth;
  }

  // async runShell({command, verbose = false}) {
  //   console.log(`⚙️ Running shell ${command}...`);
  //   console.time(`${command} done in`);
  //   const { stdout: out, stderr: err } = await execAsync(command);
  //   console.timeEnd(`${command} done in`);
  //   console.log(`Command ${command} output:`, out, err);
  // }

  async runNpmShell({command, verbose = false, cwd}) {
    const nodeBinary = process.execPath; // Path to the Node.js binary running this script
    const npmPath = path.join(path.dirname(nodeBinary), 'npm'); // Path to the npm executable

    const env = {
      VUE_APP_ADMINFORTH_PUBLIC_PATH: this.adminforth.config.baseUrl,
      FORCE_COLOR: '1',
      ...process.env,
    };

    console.log(`⚙️ Running npm ${command}...`);
    console.time(`npm ${command} done in`);
    const { stdout: out, stderr: err } = await execAsync(`${nodeBinary} ${npmPath} ${command}`, {
      cwd,
      env,
    });
    console.timeEnd(`npm ${command} done in`);

    if (verbose) {
      console.log(`npm ${command} output:`, out);
    }
    if (err) {
      console.error(`npm ${command} errors/warnings:`, err);
    }
  }

  async rmTmpDir() {
    // remove spa_tmp folder if it is exists
    const spaTmpPath = CodeInjector.SPA_TMP_PATH;
    try {
      await fs.promises.rm(spaTmpPath, { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  async prepareSources({ filesUpdated, verbose = false }: { filesUpdated?: string[], verbose?: boolean }) {
    const spaTmpPath = CodeInjector.SPA_TMP_PATH;
    // check SPA_TMP_PATH exists and create if not
    try {
      await fs.promises.access(spaTmpPath, fs.constants.F_OK);
    } catch (e) {
      await fs.promises.mkdir(spaTmpPath, { recursive: true });
    }

    const icons = [];
    let routes = '';

    const collectAssetsFromMenu = (menu) => {
      menu.forEach((item) => {
        if (item.icon) {
          icons.push(item.icon);
        }
        if (item.component) {
          routes += `{
            path: '${item.path}',
            name: '${item.path}',
            component: import('${item.component}'),
          },\n`
        }
        if (item.children) {
          collectAssetsFromMenu(item.children);
        }
      });
    };
    collectAssetsFromMenu(this.adminforth.config.menu);

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
          return !src.includes('/adminforth/spa/node_modules') && !src.includes('/adminforth/spa/dist');
        },
      });

      // copy whole custom directory
      if (this.adminforth.config.customization?.customComponentsDir) {
        await fsExtra.copy(this.adminforth.config.customization.customComponentsDir, path.join(CodeInjector.SPA_TMP_PATH, 'src', 'custom'), {
          recursive: true,
        });
      }
    }

    //collect all 'icon' fields from resources bulkActions
    this.adminforth.config.resources.forEach((resource) => {
      if (resource.options?.bulkActions) {
        resource.options.bulkActions.forEach((action) => {
          if (action.icon) {
            icons.push(action.icon);
          }
        });
      }
    });

    const uniqueIcons = Array.from(new Set(icons));

    // icons are collectionName:iconName. Get list of all unique collection names:
    const collections = new Set(icons.map((icon) => icon.split(':')[0]));

    // package names @iconify-prerendered/vue-<collection name>
    const packageNames = Array.from(collections).map((collection) => `@iconify-prerendered/vue-${collection}`);

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

    let imports = iconImports + '\n';

    if (this.adminforth.config.customization?.vueUsesFile) {
      imports += `import addCustomUses from '${this.adminforth.config.customization.vueUsesFile}';\n`;
    }

    // inject that code into spa_tmp/src/App.vue
    const appVuePath = path.join(spaTmpPath, 'src', 'main.ts');
    let appVueContent = await fs.promises.readFile(appVuePath, 'utf-8');
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH IMPORTS */', imports);
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */', iconComponents + '\n' );
    if (this.adminforth.config.customization?.vueUsesFile) {
      appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH CUSTOM USES */', 'addCustomUses(app);');
    }
    await fs.promises.writeFile(appVuePath, appVueContent);


    /* generate custom rotes */
    const routerVuePath = path.join(spaTmpPath, 'src', 'router', 'index.ts');
    let routerVueContent = await fs.promises.readFile(routerVuePath, 'utf-8');
    routerVueContent = routerVueContent.replace('/* IMPORTANT:ADMINFORTH ROUTES */', routes);
    await fs.promises.writeFile(routerVuePath, routerVueContent);
    

    /* hash checking */
    const packageLockPath = path.join(spaTmpPath, 'package-lock.json');
    const packageLock = JSON.parse(await fs.promises.readFile(packageLockPath, 'utf-8'));
    const lockHash = hashify(packageLock);
    /* customPackageLock */
    const customPackagePath = path.join('./package.json');
    const customPackage = JSON.parse(await fs.promises.readFile(customPackagePath, 'utf-8'));
    const customPackageHash = hashify(customPackage);

    const customLockPath = path.join('./package-lock.json');
    const customLock = JSON.parse(await fs.promises.readFile(customLockPath, 'utf-8'));
    const customLockHash = hashify(customLock);

    const packagesNamesHash = hashify(packageNames);

    const fullHash = hashify([lockHash, packagesNamesHash, customLockHash]);
    const hashPath = path.join(spaTmpPath, 'node_modules', '.adminforth_hash');

    try {
      const existingHash = await fs.promises.readFile(hashPath, 'utf-8');
      if (existingHash === fullHash) {
        console.log('Hashes match, skipping npm ci/install');
        return;
      }
    } catch (e) {
      // ignore
    }

    await this.runNpmShell({command: 'ci', verbose, cwd: spaTmpPath});

    // get packages with version from customPackage
    const customPackgeNames = [...Object.keys(customPackage.dependencies), ...Object.keys(customPackage.devDependencies || [])].reduce(
      (acc, packageName) => {
        const version = customLock.packages[`node_modules/${packageName}`].version;
        acc.push(`${packageName}@${version}`);
        return acc;
      }, []);

    if (packageNames.length) {
      const npmInstallCommand = `install ${[...packageNames, ...customPackgeNames].join(' ')}`;
      await this.runNpmShell({command: npmInstallCommand, cwd: spaTmpPath});
    }

    await fs.promises.writeFile(hashPath, fullHash);

  }

async watchForReprepare({ verbose }) {
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

    if (verbose) {
      console.log('🔎 Watching for changes in:', directories.join(','));
    }


    const watcher = filewatcher();
    directories.forEach((dir) => {
      watcher.add(dir);
    });

    watcher.on(
      'change',
      async (file) => {
        console.log(`File ${file} changed, preparing sources...`);
        await this.prepareSources({ filesUpdated: [file.replace(spaPath + '/', '')] });
      }
    )
    process.on('exit', () => {
      watcher.removeAll();
    });
  }

  async watchCustomComponentsForCopy({ verbose }) {
    const customComponentsDir = this.adminforth.config.customization.customComponentsDir;

    // check if folder exists
    try {
      await fs.promises.access(customComponentsDir, fs.constants.F_OK);
    } catch (e) {
      if (verbose) {
        console.log(`Custom components dir ${customComponentsDir} does not exist, skipping watching`);
      }
      return;
    }

    // get all subdirs
    const directories = [];
    const collectDirectories = async (dir) => {
      directories.push(dir);

      const files = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isDirectory()) {
          await collectDirectories(path.join(dir, file.name));
        }
      }
    };

    await collectDirectories(customComponentsDir);

    const watcher = filewatcher();
    directories.forEach((dir) => {
      watcher.add(dir);
    });

    if (verbose) {
      console.log('🔎 Watching for changes in:', directories.join(','));
    }
    
    watcher.on(
      'change',
      async (file) => {
        // copy one file
        // TODO: non optimal, copy only changed file, test on both nested and parent dir
        if (verbose) {
          console.log(`🔎 File ${file} changed, copying to spa_tmp...`);
        }
        await fsExtra.copy(this.adminforth.config.customization.customComponentsDir, path.join(CodeInjector.SPA_TMP_PATH, 'src', 'custom'), {
          recursive: true,
        });
      }
    )
    process.on('exit', () => {
      watcher.removeAll();
    });
  }

  async bundleNow({hotReload = false, verbose = false}: {hotReload: boolean, verbose: boolean}) {
    this.adminforth.runningHotReload = hotReload;

    await this.prepareSources({ verbose });

    if (hotReload) {
      await this.watchForReprepare({ verbose });
      await this.watchCustomComponentsForCopy({ verbose });
    }

    console.log('AdminForth bundling');
    
    const cwd = CodeInjector.SPA_TMP_PATH;

    if (!hotReload) {
      // probably add option to build with tsh check (plain 'build')
      await this.runNpmShell({command: 'run build-only', verbose, cwd});
    } else {
      const command = 'run dev';
      console.log(`⚙️ Running npm ${command}...`);
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

    }
  }
}

export default CodeInjector;