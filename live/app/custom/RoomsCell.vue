<template>
  <div class="flex items-center">
    <span v-for="room in record.number_of_rooms">
      🟨
    </span>
      
    {{ record.square_meter }} m²
  </div>
</template>

<script setup>
defineProps({
  record: Object
});
</script>