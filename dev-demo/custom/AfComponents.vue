<template>

  <div class="flex gap-10">
    <div class="flex flex-col max-w-[200px] m-10 mt-20 gap-10">
      <Checkbox :disabled="false"><p>afdsdfsdfsdgsdgsgdsggdg</p> </Checkbox>
      <Button @click="doSmth" 
        :loader="false" class="w-full">
        Your button text
      </Button>

      <Button @click="doSmth" 
          :loader="true" class="w-full mt-4">
        Your button text
      </Button>

      <Link to="/login">Go to login</Link>

      <LinkButton to="/login">Go to login</LinkButton>

      <Select
        class="w-full"
        :options="[
          {label: 'Last 7 days', value: '7'}, 
          {label: 'Last 30 days', value: '30'}, 
          {label: 'Last 90 days', value: '90'},
          {label: 'None', value: null}
        ]"
        v-model="selected"
      ></Select>

      <Select
        class="w-full"
        :options="[
          {label: 'Last 7 days', value: '7'}, 
          {label: 'Last 30 days', value: '30'}, 
          {label: 'Last 90 days', value: '90'},
          {label: 'None', value: null}
        ]"
        v-model="selected2"
        multiple
      ></Select>

      <Select
        class="w-full"
        :options="[
          {label: 'Last 7 days', value: '7', records: 110},
          {label: 'Last 30 days', value: '30', records: 320},
          {label: 'Last 90 days', value: '90', records: 310},
          {label: 'None', value: null}
        ]"
        v-model="selected"
      >
        <template #item="{option}">
          <div>
            <span>{{ option.label }}</span>
            <span class="ml-2 opacity-50">{{ option.records }} records</span>
          </div>
        </template>
        <template #selected-item="{option}">
          <span>{{ option.label }} 💫</span>
        </template>
      </Select>

      <Select
        class="w-full"
        :options="[
          {label: 'Last 7 days', value: '7'}, 
          {label: 'Last 30 days', value: '30'}, 
          {label: 'Last 90 days', value: '90'},
        ]"
        v-model="selected"
      >
        <template #extra-item>
          <LinkButton to="/ranges">Manage ranges</LinkButton>
        </template>

      </Select>


      <Input type="number" class="w-full">
        <template #suffix>
          USD
        </template>
      </Input>

      <Input type="text" class="w-full">
        <template #rightIcon>
          <IconSearchOutline class="w-5 h-5 text-lightPrimary dark:text-darkPrimary "/>
        </template>
      </Input>

      <Tooltip>
          <a :href="`https://google.com?q=adminforth`" target="_blank" >
              <IconCardSearch class="w-5 h-5 me-2"/>
          </a>

          <template #tooltip>
              Search for AdminForth
          </template>
      </Tooltip>

      <VerticalTabs>
        <template #tab:Profile>
          <IconUserCircleSolid class="w-5 h-5 me-2"/>
          Profile
        </template>
        <template #tab:Dashboard>
          <IconGridSolid class="w-5 h-5 me-2"/>
          Board
        </template>
        <template #Profile>
          <h3 class="text-lg font-bold text-lightPrimary dark:text-darkPrimary mb-2">Profile Tab</h3>
          <p class="mb-2">This is some placeholder content the Profile tab's associated content</p>
        </template>
        <template #Dashboard>
          Dashboard Tab Content 
        </template>
      </VerticalTabs>

      <Checkbox v-model="enable">
        Enable
      </Checkbox>

      <Dialog class="w-96">
        <template #trigger>
          <Button>Dialog Toggle</Button>
        </template>

        <div class="space-y-4">
          <p>This is the first paragraph of dialog content.</p>
          <p>And this is the second paragraph.</p>
        </div>
      </Dialog>
    </div>


    <div class="flex flex-col gap-10 m-10 mt-20">

      <Dialog
        class="w-96"
        header="Dialog Header"
      >
        <template #trigger>
          <Button>Dialog Toggle</Button>
        </template>

        <div class="space-y-4">
          <p>This is the first paragraph of dialog content.</p>
          <p>And this is the second paragraph.</p>
        </div>
      </Dialog>

      <Dropzone
        :extensions="['.jpg', '.jpeg', '.png']"
        :maxSizeBytes="1024 * 1024 * 2"
        :multiple="false"
        v-model="files"
      />

       <ProgressBar
        :currentValue="2600"
        :minValue="0"
        :maxValue="5000"
        :height="6"
                  :leftLabel="'Level 2'"
          :rightLabel="'Level 3'"
        showAnimation
        />

        <!-- <ProgressBar
          :currentValue="1070"
          :minValue="0"
          :maxValue="5000"
          :leftLabel="'Level 2'"
          :rightLabel="'Level 3'"
          :formatter="(value: number) => `${value} points`"
          :progressFormatter="(value: number, percentage: number) => `${value} done`"
        /> -->

        <div class="flex flex-col gap-2">
          <Skeleton class="w-full h-4" />
          <Skeleton class="w-full h-2" />
          <Skeleton class="w-full h-2" />
          <Skeleton class="w-full h-2" />
          <Skeleton class="w-full h-2" />
        </div>
        
        <Skeleton type="image" class="w-full h-full" />

        <Skeleton type="video" class="w-full h-full" />

        <Skeleton type="avatar" class="w-20 h-20" />

        <Table
          class="min-h-[250px]"
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
        ></Table>


        <Table
        class="min-h-[262px]"
          :columns="[
            { label: 'Name', fieldName: 'name' },
            { label: 'Age', fieldName: 'age' },
            { label: 'Country', fieldName: 'country' },
          ]"
          :data="[
            { name: 'John', age: 30, country: 'US' },
            { name: 'Rick', age: 25, country: 'CA' },
            { name: 'Alice', age: 35, country: 'BR' },
            { name: 'Colin', age: 40, country: 'AU' },
          ]"
          :pageSize="3"
        >
        </Table>

        <Spinner class="w-10 h-10" />
    </div>

  <div class="flex flex-col gap-10 m-10 mt-20">
    <CustomRangePicker
        :min="1"
        :max="100"
      />

    <Toast
      :toast="{
        id: '1',
        variant: 'info',
        message: 'This is an info toast',
        timeout: 'unlimited'
      }"
      @close="() => {}"
    />

    <Toast
      :toast="{
        id: '2',
        variant: 'danger',
        message: 'This is a danger toast',
        timeout: 'unlimited'
      }"
      @close="() => {}"
    />

    <Toast
      :toast="{
        id: '3',
        variant: 'warning',
        message: 'This is a warning toast',
        timeout: 'unlimited'
      }"
      @close="() => {}"
    />

    <Toast
      :toast="{
        id: '4',
        variant: 'success',
        message: 'This is a success toast',
        timeout: 'unlimited'
      }"
      @close="() => {}"
    />

    <Toast
      :toast="{
        id: '5',
        variant: 'info',
        messageHtml: '<b>This is HTML toast</b><br><i>with custom content</i>',
        timeout: 'unlimited'
      }"
      @close="() => {}"
    />

    <Toggle />

    <DatePicker
      v-model:valueStart="valueStart"
      :column="{ type: 'datetime' }"
      label="Pick start"
    />


    <Modal class="w-96" clickToCloseOutside>
      <template #trigger>
        <Button>Modal Toggle</Button>
      </template>

      <div class="space-y-4">
        <p>This is the first paragraph of dialog content.</p>
        <p>And this is the second paragraph.</p>
      </div>
    </Modal>

    <Button class="mt-48 ml-48" @click="createJob"> Create Job</Button>



  </div>


  </div>

