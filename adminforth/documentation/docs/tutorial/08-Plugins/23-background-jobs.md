---
title: Background Jobs
description: "Guide to the Background Jobs plugin, including job setup, execution, UI monitoring, custom state rendering, and frontend APIs for job details."
slug: /tutorial/Plugins/background-jobs
---

# Background jobs
BackgroundJobsPlugin adds a durable background job system to AdminForth. Jobs are stored in your data store through a resource, executed by registered handlers, and automatically resumed after server restarts.


## Setup

First, install the plugin:
```bash
pnpm i @adminforth/background-jobs
```

Then create a resource for jobs:


```ts title="./resources/jobs.ts"
import AdminForth, { AdminForthDataTypes } from 'adminforth';
import type { AdminForthResourceInput, AdminUser } from 'adminforth';
import { randomUUID } from 'crypto';
import BackgroundJobsPlugin from '@adminforth/background-jobs';

async function allowedForSuperAdmin({ adminUser }: { adminUser: AdminUser }): Promise<boolean> {
  return adminUser.dbUser.role === 'superadmin';
}

export default {
  dataSource: 'maindb',
  table: 'jobs',
  resourceId: 'jobs',
  label: 'Jobs',
  options: {
    allowedActions: {
      edit: allowedForSuperAdmin,
      delete: allowedForSuperAdmin,
    },
  },
  columns: [
    {
      name: 'id',
      primaryKey: true,
      type: AdminForthDataTypes.STRING,
      fillOnCreate: ({ initialRecord, adminUser }) => randomUUID(),
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'name',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'created_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: {
        edit: false,
        create: false,
      },
      fillOnCreate: ({ initialRecord, adminUser }) => (new Date()).toISOString(),
    },
    {
      name: 'finished_at',
      type: AdminForthDataTypes.DATETIME,
      showIn: {
        edit: false,
        create: false,
      },
    },
    {
      name: 'started_by',
      type: AdminForthDataTypes.STRING,
      foreignResource: {
        resourceId: 'adminuser',
        searchableFields: ["id", "email"],
      }
    },
    {
      name: 'state',
      type: AdminForthDataTypes.JSON,
    },
    {
      name: 'progress',
      type: AdminForthDataTypes.STRING,
    },
    {
      name: 'status',
      type: AdminForthDataTypes.STRING,
      enum: [
        {
          label: 'IN_PROGRESS',
          value: 'IN_PROGRESS',
        },
        {
          label: 'DONE',
          value: 'DONE',
        },
        {
          label: 'DONE_WITH_ERRORS',
          value: 'DONE_WITH_ERRORS',
        },
        {
          label: 'CANCELLED',
          value: 'CANCELLED',
        }
      ]
    },
    {
      name: 'job_handler_name',
      type: AdminForthDataTypes.STRING,
    },
  ],
  plugins: [
    new BackgroundJobsPlugin({
      createdAtField: 'created_at',
      finishedAtField: 'finished_at',
      startedByField: 'started_by',
      stateField: 'state',
      progressField: 'progress',
      statusField: 'status',
      nameField: 'name',
      jobHandlerField: 'job_handler_name',
    })
  ]
} as AdminForthResourceInput;
```

Then add the table schema:

```
model jobs {
  id          String @id
  created_at  DateTime
  finished_at DateTime?
  started_by  String
  name        String
  state       String?
  progress    String
  status      String
  job_handler_name String
}
```

Then create a migration.


## Usage
The plugin saves tasks and keeps executing them after a server restart, so you should register job task handlers when the AdminForth application starts.

