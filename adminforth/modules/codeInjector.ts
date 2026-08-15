import { exec, spawn } from 'child_process';
import chokidar from 'chokidar';
import fs from 'fs';
import os from 'os';
import path from 'path';
import pLimit from 'p-limit';
import { promisify } from 'util';
import yaml from 'yaml';
import AdminForth, { AdminForthConfigMenuItem } from '../index.js';
import { ADMIN_FORTH_ABSOLUTE_PATH, getComponentNameFromPath, transformObject, deepMerge, md5hash, slugifyString } from './utils.js';
import { ICodeInjector } from '../types/Back.js';
import { StylesGenerator } from './styleGenerator.js';
import { afLogger } from '../modules/logger.js';
import { pathToFileURL } from 'url';


let TMP_DIR;

try {
  TMP_DIR = os.tmpdir();
} catch (e) {
  if (process.platform === 'win32') {
    TMP_DIR = process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
  } else {
    TMP_DIR = '/tmp';
  }//maybe we can consider to use node_modules/.cache/adminforth here instead of tmp
}

function stripAnsiCodes(str) {
  // Regular expression to match ANSI escape codes
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

// how many files we copy into spa_tmp at the same time, to not exhaust file descriptors on big trees.
// One limiter for the whole module, so several copyTreeAtomic calls in a row share the same budget
// instead of each opening its own 32.
const copyLimit = pLimit(32);

let atomicCopySeq = 0;

const ATOMIC_COPY_TMP_RE = /\.af-(\d+)-\d+\.tmp$/;

function isAtomicCopyTempName(name: string): boolean {
  return ATOMIC_COPY_TMP_RE.test(name);
}

// the pid baked into a copyFileAtomic temp name, so we can tell our own leftovers from someone else's
function atomicCopyTempPid(name: string): number | null {
  const match = name.match(ATOMIC_COPY_TMP_RE);
  return match ? parseInt(match[1], 10) : null;
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e: any) {
    return e?.code === 'EPERM'; // exists but is not ours to signal
  }
}

/**
 * Copies a single file to dest atomically: the content goes to a unique temp file next to dest
 * and is then renamed over it. rename(2) replaces the destination in one step (and MoveFileEx with
 * MOVEFILE_REPLACE_EXISTING does the same on Windows), so dest is never missing or half-written.
 *
 * fsExtra.copy() cannot be used for this: for an existing destination it does
 * unlink(dest) -> copyFile(src, dest) -> chmod(dest, mode) as three separate syscalls. Anything that
 * writes the same destination in between - a second hot reload event, or another process bundling into
 * the same spa_tmp - makes it fail with `ENOENT: ... unlink` or `ENOENT: ... chmod`, and readers
 * (vite, computeSourcesHash) can observe a missing file.
 */
async function copyFileAtomic(src: string, dest: string, mode?: number): Promise<void> {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  const tmp = `${dest}.af-${process.pid}-${atomicCopySeq++}.tmp`;
  try {
    await fs.promises.copyFile(src, tmp);
    if (mode !== undefined) {
      // safe to chmod before the rename: tmp is private to this call, nobody else can see it
      await fs.promises.chmod(tmp, mode);
    }
    await renameWithRetry(tmp, dest);
  } catch (e) {
    await fs.promises.rm(tmp, { force: true }).catch(() => {});
    throw e;
  }
}

/**
 * On Windows a rename over an open destination fails with EPERM/EACCES/EBUSY until the other holder
 * (vite, an editor, an antivirus scanner) lets go, so give it a few short tries before giving up.
 * On POSIX the first attempt always succeeds.
 */
async function renameWithRetry(from: string, to: string, attempts = 5): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await fs.promises.rename(from, to);
      return;
    } catch (e: any) {
      const retriable = e?.code === 'EPERM' || e?.code === 'EACCES' || e?.code === 'EBUSY';
      if (!retriable || attempt >= attempts) {
        throw e;
      }
      await new Promise((resolve) => setTimeout(resolve, 10 * attempt));
    }
  }
}

/**
 * Recursive copy with the semantics prepareSources relies on: symlinks are dereferenced,
 * `filter` prunes a source path together with its subtree. Every file lands atomically
 * (see copyFileAtomic) and file copies go through the shared copyLimit.
 */
async function copyTreeAtomic(
  src: string,
  dest: string,
  { filter }: { filter?: (src: string) => boolean } = {}
): Promise<void> {
  const walk = async (from: string, to: string) => {
    if (filter && !filter(from)) {
      process.env.HEAVY_DEBUG && console.log(`🪲⚙️ copyTreeAtomic filtered out, ${from}`);
      return;
    }
    // stat (not lstat) follows symlinks, same as fsExtra's dereference: true
    const stat = await fs.promises.stat(from);
    if (stat.isDirectory()) {
      await fs.promises.mkdir(to, { recursive: true });
      const entries = await fs.promises.readdir(from);
      await Promise.all(entries.map((name) => walk(path.join(from, name), path.join(to, name))));
    } else {
      await copyLimit(() => copyFileAtomic(from, to, stat.mode));
    }
  };

  await walk(src, dest);
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

function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled';
}

/**
 * chokidar options shared by both watchers.
 *
 * awaitWriteFinish is what makes a save safe to act on: chokidar waits for the size to stop changing
 * before emitting, so we never copy a half-written .vue file. atomic (default true) collapses the
 * unlink+add pair that editors produce when they save via a temp file and rename.
 *
 * Polling is deliberately not configured here: chokidar honours CHOKIDAR_USEPOLLING and
 * CHOKIDAR_INTERVAL on its own, and that is the same switch vite's watcher reads.
 */
function watcherOptions() {
  return {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 60,
      pollInterval: 20,
    },
    ignored: (checkedPath: string) => {
      const base = path.basename(checkedPath);
      return base === 'node_modules' || base === 'dist' || isAtomicCopyTempName(base);
    },
  };
}

class CodeInjector implements ICodeInjector {

  allWatchers = [];
  adminforth: AdminForth;
  allComponentNames: { [key: string]: string } = {};
  srcFoldersToSync: { [key: string]: string } = {};
  publicFoldersToSync: { [key: string]: string } = {};
  devServerPort: number = null;

