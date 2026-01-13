import { AdminForthResource, IAdminForthPlugin, IAdminForth } from './types/Back.js';
import { getComponentNameFromPath, md5hash } from './modules/utils.js';
import { currentFileDir } from './modules/utils.js';
import path from 'path';
import fs from 'fs';

import crypto from 'crypto';


export default class AdminForthPlugin implements IAdminForthPlugin {

  adminforth: IAdminForth;
  pluginDir: string;
  customFolderName: string = 'custom';
  pluginInstanceId: string;
  customFolderPath: string;
  pluginOptions: any;
  resourceConfig: AdminForthResource;
  className: string;
  activationOrder: number = 0;

  constructor(pluginOptions: any, metaUrl: string) {
    // set up plugin here
    this.pluginDir = currentFileDir(metaUrl);
    this.customFolderPath = path.join(this.pluginDir, this.customFolderName);
    this.pluginOptions = pluginOptions;
    process.env.HEAVY_DEBUG && console.log(`🪲 🪲  AdminForthPlugin.constructor`, this.constructor.name);
    this.className = this.constructor.name;
  }

  setupEndpoints(server: any) {
    
  }

  instanceUniqueRepresentation(pluginOptions: any) : string {
    return 'non-uniquely-identified';
  }

  shouldHaveSingleInstancePerWholeApp(): boolean {
    return true;
  }

  modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource, allPluginInstances?: {pi: AdminForthPlugin, resource: AdminForthResource}[]) {
    this.resourceConfig = resourceConfig;
    const uniqueness = this.instanceUniqueRepresentation(this.pluginOptions);

    const seed = `af_pl_${this.constructor.name}_${resourceConfig.resourceId}_${uniqueness}`;
    this.pluginInstanceId = md5hash(seed);
    process.env.HEAVY_DEBUG && console.log(`🪲 AdminForthPlugin.modifyResourceConfig`, seed, 'id', this.pluginInstanceId);
    this.adminforth = adminforth;
  }

  /** 
    * This method des next:
    * - fills this.adminforth.codeInjector.srcFoldersToSync with the custom folder path mapped to `./plugins/${this.constructor.name}/`
    * - fills this.adminforth.codeInjector.allComponentNames with the component name mapped to the component path
    */
  componentPath(componentFile: string) {
    const key = `@@/plugins/${this.constructor.name}/${componentFile}`;
    const componentName = getComponentNameFromPath(key);

    if (!this.adminforth.codeInjector.srcFoldersToSync[this.customFolderPath]) {
      this.adminforth.codeInjector.srcFoldersToSync[this.customFolderPath] = `./plugins/${this.constructor.name}/`;
    }
    
    if (!this.adminforth.codeInjector.allComponentNames[key]) {
      const absSrcPath = path.join(this.customFolderPath, componentFile);
      if (!fs.existsSync(absSrcPath)) {
        throw new Error(`Plugin "${this.constructor.name}" tried to use file as component which does not exist at "${absSrcPath}"`);
      }
      this.adminforth.codeInjector.allComponentNames[key] = componentName;
    }

    return key;
  }

}