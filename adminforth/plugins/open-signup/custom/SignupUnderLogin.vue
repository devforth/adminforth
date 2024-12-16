<template>
  <p class="text-gray-500 dark:text-gray-400 font-sm text-left mt-3">
    {{$t('Have no account?')}} 
    <Link to="/signup">
      {{$t('sign up now')}}
    </Link>
  </p>
</template>

<script setup>
import Link from '@/afcl/Link.vue';

</script>