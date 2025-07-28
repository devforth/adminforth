<template>
  <div class="p-4 space-y-4">

    <JsonViewer 
      :value="[
        {
          id: 1,
          name: 'Alice',
          meta: {
            age: 30,
            hobbies: ['reading', 'biking'],
          }
        },
        {
          id: 2,
          name: 'Bob',
        }
      ]" 
      :expandDepth="2" 
    />







    <h3 class="text-lg font-semibold">Table with Pagination</h3>
    <p class="text-gray-600">This table demonstrates pagination with a custom page size.</p>

  </div>










  <Table
    :columns="[
      { label: 'Name', fieldName: 'name' },
      { label: 'Age', fieldName: 'age' },
      { label: 'Country', fieldName: 'country' },
    ]"
    :data="[
      { name: 'John', age: 30, country: 'US' },
      { name: 'Rick', age: 25, country: 'CA' },
      { name: 'Alice', age: 35, country: 'UK' },
      { name: 'Colin', age: 40, country: 'AU' },
    ]"
    :pageSize="2"
  ></Table>


<br>



  <div class="flex bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 
      focus:border-blue-500 w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 
      dark:focus:ring-blue-500 dark:focus:border-blue-500 relative max-w-full">

  </div>

</template>

<script setup lang="ts">
import { JsonViewer } from '@/afcl'
import { Table } from '@/afcl'
import { ref } from 'vue'

const currentValue = ref('');

async function complete(textBeforeCursor: string): Promise<string[]> {
  console.log('✋ complete request', textBeforeCursor);

  // simulate delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  // generate N random words of M length
  const numOfWords = Math.floor(Math.random() * 7) + 1;
  const words = Array.from({ length: numOfWords }, () => Math.random().toString(36).substring(2, 15));

  // if textBeforeCursor has "br" in end - insert \n in random word at random place
  if (textBeforeCursor.endsWith('br')) {
    const randomWordIndex = Math.floor(Math.random() * words.length);
    const pos = Math.floor(Math.random() * words[randomWordIndex].length);
    words[randomWordIndex] = words[randomWordIndex].substring(0, pos) + '\n' + words[randomWordIndex].substring(pos);
  }

  return words.map((word) => `${word} `);
}

// Фейковые данные
const rows = [
  {
    id: 1,
    name: 'Alice',
    meta: {
      age: 30,
    }
  },
  {
    id: 2,
    name: 'Bob',
    meta: {
      age: 25,
      active: true,
      scores: { math: 92, english: 88 }
    }
  }
]
</script>