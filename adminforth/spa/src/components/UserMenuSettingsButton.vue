<template>
  <div class="min-w-40">
    <div class="cursor-pointer flex items-center gap-1 block px-4 py-2 text-sm text-black 
      hover:bg-html dark:text-darkSidebarTextHover dark:hover:bg-darkSidebarItemHover dark:hover:text-darkSidebarTextActive 
      w-full select-none	"
      :class="{ 'bg-black bg-opacity-10	': showDropdown }"
      @click="showDropdown = !showDropdown"
    >
      <span>Settings</span>
      <IconCaretDownSolid class="h-5 w-5 text-lightPrimary dark:text-gray-400 opacity-50 transition duration-150 ease-in"
          :class="{ 'transform rotate-180': showDropdown }"
      />
    </div>

    <div v-if="showDropdown" >
      
      <div class="cursor-pointer flex items-center gap-1 block px-4 py-1 text-sm 
        text-black dark:text-darkSidebarTextHover
        bg-black bg-opacity-10	
        hover:brightness-110
        hover:text-lightPrimary dark:hover:text-darkPrimary
        hover:bg-lightPrimaryContrast dark:hover:bg-darkPrimaryContrast
        w-full text-select-none pl-5 select-none"
        v-for="option in options"
        @click="navigateTo(option)"
      >
        <span class="mr-1">
          <component v-if="option.icon" :is="getIcon(option.icon)" class="w-5 h-5 transition duration-75" ></component>
        </span>
        <span class="text-gray-900 dark:text-white">{{ option.pageLabel }}</span>
      </div>
    </div>

   
  </div>
</template>

<script setup lang="ts">
import 'flag-icon-css/css/flag-icons.min.css';
import { IconCaretDownSolid } from '@iconify-prerendered/vue-flowbite';
import { computed, ref, onMounted, watch } from 'vue';
import { useCoreStore } from '@/stores/core';
import { getIcon } from '@/utils';
import { useRouter } from 'vue-router';

const router = useRouter();
const coreStore = useCoreStore();

const showDropdown = ref(false);
const props = defineProps(['meta', 'resource']);

const options = computed(() => {
  console.log('Returning setting pages', coreStore.config?.settingPages);
  return coreStore.config?.settingPages?.map((page) => {
    return {
      pageLabel: page.pageLabel,
      slug: page.slug || null,
      icon: page.icon || null,
    };
  });
});

function slugifyString(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-');
}

function navigateTo(option: { slug?: string | null | undefined, pageLabel: string }) {
  console.log('Navigating to option', option);
  if (option.slug) {
    console.log('Navigating to settings page', option.slug);
    router.push({ name: 'settings', query: { page: option.slug } });
  } else {
    const destinationSlug = slugifyString(option.pageLabel);
    console.log('Navigating to settings page by label', destinationSlug);
    router.push({ name: 'settings', params: { page: destinationSlug } });
  }
}

</script>