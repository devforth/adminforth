export type PluginOptions = {
    /**
     * Id of the resource to be ignored from audit log.
    */
    excludeResourceIds?: string[];
    /**
     * Mappping of columns for audit log table.
    */
    resourceColumns: {
        /** 
         * Should be name of column were plugin will store resourceId.
         * Column should be of type string.
        */
        resourceIdColumnName: string

        /** 
         * Should be name of column were plugin will store action.
         * Column should be of type string.
        */
        resourceActionColumnName: string

        /** 
         * Should be name of column were plugin will store data.
         * Column should be of type string.
        */
        resourceDataColumnName: string

        /** 
         * Should be name of column were plugin will store user id.
         * Column should be same type as type of column where user id is stored.
         * E.g. is user id is stored as UUID, then this column should be of type UUID.
        */
        resourceUserIdColumnName: string

        resourceRecordIdColumnName: string

        resourceCreatedColumnName: string
        
        resourceIpColumnName?: string
    }

}