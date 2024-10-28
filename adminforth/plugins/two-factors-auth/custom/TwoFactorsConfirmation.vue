<template>
    <div class="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800"
      :style="(coreStore.config?.loginBackgroundImage && coreStore.config?.loginBackgroundPosition === 'over') ? {
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
                    <div class="my-4 flex justify-center items-center">
                      <v-otp-input
                        ref="code"
                        input-classes="h-10 w-10 border border-[2px] rounded-md flex otp-input"
                        :conditionalClass="['one', 'two', 'three', 'four', 'five', 'six']"
                        inputType="letter-numeric"
                        :num-inputs="6"
                        v-model:value="bindValue"
                        :should-auto-focus="true"
                        :should-focus-order="true"
                        @on-change="handleOnChange"
                        @on-complete="handleOnComplete"
                      />
                    </div>
                    <!-- <Vue2FACodeInput v-model="code"/> -->
                    <button @click="()=>{router.push('./login')}" class="flex items-center justify-center gap-1 w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                      Cancel
                    </button>   
                </div>
            </div>
        </div>
    </div>
      
      </div>
       
  
  </template>
  
  
  <script setup>
  
  import { onMounted, onBeforeUnmount, ref, watchEffect,computed,watch } from 'vue';
  import { useCoreStore } from '@/stores/core';
  import { useUserStore } from '@/stores/user';
  import { IconEyeSolid, IconEyeSlashSolid } from '@iconify-prerendered/vue-flowbite';
  import { callAdminForthApi, loadFile } from '@/utils';
  import { useRouter } from 'vue-router';
  import { showErrorTost } from '@/composables/useFrontendApi';
  import Vue2FACodeInput from '@loltech/vue3-2fa-code-input';
  import VOtpInput from "vue3-otp-input";

  const code = ref(null);

  const handleOnComplete = (value) => {
    sendCode(value);
  };

  const fillInput = (value) => {
    code.value?.fillInput(value);
  };

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
    coreStore.getPublicConfig();
    window.addEventListener('keydown', handleKeydown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  
  async function sendCode (value) {
    inProgress.value = true;
    const resp = await callAdminForthApi({
      method: 'POST',
      path: '/plugin/twofa/confirmSetup',
      body: {
        code: value,
        secret: null,
      }
    })
    if (resp.allowedLogin){
      await user.finishLogin();
    } else {
      showErrorTost('Invalid code');
    }
  }

  // watch(code, async (nv)=>{
  //   if (nv){
  //     sendCode();
  //   }
  // })

  function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      navigator.clipboard.readText().then((pastedData) => {
        if (pastedData) {
          fillInput(pastedData);
        }
      }).catch(err => {
        console.error('Failed to read clipboard contents: ', err);
      });
    }
  }
  </script>

  <style lang='scss'>
    .vue3-2fa-code-input {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .otp-input {
      margin: 0 5px;
    }
    .vue3-2fa-code-input-box {
        &[type='text'] {
          @apply  w-10 h-10 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
        
        }
        
    }

    /**
     * This particular piece of code makes the last input have a gap in the middle.
     */
     .spaced-code-input {
        & .vue3-2fa-code-input-box {
            &:nth-child(3) {
                @apply mr-4;
            }

            &:nth-child(4) {
                @apply ml-4;
            }
        }
    }  
  </style>
  