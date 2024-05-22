

<template>
  <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
              <th scope="col" class="p-4">
                  <div class="flex items-center">
                      <input id="checkbox-all-search" type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                      <label for="checkbox-all-search" class="sr-only">checkbox</label>
                  </div>
              </th>


              <th v-for="c in columns" scope="col" class="px-6 py-3">
                <div class="flex items-center">
                        {{ c.name  }}
                        <a href="#"><svg class="w-3 h-3 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z"/>
                        </svg></a>
                    </div>
              </th>
  
          </tr>
      </thead>
      <tbody>
          <!-- <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <td class="w-4 p-4">
                  <div class="flex items-center">
                      <input id="checkbox-table-search-1" type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
                      <label for="checkbox-table-search-1" class="sr-only">checkbox</label>
                  </div>
              </td>
              <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  Apple MacBook Pro 17"
              </th>
              <td class="px-6 py-4">
                  Silver
              </td>
              <td class="px-6 py-4">
                  Laptop
              </td>
              <td class="px-6 py-4">
                  Yes
              </td>
              <td class="px-6 py-4">
                  Yes
              </td>
              <td class="px-6 py-4">
                  $2999
              </td>
              <td class="px-6 py-4">
                  3.0 lb.
              </td>
              <td class="flex items-center px-6 py-4">
                  <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
                  <a href="#" class="font-medium text-red-600 dark:text-red-500 hover:underline ms-3">Remove</a>
              </td>
          </tr> -->
       
      </tbody>
  </table>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { callAdminForthApi } from '@/utils';
import { useRoute } from 'vue-router';

const route = useRoute();
const columns = ref(null);
const error = ref(null);


onMounted(async () => {
  const res = await callAdminForthApi({
      path: '/get_resource_data',
      method: 'POST',
      body: {
        resourceId: route.params.resourceId
      }
    }
  );
  if (!res.discoverInProgress) {
    columns.value = res.resource.columns;
  }
  if (res.error){
    error.value = res.error;
  }

});

</script>