import { ref } from 'vue';
import { defineStore } from 'pinia';
import { callAdminForthApi } from '@/utils';
import { useCoreStore } from './core';
import router from '@/router';
import { reconnect } from '@/websocket';


export const useUserStore = defineStore('user', () => {
    const isAuthorized = ref(false);

    function authorize() {
        isAuthorized.value = true;
        localStorage.setItem('isAuthorized', 'true');
    }

    function unauthorize() {
        isAuthorized.value = false;
        localStorage.setItem('isAuthorized', 'false');
    }

    async function finishLogin() {
        const coreStore = useCoreStore();
        authorize(); // TODO not sure we need this approach with localStorage
        reconnect();
        await router.push('/');
        await router.isReady();
        await coreStore.fetchMenuAndResource();
    }

    async function logout() {
        const coreStore = useCoreStore();

        await callAdminForthApi({
          path: '/logout',
          method: 'POST',
        });
        reconnect();
        coreStore.resetAdminUser();
        unauthorize();
        
      }

    // async function checkAuth( skipApiCall = false){
    //      console.log('checkAuth', isAuthorized.value, skipApiCall)
    //     if(isAuthorized.value) {
    //         return true}
    //     else {
    //         if(skipApiCall) return false;
    //         const resp = await callAdminForthApi({
    //             path: '/check_auth',
    //             method: 'POST',
    //         });
    //         if (resp.status !== 401) {
    //             authorize();
    //             return true;
    //         }
    //         else {
    //             unauthorize();
    //             return false;}
    //     }
        
    // }

    return {
        isAuthorized,
        authorize,
        unauthorize,
        logout,
        finishLogin
    }

});        