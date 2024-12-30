
<template>
  <!-- Main modal -->
  <div tabindex="-1" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 bottom-0 z-50 flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-white bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50">
    <div class="relative p-4 w-full max-w-2xl max-h-full ">
        <!-- Modal content -->
        <div class="relative bg-white rounded-lg shadow-xl dark:bg-gray-700">
            <!-- Modal header -->
            <div class="flex items-center justify-between p-3 md:p-4 border-b rounded-t dark:border-gray-600">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ $t('Generate image with AI') }}
                </h3>
                <button type="button" 
                  @click="emit('close')"
                  class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" >
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only">{{ $t('Close modal') }}</span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="p-4 md:p-5 space-y-4">
              <textarea id="message" rows="3" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                :placeholder="$t('Prompt which will be passed to AI network')" v-model="prompt"
                :title="$t('Prompt which will be passed to AI network')"
                ></textarea>

              <div class="flex items-center justify-center w-full relative">
                <div 
                  v-if="loading"  
                  class=" absolute flex items-center justify-center w-full h-full z-50 bg-white/80 dark:bg-gray-900/80 rounded-lg"
                >
                    <div role="status" class="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
                        <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
                        <span class="sr-only">{{ $t('Loading...') }}</span>
                    </div>
                </div>
                
                <div id="gallery" class="relative w-full" data-carousel="static">
                  <!-- Carousel wrapper -->
                  <div class="relative h-56 overflow-hidden rounded-lg md:h-72">
                      <!-- Item 1 -->
                      <div v-for="(img, index) in images" :key="index" class="hidden duration-700 ease-in-out" data-carousel-item>
                          <img :src="img" class="absolute block max-w-full h-auto -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="">
                      </div>
                      
                      <div v-if="images.length === 0" class="flex items-center justify-center w-full h-full">
                        
                        <button @click="generateImages" type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 
                          focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                          dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ms-2">{{ $t('Generate images') }}</button>

                      </div>
                     
                  </div>
                  <!-- Slider controls -->
                  <button type="button" class="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
                    @click="slide(-1)"
                  >
                      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                          <svg class="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
                          </svg>
                          <span class="sr-only">{{ $t('Previous') }}</span>
                      </span>
                  </button>
                  <button type="button" class="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" 
                    @click="slide(1)"
                  >
                      <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                          <svg class="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                          </svg>
                          <span class="sr-only">{{ $t('Next') }}</span>
                      </span>
                  </button>

                  
                </div>
              </div>
            </div>
            <!-- Modal footer -->
            <div class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                <button type="button" @click="confirmImage"
                  :disabled="loading"
                  class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center 
                  dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 
                  disabled:opacity-50 disabled:cursor-not-allowed"
                >{{ $t('Use image') }}</button>
                <button type="button" class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
                  @click="emit('close')"
                >{{ $t('Cancel') }}</button>
            </div>
        </div>
    </div>
  </div>

  
  

</template>

<script setup lang="ts">

import { ref, onMounted, nextTick } from 'vue'
import { Carousel } from 'flowbite';
import { callAdminForthApi } from '@/utils';
import { useI18n } from 'vue-i18n';
import adminforth from '@/adminforth';

const { t: $t } = useI18n();

const prompt = ref('');
const emit = defineEmits(['close', 'uploadImage']);
const props = defineProps(['meta', 'record']);
const images = ref([]);
const loading = ref(false);

function minifyField(field: string): string {
  if (field.length > 100) {
    return field.slice(0, 100) + '...';
  }
  return field;
}

const caurosel = ref(null);
onMounted(() => {
  // Initialize carousel
  let additionalContext = null;
  if (props.meta.fieldsForContext) {
    additionalContext = props.meta.fieldsForContext.filter((field: string) => props.record[field]).map((field: string) => {
      return `${field}: ${minifyField(props.record[field])}`;
    }).join('\n');
  }

  prompt.value = $t('Generate image for field "{field}" in {resource}. No text should be on image.', {
    field: props.meta.pathColumnLabel,
    resource: props.meta.resourceLabel,
  });
  if (additionalContext) {
    prompt.value += ` ${additionalContext}`;
  }

})

async function slide(direction: number) {
  if (!caurosel.value) return;
  const curPos = caurosel.value.getActiveItem().position;
  if (curPos === 0 && direction === -1) return;
  if (curPos === images.value.length - 1 && direction === 1) {
    await generateImages();
  }
  if (direction === 1) {
    caurosel.value.next();
  } else {
    caurosel.value.prev();
  }
}

async function confirmImage() {
  loading.value = true;

  const currentIndex = caurosel.value?.getActiveItem()?.position || 0;
  const img = images.value[currentIndex];
  // read  url to base64 and send it to the parent component
  const imgBlob = await fetch(
    `${import.meta.env.VITE_ADMINFORTH_PUBLIC_PATH || ''}/adminapi/v1/plugin/${props.meta.pluginInstanceId}/cors-proxy?url=${encodeURIComponent(img)}`
  ).then(res => { return res.blob() });

  emit('uploadImage', imgBlob);
  emit('close');

  loading.value = false;
}

async function generateImages() {
  loading.value = true;
  const currentIndex = caurosel.value?.getActiveItem()?.position || 0;
  const resp = await callAdminForthApi({
    path: `/plugin/${props.meta.pluginInstanceId}/generate_images`,
    method: 'POST',
    body: {
      prompt: prompt.value,
    },
  });

  if (resp.error) {
    adminforth.alert({
      message: $t('Error: {error}', { error: JSON.stringify(resp.error) }), 
      variant: 'danger',
      timeout: 15,
    });
    loading.value = false;
    return;
  }

  images.value = [
    ...images.value,
    ...resp.images.map(im => im.data[0].url),
  ];

  // images.value = [
  //   'https://via.placeholder.com/600x400?text=Image+1',
  //   'https://via.placeholder.com/600x400?text=Image+2',
  // ];
  await nextTick();

  caurosel.value = new Carousel(
    document.getElementById('gallery'), 
    images.value.map((img, index) => ({
      el: document.getElementById('gallery').querySelector(`[data-carousel-item]:nth-child(${index + 1})`),
      position: index,
    })),
    {
      internal: 0,
      defaultPosition: currentIndex,
    },
    {
      override: true,
    }
  );
  await nextTick();
  loading.value = false;
}



</script>
