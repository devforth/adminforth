
import { AllowedActionsEnum, AdminUser } from '../../types/AdminForthConfig.js';


export type PluginOptions = {
  /**
   * Called to check if user has access to a page
   * Should return `true` if user has access. If user has no access, return `false` or a string with an error message
   * @param user - The user object
   * @param page - The page to check access for
   * @param meta - The meta object containing query for list/show or record for save/edit
   * @returns {boolean | string} - 
   */
  hasAccess: (user: AdminUser, page: AllowedActionsEnum, meta: any) => Promise<boolean | string>;
}