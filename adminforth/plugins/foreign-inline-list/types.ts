
import { AdminForthResource } from 'adminforth';

export type PluginOptions = {

  /** 
   * Id of the resource to be displayed in the inline list.
   * 
   * Resource mandatory should have one columns which defined {@link AdminForthResourceColumn.foreignResource} which
   * should be equal to the resourceId of the resource where plugin is used.
   */
  foreignResourceId: string;

  /**
   * Function to modify the resource config of the table.
   * Can be used to define list of columns visible in the inline list.
   * Or modify listPageSize
   * 
   * @param resourceConfig - Resource config of the table.
   */
  modifyTableResourceConfig?: (resourceConfig: AdminForthResource) => void;
}