import { exec, spawn } from 'child_process';
import filewatcher from 'filewatcher';
import fs from 'fs';
import fsExtra from 'fs-extra';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import AdminForth, { AdminForthConfigMenuItem } from '../index.js';
import { ADMIN_FORTH_ABSOLUTE_PATH, getComponentNameFromPath, transformObject, deepMerge, md5hash } from './utils.js';
import { ICodeInjector } from '../types/Back.js';
import { StylesGenerator } from './styleGenerator.js';


let TMP_DIR;

try {
  TMP_DIR = os.tmpdir();
} catch (e) {
  TMP_DIR = '/tmp'; //maybe we can consider to use node_modules/.cache/adminforth here instead of tmp
}

function stripAnsiCodes(str) {
  // Regular expression to match ANSI escape codes
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

function findHomePage(menuItem: AdminForthConfigMenuItem[]): AdminForthConfigMenuItem | undefined {
  for (const item of menuItem) {
    if (item.homepage) {
      return item;
    }
    if (item.children) {
      const found = findHomePage(item.children);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}
async function findFirstMenuItemWithResource(menuItem: AdminForthConfigMenuItem[]): Promise<AdminForthConfigMenuItem | undefined> {
  for (const item of menuItem) {
    if (item.path || item.resourceId) {
      return item;
    }
    if (item.children) {
      const found = await findFirstMenuItemWithResource(item.children);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

const execAsync = promisify(exec);

function hashify(obj) {
  return md5hash(JSON.stringify(obj));
}

function notifyWatcherIssue(limit) {
  console.log('Ran out of file handles after watching %s files.', limit);
  console.log('Falling back to polling which uses more CPU.');
  console.log('Run ulimit -n 10000 to increase the limit for open files.');
}

class CodeInjector implements ICodeInjector {

  allWatchers = [];
  adminforth: AdminForth;
  allComponentNames: { [key: string]: string } = {};
  srcFoldersToSync: { [key: string]: string } = {};
  devServerPort: number = null;

  spaTmpPath(): string {
    const brandSlug = this.adminforth.config.customization.brandNameSlug
    if (!brandSlug) {
      throw new Error('brandSlug is empty, but it should be populated at least by config Validator ');
    }
    return path.join(TMP_DIR, 'adminforth', brandSlug, 'spa_tmp');
  }

  cleanup() {
    console.log('Cleaning up...');
    this.allWatchers.forEach((watcher) => {
      watcher.removeAll();
    });
  }
  constructor(adminforth) {
    this.adminforth = adminforth;

    ['SIGINT', 'SIGTERM', 'SIGQUIT']
      .forEach(signal => process.on(signal, () => {
        this.cleanup();
        process.exit();
      }));

  }

  // async runShell({ command }) {
  //   console.log(`⚙️ Running shell ${command}...`);
  //   console.time(`${command} done in`);
  //   const { stdout: out, stderr: err } = await execAsync(command);
  //   console.timeEnd(`${command} done in`);
  //   console.log(`Command ${command} output:`, out, err);
  // }

  async runNpmShell({command, cwd}) {
    const nodeBinary = process.execPath; // Path to the Node.js binary running this script
    const npmPath = path.join(path.dirname(nodeBinary), 'npm'); // Path to the npm executable
    const env = {
      VITE_ADMINFORTH_PUBLIC_PATH: this.adminforth.config.baseUrl,
      FORCE_COLOR: '1',
      ...process.env,
    };

    console.log(`⚙️ exec: npm ${command}`);
    console.time(`npm ${command} done in`);
    const { stdout: out, stderr: err } = await execAsync(`${nodeBinary} ${npmPath} ${command}`, {
      cwd,
      env,
    });
    console.timeEnd(`npm ${command} done in`);

    process.env.HEAVY_DEBUG && console.log(`🪲 npm ${command} output:`, out);
    if (err) {
      process.env.HEAVY_DEBUG && console.error(`🪲npm ${command} errors/warnings:`, err);
    }
  }

  async rmTmpDir() {
    // remove spa_tmp folder if it is exists
    try {
      await fs.promises.rm(
        this.spaTmpPath(), { recursive: true });
    } catch (e) {
      // ignore
    }
  }

  getServeDir() {
    return path.join(this.getSpaDir(), 'dist');
  }

  async packagesFromNpm(dir: string): Promise<[string, string[]]> {
    const usersPackagePath = path.join(dir, 'package.json');
    let packageContent: { dependencies: any, devDependencies: any } = null;
    let lockHash: string = '';
    let packages: string[] = [];
    try {
      packageContent = JSON.parse(await fs.promises.readFile(usersPackagePath, 'utf-8'));
    } catch (e) {
      // user package.json does not exist, user does not have custom components
    }
    if (packageContent) {
      const lockPath = path.join(dir, 'package-lock.json');
      let lock = null;
      try {
        lock = JSON.parse(await fs.promises.readFile(lockPath, 'utf-8'));
      } catch (e) {
        throw new Error(`Custom package-lock.json does not exist in ${dir}, but package.json does. 
          We can't determine version of packages without package-lock.json. Please run npm install in ${dir}`);
      }
      lockHash = hashify(lock);

      packages = [
        ...Object.keys(packageContent.dependencies || []),
        ...Object.keys(packageContent.devDependencies || [])
      ].reduce(
          (acc, packageName) => {
            const pack = lock.packages[`node_modules/${packageName}`];
            if (!pack) {
              throw new Error(`Package ${packageName} is not in package-lock.json but is in package.json. Please run 'npm install' in ${dir}`);
            }
            const version = pack.version;

            acc.push(`${packageName}@${version}`);
            return acc;
          }, []
      );
      
    }
    return [lockHash, packages];
  }

  getSpaDir() {
    let spaDir = path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'spa');
    if (!fs.existsSync(spaDir)) {
      spaDir = path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'dist', 'spa');
    }
    return spaDir;
  }

  async updatePartials({ filesUpdated }: { filesUpdated: string[] }) {
    const spaDir = this.getSpaDir();

    // copy only updated files
    await Promise.all(filesUpdated.map(async (file) => {
      const src = path.join(spaDir, file);
      const dest = path.join(this.spaTmpPath(), file);

      // overwrite:true can't be used to not destroy cache
      await fsExtra.copy(src, dest, {
        dereference: true, // needed to dereference types
        // preserveTimestamps: true, // needed to not invalidate any caches
      });
      if (process.env.HEAVY_DEBUG) {
        console.log('🪲⚙️ fsExtra.copy copy single file', src, dest);
      }
    }));
  }

  async prepareSources() {
    // check spa tmp folder exists and create if not
    try {
      await fs.promises.access(this.spaTmpPath(), fs.constants.F_OK);
    } catch (e) {
      await fs.promises.mkdir(this.spaTmpPath(), { recursive: true });
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
          if(Object.keys(item).includes('isStaticRoute')) {
            if(!item.isStaticRoute) {
              routes += `{
                path: '${item.path}',
                name: '${item.path}',
                component: () => import('${item.component}'),
                meta: { title: '${item?.meta?.title || item?.label ||  item.path.replace('/', '')}'}
              },\n`
            } else {
              routes += `{
                path: '${item.path}',
                name: '${item.path}',
                component: ${getComponentNameFromPath(item.component)},
                meta: { title: '${item?.meta?.title || item?.label ||item.path.replace('/', '')}'}
              },\n`
              const componentName = `${getComponentNameFromPath(item.component)}`;
              routerComponents += `import ${componentName} from '${item.component}';\n`;
            }
          } else {
              if (item.homepage) {
                routes += `{
                  path: '${item.path}',
                  name: '${item.path}',
                  component: ${getComponentNameFromPath(item.component)},
                  meta: { title: '${item?.meta?.title || item?.label || item.path.replace('/', '')}'}
                },\n`
                const componentName = `${getComponentNameFromPath(item.component)}`;
                routerComponents += `import ${componentName} from '${item.component}';\n`;
              } else {
                routes += `{
                  path: '${item.path}',
                  name: '${item.path}',
                  component: () => import('${item.component}'),
                  meta: { title: '${item?.meta?.title || item.path.replace('/', '')}'}
                },\n` 
                }
          }
        }
        if (item.children) {
          collectAssetsFromMenu(item.children);
        }
      });
    };
    const registerCustomPages = (config) => {
      if (config.customization.customPages) {
        config.customization.customPages.forEach((page) => {
          routes += `{
            path: '${page.path}',
            name: '${page.path}',
            component: () => import('${page?.component?.file || page.component}'),
            meta: ${
                JSON.stringify({
                  ...(page?.component?.meta || {}),
                  title: page.meta?.title || page.path.replace('/', '')
                })
            }
          },`})
    }}

    registerCustomPages(this.adminforth.config);
    collectAssetsFromMenu(this.adminforth.config.menu);

    const spaDir = this.getSpaDir();

    if (process.env.HEAVY_DEBUG) {
      console.log(`🪲⚙️ fsExtra.copy from ${spaDir} -> ${this.spaTmpPath()}`);
    }

    // try to rm <spa tmp path>/src/types directory 
    try {
      await fs.promises.rm(path.join(this.spaTmpPath(), 'src', 'types'), { recursive: true });
    } catch (e) {
      // ignore
    }

    // overwrite can't be used to not destroy cache
  
    await fsExtra.copy(spaDir, this.spaTmpPath(), {
      filter: (src) => {
        // /adminforth/* used for local development and /dist/* used for production
        const filterPasses = !src.includes('/adminforth/spa/node_modules') && !src.includes('/adminforth/spa/dist') 
                          && !src.includes('/dist/spa/node_modules') && !src.includes('/dist/spa/dist');
        if (process.env.HEAVY_DEBUG && !filterPasses) {
          console.log('🪲⚙️ fsExtra.copy filtered out', src);
        }

        return filterPasses
      },
      dereference: true, // needed to dereference types
    });

    // copy whole custom directory
    if (this.adminforth.config.customization?.customComponentsDir) {
      // resolve customComponentsDir to absolute path, so ./aa will be resolved to /path/to/current/dir/aa
      const customCompAbsPath = path.resolve(this.adminforth.config.customization.customComponentsDir);
      this.srcFoldersToSync[customCompAbsPath] = './'
    }

    // if this.adminforth.config.customization.favicon is set, copy it to assets
    const customFav = this.adminforth.config.customization?.favicon;
    if (customFav) {

      const faviconPath = path.join(this.adminforth.config.customization?.customComponentsDir, customFav.replace('@@/', ''));
      const dest = path.join(this.spaTmpPath(), 'public', 'assets', customFav.replace('@@/', ''));
      // make sure all folders in dest exist
      await fsExtra.ensureDir(path.dirname(dest));

      await fsExtra.copy(faviconPath, dest);
    }

    for (const [src, dest] of Object.entries(this.srcFoldersToSync)) {
      const to = path.join(this.spaTmpPath(), 'src', 'custom', dest);
      if (process.env.HEAVY_DEBUG) {
        console.log(`🪲⚙️ srcFoldersToSync: fsExtra.copy from ${src}, ${to}`);
      }

      await fsExtra.copy(src, to, {
        recursive: true,
        dereference: true,
      });
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
    const iconPackageNames = Array.from(collections).map((collection) => `@iconify-prerendered/vue-${collection}`);

    // for each icon generate import statement
    const iconImports = uniqueIcons.map((icon) => {
      const [ collection, iconName ] = icon.split(':');
      const PascalIconName = 'Icon' + iconName.split('-').map((part, index) => {
        return part[0].toUpperCase() + part.slice(1);
      }).join('');
      return `import { ${PascalIconName} } from '@iconify-prerendered/vue-${collection}';`;
    }).join('\n');

    // for each custom component generate import statement
    const customResourceComponents = [];

    function checkInjections(filePathes) {
      filePathes.forEach(({ file }) => {
        if (!customResourceComponents.includes(file)) {
          if (file === undefined) {
            throw new Error('file is undefined');
          }
          customResourceComponents.push(file);
        }
      });
    }

    this.adminforth.config.resources.forEach((resource) => {
      resource.columns.forEach((column) => {
        if (column.components) {
          Object.values(column.components).forEach(({ file }: {file: string}) => {
            if (!customResourceComponents.includes(file)) {
              if (file === undefined) {
                throw new Error('file is undefined from field.components, field:' + JSON.stringify(column));
              }
              customResourceComponents.push(file);
            }
          });
        }
      });
      
      (Object.values(resource.options?.pageInjections || {})).forEach((injection) => {
        Object.values(injection).forEach((filePathes: {file: string}[]) => {
          checkInjections(filePathes);
        });
      });
    });

    if (this.adminforth.config.customization?.globalInjections) {
      Object.values(this.adminforth.config.customization.globalInjections).forEach((injection) => {
        checkInjections(injection);
      });
    }

    if (this.adminforth.config.customization?.loginPageInjections) {
      Object.values(this.adminforth.config.customization.loginPageInjections).forEach((injection) => {
        checkInjections(injection);
      });
    }


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
    const appVuePath = path.join(this.spaTmpPath(), 'src', 'main.ts');
    let appVueContent = await fs.promises.readFile(appVuePath, 'utf-8');
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH IMPORTS */', imports);
    appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH COMPONENT REGISTRATIONS */', iconComponents + '\n' + customComponentsComponents + '\n');
    if (this.adminforth.config.customization?.vueUsesFile) {
      appVueContent = appVueContent.replace('/* IMPORTANT:ADMINFORTH CUSTOM USES */', 'addCustomUses(app);');
    }
    await fs.promises.writeFile(appVuePath, appVueContent);

    // generate tailwind extend styles
    const stylesGenerator = new StylesGenerator(this.adminforth.config.customization?.styles); 
    const  stylesText = JSON.stringify(stylesGenerator.mergeStyles(), null, 2).slice(1, -1);
    let tailwindConfigPath = path.join(this.spaTmpPath(), 'tailwind.config.js');
    let tailwindConfigContent = await fs.promises.readFile(tailwindConfigPath, 'utf-8');
    tailwindConfigContent = tailwindConfigContent.replace('/* IMPORTANT:ADMINFORTH TAILWIND STYLES */', stylesText);
    await fs.promises.writeFile(tailwindConfigPath, tailwindConfigContent);
    

    const routerVuePath = path.join(this.spaTmpPath(), 'src', 'router', 'index.ts');

    let routerVueContent = await fs.promises.readFile(routerVuePath, 'utf-8');
    routerVueContent = routerVueContent.replace('/* IMPORTANT:ADMINFORTH ROUTES IMPORTS */', routerComponents);

    // inject title to index.html
    const indexHtmlPath = path.join(this.spaTmpPath(), 'index.html');
    let indexHtmlContent = await fs.promises.readFile(indexHtmlPath, 'utf-8');
    indexHtmlContent = indexHtmlContent.replace('/* IMPORTANT:ADMINFORTH TITLE */', `${this.adminforth.config.customization.title || 'AdminForth'}`);
    
    indexHtmlContent = indexHtmlContent.replace(
      '/* IMPORTANT:ADMINFORTH FAVICON */',
      this.adminforth.config.customization.favicon?.replace('@@/', `${this.adminforth.config.baseUrlSlashed}assets/`)
          ||
       `${this.adminforth.config.baseUrlSlashed}assets/favicon.png`
    );
    await fs.promises.writeFile(indexHtmlPath, indexHtmlContent);


    /* generate custom routes */
    let homepageMenuItem: AdminForthConfigMenuItem = findHomePage(this.adminforth.config.menu);
    if (!homepageMenuItem) {
      // find first item with path or resourceId. If we face a menu item with children earlier then path/resourceId, we should search in children
      homepageMenuItem = await findFirstMenuItemWithResource(this.adminforth.config.menu);
    }
    if (!homepageMenuItem) {
      throw new Error('No homepage found in menu and no menu item with path/resourceId found. AdminForth can not generate routes');
    }

    let homePagePath = homepageMenuItem.path || `/resource/${homepageMenuItem.resourceId}`;
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
    const spaPackageLockPath = path.join(this.spaTmpPath(), 'package-lock.json');
    const spaPackageLock = JSON.parse(await fs.promises.readFile(spaPackageLockPath, 'utf-8'));
    const spaLockHash = hashify(spaPackageLock);

    /* customPackageLock */
    let usersLockHash: string = '';
    let usersPackages: string[] = [];


    if (this.adminforth.config.customization?.customComponentsDir) {
      [usersLockHash, usersPackages] = await this.packagesFromNpm(this.adminforth.config.customization.customComponentsDir);
    }

    const pluginPackages: {
        pluginName: string,
        lockHash: string,
        packages: string[],
    }[] = [];

    // for every installed plugin generate packages
    for (const plugin of this.adminforth.activatedPlugins) {
      process.env.HEAVY_DEBUG && console.log('🔧 Checking packages for plugin', plugin.constructor.name, plugin.customFolderPath);
      const [lockHash, packages] = await this.packagesFromNpm(plugin.customFolderPath);
      if (packages.length) {
        pluginPackages.push({
          pluginName: plugin.constructor.name,
          lockHash,
          packages,
        });
      }
    }
    // form string "pluginName:lockHash::pLugin2Name:lockHash"
    const pluginsLockHash = pluginPackages.map(({ pluginName, lockHash }) => `${pluginName}>${lockHash}`).join('::');

    const iconPackagesNamesHash = hashify(iconPackageNames);

    const fullHash = `spa>${spaLockHash}::icons>${iconPackagesNamesHash}::user/custom>${usersLockHash}::${pluginsLockHash}`;
    const hashPath = path.join(this.spaTmpPath(), 'node_modules', '.adminforth_hash');

    try {
      const existingHash = await fs.promises.readFile(hashPath, 'utf-8');
      if (existingHash === fullHash) {
        process.env.HEAVY_DEBUG && console.log(`🪲Hashes match, skipping npm ci/install, from file: ${existingHash}, actual: ${fullHash}`);
        return;
      } else {
        process.env.HEAVY_DEBUG && console.log(`🪲 Hashes do not match: from file: ${existingHash} actual: ${fullHash}, proceeding with npm ci/install`);
      }
    } catch (e) {
      // ignore
      process.env.HEAVY_DEBUG && console.log('🪲Hash file does not exist, proceeding with npm ci/install');
    }

    await this.runNpmShell({command: 'ci', cwd: this.spaTmpPath()});

    const allPacks = [
      ...iconPackageNames,
      ...usersPackages, 
      ...pluginPackages.reduce((acc, { packages }) => {
        acc.push(...packages);
        return acc;
      }, []),
    ];
    const EXCLUDE_PACKS = ['@iconify-prerendered/vue-flowbite'];

    const allPacksFiltered = allPacks.filter((pack) => {
      return !EXCLUDE_PACKS.some((exclude) => pack.startsWith(exclude));
    })
    const allPacksUnique = Array.from(new Set(allPacksFiltered));

    if (allPacks.length) {
      const npmInstallCommand = `install ${allPacksUnique.join(' ')}`;
      await this.runNpmShell({command: npmInstallCommand, cwd: this.spaTmpPath()});
    }

    await fs.promises.writeFile(hashPath, fullHash);
  }

  async watchForReprepare({}) {
    const spaPath = this.getSpaDir();
    // get list of all subdirectories in spa recursively (for SPA development)
    const directories = [];
    const collectDirectories = async (dir) => {
      const files = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (['node_modules', 'dist'].includes(file.name)) {
          continue;
        }
        if (file.isDirectory()) {
          directories.push(path.join(dir, file.name));
          await collectDirectories(path.join(dir, file.name));
        }
      }
    };
    await collectDirectories(spaPath);

    process.env.HEAVY_DEBUG && console.log('🪲🔎 Watch for:', directories.join(','));

    const watcher = filewatcher({ debounce: 30 });
    directories.forEach((dir) => {
      // read directory files and add to watcher, only files not directories
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const fullPath = path.join(dir, file);
        if (fs.lstatSync(fullPath).isFile()) {
          process.env.HEAVY_DEBUG && console.log(`🪲🔎 Watch for file ${fullPath}`);
          watcher.add(fullPath);
        }
      })
    });

    watcher.on(
      'change',
      async (file) => {
        process.env.HEAVY_DEBUG && console.log(`🐛 File ${file} changed (SPA), preparing sources...`);
        await this.updatePartials({ filesUpdated: [file.replace(spaPath + '/', '')] });
      }
    )
    watcher.on('fallback', notifyWatcherIssue);
    this.allWatchers.push(watcher);
  }

  async watchCustomComponentsForCopy({ customComponentsDir, destination }) {
    if (!customComponentsDir) {
      return;
    }
    // check if folder exists
    try {
      await fs.promises.access(customComponentsDir, fs.constants.F_OK);
    } catch (e) {
      process.env.HEAVY_DEBUG && console.log(`🪲Custom components dir ${customComponentsDir} does not exist, skipping watching`);
      return;
    }

    // get all subdirs
    const directories = [];
    const files = []
    const collectDirectories = async (dir) => {
      if (['node_modules', 'dist'].includes(path.basename(dir))) {
        return;
      }
      directories.push(dir);

      const filesAndDirs = await fs.promises.readdir(dir, { withFileTypes: true });
      await Promise.all(
        filesAndDirs.map(
          async (file) => {
            const isDir = fs.lstatSync(path.join(dir, file.name)).isDirectory();
            if (isDir) {
              await collectDirectories(path.join(dir, file.name));
            } else {
              files.push(path.join(dir, file.name));
            }
          }
        )
      )
    };

    await collectDirectories(customComponentsDir);

    const watcher = filewatcher({ debounce: 30 });
    files.forEach((file) => {
      process.env.HEAVY_DEBUG && console.log(`🪲🔎 Watch for file ${file}`);
      watcher.add(file);
    });

    process.env.HEAVY_DEBUG && console.log('🪲🔎 Watch for:', directories.join(','));
    
    watcher.on(
      'change',
      async (fileOrDir) => {
        // copy one file
        const relativeFilename = fileOrDir.replace(customComponentsDir + '/', '');
        if (process.env.HEAVY_DEBUG) {
          console.log(`🔎 fileOrDir ${fileOrDir} changed`);
          console.log(`🔎 relativeFilename ${relativeFilename}`);
          console.log(`🔎 customComponentsDir ${customComponentsDir}`);
          console.log(`🔎 destination ${destination}`);
        }
        const isFile = fs.lstatSync(fileOrDir).isFile();
        if (isFile) {
          const destPath = path.join(this.spaTmpPath(), 'src', 'custom', destination, relativeFilename);
          process.env.HEAVY_DEBUG && console.log(`🔎 Copying file ${fileOrDir} to ${destPath}`);
          await fsExtra.copy(fileOrDir, destPath);
          return;
        } else {
          // for now do nothing
        }
      }
    );

    watcher.on('fallback', notifyWatcherIssue);

    this.allWatchers.push(watcher);
  }

  async bundleNow({ hotReload = false }: { hotReload: boolean }) {
    console.log(`AdminForth bundling ${hotReload ? ' and listening for changes (🔥 Hotreload)' : ' (no hot reload)'}`);
    this.adminforth.runningHotReload = hotReload;

    await this.prepareSources();

    if (hotReload) {
      await Promise.all([
        this.watchForReprepare({}),
        ...Object.entries(this.srcFoldersToSync).map(async ([src, dest]) => {

          await this.watchCustomComponentsForCopy({ 
            customComponentsDir: src,
            destination: dest,
          });
        }),
      ]);
    }

    const cwd = this.spaTmpPath();

    if (!hotReload) {
      // probably add option to build with tsh check (plain 'build')
      const serveDir = this.getServeDir();
      await this.runNpmShell({command: 'run build-only', cwd});
      // remove serveDir if exists
      try {
        await fs.promises.rm(serveDir, { recursive: true });
      } catch (e) {
        // ignore
      }
      await fs.promises.mkdir(serveDir, { recursive: true });
      // coy dist to serveDir
      await fsExtra.copy(path.join(cwd, 'dist'), serveDir, { recursive: true });

    } else {
      const command = 'run dev';
      console.log(`⚙️ spawn: npm ${command}...`);
      const nodeBinary = process.execPath; 
      const npmPath = path.join(path.dirname(nodeBinary), 'npm');
      const env = {
        VITE_ADMINFORTH_PUBLIC_PATH: this.adminforth.config.baseUrl,
        FORCE_COLOR: '1',
        ...process.env,
      };

      const devServer = spawn(`${nodeBinary}`, [`${npmPath}`, ...command.split(' ')], {
        cwd,
        env,
      });
      devServer.stdout.on('data', (data) => {
        if (data.includes('➜')) {
          // TODO: maybe better use our string "App port: 5174. HMR port: 5274", it is more reliable because vue might change their output

          // parse port from message "  ➜  Local:   http://localhost:xyz/"
          const s = stripAnsiCodes(data.toString());
          
          process.env.HEAVY_DEBUG && console.log('🪲 devServer stdout ➜ (port detect):', s);
          const portMatch = s.match(/.+?http:\/\/.+?:(\d+).+?/m);
          if (portMatch) {
            this.devServerPort = parseInt(portMatch[1]);
          }
        } else {
          console.log(`[AdminForth SPA]:`);
          process.stdout.write(data);
        }
      });
      devServer.stderr.on('data', (data) => {
        console.error(`[AdminForth SPA ERR]:`);
        process.stdout.write(data);
      });

    }
  }
}

export default CodeInjector;