<template>
  <DropdownMenuAccordion v-if="options && options.length" :label="$t('Settings')" :triggerClass="USER_MENU_ITEM_CLASSES">
    <DropdownMenuItem
      v-for="option in options"
      :key="option.slug ?? option.pageLabel"
      :to="getRoute(option)"
      :class="USER_MENU_ITEM_CLASSES"
    >
      <template v-if="option.icon" #icon>
        <component :is="getIcon(option.icon)" />
      </template>
      {{ option.pageLabel }}
    </DropdownMenuItem>
  </DropdownMenuAccordion>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DropdownMenuAccordion, DropdownMenuItem } from '@/afcl';
import { USER_MENU_ITEM_CLASSES } from '@/utils/userMenu';
import { useCoreStore } from '@/stores/core';
import { getIcon } from '@/utils';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const coreStore = useCoreStore();
const { t } = useI18n();

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