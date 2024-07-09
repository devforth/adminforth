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
                    <div class="m-3" >Please enter your authenticator code </div>
                    
                    <form class="max-w-sm mx-auto mt-6 flex flex-col items-center ">
                        <div class="flex mb-2 space-x-2 rtl:space-x-reverse  ">
                            <div>
                                <label for="code-1" class="sr-only">First code</label>
                                <input type="text" maxlength="1" data-focus-input-init data-focus-input-next="code-2" id="code-1" class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
                            </div>
                            <div>
                                <label for="code-2" class="sr-only">Second code</label>
                                <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-1" data-focus-input-next="code-3" id="code-2" class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
                            </div>
                            <div>
                                <label for="code-3" class="sr-only">Third code</label>
                                <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-2" data-focus-input-next="code-4" id="code-3" class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
                            </div>
                            <div>
                                <label for="code-4" class="sr-only">Fourth code</label>
                                <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-3" data-focus-input-next="code-5" id="code-4" class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
                            </div>
                            <div>
                                <label for="code-5" class="sr-only">Fifth code</label>
                                <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-4" data-focus-input-next="code-6" id="code-5" class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
                            </div>
                            <div>
                                <label for="code-6" class="sr-only">Sixth code</label>
                                <input type="text" maxlength="1" data-focus-input-init data-focus-input-prev="code-5" id="code-6" class="block w-9 h-9 py-3 text-sm font-extrabold text-center text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" required />
                            </div>
                        </div>
                        <p id="helper-text-explanation" class="mt-2 text-sm text-gray-500 dark:text-gray-400"></p>
                    </form> 
                    <button @click="()=>{router.push('./login')}" class="flex items-center justify-center gap-1 w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
>Cancel</button>   
                </div>
            </div>
        </div>
    </div>
      
      </div>
       
  
  </template>
  
  
  <script setup>
  
  import { onMounted, ref, watchEffect,computed } from 'vue';
  import { useCoreStore } from '@/stores/core';
  import { useUserStore } from '@/stores/user';
  import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
  import { callAdminForthApi, loadFile } from '@/utils';
  import { useRouter } from 'vue-router';
  import { initFlowbite } from 'flowbite'
  import { showErrorTost } from '@/composables/useFrontendApi';
  
  
  
  
  const router = useRouter();
  const inProgress = ref(false);
  
  const coreStore = useCoreStore();
  const user = useUserStore();
  
  // use this simple function to automatically focus on the next input
  
  
  
  const showPw = ref(false);
  
  const error = ref(null);
  const totp = ref({});
  const totpJWT = ref(null);
 
    
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
  
  onMounted(async () => {
    coreStore.getPublicConfig()
   
    function focusNextInput(el, prevId, nextId) {
      if (el.value.length === 0) {
          if (prevId) {
              document.getElementById(prevId).focus();
          }
      } else {
          if (nextId) {
              document.getElementById(nextId).focus();
          } else {
            sendCode()
          }
      }
    }
  
    document.querySelectorAll('[data-focus-input-init]').forEach(function(element) {
        element.addEventListener('keyup', function() {
            const prevId = this.getAttribute('data-focus-input-prev');
            const nextId = this.getAttribute('data-focus-input-next');
            focusNextInput(this, prevId, nextId);
        });
    });
  
  
  
  });
  
  async function sendCode () {
    inProgress.value = true;
    const code = document.getElementById('code-1').value + document.getElementById('code-2').value + document.getElementById('code-3').value + document.getElementById('code-4').value + document.getElementById('code-5').value + document.getElementById('code-6').value;
    const resp = await callAdminForthApi({
      method: 'POST',
      path: '/plugin/twofa/confirmSetup',
      body: {
        code: code,
        secret: null,
      }
    })
    if (resp.allowedLogin){
        router.push('/');
      } else {
        showErrorTost('Invalid code');
      }
    }
  </script>
  