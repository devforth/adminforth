# Background jobs
BackgroundJobsPlugin adds a durable background-job system to AdminForth. Jobs are stored in your data store (via a resource), executed by registered handlers, and automatically resumed after server restarts.


## Setup

First, install the plugin:
```bash
npm i @adminforth/background-jobs
```

and create a resource for jobs:


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

## Usage
The plugin saves tasks and keeps executing them even after a server restart, so you should register job task handlers at the start of the AdminForth application.

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
    handler: async ({ setTaskStateField, getTaskStateField }) => {
      //diff-add
      const state = await getTaskStateField();
      //diff-add
      console.log('State of the task at the beginning of the job handler:', state);
      //diff-add
      await new Promise(resolve => setTimeout(resolve, 3000));
      //diff-add
      await setTaskStateField({[state.step]: `Step ${state.step} completed`});
      //diff-add
      const updatedState = await getTaskStateField();
      //diff-add
      console.log('State of the task after setting the new state in the job handler:', updatedState);
      //diff-add
    },
    //diff-add
    //limit of tasks, that are running in parallel
    //diff-add
    parallelLimit: 1
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
          const backgroundJobsPlugin = admin.getPluginByClassName<BackgroundJobsPlugin>('default');
          //diff-add
          if (!backgroundJobsPlugin) {
            //diff-add
            res.status(404).json({ error: 'BackgroundJobsPlugin not found' });
            //diff-add
            return;
            //diff-add
          }
          //diff-add
          backgroundJobsPlugin.startNewJob(
            //diff-add
            'Example Job', //job name
            //diff-add
            req.adminUser, // adminuser
            //diff-add
            [
              //diff-add
              { state: { step: 1 } },
              //diff-add
              { state: { step: 2 } },
              //diff-add
              { state: { step: 3 } },
              //diff-add
              { state: { step: 4 } },
              //diff-add
              { state: { step: 5 } },
              //diff-add
              { state: { step: 6 } },
              //diff-add
            ], //initial tasks
            //diff-add
            'example_job_handler', //job handler name
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
## Custom job state renderer
There may be cases when you need to display the state of job tasks. For this, you can register a custom component.


```ts title="./custom/JobCustomComponent.vue"
<template>
  <div class="w-[1000px] h-[500px] bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center  ">
    <Button class="h-10" @click="loadTasks">
      Get Job Tasks
    </Button>
    {{ tasks }}
  </div>
</template>


<script setup lang="ts">
import { Button, JsonViewer } from '@/afcl';
import { onMounted, onUnmounted, ref } from 'vue';
import websocket from '@/websocket';
import type { AdminForthComponentDeclarationFull } from 'adminforth';


const tasks = ref<{state: Record<string, any>, status: string}[]>([]);


const props = defineProps<{
  meta: any;
  getJobTasks: (limit?: number, offset?: number) => Promise<{state: Record<string, any>, status: string}[]>;
  job: {
    id: string;
    name: string;
    status: 'IN_PROGRESS' | 'DONE' | 'DONE_WITH_ERRORS' | 'CANCELLED';
    progress: number; // 0 to 100
    createdAt: Date;
    customComponent?: AdminForthComponentDeclarationFull; 
  };
}>();

const loadTasks = async () => {
  tasks.value = await props.getJobTasks(10, 0);
  console.log('Loaded tasks for job:', tasks.value);
}


onMounted(async () => {
  loadTasks();
  websocket.subscribe(`/background-jobs-task-update/${props.job.id}`, (data: { taskIndex: number, status?: string, state?: Record<string, any> }) => {
    console.log('Received WebSocket message for job:', data.status);
    
    if (data.state) {
      tasks.value[data.taskIndex].state = data.state;
    }
    if (data.status) {
      tasks.value[data.taskIndex].status = data.status;
    }

  });
});

onUnmounted(() => {
  console.log('Unsubscribing from WebSocket for job:', props.job.id);
  websocket.unsubscribe(`/background-jobs-task-update/${props.job.id}`);
});


</script>
```


Now register this component explicitly:

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


Finally, register this component alongside the job task handler:

```ts title="./index.ts"
  ...

  const backgroundJobsPlugin = admin.getPluginByClassName<BackgroundJobsPlugin>('default');
  
  backgroundJobsPlugin.registerTaskHandler({
    jobHandlerName: 'example_job_handler', // Handler name
    handler: async ({ setTaskStateField, getTaskStateField }) => { //handler function
      const state = await getTaskStateField();
      console.log('State of the task at the beginning of the job handler:', state);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await setTaskStateField({[state.step]: `Step ${state.step} completed`});
      const updatedState = await getTaskStateField();
      console.log('State of the task after setting the new state in the job handler:', updatedState);
    },
    parallelLimit: 1 //parallel tasks limit
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
