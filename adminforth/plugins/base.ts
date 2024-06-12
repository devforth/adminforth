import { AdminForthResource, AdminForthPluginType, AdminForthClass } from '../types/AdminForthConfig.js';
import { getComponentNameFromPath } from '../modules/utils.js';
import { currentFileDir } from '../modules/utils.js';
import path from 'path';
import fs from 'fs';

export default class AdminForthPlugin implements AdminForthPluginType {

  adminforth: AdminForthClass;
  pluginDir: string;
  customFolderName: string = 'custom';

  constructor(pluginOptions: any, metaUrl: string) {
    // set up plugin here
    this.pluginDir = currentFileDir(metaUrl);
  }

  modifyResourceConfig(adminforth: AdminForthClass, resourceConfig: AdminForthResource) {
    this.adminforth = adminforth;
  }

  componentPath(componentFile: string) {
    const key = `@@/plugins/${this.constructor.name}/${componentFile}`;
    const componentName = getComponentNameFromPath(key);

    const absSrcFolder = path.join(this.pluginDir, this.customFolderName);

    if (!this.adminforth.codeInjector.srcFoldersToSync[absSrcFolder]) {
      this.adminforth.codeInjector.srcFoldersToSync[absSrcFolder] = `./plugins/${this.constructor.name}/`;
    }
    
    if (!this.adminforth.codeInjector.allComponentNames[key]) {
      const absSrcPath = path.join(absSrcFolder, componentFile);
      if (!fs.existsSync(absSrcPath)) {
        throw new Error(`Plugin "${this.constructor.name}" tried to use file as component which does not exist at "${absSrcPath}"`);
      }
      this.adminforth.codeInjector.allComponentNames[key] = componentName;
    }

    return key;
  }

}