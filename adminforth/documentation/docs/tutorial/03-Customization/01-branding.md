# Branding and Theming

The first things you would probably like to change are the logo, favicon and the name of the application. 

First of all create directory named `custom` at the same level with your TypeScript/JavaScript index file. 

We will use this directory for all custom components. If you want to use other name then `custom`, use [customComponentsDir](https://adminforth.dev/docs/api/types/AdminForthConfig/type-aliases/AdminForthConfig#customizationcustomcomponentsdir)

Place your logo file into the `custom` directory e.g. (`logo.svg`)

Also place your favicon into the `custom` directory e.g. (`favicon.png`)

Then you can change the branding of the application in the configuration:

```ts title='./index.ts'

const admin = new AdminForth({
  ...
//diff-add
  customization: {
//diff-add
    brandName: 'My App',  // used in header
//diff-add
    title: 'My App Admin',  // used to set the title (HTML title tag in your pages)
//diff-add
    brandLogo: '@@/logo.svg',
//diff-add
    favicon: '@@/favicon.png',
//diff-add
  },
  ...
});
```

Please note that `@@/` is a special prefix which tells AdminForth to look for the file in the `custom` directory. 
You can use `@@/` prefix for all paths in the configuration and also import images like this in your custom components e.g.:

```ts
<template>
  <img src="@@/myFile.svg" alt="logo">
</template>
```

## Theming

AdminForth uses TailwindCSS for styling. By default both black and light thems the same as for Tailwind, but you able to customize the look of the application by changing the TailwindCSS configuration.

Use [styles.ts](https://github.com/devforth/adminforth/blob/main/adminforth/modules/styles.ts) file to see which variables are available for change.

Let's say your brand has a primary purple color and you wish to make side bar purple with white text.

In `index.ts` file set the `styles` property in the configuration:

```ts title='./index.ts'

const admin = new AdminForth({
  ...
//diff-add
  customization:{
//diff-add
    styles:{
//diff-add
      colors: {
//diff-add
        light: {
//diff-add
          sidebar: {main:'#571e58', text:'white'},
//diff-add
        },
//diff-add
      }
//diff-add
    } 
//diff-add
  },
  ...
});
```



## Square vs rounded buttons?

Not an issue, just change:

```ts title='./index.ts'
styles: {
//diff-add
  borderRadius: {
//diff-add
    "default": "0px"
//diff-add
  }
}
```

## Login background

Some why login background image matters.

For example you might want to get [free sweet background](https://unsplash.com/s/photos/secure?license=free) from Unsplash like
[Nate Watson's appartments view](https://images.unsplash.com/photo-1516501312919-d0cb0b7b60b8?q=80&w=3404&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D).

Download it to `custom` directory, and just set it in the configuration:


```ts title='./index.ts'
const admin = new AdminForth({
  ...
  auth: {
    ...
//diff-add
    loginBackgroundImage: '@@/photo-1516501312919-d0cb0b7b60b8.jpeg',
  },
  ...
});
```
Here is how it looks:
![alt text](<localhost_3500_resource_aparts (1).png>)