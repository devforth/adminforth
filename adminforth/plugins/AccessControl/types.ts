
import { AllowedActionsEnum } from '../../types/AdminForthConfig.js';


export type PluginOptions = {
  /**
   * Called to check if user has access to a page
   * @param user - The user object
   * @param page - The page to check access for
   * @returns true if user has access, false or a string with an error message
   */
  hasAccess: (user: any, page: AllowedActionsEnum) => Promise<boolean | string>;
}