```ts title="./index.ts"
  //diff-add
  import BackgroundJobsPlugin from '@adminforth/background-jobs';
  //diff-add
  import jobs_resource from './resources/jobs.js';
  
  ...

  resources: [

    ...

    //diff-add
    jobs_resource,

    ...

  ],

  ...

  admin.express.serve(app);

  admin.discoverDatabases().then(async () => {
    if (await admin.resource('adminuser').count() === 0) {
      await admin.resource('adminuser').create({
        email: 'adminforth',
        password_hash: await AdminForth.Utils.generatePasswordHash('adminforth'),
        role: 'superadmin',
      });
    }
  });

  //diff-add
  const backgroundJobsPlugin = admin.getPluginByClassName<BackgroundJobsPlugin>('BackgroundJobsPlugin');
  
  //diff-add
  backgroundJobsPlugin.registerTaskHandler({
    //diff-add
    // job handler name
    //diff-add
    jobHandlerName: 'example_job_handler',
    //diff-add
    //handler function
    //diff-add
    handler: async ({ jobId, setTaskStateField, getTaskStateField, getState }) => {
      //diff-add
      const state = await getState();
      //diff-add
      console.log('State of the task at the beginning of the job handler:', state);
      //diff-add
      for (let second = 0; second < 3; second++) {
        //diff-add
        let taskCounter = await getTaskStateField('task_counter');
        //diff-add
        await new Promise(resolve => setTimeout(resolve, 1000));
        //diff-add
        taskCounter += 1;
        //diff-add
        await setTaskStateField('task_counter', taskCounter);
        //diff-add
      }
      //diff-add
      await backgroundJobsPlugin.updateJobFieldsAtomically(jobId, async () => {
        //diff-add
        const jobState = await backgroundJobsPlugin.getJobState(jobId);
        //diff-add
        await backgroundJobsPlugin.setJobStateField(jobId, 'counter', jobState.counter + 1);
        //diff-add
        await backgroundJobsPlugin.setJobStateField(jobId, 'commited_tasks', `${jobState.commited_tasks}${state.task_number} `);
        //diff-add
      });
      //diff-add
    },
    //diff-add
    // limit of tasks that are running in parallel
    //diff-add
    parallelLimit: 2
    //diff-add
  })

  ...

```


After registering a handler, you can create a job. For example:


```ts title="./index.ts"

  ...

  if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    const app = express();
    app.use(express.json());

    //diff-add
    app.post(`${ADMIN_BASE_URL}/api/create-job/`,
    //diff-add
      admin.express.authorize(
        //diff-add
        async (req: any, res: any) => {
          //diff-add
          const backgroundJobsPlugin = admin.getPluginByClassName<BackgroundJobsPlugin>('BackgroundJobsPlugin');
          //diff-add
          if (!backgroundJobsPlugin) {
            //diff-add
            res.status(404).json({ error: 'BackgroundJobsPlugin not found' });
            //diff-add
            return;
            //diff-add
          }
          //diff-add
          const jobId = await backgroundJobsPlugin.startNewJob(
            //diff-add
            'Example Job', //job name
            //diff-add
            req.adminUser, // adminuser
            //diff-add
            [
              //diff-add
              { state: { task_number: 1, task_counter: 0 } },
              //diff-add
              { state: { task_number: 2, task_counter: 0 } },
              //diff-add
              { state: { task_number: 3, task_counter: 0 } },
              //diff-add
              { state: { task_number: 4, task_counter: 0 } },
              //diff-add
              { state: { task_number: 5, task_counter: 0 } },
              //diff-add
              { state: { task_number: 6, task_counter: 0 } },
              //diff-add
            ], //initial tasks
            //diff-add
            'example_job_handler', //job handler name
            //diff-add
            { counter: 0, commited_tasks: 'Commited tasks:' }, //initial job state
            //diff-add
          )
          //diff-add
          res.json({ok: true, message: 'Job started' });
          //diff-add
        }
        //diff-add
      ),
      //diff-add
    );

  ...

```

## Run code after all tasks are done
If you need to react when the whole job is finished, pass `onAllTasksDone` to `registerTaskHandler`.

```ts title="./index.ts"
  ...

  backgroundJobsPlugin.registerTaskHandler({
    jobHandlerName: 'import-users',
    handler: async ({ jobId, setTaskStateField, getTaskStateField, getState }) => {
      // task logic
    },
    onAllTasksDone: async ({ jobId, failedTasks, succeededTasks }) => {
      console.log('job finished', { jobId, failedTasks, succeededTasks });
    },
  });

```

## Custom job state renderer
There may be cases where you need to display the state of job tasks. For this, you can register a custom component.

