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