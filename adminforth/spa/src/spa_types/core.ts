import type { AdminForthResource, AdminForthResourceColumn } from '../types/Back.js';

export type resourceById = {
    [key: string]: AdminForthResource;
}

export type Menu = {
    label: string,
    icon: string,
    resourceId: string,
    children?: Array<Menu>,
}

export type Record = {
    [key: string]: any;
}

export type ResourceColumns = {
    [key: string]: Array<AdminForthResourceColumn>;
}

export type CoreConfig = {
    brandName: string,
    singleTheme?: 'light' | 'dark',
    brandLogo: string,
    iconOnlySidebar: {
        logo?: string,
        enabled?: boolean,
    },
    title: string,
    datesFormat: string,
    timeFormat: string,
    usernameField: string,
    usernameFieldName?: string,
    auth?: {
        resourceId: string,
        usernameField: string,
        passwordHashField: string,
        loginBackgroundImage: string,
        loginBackgroundPosition: string,
        removeBackgroundBlendMode: boolean,
        userFullnameField: string,
    },
    emptyFieldPlaceholder?: {
        show?: string,
        list?: string,
    } | string,

    customHeadItems?: {
        tagName: string;
        attributes: { [key: string]: string | boolean };
    }[],
}


export type AllowedActions = {
    show: boolean,
    create: boolean,
    edit: boolean,
    delete: boolean,
}

