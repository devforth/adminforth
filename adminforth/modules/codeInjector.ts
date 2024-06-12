import { exec, spawn } from 'child_process';
import crypto from 'crypto';
import filewatcher from 'filewatcher';
import fs from 'fs';
import fsExtra from 'fs-extra';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import AdminForth from '../index.js';
import { ADMIN_FORTH_ABSOLUTE_PATH } from './utils.js';
import { getComponentNameFromPath } from './utils.js';



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
  allComponentNames: { [key: string]: string } = {};
  srcFoldersToSync: { [key: string]: string } = {};

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
    try {
      await fs.promises.rm(CodeInjector.SPA_TMP_PATH, { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  async prepareSources({ filesUpdated, verbose = false }: { filesUpdated?: string[], verbose?: boolean }) {
    // check SPA_TMP_PATH exists and create if not
    try {
      await fs.promises.access(CodeInjector.SPA_TMP_PATH, fs.constants.F_OK);
    } catch (e) {
      await fs.promises.mkdir(CodeInjector.SPA_TMP_PATH, { recursive: true });
    }

    const icons = [];
    let routes = '';
    let routerComponents = '';  

    const collectAssetsFromMenu = (menu) => {
      menu.forEach((item) => {
        if (item.icon) {
          icons.push(item.icon);
        }
        
        if (item.component) {
          if(Object.keys(item).includes('isStaticRoute')){
            if(!item.isStaticRoute){
            routes += `{
              path: '${item.path}',
              name: '${item.path}',
              component: () => import('${item.component}'),
              meta: { title: '${item?.meta?.title}'}
            },\n`} else {
              routes += `{
                path: '${item.path}',
                name: '${item.path}',
                component: ${getComponentNameFromPath(item.component)},
                meta: { title: '${item?.meta?.title}'}
              },\n`
              const componentName = `${getComponentNameFromPath(item.component)}`;
              routerComponents += `import ${componentName} from '${item.component}';\n`;
            }
          } else{
            if(item.homepage){
              routes += `{
                path: '${item.path}',
                name: '${item.path}',
                component: ${getComponentNameFromPath(item.component)},
                meta: { title: '${item?.meta?.title}'}
              },\n`
              const componentName = `${getComponentNameFromPath(item.component)}`;
              routerComponents += `import ${componentName} from '${item.component}';\n`;}
              else {
              routes += `{
                path: '${item.path}',
                name: '${item.path}',
                component: () => import('${item.component}'),}
                meta: { title: '${item?.meta?.title}'
              },\n` 
              
            }
            
          }
          
        }
        if (item.children) {
          collectAssetsFromMenu(item.children);
        }
      });
    };
    collectAssetsFromMenu(this.adminforth.config.menu);

    if (filesUpdated) {
      // copy only updated files
      await Promise.all(filesUpdated.map(async (file) => {
        const src = path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'spa', file);
        const dest = path.join(CodeInjector.SPA_TMP_PATH, file);
        await fsExtra.copy(src, dest);
        if (process.env.HEAVY_DEBUG) {
          console.log('🪲 await fsExtra.copy filtering', src, dest);
        }

      }));
    } else {
      if (process.env.HEAVY_DEBUG) {
        console.log(`🪲 await fsExtra.copy from ${path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'spa')}, ${CodeInjector.SPA_TMP_PATH}`);
      }

      await fsExtra.copy(path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'spa'), CodeInjector.SPA_TMP_PATH, {
        filter: (src) => {
          if (process.env.HEAVY_DEBUG) {
            console.log('🪲 await fsExtra.copy filtering', src);
          }

          return !src.includes('/adminforth/spa/node_modules') && !src.includes('/adminforth/spa/dist');
        },
        overwrite: true,
      });

      // copy whole custom directory
      if (this.adminforth.config.customization?.customComponentsDir) {
        this.srcFoldersToSync[this.adminforth.config.customization.customComponentsDir] = './'
      }

      for (const [src, dest] of Object.entries(this.srcFoldersToSync)) {
        const to = path.join(CodeInjector.SPA_TMP_PATH, 'src', 'custom', dest);
        if (process.env.HEAVY_DEBUG) {
          console.log(`🪲 await fsExtra.copy from ${src}, ${to}`);
        }

        await fsExtra.copy(src, to, {
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

    // for each custom component generate import statement
    const customComponentsDir = this.adminforth.config.customization?.customComponentsDir;

    const customResourceComponents = [];
    this.adminforth.config.resources.forEach((resource) => {
      resource.columns.forEach((field) => {
        if (field.component) {
          Object.values(field.component).forEach((filePath) => {
            if (!customResourceComponents.includes(filePath)) {
              customResourceComponents.push(filePath);
            }
          });
        }
      });
    });

    customResourceComponents.forEach((filePath) => {
      const componentName = getComponentNameFromPath(filePath);
      this.allComponentNames[filePath] = componentName;
    });

    // console.log('🔧 Injecting code into Vue sources...', this.allComponentNames);
    
    let customComponentsImports = '';
    for (const [targetPath, component] of Object.entries(this.allComponentNames)) {
      customComponentsImports += `import ${component} from '${targetPath}';\n`;
    }


    // Generate Vue.component statements for each icon
    const iconComponents = uniqueIcons.map((icon) => {
      const [ collection, iconName ] = icon.split(':');
      const PascalIconName = 'Icon' + iconName.split('-').map((part, index) => {
        return part[0].toUpperCase() + part.slice(1);
      }).join('');
      return `app.component('${PascalIconName}', ${PascalIconName});`;
    }).join('\n');

    // Generate Vue.component statements for each custom component
    let customComponentsComponents = '';
    for (const name of Object.values(this.allComponentNames)) {
      customComponentsComponents += `app.component('${name}', ${name});\n`;
    }

    let imports = iconImports + '\n';
    imports += customComponentsImports + '\n';


    if (this.adminforth.config.customization?.vueUsesFile) {
      imports += `import addCustomUses from '${this.adminforth.config.customization.vueUsesFile}';\n`;
    }

    // inject that code into spa_tmp/src/App.vue
    const appVuePath = path.join(CodeInjector.SPA_TMP_PATH, 'src', 'main.ts');
    let appVueContent = await fs.promises.readFile(appVuePath, 'utf-8');
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH IMPORTS */', imports);
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */', iconComponents + '\n' + customComponentsComponents + '\n');
    if (this.adminforth.config.customization?.vueUsesFile) {
      appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH CUSTOM USES */', 'addCustomUses(app);');
    }
    await fs.promises.writeFile(appVuePath, appVueContent);

    // generate tailwind extend styles 
    if(this.adminforth.config?.styles){
      const tailwindStyles = this.adminforth.config?.styles
      const stylesText = JSON.stringify(tailwindStyles, null, 2).slice(1, -1);
      let tailwindConfigPath = path.join(CodeInjector.SPA_TMP_PATH, 'tailwind.config.js');
      let tailwindConfigContent = await fs.promises.readFile(tailwindConfigPath, 'utf-8');
      tailwindConfigContent = tailwindConfigContent.replace('/* IMPORTANT:ADMINFORTH TAILWIND STYLES */', stylesText);
      await fs.promises.writeFile(tailwindConfigPath, tailwindConfigContent);
    }


    const routerVuePath = path.join(CodeInjector.SPA_TMP_PATH, 'src', 'router', 'index.ts');

    let routerVueContent = await fs.promises.readFile(routerVuePath, 'utf-8');
    routerVueContent = routerVueContent.replace('/* IMPORTANT:ADMINFORTH ROUTES IMPORTS */', routerComponents);

    // inject title to index.html
    const indexHtmlPath = path.join(CodeInjector.SPA_TMP_PATH, 'index.html');
    let indexHtmlContent = await fs.promises.readFile(indexHtmlPath, 'utf-8');
    indexHtmlContent = indexHtmlContent.replace('/* IMPORTANT:ADMINFORTH TITLE */', `${this.adminforth.config.customization.title || 'AdminForth'}`);
    await fs.promises.writeFile(indexHtmlPath, indexHtmlContent);



    /* generate custom routes */
    const homepageMenuItem = this.adminforth.config.menu.find((mi)=>mi.homepage);
    let childrenHomePageMenuItem = this.adminforth.config.menu.find((mi)=>mi.children && mi.children?.find((mi)=>mi.homepage));
    let childrenHomepage = childrenHomePageMenuItem?.children?.find((mi)=>mi.homepage)
    let homePagePath = homepageMenuItem?.path || `/resource/${childrenHomepage?.resourceId}`;
    if (!homePagePath) {
      homePagePath=this.adminforth.config.menu.filter((mi)=>mi.path)[0]?.path || `/resource/${this.adminforth.config.menu.filter((mi)=>mi.children)[0]?.resourceId}` ;
    }

    routes += `{
      path: '/',
      name: 'home',
      //redirect to login 
      redirect: '${homePagePath}'
    },\n`;
    routerVueContent = routerVueContent.replace('/* IMPORTANT:ADMINFORTH ROUTES */', routes);
    await fs.promises.writeFile(routerVuePath, routerVueContent);
    

    /* hash checking */
    const spaPackageLockPath = path.join(CodeInjector.SPA_TMP_PATH, 'package-lock.json');
    const spaPackageLock = JSON.parse(await fs.promises.readFile(spaPackageLockPath, 'utf-8'));
    const spaLockHash = hashify(spaPackageLock);

    /* customPackageLock */
    const usersPackagePath = path.join('./package.json');
    const usersPackage = JSON.parse(await fs.promises.readFile(usersPackagePath, 'utf-8'));

    const usersLockPath = path.join('./package-lock.json');
    const usersLock = JSON.parse(await fs.promises.readFile(usersLockPath, 'utf-8'));
    const usersLockHash = hashify(usersLock);

    const packagesNamesHash = hashify(packageNames);

    const fullHash = `${spaLockHash}::${packagesNamesHash}::${usersLockHash}`;
    const hashPath = path.join(CodeInjector.SPA_TMP_PATH, 'node_modules', '.adminforth_hash');

    try {
      const existingHash = await fs.promises.readFile(hashPath, 'utf-8');
      if (existingHash === fullHash) {
        console.log('Hashes match, skipping npm ci/install');
        return;
      } else {
        if (verbose) {
          console.log(`Hashes do not match: existing ${existingHash} new ${fullHash}, proceeding with npm ci/install`);
        }
      }
    } catch (e) {
      // ignore
      if (verbose) {
        console.log('Hash file does not exist, proceeding with npm ci/install');
      }
    }

    await this.runNpmShell({command: 'ci', verbose, cwd: CodeInjector.SPA_TMP_PATH});

    // get packages with version from customPackage
    const IGNORE_PACKAGES = ['tsx', 'typescript', 'express', 'nodemon'];
    const customPackgeNames = [...Object.keys(usersPackage.dependencies), ...Object.keys(usersPackage.devDependencies || [])]
      .filter((packageName) => !IGNORE_PACKAGES.includes(packageName))
      .reduce(
        (acc, packageName) => {
          const version = usersLock.packages[`node_modules/${packageName}`].version;
          acc.push(`${packageName}@${version}`);
          return acc;
        }, []);

    if (packageNames.length) {
      const npmInstallCommand = `install ${[...packageNames, ...customPackgeNames].join(' ')}`;
      await this.runNpmShell({command: npmInstallCommand, cwd: CodeInjector.SPA_TMP_PATH});
    }

    await fs.promises.writeFile(hashPath, fullHash);

  }

async watchForReprepare({ verbose }) {
    const spaPath = path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'spa');
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