  spaTmpPath(): string {
    const brandSlug = this.adminforth.config.customization.brandNameSlug
    if (!brandSlug) {
      throw new Error('brandSlug is empty, but it should be populated at least by config Validator ');
    }
    return path.join(TMP_DIR, 'adminforth', brandSlug, 'spa_tmp');
  }

  /**
   * spa_tmp is named after the brand slug only, so every run of the same project shares one folder.
   * We record who owns it next to it (not inside, so it stays out of the sources hash) purely to make
   * a second process visible: two of them copy over each other's files, which surfaces later as a
   * random fs error in an unrelated place. Investigation notes are in AdminForth/1519.
   */
  private async claimSpaTmp(): Promise<void> {
    const ownerFile = path.join(path.dirname(this.spaTmpPath()), '.owner');
    const previous = await this.tryReadFile(ownerFile);
    if (previous) {
      const [pidText, ...command] = previous.trim().split(' ');
      const pid = parseInt(pidText, 10);
      if (pid && pid !== process.pid && isProcessAlive(pid)) {
        afLogger.warn(
          `Another AdminForth process is already using ${this.spaTmpPath()}: pid ${pid}` +
          `${command.length ? ` (${command.join(' ')})` : ''}. They share this folder because it is named ` +
          `after the brand only, so their file copies overwrite each other. If you did not start a second ` +
          `dev server or "npx adminforth bundle" on purpose, please report this on AdminForth/1519.`
        );
      }
    }
    await fs.promises.writeFile(ownerFile, `${process.pid} ${process.argv.slice(1).join(' ')}`).catch(() => {});
  }

  async checkIconNames(icons: string[]) {
    process.env.HEAVY_DEBUG && console.log(`Checking icon names: ${icons.join(', ')}`);
    const uniqueIcons = Array.from(new Set(icons));
    process.env.HEAVY_DEBUG && console.log(`Unique icons: ${uniqueIcons.join(', ')}`);
    const collections = new Set(icons.map((icon) => icon.split(':')[0]));
    process.env.HEAVY_DEBUG && console.log(`Icon collections: ${Array.from(collections).join(', ')}`);
    const iconPackageNames = Array.from(collections).map((collection) => `@iconify-prerendered/vue-${collection}`);
    process.env.HEAVY_DEBUG && console.log(`Icon package names: ${iconPackageNames.join(', ')}`);
    const iconPackages = (
      await Promise.allSettled(
        iconPackageNames.map(
          async (pkg) => (
            { 
              pkg: await import(pathToFileURL(path.join(this.spaTmpPath(), 'node_modules', pkg, 'index.js')).href), 
              name: pkg
            }
          )
        )
      )
    );
    process.env.HEAVY_DEBUG && console.log(`Icon packages load results: ${iconPackages.map(res => res.status === 'fulfilled' ? res.value.name : 'error:' + res.reason).join(', ')}`);
    const loadedIconPackages = iconPackages.filter(isFulfilled).map((res) => res.value).reduce((acc, { pkg, name }) => {
      acc[name.slice(`@iconify-prerendered/vue-`.length)] = pkg;
      return acc;
    }, {});
    process.env.HEAVY_DEBUG && console.log(`Loaded icon packages: ${Object.keys(loadedIconPackages).join(', ')}`);
    uniqueIcons.forEach((icon) => {
      const [ collection, iconName ] = icon.split(':');
      const PascalIconName = 'Icon' + iconName.split('-').map((part, index) => {
        return part[0].toUpperCase() + part.slice(1);
      }).join('');
      process.env.HEAVY_DEBUG && console.log(`Checking icon: ${icon}, collection: ${collection}, iconName: ${iconName}, PascalIconName: ${PascalIconName}`);
      if (!loadedIconPackages[collection]) {
        throw new Error(`Collection ${collection} not found`);
      }
      if (!loadedIconPackages[collection][PascalIconName]) {
        throw new Error(`Icon ${iconName} not found in collection ${collection}`);
      }
    });
  }


  registerCustomComponent(filePath: string): void {
    const componentName = getComponentNameFromPath(filePath);
    this.allComponentNames[filePath] = componentName;
  }

  collectTailwindSafelist(): string[] {
    const classes = new Set<string>();

    for (const resource of this.adminforth.config.resources) {
      for (const column of resource.columns || []) {
        if (!column.listCssClass) {
          continue;
        }

        column.listCssClass
          .split(/\s+/)
          .filter(Boolean)
          .forEach((className) => classes.add(className));
      }
    }

    return Array.from(classes);
  }

