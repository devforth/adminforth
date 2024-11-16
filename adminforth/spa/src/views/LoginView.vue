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
      class="overflow-y-auto flex flex-grow
      overflow-x-hidden z-50 min-w-[350px]  justify-center items-center md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative p-4 w-full max-h-full max-w-[400px]">
            <!-- Modal content -->
            <div class="relative bg-white rounded-lg shadow dark:bg-gray-700 dark:shadow-black" >
                <!-- Modal header -->
                <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                      Sign in to {{ coreStore.config?.brandName }}
                    </h3>
                </div>
                <!-- Modal body -->
                <div class="p-4 md:p-5">
                    <form class="space-y-4" @submit.prevent>
                        <div>
                            <label for="username" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your {{ coreStore.config?.usernameFieldName?.toLowerCase() }}</label>
                            <input type="username" name="username" id="username" 
                              ref="usernameInput"
                              @keydown.enter="passwordInput.focus()"
                              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="name@company.com" required />
                        </div>
                        <div class="relative">
                            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your password</label>
                            <input 
                              ref="passwordInput"
                              @keydown.enter="login"
                              :type="!showPw ? 'password': 'text'" name="password" id="password" placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" required />
                            <button type="button" @click="showPw = !showPw" class="absolute top-12 right-3 -translate-y-1/2 text-gray-400 dark:text-gray-300">
                              <IconEyeSolid class="w-5 h-5" v-if="!showPw" />
                              <IconEyeSlashSolid class="w-5 h-5" v-else />
                            </button>
                        </div>

                        <div v-if="coreStore.config.rememberMeDays" 
                            class="flex items-start mb-5"
                            :title="`Stay logged in for ${coreStore.config.rememberMeDays} days`"
                        >
                          <div class="flex items-center h-5">
                            <input id="remember" 
                              ref="rememberInput"
                              type="checkbox" 
                              value="" 
                              class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-lightPrimary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 checked:bg-lightPrimary checked:dark:bg-darkPrimary" /> 
                          </div>
                          <label for="remember" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Remember me</label>
                        </div>
                        
                        <component 
                          v-for="c in coreStore?.config?.loginPageInjections?.underInputs || []"
                          :is="getCustomComponent(c)"
                          :meta="c.meta"
                        />

                        <div v-if="error" class="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                          <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                          </svg>
                          <span class="sr-only">Info</span>
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
                          <span class="sr-only">Info</span>
                          <div v-html="coreStore.config?.loginPromptHTML"></div>
                        </div>
                        <Button @click="login" :loader="inProgress" :disabled="inProgress" class="w-full">
                          Login to your account
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
import { onMounted, ref, computed } from 'vue';
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
import { callAdminForthApi, loadFile } from '@/utils';
import { useRouter } from 'vue-router';
import Button from '@/afcl/Button.vue';

const passwordInput = ref(null);
const usernameInput = ref(null);
const rememberInput = ref(null);

const router = useRouter();
const inProgress = ref(false);

const coreStore = useCoreStore();
const user = useUserStore();

const showPw = ref(false);

const error = ref(null);

const backgroundPosition = computed(() => {
  return coreStore.config?.loginBackgroundPosition || '1/2';
});

onMounted(async () => {
    if (coreStore.config?.demoCredentials) {
      console.log('Setting demo credentials');
      const [username, password] = coreStore.config.demoCredentials.split(':');
      usernameInput.value.value = username;
      passwordInput.value.value = password;
    }
    usernameInput.value.focus();
});


async function login() {
  const username = usernameInput.value.value;
  const password = passwordInput.value.value;

  if (!username || !password) {
    return;
  }
  inProgress.value = true;
  const resp = await callAdminForthApi({
    path: '/login',
    method: 'POST',
    body: {
      username,
      password,
      rememberMe: rememberInput.value?.checked,
    }
  });
  inProgress.value = false;
  if (resp.error) {
    error.value = resp.error;
  } else if (resp.redirectTo) {
    router.push(resp.redirectTo);
  } else {
    error.value = null;
    await user.finishLogin();
  }
}


</script>