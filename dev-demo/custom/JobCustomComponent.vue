<template>
  <div class="w-full rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <div class="flex gap-10">
      <div>
        <h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Job state</h3>
        <Table
          class="mb-6"
          :columns="jobStateColumns"
          :data="jobStateRows"
          :page-size="jobStateRows.length"
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
