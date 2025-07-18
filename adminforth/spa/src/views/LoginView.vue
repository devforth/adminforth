<template>
  <div class="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 relative w-screen h-screen"
    :style="coreStore.config?.loginBackgroundImage && backgroundPosition === 'over' ? {
      'background-image': 'url(' + loadFile(coreStore.config?.loginBackgroundImage) + ')',
      'background-size': 'cover',
      'background-position': 'center',
      'background-blend-mode': 'darken'
    }: {}"
  >
    
    <img v-if="coreStore.config?.loginBackgroundImage && backgroundPosition !== 'over'"
      :src="loadFile(coreStore.config?.loginBackgroundImage)"
      class="position-absolute top-0 left-0 h-screen object-cover w-0"
      :class="{
        '1/2': 'md:w-1/2',
        '1/3': 'md:w-1/3',
        '2/3': 'md:w-2/3',
        '3/4': 'md:w-3/4',  
        '2/5': 'md:w-2/5',
        '3/5': 'md:w-3/5',
      }[backgroundPosition]"
    />

    <!-- Main modal -->
    <div id="authentication-modal" tabindex="-1" 
      class="af-login-modal overflow-y-auto flex flex-grow
      overflow-x-hidden z-50 min-w-[350px]  justify-center items-center md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative p-4 w-full max-h-full max-w-[400px]">
            <!-- Modal content -->
            <div class="af-login-modal-content relative bg-white rounded-lg shadow dark:bg-gray-700 dark:shadow-black" >
                <!-- Modal header -->
                <div class="af-login-modal-header flex items-center justify-between flex-col p-4 md:p-5 border-b rounded-t dark:border-gray-600">

                    <template v-if="coreStore?.config?.loginPageInjections?.panelHeader.length > 0">
                      <component 
                        v-for="(c, index) in coreStore?.config?.loginPageInjections?.panelHeader || []"
                        :key="index"
                        :is="getCustomComponent(c)"
                        :meta="c.meta"
                      />
                    </template>
                    <h3 v-else class="text-xl font-semibold text-gray-900 dark:text-white">
                      {{ $t('Sign in to') }} {{ coreStore.config?.brandName }}
                    </h3>
                </div>
                <!-- Modal body -->
                <div class="af-login-modal-body p-4 md:p-5">
                    <form class="space-y-4" @submit.prevent>
                        <div>
                            <label for="username" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ $t('Your') }} {{ coreStore.config?.usernameFieldName?.toLowerCase() }}</label>
                            <Input 
                              v-model="username"
                              autocomplete="username"  
                              type="username" 
                              name="username" 
                              id="username" 
                              ref="usernameInput"
                              oninput="setCustomValidity('')"
                              @keydown.enter="passwordInput.focus()"
                              class="w-full"
                              placeholder="name@company.com" required />
                        </div>
                        <div class="">
                            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ $t('Your password') }}</label>
                            <Input 
                              v-model="password"
                              ref="passwordInput"
                              autocomplete="current-password"
                              oninput="setCustomValidity('')"
                              @keydown.enter="login"
                              :type="!showPw ? 'password': 'text'" name="password" id="password" placeholder="••••••••" class="w-full" required>
                              <template #rightIcon>
                                <button type="button" @click="showPw = !showPw" class="text-gray-400 dark:text-gray-300">
                                  <IconEyeSolid class="w-5 h-5" v-if="!showPw" />
                                  <IconEyeSlashSolid class="w-5 h-5" v-else />
                                </button>
                              </template>
                            </Input>
                        </div>

                        <div v-if="coreStore.config.rememberMeDays" 
                            class="flex items-start mb-5"
                            :title="$t(`Stay logged in for {days} days`, {days: coreStore.config.rememberMeDays})"
                        >
                          <Checkbox v-model="rememberMeValue" class="mr-2">
                            {{ $t('Remember me') }}
                          </Checkbox>
                          
                        </div>
                        
                        <component 
                          v-for="c in coreStore?.config?.loginPageInjections?.underInputs || []"
                          :is="getCustomComponent(c)"
                          :meta="c.meta"
                        />

                        <div v-if="error" class="af-login-modal-error flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                          <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                          </svg>
                          <span class="sr-only">{{ $t('Info') }}</span>
                          <div>
                            {{ error }}
                          </div>
                        </div>

                        <div v-if="coreStore.config?.loginPromptHTML"
                          class="flex items-center p-4 mb-4 text-sm text-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-400" role="alert"
                        >
                          <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                          </svg>
                          <span class="sr-only">{{ $t('Info') }}</span>
                          <div v-html="coreStore.config?.loginPromptHTML"></div>
                        </div>
                        <Button @click="login" :loader="inProgress" :disabled="inProgress" class="w-full">
                          {{ $t('Login to your account') }}
                        </Button>
                    </form>

                </div>
            </div>
        </div>
    </div> 

  </div>
</template>


<script setup>

import { getCustomComponent } from '@/utils';
import { onBeforeMount, onMounted, ref, computed } from 'vue';
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
import { callAdminForthApi, loadFile } from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import { Button, Checkbox, Input } from '@/afcl';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const passwordInput = ref(null);
const usernameInput = ref(null);
const rememberMeValue= ref(false);
const username = ref('');
const password = ref('');

const route = useRoute();
const router = useRouter();
const inProgress = ref(false);

const coreStore = useCoreStore();
const user = useUserStore();

const showPw = ref(false);

const error = ref(null);

const backgroundPosition = computed(() => {
  return coreStore.config?.loginBackgroundPosition || '1/2';
});

onBeforeMount(() => {
  if (localStorage.getItem('isAuthorized') === 'true') {
    // if route has next param, redirect
    coreStore.fetchMenuAndResource();
    if (route.query.next) {
      router.push(route.query.next.toString());
    } else {
      router.push({ name: 'home' });
    }
  }
})

onMounted(async () => {
    if (coreStore.config?.demoCredentials) {
      const [demoUsername, demoPassword] = coreStore.config.demoCredentials.split(':');
      username.value = demoUsername;
      password.value = demoPassword;
    }
    usernameInput.value.focus();
});


async function login() {
  
  if (!username.value) {
    usernameInput.value.setCustomValidity(t('Please fill out this field.'));
    return;
  }
  if (!password.value) {
    passwordInput.value.setCustomValidity(t('Please fill out this field.'));
    return;
  }

  if (inProgress.value) {
    return;
  }
  inProgress.value = true;
  const resp = await callAdminForthApi({
    path: '/login',
    method: 'POST',
    body: {
      username: username.value,
      password: password.value,
      rememberMe: rememberMeValue.value,
    }
  });
  if (resp.error) {
      error.value = resp.error;
  } else if (resp.redirectTo) {
    router.push(resp.redirectTo);
  } else {
    error.value = null;
    await user.finishLogin();
  }
  inProgress.value = false;

}


</script>