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
                      {{$t('Sign up into')}} {{ coreStore.config?.brandName }}
                    </h3>
                </div>
                <!-- Modal body -->
                <div class="p-4 md:p-5">
                  <form v-if="!requestSent" class="space-y-4" role="alert" @submit.prevent>
                    <div v-if="!verifyToken" class="relative">
                      <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{$t('Your email address')}}</label>
                      <input type="email" name="email" id="email" 
                        tabindex="1"
                        autocomplete="username"  
                        @keydown.enter="passwordInput?.focus()"
                        ref="emailInput"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" 
                        placeholder="name@company.com" 
                        required
                      />
                    </div>
                    <div v-if="isPasswordNeeded" class="relative">
                      <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{$t('Your password')}}</label>
                      <input 
                        tabindex="2"
                        autocomplete="new-password"
                        ref="passwordInput"
                        :type="unmasked ? 'text' : 'password'"
                        name="password" id="password" 
                        v-model="password"
                        @keydown.enter="passwordConfirmationInput?.focus()"
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

                    <div v-if="isPasswordNeeded" class="relative">
                      <label for="password_confirmation" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{$t('Confirm your password')}}</label>
                      <input 
                        ref="passwordConfirmationInput"
                        autocomplete="new-password"
                        :type="unmasked ? 'text' : 'password'"
                        name="password_confirmation" id="password_confirmation" 
                        tabindex="3"
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

                    <Button
                      :disabled="inProgress || (validationRunning && validationError)"
                      @click="() => verifyToken ? signupAfterEmailConfirmation() : doSignup()"
                      type="submit"
                      class="w-full"
                      :loader="inProgress"
                    >
                      {{$t('Sign up')}}
                    </Button>
                  </form>
<!-- END of set new paasord -->
                  <div v-else class="flex items center justify-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-800 dark:text-green-400" role="alert">
                    {{$t('Please check your email at')}} {{ sentToEmail }} {{$t('to confirm your email address.')}}
                  </div> 
                  <p class="text-gray-500 dark:text-gray-400 font-sm text-right mt-3">
                      {{$t('Already have an account?')}} <Link :to="`/login${route.query.next ? `?next=${encodeURIComponent(route.query.next)}` : ''}`">{{ $t('login here') }}</Link>
                  </p>
                </div>
            </div>
        </div>
    </div> 

  </div>
</template>


<script setup lang="ts">
import { onMounted, ref, computed, Ref, onBeforeMount, nextTick } from 'vue';
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { callAdminForthApi, loadFile, applyRegexValidation } from '@/utils';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
import Button from '@/afcl/Button.vue';
import Link from '@/afcl/Link.vue';
import { useI18n } from 'vue-i18n';
import adminforth from '@/adminforth';

const { t } = useI18n();

const inProgress = ref(false);

const coreStore = useCoreStore();
const requestSent = ref(false);

const emailInput: Ref<HTMLInputElement | null> = ref(null);
const passwordInput: Ref<HTMLInputElement | null> = ref(null);
const passwordConfirmationInput: Ref<HTMLInputElement | null> = ref(null);

const password = ref("");
const passwordConfirmation = ref("");
const unmasked = ref(false);
const sentToEmail: Ref<string> = ref('');

const requestEmailConfirmation = computed(() => route.meta.requestEmailConfirmation);
const verifyToken = computed(() => route.query.token);
const isPasswordNeeded = computed(() => !requestEmailConfirmation.value || (requestEmailConfirmation.value && verifyToken.value));

const user = useUserStore();

const route = useRoute();
const router = useRouter();

function checkPassword() {

  if (!password.value || !passwordConfirmation.value) {
    return t('Please enter both password and password confirmation');
  }
  if (password.value !== passwordConfirmation.value) {
    return t('Passwords do not match');
  }

  if (!passwordConstraints.value) {
    return null;
  }
  if (password.value.length < passwordConstraints.value.minLength) {
    return t(`Password must be at least {minLength} characters long`, { minLength: passwordConstraints.value.minLength });
  }

  if (password.value.length > passwordConstraints.value.maxLength) {
    return t(`Password must be at most {maxLength} characters long`, { maxLength: passwordConstraints.value.maxLength });
  }

  if (passwordConstraints.value.validation) {
    const valError = applyRegexValidation(password.value, passwordConstraints.value.validation);
    if (valError) {
      return valError;
    }
  }

  return null;
}

const validationRunning = ref(false);

const validationError = computed(() => {
  if (validationRunning.value) {
    return checkPassword();
  }
  return null;
});

const error: Ref<string | null> = ref(null);


const backgroundPosition = computed(() => {
  return coreStore.config?.loginBackgroundPosition || '1/2';
});


const passwordConstraints: Ref<{
  minLength: number;
  maxLength: number;
  validation: string;
}> = ref({
  minLength: 8,
  maxLength: 100,
  validation: '',
});

// implement something similar to beforeEnter
// beforeEnter: async (to, from, next) => {
//         if(localStorage.getItem('isAuthorized') === 'true') {
//           // check if url has next=... and redirect to it
//           console.log('to.query', to.query)
//           if (to.query.next) {
//             next(to.query.next.toString())
//           } else {
//             next({name: 'home'});
//           }
//         } else {
//           next()
//         }
//       } 

onBeforeMount(() => {
  // console.log('⛔ SignUp Page. Before Mount: ', route)
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
  emailInput.value?.focus();
  await coreStore.getPublicConfig();

  await nextTick();
  await router.isReady();

  // getPasswordConstraints
  console.log('⛔ SignUp Page. Before Mount: ', route.meta)
  passwordConstraints.value = await callAdminForthApi({
    path: `/plugin/${route.meta.pluginInstanceId}/password-constraints`,
    method: 'GET',
  });
})

// onMounted(async () => {
// });

async function doSignup() {
  error.value = null;
  const email = emailInput.value!.value;
  if (!email) {
    error.value = t('Please enter your email');
    return;
  }
  if (!requestEmailConfirmation.value && checkPassword()) {
    validationRunning.value = true;
    return;
  }

  inProgress.value = true;
  const resp = await callAdminForthApi({
    path: `/plugin/${route.meta.pluginInstanceId}/signup`,
    method: 'POST',
    body: {
      email,
      url: window.location.origin + window.location.pathname,
      ...(!requestEmailConfirmation.value ? {password: password.value} : {}),
    }
  });
  inProgress.value = false;
  if (resp.error) {
    error.value = resp.error;
  } else {
    error.value = null;
    requestSent.value = true;
    sentToEmail.value = email;
    if (resp.redirectTo && !requestEmailConfirmation.value) {
      router.push(resp.redirectTo);
    } else if (!requestEmailConfirmation.value) {
      error.value = null;
      await user.finishLogin();
    }
  }
}

const signupAfterEmailConfirmation = async () => {
  if (checkPassword()) {
    validationRunning.value = true;
    return;
  }
  const resp = await callAdminForthApi({
      path: `/plugin/${route.meta.pluginInstanceId}/complete-verified-signup`,
      method: 'POST',
      body: {
        token: verifyToken.value,
        password: password.value,
      }
    });
    if (resp.error) {
      adminforth.alert({
        message: t(`Error fetching data: {error}`, { error: resp.error }),
        variant: 'danger',
      });
    } else if (resp.redirectTo) {
      router.push(resp.redirectTo);
    } else {
      await user.finishLogin();
    }
}
</script>