1) You need to create a custom vue component:
```vue title="./custom/JobCustomComponent.vue"
<template>
  <div class="w-full rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <div class="flex gap-10">
      <div>
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Job state</h3>
        <Table
          class="mb-6"
          :columns="jobStateColumns"
          :data="jobStateRows"
          :page-size="2"
        />
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Tasks</h3>
        <Table
          :columns="taskColumns"
          :data="taskRows"
          :page-size="taskRows.length || 5"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { AdminForthComponentDeclarationFull } from 'adminforth';
import { Table } from '@/afcl';

type JobTask = {
  state: {
    task_number: number;
    task_counter: number;
  };
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'DONE' | 'FAILED';
};

const tasks = ref<JobTask[]>([]);
const unsubscribeCallbacks: Array<() => void> = [];
const jobStateColumns = [
  { label: 'Field', fieldName: 'field' },
  { label: 'Value', fieldName: 'value' },
];
const taskColumns = [
  { label: 'Task', fieldName: 'taskNumber' },
  { label: 'State', fieldName: 'status' },
  { label: 'task_counter', fieldName: 'taskCounter' },
];
const taskStatusLabels: Record<JobTask['status'], string> = {
  SCHEDULED: 'pending',
  IN_PROGRESS: 'running',
  DONE: 'done',
  FAILED: 'failed',
};

const props = defineProps<{
  meta: any;
  getJobTasks: (limit?: number, offset?: number) => Promise<JobTask[]>;
  subscribeToJobStateFields: (fieldNames: string[]) => () => void;
  subscribeToJobTaskFields: (fieldNames: string[]) => () => void;
  job: {
    id: string;
    name: string;
    status: 'IN_PROGRESS' | 'DONE' | 'DONE_WITH_ERRORS' | 'CANCELLED';
    state: {
      counter: number;
      commited_tasks: string;
    };
    progress: number;
    createdAt: Date;
    customComponent?: AdminForthComponentDeclarationFull;
  };
}>();

const jobStateRows = computed(() => [
  { field: 'counter', value: props.job.state.counter },
  { field: 'commited_tasks', value: props.job.state.commited_tasks },
]);

const taskRows = computed(() => tasks.value.map((task) => ({
  taskNumber: task.state.task_number,
  status: taskStatusLabels[task.status],
  taskCounter: task.state.task_counter,
})));

async function loadTasks() {
  tasks.value = await props.getJobTasks(100, 0);
}

onMounted(async () => {
  await loadTasks();

  unsubscribeCallbacks.push(props.subscribeToJobStateFields(['counter', 'commited_tasks']));
  unsubscribeCallbacks.push(props.subscribeToJobTaskFields(['task_counter']));
});

onUnmounted(() => {
  unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
});
</script>
```

2) Now register this component explicitly:

```ts title="./index.ts"
export const admin = new AdminForth({
  baseUrl: ADMIN_BASE_URL,
  auth: {
    usersResourceId: 'adminuser',
    usernameField: 'email',
    passwordHashField: 'password_hash',
    rememberMeDuration: '30d', 
    loginBackgroundImage: 'https://images.unsplash.com/photo-1534239697798-120952b76f2b?q=80&w=3389&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    loginBackgroundPosition: '1/2',
    loginPromptHTML: async () => { 
      const adminforthUserExists = await admin.resource("adminuser").count(Filters.EQ('email', 'adminforth')) > 0;
      if (adminforthUserExists) {
        return "Please use <b>adminforth</b> as username and <b>adminforth</b> as password"
      }
    },
  },

  //diff-add
  componentsToExplicitRegister: [
    //diff-add
    { 
      //diff-add
      file: '@@/JobCustomComponent.vue',
      //diff-add
      meta: {
        //diff-add
        label: 'Job Custom Component',
        //diff-add
      }
      //diff-add
    }
    //diff-add
  ],
  ...

```


3) Finally, register this component alongside the job task handler:

