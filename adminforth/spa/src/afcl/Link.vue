<template>
  <router-link 
    v-bind="$attrs"
    class="text-lightPrimary underline dark:text-darkPrimary hover:no-underline hover:brightness-110
      cursor-pointer"
  >
    <slot></slot>
  </router-link>
</template>