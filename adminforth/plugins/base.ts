import { AdminForthResource } from '../types/AdminForthConfig.js';
import AdminForth from '../index.js';

export default class AdminForthPlugin {

  adminforth: AdminForth;

  constructor(pluginOptions: any) {
    // set up plugin here
  }

  modifyResourceConfig(adminforth: AdminForth, resourceConfig: AdminForthResource) {
    this.adminforth = adminforth;
  }

}