<template>
  <div class="flex flex-col max-w-[200px] m-10 mt-20 gap-10">
    <Button @click="createJob">
      Create Job
    </Button>
    <Button @click="addTaskToTheLastJob">
      Add Task to the Last Job
    </Button>
    <Button @click="deleteTaskFromTheLastJob">
      Delete Task from the Last Job
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

    <Button @click="get2FaConfirmationResultWindow">
      2fa window.get2FaConfirmationResult (global window api)
    </Button>
    <Button @click="get2FaConfirmationResultTwoFactorsAuth">
      2fa twoFactorsAuth.get2FaConfirmationResult
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
import { useTwoFactorsAuth } from '@/custom/plugins/TwoFactorsAuthPlugin/use2faApi.ts';

const twoFactorsAuth = useTwoFactorsAuth();

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

async function addTaskToTheLastJob() {
  try {
    const res = await callApi({path: '/api/add-task-to-last-job/', method: 'POST'});
    console.log('Task added to the last job successfully:', res);
  } catch (error) {
    console.error('Error adding task to the last job:', error);
  }
}

async function deleteTaskFromTheLastJob() {
  try {
    const res = await callApi({
      path: '/api/delete-task-from-last-job/', 
      method: 'POST',
      body: {
        taskIndex: 10 // Replace with the actual task index you want to delete
      }
    });
    console.log('Task deleted from the last job successfully:', res);
  } catch (error) {
    console.error('Error deleting task from the last job:', error);
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

async function get2FaConfirmationResultWindow() {
  const verificationResult = await window.adminforthTwoFaModal.get2FaConfirmationResult();  // this will ask user to enter code
  console.log('2FA verification result (window):', verificationResult);
}

async function get2FaConfirmationResultTwoFactorsAuth() {
  const verificationResult = await twoFactorsAuth.get2FaConfirmationResult();  // this will ask user to enter code
  console.log('2FA verification result (twoFactorsAuth):', verificationResult);
}
</script>