</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Checkbox from '@/afcl/Checkbox.vue';
import { Button } from '@/afcl'
import { Link } from '@/afcl'
import { LinkButton } from '@/afcl'
import { Select } from '@/afcl'
import { Input } from '@/afcl'
import { Tooltip } from '@/afcl'
import { VerticalTabs } from '@/afcl'
import { IconGridSolid, IconUserCircleSolid } from '@iconify-prerendered/vue-flowbite';
import { Dialog } from '@/afcl';
import { Ref } from 'vue'
import { Dropzone } from '@/afcl'
import { Table } from '@/afcl'
import { ProgressBar } from '@/afcl';
import { Skeleton } from '@/afcl';
import { Spinner } from '@/afcl';
import { Toggle } from '@/afcl';
import { Modal } from '@/afcl';
import { IconSearchOutline } from '@iconify-prerendered/vue-flowbite'
import { DatePicker } from '@/afcl';
import CustomRangePicker from "@/components/CustomRangePicker.vue";
import Toast from '@/components/Toast.vue';
import { useAdminforth } from '@/adminforth';
import { callApi } from '@/utils';

const { alert } = useAdminforth();
import adminforth  from '@/adminforth';

const files: Ref<File[]> = ref([])

watch(files, (files) => {
  console.log('files selected', files);
  setTimeout(() => {
    // clear
    files.length = 0;
  }, 5000);
})
const enable = ref(false)
const selected = ref(null)
const selected2 = ref([])
const valueStart = ref()


watch(valueStart, (newVal) => {
  console.log('New start value:', newVal);
});

function doSmth(){
  alert({message: 'Hello world', variant: 'success'})
  adminforth.alert({message: 'You clicked the button!', variant: 'success' })
}

async function createJob() {
  try {
    const res = await callApi({path: '/api/create-job/', method: 'POST'});
    console.log('Job created successfully:', res);
  } catch (error) {
    console.error('Error creating job:', error);
  }
}

</script>