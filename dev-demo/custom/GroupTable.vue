<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xl font-bold">🧪 JsonCell Test Table</h2>





    <JsonViewer 
      :value="[
        {
          id: 1,
          name: 'Alice',
          meta: {
            age: 30,
            hobbies: ['reading', 'biking'],
            location: { city: 'Kyiv', country: 'Ukraine' }
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
      ]" 
      :expandDepth="4" 
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

</template>

<script setup lang="ts">
import { JsonViewer } from '@/afcl'
import { Table } from '@/afcl'


// Фейковые данные
const rows = [
  {
    id: 1,
    name: 'Alice',
    meta: {
      age: 30,
      hobbies: ['reading', 'biking'],
      location: { city: 'Kyiv', country: 'Ukraine' }
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
