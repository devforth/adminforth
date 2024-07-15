import { AdminForthResource, IAdminForthPlugin, IAdminForth } from './types/AdminForthConfig.js';
import { getComponentNameFromPath } from './modules/utils.js';
import { currentFileDir } from './modules/utils.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export default class AdminForthPlugin implements IAdminForthPlugin {

  adminforth: IAdminForth;
  pluginDir: string;
  customFolderName: string = 'custom';
  pluginInstanceId: string;
  customFolderPath: string;

  constructor(pluginOptions: any, metaUrl: string) {
    // set up plugin here
    this.pluginDir = currentFileDir(metaUrl);
    this.pluginInstanceId = uuidv4();
    this.customFolderPath = path.join(this.pluginDir, this.customFolderName);
  }

  setupEndpoints(server: any) {
    
  }

  modifyResourceConfig(adminforth: IAdminForth, resourceConfig: AdminForthResource) {
    this.adminforth = adminforth;
  }

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