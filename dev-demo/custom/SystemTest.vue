<template>
  <div class="flex flex-col max-w-[200px] m-10 mt-20 gap-10">
    <Button @click="createJob">
      Create Job
    </Button>

    <Button @click="callHelloWorldApi">
      Call API
    </Button>

    <Button @click="callHelloWorldApi">
      Refresh badge
    </Button>

    <Button @click="doTest2faCall">
      Test 2FA API Call
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '@/afcl'
import { useAdminforth } from '@/adminforth';
import { callApi } from '@/utils';


const { alert } = useAdminforth();
import adminforth  from '@/adminforth';


const valueStart = ref()

watch(valueStart, (newVal) => {
  console.log('New start value:', newVal);
});

async function createJob() {
  try {
    const res = await callApi({path: '/api/create-job/', method: 'POST'});
    console.log('Job created successfully:', res);
  } catch (error) {
    console.error('Error creating job:', error);
  }
}

async function callHelloWorldApi() {
  try {
    const response = await callApi({ path: '/api/hello/', method: 'GET' });
    console.log('API response:', response);
  } catch (error) {
    console.error('API error:', error);
  }
}

async function doTest2faCall() {
  try {
    const response = await callApi({ path: '/api/test2faCall/', method: 'GET' });
  } catch (error) {
    console.error('2FA API error:', error);
  }
}
</script>