<template>
  <div class="min-w-40">
    <div class="cursor-pointer flex items-center justify-between gap-1 block px-4 py-2 text-sm 
      bg-lightUserMenuItemBackground hover:bg-lightUserMenuItemBackgroundHover text-lightUserMenuItemText 
      hover:text-lightUserMenuItemText dark:bg-darkUserMenuItemBackground dark:hover:bg-darkUserMenuItemBackgroundHover 
      dark:text-darkUserMenuItemText dark:hover:darkUserMenuItemTextHover
      w-full select-none "
      @click="showDropdown = !showDropdown"
    >
        <span>{{ $t('Settings') }}</span>
        <IconCaretDownSolid class="h-5 w-5 text-lightPrimary dark:text-gray-400 opacity-50 transition duration-150 ease-in"
            :class="{ 'transform rotate-180': showDropdown }"
      />
    </div>

    <div v-if="showDropdown" >
      
      <router-link class="cursor-pointer flex items-center gap-1 block px-4 py-1 text-sm 
        bg-lightUserMenuItemBackground hover:bg-lightUserMenuItemBackgroundHover text-lightUserMenuItemText 
        hover:text-lightUserMenuItemText dark:bg-darkUserMenuItemBackground dark:hover:bg-darkUserMenuItemBackgroundHover 
        dark:text-darkUserMenuItemText dark:hover:darkUserMenuItemTextHover
        w-full text-select-none pl-5 select-none"
        v-for="option in options"
        :to="getRoute(option)"
      >
        <span class="mr-1">
          <component v-if="option.icon" :is="getIcon(option.icon)" class="w-5 h-5 transition duration-75" ></component>
        </span>
        <span>{{ option.pageLabel }}</span>
      </router-link>
    </div>

   
  </div>
</template>

<script setup lang="ts">
import { IconCaretDownSolid } from '@iconify-prerendered/vue-flowbite';
import { computed, ref, onMounted, watch } from 'vue';
import { useCoreStore } from '@/stores/core';
import { getIcon } from '@/utils';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const coreStore = useCoreStore();
const { t } = useI18n();

const showDropdown = ref(false);
const props = defineProps(['meta', 'resource']);

const options = computed(() => {
  return coreStore.config?.settingPages?.filter(page => page.isVisible).map((page) => {
    return {
      pageLabel: page.pageLabel,
      slug: page.slug || null,
      icon: page.icon || null,
    };
  });
});

function getRoute(option: { slug?: string | null, pageLabel: string }) {
  return {
    name: 'settings',
    params: { page: option.slug }
  }
}

</script>