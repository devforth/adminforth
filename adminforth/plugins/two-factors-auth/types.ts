import { AdminUser } from "adminforth";

export type PluginOptions = {

    /**
     * Name of the field in the auth resource which will store 2FA secret. 
     *
     * Resource mandatory should have one columns which defined {@link AdminForthResourceColumn} which
     * name should be equal to the value .
     */
    twoFaSecretFieldName: string;

    /**
     * Optional function to filter users to apply 2FA.
     * Should return true if 2FA should be applied to the user and false if AdminForth should not challenge the user with 2FA.
     * @param adminUser 
     * @returns true if 2FA should be applied to the user and false if AdminForth should not challenge the user with 2FA.
     */
    usersFilterToApply?: (adminUser: AdminUser) => boolean;

    /**
     * Optional function to allow users to skip 2FA setup.
     * Should return true if the user should be allowed to skip the 2FA setup and false if AdminForth should require the user to set up 2FA.
     * @param adminUser 
     * @returns true if the user should be allowed to skip the 2FA setup and false if AdminForth should require the user to set up 2FA.
     */
    usersFilterToAllowSkipSetup?: (adminUser: AdminUser) => boolean;
}