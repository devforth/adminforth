<template>
  <div class="m-6 mt-14 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          LevelDB
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex w-full gap-3">
            <Input class="w-full" v-model="levelDbKey" placeholder="LevelDB key" />
            <Input class="w-full" v-model="levelDbValue" placeholder="LevelDB value" />
          </div>
          <Button class="w-full" @click="addLevelDbKeyValue">
            Add level DB key/value
          </Button>
          <Input class="w-full" v-model="levelDbPrefix" placeholder="LevelDB prefix" />
          <Button class="w-full" @click="getLevelDbKeys">
            Get level db keys
          </Button>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Jobs
        </div>
        <div class="flex flex-col gap-3">
          <Button class="w-full" @click="createJob">
            Create Job
          </Button>
          <Button class="w-full" @click="addTaskToTheLastJob">
            Add Task to the Last Job
          </Button>
          <Button class="w-full" @click="deleteTaskFromTheLastJob">
            Delete Task from the Last Job
          </Button>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          API
        </div>
        <div class="flex flex-col gap-3">
          <Button class="w-full" @click="callHelloWorldApi">
            Call API
          </Button>
          <Button class="w-full" @click="callHelloWorldApi">
            Refresh badge
          </Button>
        </div>
      </section>

      <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          2FA
        </div>
        <div class="flex flex-col gap-3">
          <Button class="w-full px-4" @click="doTest2faCall">
            Test 2FA API Call
          </Button>
          <Button class="w-full px-4" @click="get2FaConfirmationResultWindow">
            2fa window.get2FaConfirmationResult (global window api)
          </Button>
          <Button class="w-full px-4" @click="get2FaConfirmationResultTwoFactorsAuth">
            2fa twoFactorsAuth. get2FaConfirmationResult
          </Button>
        </div>
      </section>
    </div>

    <section class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Last API Output
      </div>
      <textarea
        v-model="lastApiOutput"
        class="h-72 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-700 outline-none"
        readonly
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button, Input } from '@/afcl'
import { useAdminforth } from '@/adminforth';
import { callApi } from '@/utils';


const { alert } = useAdminforth();
import adminforth  from '@/adminforth';
import { useTwoFactorsAuth } from '@/custom/plugins/TwoFactorsAuthPlugin/use2faApi.ts';

  const { get2FaConfirmationResult } = useTwoFactorsAuth();
const valueStart = ref()
const levelDbKey = ref('');
const levelDbValue = ref('');
const levelDbPrefix = ref('');
const lastApiOutput = ref('No output yet. Click a button to run an action.');

function setLastApiOutput(actionName: string, data: unknown, isError = false) {
  const status = isError ? 'ERROR' : 'OK';
  const serializedData = typeof data === 'string'
    ? data
    : JSON.stringify(data, null, 2);

  lastApiOutput.value = `[${status}] ${actionName}\n\n${serializedData}`;
}

watch(valueStart, (newVal) => {
  console.log('New start value:', newVal);
});

async function addLevelDbKeyValue() {
  try {
    const response = await callApi({
      path: '/api/addLevelDbKey/',
      method: 'POST',
      body: {
        key: levelDbKey.value,
        value: levelDbValue.value,
      },
    });
    console.log('LevelDB key/value added:', response);
    setLastApiOutput('Add level DB key/value', response);
  } catch (error) {
    console.error('Error adding LevelDB key/value:', error);
    setLastApiOutput('Add level DB key/value', String(error), true);
  }
}

async function getLevelDbKeys() {
  try {
    const response = await callApi({ path: '/api/getLevelDbKeys/', method: 'POST', body: { prefix: levelDbPrefix.value } });
    console.log('LevelDB keys:', response);
    setLastApiOutput('Get level db keys', response);
  } catch (error) {
    console.error('Error getting LevelDB keys:', error);
    setLastApiOutput('Get level db keys', String(error), true);
  }
}

async function createJob() {
  try {
    const res = await callApi({path: '/api/create-job/', method: 'POST'});
    console.log('Job created successfully:', res);
    setLastApiOutput('Create Job', res);
  } catch (error) {
    console.error('Error creating job:', error);
    setLastApiOutput('Create Job', String(error), true);
  }
}

async function addTaskToTheLastJob() {
  try {
    const res = await callApi({path: '/api/add-task-to-last-job/', method: 'POST'});
    console.log('Task added to the last job successfully:', res);
    setLastApiOutput('Add Task to the Last Job', res);
  } catch (error) {
    console.error('Error adding task to the last job:', error);
    setLastApiOutput('Add Task to the Last Job', String(error), true);
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
    setLastApiOutput('Delete Task from the Last Job', res);
  } catch (error) {
    console.error('Error deleting task from the last job:', error);
    setLastApiOutput('Delete Task from the Last Job', String(error), true);
  }
}

async function callHelloWorldApi() {
  try {
    const response = await callApi({ path: '/api/hello/', method: 'GET' });
    console.log('API response:', response);
    setLastApiOutput('Call API', response);
  } catch (error) {
    console.error('API error:', error);
    setLastApiOutput('Call API', String(error), true);
  }
}

async function doTest2faCall() {
  try {
    const response = await callApi({ path: '/api/test2faCall/', method: 'GET' });
    setLastApiOutput('Test 2FA API Call', response);
  } catch (error) {
    console.error('2FA API error:', error);
    setLastApiOutput('Test 2FA API Call', String(error), true);
  }
}

async function get2FaConfirmationResultWindow() {
  const verificationResult = await window.adminforthTwoFaModal.get2FaConfirmationResult();  // this will ask user to enter code
  console.log('2FA verification result (window):', verificationResult);
  setLastApiOutput('2fa window.get2FaConfirmationResult', verificationResult);
}

async function get2FaConfirmationResultTwoFactorsAuth() {
  const verificationResult = await get2FaConfirmationResult();  // this will ask user to enter code
  console.log('2FA verification result (twoFactorsAuth):', verificationResult);
  setLastApiOutput('2fa twoFactorsAuth.get2FaConfirmationResult', verificationResult);
}
</script>