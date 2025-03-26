# Alerts and confirmations

When you are writing custom components or pages you might need to show alerts or confirmations to the user.

For example if fetch to the API fails you might want to show an error message to the user.

AdminForth has very simple [frontend API](/docs/api/FrontendAPI/interfaces/FrontendAPIInterface) for this.


## Alerts

To show an alert use `adminforth.alert` method:

```ts
import adminforth from '@/adminforth';

adminforth.alert({message: 'Hello world', variant: 'success'})
```

Next variants are supported:

* `success`
* `danger`
* `warning`
* `info`

## Confirmations

To show a confirmation dialog use `adminforth.confirm` method:

```ts
import adminforth from '@/adminforth';

const isConfirmed = await adminforth.confirm({message: 'Are you sure?', yes: 'Yes', no: 'No'})
```

## Ussage example

Create a Vue component in the custom directory of your project, e.g. `Alerts.vue`:

```html title="./custom/Alerts.vue"
<template>
    <div class="ml-3 mt-16">
        <Button @click="successAlert($t('Example success alert'))" class="bg-green-700 hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800" >
            {{$t('Call success alert')}}
        </Button>

        <Button @click="warningAlert($t('Example danger alert'))" class="bg-orange-500 hover:bg-orange-400 focus:ring-orange-100 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-900" >
            {{$t('Call warning alert')}}
        </Button>

        <Button @click="doConfirm" class="bg-red-700 hover:bg-red-800 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900" >
            {{$t('Call confirm dialog')}}
        </Button>
    </div>
</template>
<script setup>
import adminforth from '@/adminforth';
import { Button } from '@/afcl'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

function successAlert(message) {
    adminforth.alert({message, variant: 'success'})
};

function warningAlert(message) {
    adminforth.alert({message, variant: 'warning'})
};

async function doConfirm() {
    const isConfirmed = await adminforth.confirm({message: t('Are you sure?'), yes: t('Yes'), no: t('No')})
    if (isConfirmed){
        adminforth.alert({message: t('Confirmed'), variant: 'success'})
    } else {
        adminforth.alert({message: t('Not confirmed'), variant: 'warning'})
    }
}
</script>
```

Now let's add this page to the AdminForth menu:

```html title="/index.ts"
menu: [
//diff-add
{
//diff-add
    label: 'Alerts',
//diff-add
    icon: 'flowbite:bell-active-alt-solid',
//diff-add
    component: '@@/Alerts.vue',
//diff-add
    path: '/alerts'
//diff-add
}
```

Here is how alert looks:
![alt text](image-12.png)

And here is how confirmation looks:
![alt text](<Alerts and confirmations2.png>)

## Announcement


You can notify users of important information by displaying an announcement badge in side bar:

```ts title="/index.ts"

  customization: {
//diff-add
    announcementBadge: (adminUser: AdminUser) => {
//diff-add
      return { 
//diff-add
        html: '⭐ <a href="https://github.com/devforth/adminforth" style="font-weight: bold; text-decoration: underline" target="_blank">Star us on GitHub</a> to support a project!',
//diff-add
        closable: true,
//diff-add
        title: 'Support us for free',
//diff-add
      }
//diff-add
    }
  },
```

Here's what the announcement will look like:
![alt text](image-11.png)