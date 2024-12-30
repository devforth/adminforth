<template>
  <div class="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800"
    :style="coreStore.config?.loginBackgroundImage && coreStore.config?.loginBackgroundPosition === 'over' ? {
      'background-image': 'url(' + loadFile(coreStore.config?.loginBackgroundImage) + ')',
      'background-size': 'cover',
      'background-position': 'center',
      'background-blend-mode': 'darken'
    }: {}"
    >

    <div id="authentication-modal" tabindex="-1" class=" overflow-y-auto overflow-x-hidden z-50 min-w-[00px] justify-center items-center md:inset-0 h-[calc(100%-1rem)] max-h-full">
      <div class="relative p-4 w-full max-w-md max-h-full">
          <!-- Modal content -->
          <div class="relative bg-white rounded-lg shadow dark:bg-gray-700 dark:shadow-black text-gray-500" >
              <div class="p-8 w-full max-w-md max-h-full" >
                  <div class="m-3" >{{$t('Scan this QR code with your authenticator app or open by')}} <a class="text-blue-600" :href="totpUri">{{$t('click')}}</a></div>
                  <div class="flex justify-center m-3" >
                      <img :src="totpQrCode" alt="QR code" />
                  </div>
                  <div class="m-3 ">
                      <div class="m-1">{{$t('Or copy this code to app manually:')}}</div>
                      <div class="w-full max-w-[46rem]">
                          <div class="relative">
                              <label for="npm-install-copy-text" class="sr-only">{{$t('Label')}}</label>
                              <input id="npm-install-copy-text" type="text" class="col-span-10 bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-4 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 pr-12" :value="totp.newSecret" readonly>
                              <button @click="onCopyClick" data-copy-to-clipboard-target="npm-install-copy-text" class="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg py-2 px-2.5 inline-flex items-center justify-center bg-white border-gray-200 border">
                                  <span id="default-message" class="inline-flex items-center">
                                      <svg class="w-3 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                                          <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z"/>
                                      </svg>
                                  </span>
                              </button>
                          </div>
                      </div>
                  </div>
                  <div class="my-4 flex justify-center items-center">
                    <v-otp-input
                      ref="code"
                      input-classes="bg-gray-50 text-center flex justify-center otp-input  border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-10 h-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                      :conditionalClass="['one', 'two', 'three', 'four', 'five', 'six']"
                      inputType="number"
                      :num-inputs="6"
                      :should-auto-focus="true"
                      :should-focus-order="true"
                      @on-complete="handleOnComplete"
                    />
                  </div>
                  <!-- <Vue2FACodeInput v-model="code" autofocus /> -->
                   <div class="flex flex-row gap-2.5">
                  <LinkButton to="/login" class="w-full">
                    {{$t('Back to login')}}
                  </LinkButton>
                  <Button v-if="skipAllowed" @click="handleSkip" class="w-full">
                    {{$t('Skip for now')}}
                  </Button>
                </div>
              </div>
          </div>
      </div>
  </div>
</div>
     

</template>


<script setup lang="ts">

import { onMounted, onBeforeUnmount,  ref, watchEffect,computed,watch } from 'vue';
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
import { callAdminForthApi, loadFile } from '@/utils';
import { useRouter } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi';
import { Button, LinkButton } from '@/afcl';
import Vue2FACodeInput from '@loltech/vue3-2fa-code-input';
import VOtpInput from "vue3-otp-input";
import adminforth from '@/adminforth';


const code = ref(null);
const handleOnComplete = (value) => {
  sendCode(value);
};

const router = useRouter();
const inProgress = ref(false);

const coreStore = useCoreStore();
const user = useUserStore();

const skipAllowed = ref(false);

// use this simple function to automatically focus on the next input

const showPw = ref(false);

const error = ref(null);
const totp = ref({});
const totpJWT = ref(null);
const totpUri = computed(() => {
  if (totp.value) {
    return `otpauth://totp/${totp.value.issuer}:${totp.value.userName}?secret=${totp.value.newSecret}&issuer=${totp.value.issuer}`;
  }});
const totpQrCode = computed(() => {
  if (totpUri.value) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri.value)}`;
  }});
  
function parseJwt(token) {
  // Split the token into its parts
  const base64Url = token.split('.')[1];
  
  // Base64-decode the payload
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  
  // Parse the JSON payload
  return JSON.parse(jsonPayload);
} 

function onCopyClick(){
  navigator.clipboard.writeText(totp.value.newSecret);
  adminforth.alert({message: 'Copied to clipboard', variant: 'success'})
}

onMounted(async () => {
  coreStore.getPublicConfig()
  const resp = await callAdminForthApi({
    path: '/plugin/twofa/initSetup',
    method: 'POST',});
  if (resp && resp.totpJWT){
    totpJWT.value = resp.totpJWT;
  } 
  
  totp.value=parseJwt(totpJWT.value);
  
  const allowSkipResp = await callAdminForthApi({
    path: '/plugin/twofa/skip-allow',
    method: 'GET',
  });

  if (allowSkipResp?.skipAllowed){
    skipAllowed.value = true;
  }

  window.addEventListener('paste', handlePaste);
});

onBeforeUnmount(() => {
  window.removeEventListener('paste', handlePaste);
});

async function sendCode (value) {
  inProgress.value = true;

  
  const resp = await callAdminForthApi({
    method: 'POST',
    path: '/plugin/twofa/confirmSetup',
    body: {
      code: value,
      secret: totp.value.newSecret,
    }
  })
  if (resp.allowedLogin){
    await user.finishLogin()
  } else {
    showErrorTost('Invalid code');
  }
}


function handlePaste(event) {
  event.preventDefault();
  if (event.target.classList.contains('otp-input')) {
    return;
  }
  const pastedText = event.clipboardData?.getData('text') || '';
  if (pastedText.length === 6) { 
    code.value?.fillInput(pastedText);
  }
}

const handleSkip = async () => {
  const resp = await callAdminForthApi({
    method: 'POST',
    path: '/plugin/twofa/confirmSetup',
    body: {
      skip: true,
    }
  });
  if (resp.allowedLogin){
    await user.finishLogin()
  } else {
    showErrorTost('Something went wrong');
  }
}
</script>
<style>
.otp-input {
  margin: 0 5px;
}
</style>