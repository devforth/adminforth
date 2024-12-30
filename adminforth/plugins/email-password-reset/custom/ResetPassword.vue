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
                      {{$t('Reset your password on')}} {{ coreStore.config?.brandName }}
                    </h3>
                </div>
                <!-- Modal body -->
                <div class="p-4 md:p-5">
                  <form v-if="enteringNew" class="space-y-4" role="alert" @submit.prevent>
                    <div class="relative">
                      <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{$t('New password')}}</label>
                      <input 
                        :type="unmasked ? 'text' : 'password'"
                        name="password" id="password"
                        autocomplete="new-password"
                        v-model="password"
                        @keydown.enter="passwordConfirmationInput.focus()"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" 
                        :placeholder="$t('New password')" required 
                      />
                      
                      <button
                        type="button"
                        @click="unmasked = !unmasked"
                        class="h-6 absolute inset-y-2 top-9 right-1 flex items-center pr-2 z-index-100 focus:outline-none"
                      >
                        <IconEyeSolid class="w-6 h-6 text-gray-400"  v-if="!unmasked" />
                        <IconEyeSlashSolid class="w-6 h-6 text-gray-400" v-else />
                      </button>
                    </div>

                    <div class="relative">
                      <label for="password_confirmation" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{$t('Confirm new password')}}</label>
                      <input 
                        :type="unmasked ? 'text' : 'password'"
                        name="password_confirmation" id="password_confirmation" 
                        autocomplete="new-password"
                        v-model="passwordConfirmation"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" 
                        :placeholder="$t('Confirm new password')" required 
                      />

                      <button
                        type="button"
                        @click="unmasked = !unmasked"
                        class="h-6 absolute inset-y-2 top-9 right-1 flex items-center pr-2 z-index-100 focus:outline-none"
                      >
                        <IconEyeSolid class="w-6 h-6 text-gray-400"  v-if="!unmasked" />
                        <IconEyeSlashSolid class="w-6 h-6 text-gray-400" v-else />
                      </button>
                    </div>

                    <div v-if="validationError || error" class="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                      <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                      </svg>
                      <span class="sr-only">{{$t('Info')}}</span>
                      <div>
                        {{ validationError || error }}
                      </div>
                    </div>

                    <button
                      :disabled="inProgress || (validationRunning && validationError)"
                      @click="setNewPassword"
                      type="submit" class="flex items-center justify-center gap-1 w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50">
                      <svg v-if="inProgress"
                        aria-hidden="true" class="w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874
// 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
                        {{$t('Set new password')}}
                    </button>
                  </form>
<!-- END of set new paasord -->
                  <div v-if="!enteringNew && requestSent" class="flex items center justify-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-800 dark:text-green-400" role="alert">
                    {{$t('If user with specified email exists in our db, then request was sent. Please check your email at')}} {{ sentToEmail }} {{$t('to reset your password.')}}
                  </div>

                  <form v-if="!enteringNew && !requestSent" class="space-y-4" @submit.prevent>
                    <div>
                      <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{$t('Your email')}}</label>
                      <input type="email" name="email" id="email" 
                        @keydown.enter="reset()"
                        ref="emailInput"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" 
                        placeholder="name@company.com" 
                        required
                      />
                    </div>
                  
                    <div v-if="error" class="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                      <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                      </svg>
                      <span class="sr-only">{{$t('Info')}}</span>
                      <div>
                        {{ error }}
                      </div>
                    </div>

                    <Button 
                      :loader="inProgress"
                      :disabled="inProgress"
                      @click="reset"
                      class="w-full">
                      {{$t('Reset Password')}}
                    </Button>

                    <p class="text-gray-500 dark:text-gray-400 font-sm text-right mt-3">
                      {{$t('or')}} <Link to="/login">{{$t('Back to login')}}</Link>
                    </p>

                  </form>

                </div>
            </div>
        </div>
    </div> 

  </div>
</template>


<script setup lang="ts">

import { onMounted, ref, computed, Ref } from 'vue';
import { useCoreStore } from '@/stores/core';
import { callAdminForthApi, loadFile, applyRegexValidation } from '@/utils';
import { useRoute, useRouter } from 'vue-router';
import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
import Button from '@/afcl/Button.vue';
import Link from '@/afcl/Link.vue';
import adminforth from '@/adminforth';

const inProgress = ref(false);

const coreStore = useCoreStore();
const requestSent = ref(false);

const emailInput = ref(null);
const password = ref("");
const passwordConfirmation = ref("");
const unmasked = ref(false);
const sentToEmail: Ref<string> = ref('');


const route = useRoute();
const router = useRouter();

function checkPassowrd() {

  if (!password.value || !passwordConfirmation.value) {
    return 'Please enter both password and password confirmation';
  }
  if (password.value !== passwordConfirmation.value) {
    return 'Passwords do not match';
  }

  if (password.value.length < passwordField.value.minLength) {
    return `Password must be at least ${passwordField.value.minLength} characters long`;
  }

  if (password.value.length > passwordField.value.maxLength) {
    return `Password must be at most ${passwordField.value.maxLength} characters long`;
  }

  if (passwordField.value.validation) {
    const valError = applyRegexValidation(password.value, passwordField.value.validation);
    if (valError) {
      return valError;
    }
  }

  return null;
}

const validationRunning = ref(false);

const validationError = computed(() => {
  console.log('validationRunning.value', validationRunning.value, 'aa', checkPassowrd());
  if (validationRunning.value) {
    return checkPassowrd();
  }
  return null;
});

const error = ref(null);

// if token query param is present, we are entering new password
const enteringNew = computed(() => route.query.token);

const backgroundPosition = computed(() => {
  return coreStore.config?.loginBackgroundPosition || '1/2';
});

const passwordField = computed(
  () => route.meta.passwordField
)

onMounted(async () => {
  await coreStore.getPublicConfig();
});

async function reset() {
  error.value = null;
  const email = emailInput.value.value;
  if (!email) {
    error.value = 'Please enter your email';
    return;
  }

  inProgress.value = true;
  const resp = await callAdminForthApi({
    path: `/plugin/${route.meta.pluginInstanceId}/reset-password`,
    method: 'POST',
    body: {
      email,
      url: window.location.origin + window.location.pathname,
    }
  });
  inProgress.value = false;
  if (resp.error) {
    error.value = resp.error;
  } else {
    error.value = null;
    requestSent.value = true;
    sentToEmail.value = email;
  }
}

async function setNewPassword() {
  error.value = null;
  
  if (checkPassowrd()) {
    validationRunning.value = true;
    return;
  }

  inProgress.value = true;
  const resp = await callAdminForthApi({
    path: `/plugin/${route.meta.pluginInstanceId}/reset-password-confirm`,
    method: 'POST',
    body: {
      token: route.query.token,
      password: password.value,
    }
  });
  inProgress.value = false;
  if (resp.error) {
    error.value = resp.error;
  } else {
    error.value = null;
    router.push('/login');
    adminforth.alert({
      message: 'Password reset successfully. Please login with your new password',
      variant: 'success',
      timeout: 15,
    });

  }
}


</script>