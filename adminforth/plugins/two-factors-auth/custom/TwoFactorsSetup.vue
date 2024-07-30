<template>
  <div class="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800"
    :style="coreStore.config?.loginBackgroundImage ? {
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
                  <div class="m-3" >Scan this QR code with your authenticator app or open by <a class="text-blue-600" :href="totpUri">click</a></div>
                  <div class="flex justify-center m-3" >
                      <img :src="totpQrCode" alt="QR code" />
                  </div>
                  <div class="m-3 ">
                      <div class="m-1">Or copy this code to app manually:</div>
                      <div class="w-full max-w-[46rem]">
                          <div class="relative">
                              <label for="npm-install-copy-text" class="sr-only">Label</label>
                              <input id="npm-install-copy-text" type="text" class="col-span-10 bg-gray-50 border border-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-4 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" :value="totp.newSecret" disabled readonly>
                              <button data-copy-to-clipboard-target="npm-install-copy-text" class="absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg py-2 px-2.5 inline-flex items-center justify-center bg-white border-gray-200 border">
                                  <span id="default-message" class="inline-flex items-center">
                                      <svg class="w-3 h-3 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20">
                                          <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z"/>
                                      </svg>
                                      <span @click="onCopyClick" class="text-xs font-semibold">Copy</span>
                                  </span>
                                  <span id="success-message" class="hidden inline-flex items-center">
                                      <svg class="w-3 h-3 text-blue-700 dark:text-blue-500 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12">
                                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/>
                                      </svg>
                                      <span class="text-xs font-semibold text-blue-700 dark:text-blue-500">Copied</span>   
                                  </span>
                              </button>
                          </div>
                      </div>
                  </div>
                  <Vue2FACodeInput v-model="code"/>
                  <button @click="()=>{router.push('./login')}" class="flex items-center justify-center gap-1 w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Cancel</button>      
              </div>
          </div>
      </div>
  </div>
    
    </div>
     

</template>


<script setup>

import { onMounted, ref, watchEffect,computed,watch } from 'vue';
import { useCoreStore } from '@/stores/core';
import { useUserStore } from '@/stores/user';
import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
import { callAdminForthApi, loadFile } from '@/utils';
import { useRouter } from 'vue-router';
import { showErrorTost } from '@/composables/useFrontendApi';
import Vue2FACodeInput from '@loltech/vue3-2fa-code-input';

const code = ref(null);

const router = useRouter();
const inProgress = ref(false);

const coreStore = useCoreStore();
const user = useUserStore();

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
  window.adminforth.alert({message: 'Copied to clipboard', variant: 'success'})
}

watch(code, async (nv)=>{
    if (nv){
      sendCode();
    }
  })

onMounted(async () => {
  coreStore.getPublicConfig()
  const resp = await callAdminForthApi({
    path: '/plugin/twofa/initSetup',
    method: 'POST',});
  if (resp && resp.totpJWT){
    totpJWT.value = resp.totpJWT;
  } 
  

  totp.value=parseJwt(totpJWT.value);


});

async function sendCode () {
  inProgress.value = true;
  const resp = await callAdminForthApi({
    method: 'POST',
    path: '/plugin/twofa/confirmSetup',
    body: {
      code: code.value,
      secret: totp.value.newSecret,
    }
  })
  if (resp.allowedLogin){
    await user.finishLogin()
  } else {
    showErrorTost('Invalid code');
  }
}
</script>
