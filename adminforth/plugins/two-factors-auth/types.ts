export type PluginOptions = {

    /**
     * Name of the field in the auth resource which will store 2FA secret. 
     *
     * Resource mandatory should have one columns which defined {@link AdminForthResourceColumn} which
     * name should be equal to the value .
     */
    twoFaSecretFieldName: string;
}