  cleanup() {
    console.log('Cleaning up...');
    this.allWatchers.forEach((watcher) => {
      // close() is async, but the signal handler exits right after us - firing it is all we can do,
      // and an already-closed watcher must not throw out of a signal handler
      try {
        watcher.close();
      } catch (e) {
        process.env.HEAVY_DEBUG && console.log(`🪲 Failed to close a watcher: ${e}`);
      }
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


  public async doesUserHasPnpmLockFile(dir: string): Promise<boolean> {
    if (!dir) {
      return false;
    }

    const usersPackagePath = path.join(dir, 'package.json');
    let packageContent: { dependencies: any, devDependencies: any } = null;
    try {
      packageContent = JSON.parse(await fs.promises.readFile(usersPackagePath, 'utf-8'));
    } catch (e) {
      // user package.json does not exist, user does not have custom components
    }
    if (packageContent) {
      const lockPath = path.join(dir, 'pnpm-lock.yaml');
      let lock: any = null;
      try {
        lock = yaml.parse(await fs.promises.readFile(lockPath, 'utf-8'));
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  async runPackageManagerShell({command, cwd, envOverrides = {}}: {
    command: string,
    cwd: string,
    envOverrides?: { [key: string]: string }
  }) {
    
    const nodeBinary = process.execPath; // Path to the Node.js binary running this script
    const doesUserHavePnpmLock = await this.doesUserHasPnpmLockFile(this.adminforth.config.customization.customComponentsDir);

    // On Windows, npm/pnpm is npm/pnpm.cmd, on Unix systems it's npm/pnpm
    let packageExecutable 
    if (doesUserHavePnpmLock) {
      process.env.HEAVY_DEBUG && console.log(`User has pnpm-lock.yaml, using pnpm for installing custom components`);
      packageExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    } else {
      process.env.HEAVY_DEBUG && console.log(`User does not have pnpm-lock.yaml, falling back to npm for installing custom components`);
      packageExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    }
    const packagePath = path.join(path.dirname(nodeBinary), packageExecutable); // Path to the package executable

    const env = {
      VITE_ADMINFORTH_PUBLIC_PATH: this.adminforth.config.baseUrl,
      FORCE_COLOR: '1',
      ...process.env,
      ...envOverrides,
    };

    process.env.HEAVY_DEBUG && console.log(`⚙️ exec: ${packageExecutable} ${command}`);
    process.env.HEAVY_DEBUG && console.log(`🪲 ${packageExecutable} ${command} cwd: ${cwd}`);

    let execCommand: string;
    if (process.platform === 'win32') {
      // Quote path if it contains spaces
      const quotedPackagePath = packagePath.includes(' ') ? `"${packagePath}"` : packagePath;
      execCommand = `${quotedPackagePath} ${command}`;
    } else {
      // Quote paths that contain spaces (for Unix systems)
      const quotedNodeBinary = nodeBinary.includes(' ') ? `"${nodeBinary}"` : nodeBinary;
      const quotedPackagePath = packagePath.includes(' ') ? `"${packagePath}"` : packagePath;
      execCommand = `${quotedNodeBinary} ${quotedPackagePath} ${command}`;
    }
    
    const execOptions: any = {
      cwd,
      env,
    };

    if (process.platform === 'win32') {
      execOptions.shell = true;
    }

    const { stderr: err } = await execAsync(execCommand, execOptions);
    process.env.HEAVY_DEBUG && console.log(`${packageExecutable} ${command} done in`);

    if (err) {
      process.env.HEAVY_DEBUG && console.log(`🪲${packageExecutable} ${command} errors/warnings: ${err}`);
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

  async parsePackageLockPackages(dir: string, packageContent: { dependencies: any, devDependencies: any }): Promise<[string, string[]]> {
    const npmLockPath = path.join(dir, 'package-lock.json');
    let npmLock: any = null;
    try {
      npmLock = JSON.parse(await fs.promises.readFile(npmLockPath, 'utf-8'));
    } catch (npmLockError) {
      throw new Error(`Custom pnpm-lock.yaml or package-lock.json does not exist in ${dir}, but package.json does.
      We can't determine version of packages without pnpm-lock.yaml or package-lock.json. Please run pnpm install or npm install in ${dir}`);
    }

    const lockHash = hashify(npmLock);

    const packages = [
      ...Object.keys(packageContent.dependencies || {}),
      ...Object.keys(packageContent.devDependencies || {})
    ].reduce(
      (acc, packageName) => {
        const pack = npmLock?.packages?.[`node_modules/${packageName}`];
        if (!pack?.version) {
          throw new Error(`Package ${packageName} is not in package-lock.json but is in package.json. Please run 'npm install' in ${dir}`);
        }

        acc.push(`${packageName}@${pack.version}`);
        return acc;
      }, []
    );

    return [lockHash, packages];
  }

  async packagesFromPnpm(dir: string): Promise<[string, string[]]> {
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
      const lockPath = path.join(dir, 'pnpm-lock.yaml');
      let lock: any = null;
      try {
        lock = yaml.parse(await fs.promises.readFile(lockPath, 'utf-8'));
      } catch (e) {
        return await this.parsePackageLockPackages(dir, packageContent);
      }
      lockHash = hashify(lock);
      const importer = lock?.importers?.['.'];
      if (!importer) {
        throw new Error(`pnpm-lock.yaml in ${dir} does not contain importer ".". Please run pnpm install in ${dir}`);
      }

      const importerDeps = {
        ...(importer.dependencies || {}),
        ...(importer.devDependencies || {}),
        ...(importer.optionalDependencies || {}),
      };
      try {
        packages = [
          ...Object.keys(packageContent.dependencies || {}),
          ...Object.keys(packageContent.devDependencies || {})
        ].reduce(
            (acc, packageName) => {
              const depInfo = importerDeps[packageName];
              const raw = typeof depInfo === 'string'
                ? depInfo
                : (depInfo?.version || depInfo?.specifier);

              if (!raw) {
                throw new Error(`Package ${packageName} is not in pnpm-lock.yaml but is in package.json. Please run 'pnpm install' in ${dir}`);
              }

              const cleaned = raw.includes('(') ? raw.split('(')[0] : raw;

              acc.push(`${packageName}@${cleaned}`);
              return acc;
            }, []
        );
      } catch (e) {
        console.log(`Error while parsing pnpm-lock.yaml: ${e.message}. Falling back to package-lock.json parsing.`);
        // if there there is no sync between package.json and pnpm-lock.yaml - fallback to the package-lock.json parsing
        return await this.parsePackageLockPackages(dir, packageContent);
      }
    }
    return [lockHash, packages];
  }

  async allowBuildsFromWorkspaceFile(dir: string, sourceName: string): Promise<{ [packageName: string]: boolean }> {
    const content = await this.tryReadFile(path.join(dir, 'pnpm-workspace.yaml'));
    if (!content) {
      return {};
    }

    let parsed: any = null;
    try {
      parsed = yaml.parse(content);
    } catch (e) {
      afLogger.warn(`Could not parse pnpm-workspace.yaml in ${dir}, ignoring its allowBuilds: ${e.message}`);
      return {};
    }

    const allowBuilds: { [packageName: string]: boolean } = {};
    for (const [packageName, allowed] of Object.entries(parsed?.allowBuilds || {})) {
      if (typeof allowed !== 'boolean') {
        afLogger.warn(
          `Ignoring allowBuilds."${packageName}" declared by ${sourceName}: expected true or false, got ${JSON.stringify(allowed)}`
        );
        continue;
      }
      allowBuilds[packageName] = allowed;
    }
    return allowBuilds;
  }

  async syncAllowBuildsToSpaTmp(): Promise<{ [packageName: string]: boolean }> {
    const sources: { name: string, dir: string }[] = [];
    const customComponentsDir = this.adminforth.config.customization?.customComponentsDir;
    if (customComponentsDir) {
      sources.push({ name: 'customComponentsDir', dir: path.resolve(customComponentsDir) });
    }
    for (const plugin of this.adminforth.activatedPlugins) {
      sources.push({ name: plugin.constructor.name, dir: plugin.customFolderPath });
    }

    const merged: { [packageName: string]: boolean } = {};
    for (const { name, dir } of sources) {
      const allowBuilds = await this.allowBuildsFromWorkspaceFile(dir, name);
      for (const [packageName, allowed] of Object.entries(allowBuilds)) {
        if (merged[packageName] !== undefined && merged[packageName] !== allowed) {
          afLogger.warn(`Conflicting allowBuilds for "${packageName}", denying the build. Last source: ${name}`);
          merged[packageName] = false;
          continue;
        }
        merged[packageName] = allowed;
      }
    }
    process.env.HEAVY_DEBUG && console.log(`🪲 allowBuilds collected from plugins/custom dir: ${JSON.stringify(merged)}`);

    if (!Object.keys(merged).length) {
      return merged;
    }

    const workspacePath = path.join(this.spaTmpPath(), 'pnpm-workspace.yaml');
    const workspaceContent = await this.tryReadFile(workspacePath);
    const workspace = workspaceContent ? (yaml.parse(workspaceContent) || {}) : {};
    workspace.allowBuilds = { ...merged, ...(workspace.allowBuilds || {}) };
    await fs.promises.writeFile(workspacePath, yaml.stringify(workspace));

    return merged;
  }

  getSpaDir() {
    let spaDir = path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'spa');
    if (!fs.existsSync(spaDir)) {
      spaDir = path.join(ADMIN_FORTH_ABSOLUTE_PATH, 'dist', 'spa');
    }
    return spaDir;
  }

  registerPluginPublicFoldersToSync() {
    this.publicFoldersToSync = {};

    for (const plugin of this.adminforth.activatedPlugins) {
      const pluginPublicFolderPath = path.join(plugin.customFolderPath, 'public');
      if (fs.existsSync(pluginPublicFolderPath)) {
        this.publicFoldersToSync[pluginPublicFolderPath] = `./plugins/${plugin.className}/`;
      }
    }
  }

  async updatePartials({ filesUpdated }: { filesUpdated: string[] }) {
    const spaDir = this.getSpaDir();

    // copy only updated files
    await Promise.all(filesUpdated.map(async (file) => {
      const src = path.join(spaDir, file);
      const dest = path.join(this.spaTmpPath(), file);

      // atomic: a hot reload copy must never leave dest missing for a reader (vite / computeSourcesHash)
      await copyFileAtomic(src, dest);
      process.env.HEAVY_DEBUG && console.log(`🪲⚙️ copyFileAtomic copy single file, ${src}, ${dest}`);
    }));
  }
  async migrateLegacyCustomLayout(oldMeta) {
    if (oldMeta.customLayout === true) {
      oldMeta.sidebarAndHeader = "none";
    }
    return oldMeta;
  }
  async prepareSources() {
    // collects all files and folders into SPA_TMP_DIR

    // check spa tmp folder exists and create if not
    try {
      await fs.promises.access(this.spaTmpPath(), fs.constants.F_OK);
    } catch (e) {
      await fs.promises.mkdir(this.spaTmpPath(), { recursive: true });
    }

    await this.claimSpaTmp();

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
        config.customization.customPages.forEach(async (page) => {
          const newMeta = await this.migrateLegacyCustomLayout(page?.component?.meta || {});
          routes += `{
            path: '${page.path}',
            name: '${page.path}',
            component: () => import('${page?.component?.file || page.component}'),
            meta: ${
                JSON.stringify({
                  ...newMeta,
                  title: page.meta?.title || page.path.replace('/', '')
                })
            }
          },`})
    }}
    const registerSettingPages = ( settingPage ) => {
      if (!settingPage) {
        return;
      }
      for (const page of settingPage) {
        if (page.icon) {
          icons.push(page.icon);
        }
      }
    }

    registerCustomPages(this.adminforth.config);
    const menuWithContributions = await this.adminforth.getMenuWithContributions();
    collectAssetsFromMenu(menuWithContributions);
    registerSettingPages(this.adminforth.config.auth.userMenuSettingsPages);
    const spaDir = this.getSpaDir();

    process.env.HEAVY_DEBUG && console.log(`🪲⚙️ copyTreeAtomic from ${spaDir} -> ${this.spaTmpPath()}`);

    // try to rm <spa tmp path>/src/types directory 
    try {
      await fs.promises.rm(path.join(this.spaTmpPath(), 'src', 'types'), { recursive: true });
    } catch (e) {
      // ignore
    }

    // overwrite can't be used to not destroy cache
  
    await copyTreeAtomic(spaDir, this.spaTmpPath(), {
      filter: (src) => {
        // /adminforth/* used for local development and /dist/* used for production
        const filterPasses = !src.includes(`${path.sep}adminforth${path.sep}spa${path.sep}node_modules`) && !src.includes(`${path.sep}adminforth${path.sep}spa${path.sep}dist`) 
                          && !src.includes(`${path.sep}dist${path.sep}spa${path.sep}node_modules`) && !src.includes(`${path.sep}dist${path.sep}spa${path.sep}dist`);
        return filterPasses
      },
    });

    // copy whole custom directory
    if (this.adminforth.config.customization?.customComponentsDir) {
      // resolve customComponentsDir to absolute path, so ./aa will be resolved to /path/to/current/dir/aa
      const customCompAbsPath = path.resolve(this.adminforth.config.customization.customComponentsDir);
      this.srcFoldersToSync[customCompAbsPath] = './'
    }

    this.registerPluginPublicFoldersToSync();

    // if this.adminforth.config.customization.favicon is set, copy it to assets
    const customFav = this.adminforth.config.customization?.favicon;
    if (customFav) {

      const faviconPath = path.join(this.adminforth.config.customization?.customComponentsDir, customFav.replace('@@/', ''));
      const dest = path.join(this.spaTmpPath(), 'public', 'assets', customFav.replace('@@/', ''));
      // copyFileAtomic creates all folders in dest itself
      await copyFileAtomic(faviconPath, dest);
    }

    for (const [src, dest] of Object.entries(this.srcFoldersToSync)) {
      const to = path.join(this.spaTmpPath(), 'src', 'custom', dest);
      process.env.HEAVY_DEBUG && console.log(`🪲⚙️ srcFoldersToSync: copyTreeAtomic from ${src}, ${to}`);

      await copyTreeAtomic(src, to, {
        // exclude if node_modules comes after /custom/ in path
        filter: (src) => !src.includes(path.join('custom', 'node_modules')),
      });
    }

    for (const [src, dest] of Object.entries(this.publicFoldersToSync)) {
      const to = path.join(this.spaTmpPath(), 'public', dest);
      process.env.HEAVY_DEBUG && console.log(`🪲⚙️ publicFoldersToSync: copyTreeAtomic from ${src}, ${to}`);

      await copyTreeAtomic(src, to);
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

      if (resource.options?.actions) {
        resource.options.actions.forEach((action) => {
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
      resource.options.actions.forEach((action) => {
        const cc = action.customComponent;
        if (!cc) return;
      
        const file = (typeof cc === 'string') ? cc : cc.file;
        if (!file) {
          throw new Error('customComponent.file is missing for action: ' + JSON.stringify({ id: action.id, name: action.name }));
        }
        if (!customResourceComponents.includes(file)) {
          customResourceComponents.push(file);
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

    if (this.adminforth.config.auth.userMenuSettingsPages) {
      for (const settingPage of this.adminforth.config.auth.userMenuSettingsPages) {
        checkInjections([{ file: settingPage.component }]);
      }
    }

    if (this.adminforth.config.componentsToExplicitRegister) {
      this.adminforth.config.componentsToExplicitRegister.forEach((component) =>  {
        if (!customResourceComponents.includes(component)) {
          customResourceComponents.push(component.file);
        }
      }); 
    }

    customResourceComponents.forEach((filePath) => {
      const componentName = getComponentNameFromPath(filePath);
      this.allComponentNames[filePath] = componentName;
    });

    
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
    const safelistText = JSON.stringify(this.collectTailwindSafelist(), null, 2).slice(1, -1);
    let tailwindConfigPath = path.join(this.spaTmpPath(), 'tailwind.config.js');
    let tailwindConfigContent = await fs.promises.readFile(tailwindConfigPath, 'utf-8');
    tailwindConfigContent = tailwindConfigContent.replace('/* IMPORTANT:ADMINFORTH TAILWIND STYLES */', stylesText);
    tailwindConfigContent = tailwindConfigContent.replace('/* IMPORTANT:ADMINFORTH TAILWIND SAFELIST */', safelistText);
    await fs.promises.writeFile(tailwindConfigPath, tailwindConfigContent);
    

    const routerVuePath = path.join(this.spaTmpPath(), 'src', 'router', 'index.ts');

    let routerVueContent = await fs.promises.readFile(routerVuePath, 'utf-8');
    routerVueContent = routerVueContent.replace('/* IMPORTANT:ADMINFORTH ROUTES IMPORTS */', routerComponents);

    // inject title to index.html
    const indexHtmlPath = path.join(this.spaTmpPath(), 'index.html');
    let indexHtmlContent = await fs.promises.readFile(indexHtmlPath, 'utf-8');
    indexHtmlContent = indexHtmlContent.replace('/* IMPORTANT:ADMINFORTH TITLE */', `${this.adminforth.config.customization?.title || this.adminforth.config.customization?.brandName || 'AdminForth'}`);
    
    // we dont't need to add baseUrl in front of assets here, because it is already added by Vite/Vue
    indexHtmlContent = indexHtmlContent.replace(
      '/* IMPORTANT:ADMINFORTH FAVICON */',
      this.adminforth.config.customization.favicon?.replace('@@/', `/assets/`)
          ||
       `/assets/favicon.png`
    );

    // inject heads to index.html
    const headItems = this.adminforth.config.customization?.customHeadItems;
    if(headItems){
      const renderedHead = headItems.map(({ tagName, attributes, innerCode }) => {
      const attrs = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      const isVoid = ['base', 'link', 'meta'].includes(tagName);
      return isVoid
        ? `<${tagName} ${attrs}>`
        : `<${tagName} ${attrs}> ${innerCode} </${tagName}>`;
      }).join('\n    ');

      indexHtmlContent = indexHtmlContent.replace("    <!-- /* IMPORTANT:ADMINFORTH HEAD */ -->", `${renderedHead}` );
    }
    await fs.promises.writeFile(indexHtmlPath, indexHtmlContent);

    /* generate custom routes */
    let homepageMenuItem: AdminForthConfigMenuItem = findHomePage(menuWithContributions);
    if (!homepageMenuItem) {
      // find first item with path or resourceId. If we face a menu item with children earlier then path/resourceId, we should search in children
      homepageMenuItem = await findFirstMenuItemWithResource(menuWithContributions);
    }
    if (!homepageMenuItem) {
      throw new Error('No homepage found in menu and no menu item with path/resourceId found. AdminForth can not generate routes');
    }

    let homePagePath = homepageMenuItem.path || `/resource/${homepageMenuItem.resourceId}`;
    if (!homePagePath) {
      homePagePath=menuWithContributions.filter((mi)=>mi.path)[0]?.path || `/resource/${menuWithContributions.filter((mi)=>mi.children)[0]?.resourceId}` ;
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
    let spaLockHash = '';
    const isTherePnpmLockInCustomFolder = await this.doesUserHasPnpmLockFile(this.adminforth.config.customization.customComponentsDir);
    if (isTherePnpmLockInCustomFolder) {
      const spaPnpmLockPath = path.join(this.spaTmpPath(), 'pnpm-lock.yaml');
      const spaPnpmLock = yaml.parse(await fs.promises.readFile(spaPnpmLockPath, 'utf-8'));
      spaLockHash = hashify(spaPnpmLock);
    } else {
      const spaNpmLockPath = path.join(this.spaTmpPath(), 'package-lock.json');
      const spaNpmLock = JSON.parse(await fs.promises.readFile(spaNpmLockPath, 'utf-8'));
      spaLockHash = hashify(spaNpmLock);
    }
    /* customPackageLock */
    let usersLockHash: string = '';
    let usersPackages: string[] = [];


    if (this.adminforth.config.customization?.customComponentsDir) {
      [usersLockHash, usersPackages] = await this.packagesFromPnpm(this.adminforth.config.customization.customComponentsDir);
    }

    const pluginPackages: {
        pluginName: string,
        lockHash: string,
        packages: string[],
    }[] = [];

    // for every installed plugin generate packages
    for (const plugin of this.adminforth.activatedPlugins) {
      process.env.HEAVY_DEBUG && console.log(`🔧 Checking packages for plugin, ${plugin.constructor.name}, ${plugin.customFolderPath}`);
      const [lockHash, packages] = await this.packagesFromPnpm(plugin.customFolderPath);
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

    await this.syncAllowBuildsToSpaTmp();

    const fullHash = `spa>${spaLockHash}::icons>${iconPackagesNamesHash}::user/custom>${usersLockHash}::${pluginsLockHash}`;
    const hashPath = path.join(this.spaTmpPath(), 'node_modules', '.adminforth_hash');

    try {
      const existingHash = await fs.promises.readFile(hashPath, 'utf-8');
      await this.checkIconNames(icons);
      if (existingHash === fullHash) {
        process.env.HEAVY_DEBUG && console.log(`🪲Hashes match, skipping pnpm install, from file: ${existingHash}, actual: ${fullHash}`);
        return;
      } else {
        process.env.HEAVY_DEBUG && console.log(`🪲 Hashes do not match: from file: ${existingHash} actual: ${fullHash}, proceeding with pnpm install`);
      }
    } catch (e) {
      // ignore
      process.env.HEAVY_DEBUG && console.log(`🪲Hash file does not exist, proceeding with pnpm install, ${e}`);
    }

    // install --frozen-lockfile works for npm and pnpm
    await this.runPackageManagerShell({command: 'install --frozen-lockfile', cwd: this.spaTmpPath(), envOverrides: { 
      NODE_ENV: 'development' // otherwise it will not install devDependencies which we still need, e.g for extract
    }}); 

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
      const packageManagerInstallCommand = `install ${allPacksUnique.join(' ')}`;
      await this.runPackageManagerShell({
        command: packageManagerInstallCommand, cwd: this.spaTmpPath(), 
        envOverrides: { 
          NODE_ENV: 'development' // otherwise it will not install devDependencies which we still need, e.g for extract
        }
      });
    }
    await this.checkIconNames(icons);
    await fs.promises.writeFile(hashPath, fullHash);
  }

  async watchForReprepare({}) {
    const spaPath = this.getSpaDir();
    // get list of all subdirectories in spa recursively (for SPA development)
    process.env.HEAVY_DEBUG && console.log(`🪲🔎 Watch for: ${spaPath}`);

    // one recursive watcher for the whole tree, instead of one fs.watch handle per file:
    // files created after startup are picked up too, which the per-file registration never did
    const watcher = chokidar.watch(spaPath, watcherOptions());

    const onAddOrChange = (file: string) => {
      process.env.HEAVY_DEBUG && console.log(`🐛 File ${file} changed (SPA), preparing sources...`);
      this.onWatchedFileChange(file, async () => {
        await this.updatePartials({ filesUpdated: [path.relative(spaPath, file)] });
      });
    };

    watcher.on('add', onAddOrChange);
    watcher.on('change', onAddOrChange);
    watcher.on('unlink', (file: string) => {
      // keep spa_tmp in sync with removals, it used to only ever grow
      this.onWatchedFileRemove(path.join(this.spaTmpPath(), path.relative(spaPath, file)));
    });
    watcher.on('error', (e: any) => afLogger.warn(`Hot reload watcher error for ${spaPath}: ${e?.message}`));
    this.allWatchers.push(watcher);
  }

  // one promise chain per watched path, so two events for the same file can never have their
  // copies interleaved (which is what makes fs copies race each other), and a burst of saves
  // queues up instead of piling on top of each other
  private fileChangeChains: Map<string, Promise<void>> = new Map();

  /**
   * Runs `task` for a changed watched file, serialized per path and fully guarded.
   *
   * Both guards matter. A watcher event only says that something happened, not that the file is still
   * there - a rename, a git checkout or an editor writing through a temp file is enough for it to be
   * gone by the time we act on it. And any throw here would land in a listener whose promise nobody
   * awaits, i.e. an unhandled rejection, which node kills the process for.
   */
  private onWatchedFileChange(file: string, task: () => Promise<void>): void {
    this.queuePerPath(file, async () => {
      const stat = await fs.promises.stat(file).catch(() => null);
      if (!stat?.isFile()) {
        process.env.HEAVY_DEBUG && console.log(`🪲🔎 ${file} is gone or is not a file, skipping hot reload copy`);
        return;
      }
      await task();
    });
  }

  // removes a file from spa_tmp after it was deleted from the sources, on the same queue as copies
  // so a delete can never overtake a copy of the same path
  private onWatchedFileRemove(destPath: string): void {
    this.queuePerPath(destPath, async () => {
      process.env.HEAVY_DEBUG && console.log(`🪲🔎 Removing ${destPath} from spa_tmp, source is gone`);
      await fs.promises.rm(destPath, { force: true });
    });
  }

  private queuePerPath(key: string, task: () => Promise<void>): void {
    const previous = this.fileChangeChains.get(key) ?? Promise.resolve();

    const current = previous.then(task).catch((e) => {
      afLogger.warn(`Hot reload failed to sync ${key}: ${e.message}`);
    });

    this.fileChangeChains.set(key, current);
    current.then(() => {
      // keep the map from growing for the lifetime of the dev server
      if (this.fileChangeChains.get(key) === current) {
        this.fileChangeChains.delete(key);
      }
    });
  }

  async watchCustomComponentsForCopy({ customComponentsDir, destination, targetRoot = path.join('src', 'custom') }: {
    customComponentsDir: string,
    destination: string,
    targetRoot?: string,
  }) {
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

    process.env.HEAVY_DEBUG && console.log(`🪲🔎 Watch for: ${customComponentsDir}`);

    const watcher = chokidar.watch(customComponentsDir, watcherOptions());

    const destinationOf = (fileOrDir: string) =>
      path.join(this.spaTmpPath(), targetRoot, destination, path.relative(customComponentsDir, fileOrDir));

    const onAddOrChange = (fileOrDir: string) => {
      process.env.HEAVY_DEBUG && console.log(`🔎 fileOrDir ${fileOrDir} changed`);
      process.env.HEAVY_DEBUG && console.log(`🔎 customComponentsDir ${customComponentsDir}`);
      process.env.HEAVY_DEBUG && console.log(`🔎 destination ${destination}`);
      this.onWatchedFileChange(fileOrDir, async () => {
        const destPath = destinationOf(fileOrDir);
        process.env.HEAVY_DEBUG && console.log(`🔎 Copying file ${fileOrDir} to ${destPath}`);
        await copyFileAtomic(fileOrDir, destPath);
      });
    };

    watcher.on('add', onAddOrChange);
    watcher.on('change', onAddOrChange);
    watcher.on('unlink', (file: string) => this.onWatchedFileRemove(destinationOf(file)));
    watcher.on('error', (e: any) => afLogger.warn(`Hot reload watcher error for ${customComponentsDir}: ${e?.message}`));

    this.allWatchers.push(watcher);
  }

  async tryReadFile(filePath: string) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return content;
    } catch (e) {
      // file does not exist
      process.env.HEAVY_DEBUG && console.log(`🪲File ${filePath} does not exist, returning null`);
      return null;
    }
  }

  async computeSourcesHash(folderPath: string = this.spaTmpPath(), allFiles: string[] = []) {
    const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
    const hashes = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(folderPath, file.name);

        // 🚫 Skip big files or files which might be dynamic
        if (file.name === 'node_modules' || file.name === 'dist' ||
            file.name === 'i18n-messages.json' || file.name === 'i18n-empty.json' ||
            file.name === 'hashes.json' || file.name === 'package.json' ||
            file.name === 'pnpm-lock.yaml' || file.name === 'package-lock.json') {
          return '';
        }

        // a copyFileAtomic temp file survives only if the process was killed mid-copy (SIGKILL);
        // drop it so it neither poisons the build cache hash nor accumulates in spa_tmp.
        // If it belongs to a process that is still running, it is not a leftover at all - somebody
        // else is copying into our spa_tmp right now, which is the situation behind AdminForth/1519.
        if (isAtomicCopyTempName(file.name)) {
          const ownerPid = atomicCopyTempPid(file.name);
          if (ownerPid && ownerPid !== process.pid && isProcessAlive(ownerPid)) {
            afLogger.warn(
              `Caught another live process (pid ${ownerPid}) copying into ${this.spaTmpPath()} right now ` +
              `(${filePath}). Two processes sharing one spa_tmp overwrite each other's files - ` +
              `please report this on AdminForth/1519.`
            );
          } else {
            await fs.promises.rm(filePath, { force: true }).catch(() => {});
          }
          return '';
        }

        allFiles.push(filePath);
        
        if (file.isDirectory()) {
          return this.computeSourcesHash(filePath, allFiles);
        } else {
          const content = await fs.promises.readFile(filePath, 'utf-8');
          return md5hash(content);
        }
      })
    );
    return md5hash(hashes.join(''));
  }

  // Compute a map of file relative paths -> md5 hash of file contents and return it.
  // Skips directories/files that are ignored by computeSourcesHash (node_modules, dist, i18n files).
  async computeSourcesHashMap(folderPath: string = this.spaTmpPath(), rootFolder: string = this.spaTmpPath(), map: { [key: string]: string } = {}): Promise<{ [key: string]: string }> {
    const files = await fs.promises.readdir(folderPath, { withFileTypes: true });

    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(folderPath, file.name);

        // 🚫 Skip big/dynamic folders or files
        if (file.name === 'node_modules' || file.name === 'dist' ||
            file.name === 'i18n-messages.json' || file.name === 'i18n-empty.json' ||
            file.name === 'hashes.json' || file.name === 'package.json' ||
            file.name === 'pnpm-lock.yaml' || file.name === 'package-lock.json' ||
            isAtomicCopyTempName(file.name)) {
          return;
        }

        if (file.isDirectory()) {
          return await this.computeSourcesHashMap(filePath, rootFolder, map);
        } else {
          try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const hash = md5hash(content);
            // store relative path using forward slashes for portability
            const rel = path.relative(rootFolder, filePath).split(path.sep).join('/');
            map[rel] = hash;
          } catch (e) {
            // If a file can't be read (binary or permission), log and continue
            process.env.HEAVY_DEBUG && console.log(`🪲File ${filePath} read error: ${e}`);
            return;
          }
        }
      })
    );

    return map;
  }

  // Convenience helper: compute per-file hashes and save them into hashes.json in the spa tmp dir
  async saveSourcesHashesToFile(outputFileName: string = 'hashes.json', hashMap: { [key: string]: string } = {}): Promise<string> {
    const root = this.spaTmpPath();
    const outPath = path.join(root, outputFileName);
    await fs.promises.writeFile(outPath, JSON.stringify(hashMap, null, 2), 'utf-8');
    process.env.HEAVY_DEBUG && console.log(`🪲 Saved sources hashes to ${outPath}`);
    return outPath;
  }

  async bundleNow({ hotReload = false, buildTime = true }: { hotReload: boolean, buildTime?: boolean }) {
    console.log(`${this.adminforth.formatAdminForth()} Bundling ${hotReload ? 'and listening for changes (🔥 Hotreload)' : ' (no hot reload)'}`);
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
        ...Object.entries(this.publicFoldersToSync).map(async ([src, dest]) => {
          await this.watchCustomComponentsForCopy({
            customComponentsDir: src,
            destination: dest,
            targetRoot: 'public',
          });
        }),
      ]);
    }

    const cwd = this.spaTmpPath();
    const serveDir = this.getServeDir();

    const allFiles = [];
    const sourcesHash = await this.computeSourcesHash(this.spaTmpPath(), allFiles);
    process.env.HEAVY_DEBUG && console.log(`🪲🪲 allFiles:, ${JSON.stringify(
      allFiles.sort((a,b) => a.localeCompare(b)), null, 1)}`);
    
    const buildHash = await this.tryReadFile(path.join(serveDir, '.adminforth_build_hash'));
    const messagesHash = await this.tryReadFile(path.join(serveDir, '.adminforth_messages_hash'));

    const skipBuild = buildHash === sourcesHash;
    const skipExtract = messagesHash === sourcesHash;

    process.env.HEAVY_DEBUG && console.log(`🪲 SPA messages hash: ${messagesHash}`);

    if (!skipBuild) {
      // remove serveDir if exists
      try {
        await fs.promises.rm(serveDir, { recursive: true });
      } catch (e) {
        // ignore
      }
      await fs.promises.mkdir(serveDir, { recursive: true });
    }

    if (!skipExtract) {
      await this.runPackageManagerShell({command: 'run i18n:extract', cwd});
      
      // create serveDir if not exists
      await fs.promises.mkdir(serveDir, { recursive: true });

      // copy i18n messages to serve dir
      await copyFileAtomic(path.join(cwd, 'i18n-messages.json'), path.join(serveDir, 'i18n-messages.json'));

      // save hash
      await fs.promises.writeFile(path.join(serveDir, '.adminforth_messages_hash'), sourcesHash);
    } else {
      console.log(`AdminForth i18n message extraction skipped — build already performed for the current sources.`);
    }

    if (!hotReload) {
      if (!skipBuild) {     
        console.log(`🪲 Build cache miss or outdated, building SPA...`);
        let oldHashForFiles = null;
        try {
          oldHashForFiles = await fs.promises.readFile(path.join(this.spaTmpPath(), 'hashes.json'), 'utf-8');
        } catch (e) {
          // ignore if file doesn't exist, it is only for debugging
          if (!buildTime) {
            console.log(`Build cache not found, building now (downtime) please consider running npx adminforth bundle at build time to avoid downtimes at runtime`);
          }
        }
        const root = this.spaTmpPath();
        const hashMap = await this.computeSourcesHashMap(root, root, {});
        if (oldHashForFiles) {
          const parsedOldHashForFiles = JSON.parse(oldHashForFiles);
          const logsToDisplay = [];
          logsToDisplay.push(`Build cache exists but is outdated:`);
          for(const [file, hash] of Object.entries(hashMap)) {
            if (!parsedOldHashForFiles[file]) {
              logsToDisplay.push(`   - file ${file} - does not exist in cache but exists in runtime`);
            } else if (parsedOldHashForFiles[file] !== hash) {
              logsToDisplay.push(`   - file ${file} - content in cache is different then in runtime`);
            }
          }
          /**
           * Currently we can't detect, if file was removed, 
           * because we can only add files to the tpm folder but not remove them, 
           * so if file existed before and now doesn't exist, we will not detect it
           */

          // for(const [file, hash] of Object.entries(parsedOldHashForFiles)) {
          //   console.log(`checking file ${file} in old hash: ${hash}`);
          //   console.log(`checking file ${file} in new hash: ${hashMap[file]}`);
          //   if (!hashMap[file]) {
          //     logsToDisplay.push(`   - file ${file} - exists in cache but does not exist in runtime`);
          //   }
          // }

          logsToDisplay.push(`If you are running in production now, then the cache loss is a downtime issue.`);
          logsToDisplay.push(`If you have npx adminforth bundle in build time, then this issue might be caused by conditional instantiation of plugins:`)
          logsToDisplay.push(`Please avoid constructions like (process.env.SOME_KEY ? new Plugin(...) ) because if you will miss SOME_KEY in build time build cache and functionality fails.`);
          if (logsToDisplay.length > 4) {
            for(const log of logsToDisplay) {
              console.log(log);
            }
          }
        }

        // TODO probably add option to build with tsh check (plain 'build')
        await this.runPackageManagerShell({command: 'run build-only', cwd});
        
        // coy dist to serveDir
        await copyTreeAtomic(path.join(cwd, 'dist'), serveDir);

        // save hash
        await fs.promises.writeFile(path.join(serveDir, '.adminforth_build_hash'), sourcesHash);
        // save sources hashes to file for later debugging if needed
        await this.saveSourcesHashesToFile('hashes.json', hashMap);
      } else {
        console.log(`Skipping AdminForth SPA bundling - already completed for the current sources.`);
      }
    } else {

      const command = 'run dev';
      const usersPackageManager = await this.doesUserHasPnpmLockFile(this.adminforth.config.customization.customComponentsDir) ? 'pnpm' : 'npm';
      console.log(`⚙️ spawn: ${usersPackageManager} ${command}...`);
      if (process.env.VITE_ADMINFORTH_PUBLIC_PATH) {
        console.log(`⚠️ Your VITE_ADMINFORTH_PUBLIC_PATH: ${process.env.VITE_ADMINFORTH_PUBLIC_PATH} has no effect`);
      }
      const env = {
        VITE_ADMINFORTH_PUBLIC_PATH: this.adminforth.config.baseUrl,
        FORCE_COLOR: '1',
        ...process.env,
      }; 
      
      const nodeBinary = process.execPath;
      const packageManagerPath = path.join(path.dirname(nodeBinary), usersPackageManager);
      
      let devServer;
      if (process.platform === 'win32') {
        devServer = spawn(usersPackageManager, command.split(' '), { cwd, env, shell: true });
      } else {
        devServer = spawn(`${nodeBinary}`, [`${packageManagerPath}`, ...command.split(' ')], { cwd, env });
      }
      devServer.stdout.on('data', (data) => {
        if (data.includes('➜')) {
          // TODO: maybe better use our string "App port: 5174. HMR port: 5274", it is more reliable because vue might change their output

          // parse port from message "  ➜  Local:   http://localhost:xyz/"
          const s = stripAnsiCodes(data.toString());
          
          const portMatch = s.match(/.+?http:\/\/.+?:(\d+).+?/m);
          if (portMatch) {
            this.devServerPort = parseInt(portMatch[1]);
          }
        } else {
          process.env.HEAVY_DEBUG && console.log(`[AdminForth SPA]:`);
          process.env.HEAVY_DEBUG && console.log(data.toString());
        }
      });
      devServer.stderr.on('data', (data) => {
        const text = data.toString();
        // pnpm/npm echo the script command they are about to run (e.g. "$ vite") to stderr,
        // and emit empty lines. These are not errors, so don't log them as such.
        const meaningful = stripAnsiCodes(text)
          .split('\n')
          .filter((line: string) => line.trim() && !line.trim().startsWith('$ '));
        if (meaningful.length === 0) {
          process.env.HEAVY_DEBUG && console.log(`[AdminForth SPA]:`, text);
          return;
        }
        afLogger.error(`[AdminForth SPA ERROR]:`);
        afLogger.error(text);
      });

    }
  }
}

export default CodeInjector;
