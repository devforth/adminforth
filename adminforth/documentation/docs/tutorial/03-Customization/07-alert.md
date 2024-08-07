# Alerts and confirmations

When you are writing custom components or pages you might need to show alerts or confirmations to the user.

For example if fetch to the API fails you might want to show an error message to the user.

AdminForth has very simple [frontend API](/docs/api/types/FrontendAPI/interfaces/FrontendAPIInterface) for this.

To see an example of alerts, you can call them yourself.

Create a Vue component in the custom directory of your project, e.g. Alerts.vue:

```html title="./custom/Alerts.vue"
<template>
    <div class="buttons">
        <button @click="callAlert" class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Call alert</button>
        <button @click="callConfirmation" class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Confirmation</button>
    </div>
</template>
<script setup>
function callAlert(){
    window.adminforth.alert({message: 'Example alert', variant: 'success'})
};
async function callConfirmation(){
    const isConfirmed = await window.adminforth.confirm({message: 'Are you sure?', yes: 'Yes', no: 'No'})
}
</script>
<style>
    .buttons {
        margin-left: 30px;
        margin-top: 80px;
    }
</style>
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
![alt text](image-8.png)

And here is how confirmation looks:
![alt text](image-9.png)