import { AdminForth } from '../core/adminforth';


export default class AdminForthPlugin {

  adminforth: AdminForth;

  constructor(pluginOptions: any) {
    // set up plugin here
  }

  modifyResourceConfig(adminforth: AdminForth, resourceConfig: AdminForthResource) {
    this.adminforth = adminforth;
  }

}