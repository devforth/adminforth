<template>
  <p class="text-gray-500 dark:text-gray-400 font-sm text-left mt-3">
    {{$t('Forgot password?')}} 
    <Link to="/reset-password">
      {{$t('reset it')}}
    </Link>
  </p>
</template>

<script setup>
import Link from '@/afcl/Link.vue';

</script>