```ts title="./index.ts"
  ...

  const backgroundJobsPlugin = admin.getPluginByClassName<BackgroundJobsPlugin>('BackgroundJobsPlugin');
  
  backgroundJobsPlugin.registerTaskHandler({
    jobHandlerName: 'example_job_handler', // Handler name
    handler: async ({ jobId, setTaskStateField, getTaskStateField, getState }) => { //handler function
      const state = await getState();
      console.log('State of the task at the beginning of the job handler:', state);

      for (let second = 0; second < 3; second++) {
        let taskCounter = await getTaskStateField('task_counter');
        await new Promise(resolve => setTimeout(resolve, 1000));
        taskCounter += 1;
        await setTaskStateField('task_counter', taskCounter);
      }

      await backgroundJobsPlugin.updateJobFieldsAtomically(jobId, async () => {
        const jobState = await backgroundJobsPlugin.getJobState(jobId);
        await backgroundJobsPlugin.setJobStateField(jobId, 'counter', jobState.counter + 1);
        await backgroundJobsPlugin.setJobStateField(jobId, 'commited_tasks', `${jobState.commited_tasks}${state.task_number} `);
      });
    },
    parallelLimit: 2 //parallel tasks limit. 2 menans 2 tasks can run at a time
  })

  //diff-add
  backgroundJobsPlugin.registerTaskDetailsComponent({
    //diff-add
    jobHandlerName: 'example_job_handler', // Handler name
    //diff-add
    component: { 
      //diff-add
      file: '@@/JobCustomComponent.vue'  //custom component for the job details
      //diff-add
    },
    //diff-add
  })


```

### Reactive updates for job state and task state

You can activate automatic reactive updates for task state and job state on the frontend when you call backend state mutation methods like `setJobStateField` and `setTaskStateField`.

To avoid unnecessary high-volume backend updates for data that might not be needed on the frontend, all reactive updates are disabled by default, and you need to specify which fields to subscribe to.

Use `subscribeToJobStateFields(['fieldName1', 'fieldName2'])` for specific job state fields and
`subscribeToJobTaskFields(['fieldName1', 'fieldName2'])` for specific task state fields.

The plugin applies incoming updates to the reactive `job` prop and to the task objects returned by
`getJobTasks()`. Task field subscriptions receive updates for that field from every task
in the open job. Both helpers return an unsubscribe function, though the plugin also automatically unsubscribes from
remaining field subscriptions when the job dialog closes.



## Frontend API
### Job info popup
If you want to immediately open the job info popup, return the job ID from the API that creates the job:

For example:

```ts
  ...
//diff-add
  import { useBackgroundJobApi } from '@/custom/plugins/BackgroundJobsPlugin/useBackgroundJobApi.ts';
 
 //diff-add
  const backgroundJobApi = useBackgroundJobApi();

  const res = await callAdminForthApi({
    path: `/plugin/${props.meta.pluginInstanceId}/translate-selected-to-languages`,
    method: 'POST',
    body: { 
      selectedIds: listOfIds,
      selectedLanguages: Object.keys(checkedLanguages.value).filter(lang => checkedLanguages.value[lang]),
    },
    silentError: true,
  });

  if (res.ok) {
    const jobId = res.jobId;
    if (jobId) {
      //diff-add
      backgroundJobApi.openJobInfoPopup(jobId);
    }
  }

```

## Backend API

The plugin provides some handy methods that can be used in different situations:

```ts
//set key:value to the job state in the DB
setJobStateField(jobId: string, key: string, value: any)
//get job field from the state in db
getJobStateField(jobId: string, key: string)
//get job state from the db
getJobState(jobId: string)
//add task to the running job
addNewTasksToExistingJob(jobId: string, tasks: taskType[])
//delete task from the running job (if not started yet)
deleteTasksFromExistingJob(jobId: string, taskIndex: number)
/**
 * 
 * executes code atomically. If you have many tasks that can update task state,
 * use this method to avoid invalid task state writes.
 * 
 **/
updateJobFieldsAtomically(jobId: string, updateFunction: () => Promise<void>) 

//for example
backgroundJobsPlugin.updateJobFieldsAtomically(jobId, async () => {
  // Do all set / get field operations in this function to make the state update atomic and avoid conflicts
  // when two parallel tasks get the same value before setting it.
  // Don't do long awaits in this callback, since it has an exclusive lock.
  let totalUsedTokens = await backgroundJobsPlugin.getJobStateField(jobId, 'totalUsedTokens');
  totalUsedTokens += promptCost;
  await backgroundJobsPlugin.setJobStateField(jobId, 'totalUsedTokens', totalUsedTokens);
})

```
