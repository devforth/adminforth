<template>
    {{ getFlagEmojiFromIso(record.country) }}
 </template>
   
 <script setup>
   const props = defineProps(['record']);
   
   function getFlagEmojiFromIso(iso) {
      return iso?.toUpperCase()?.replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
   }
 </script>