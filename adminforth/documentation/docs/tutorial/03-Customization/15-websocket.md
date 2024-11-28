
# Websocket

AdminForth provide own build-in websocket interface which allows to stream some data to frontend from backend.

In two words, to subscribe to a topic from any frontend component you need to do next

```javascript
import websocket from '@/websocket';

websocket.subscribe('/topic-name', (data) => {
  // this callback called when we receive publish in topic from the websocket
  console.log(data);
});
```

On server you can publish data to the topic by calling

```javascript
admin.websocket.publish('/topic-name', {some: 'data'});
```

Let's consider a real-world example.

## Usage example

Let's say we want to show realtor sum of all his properties in the AdminForth in header.

Create a component `PropertyCost.vue`:

```html title="./custom/PropertyCost.vue"
<template>
  <div v-show="totalCost !== null" 
    class="flex items-center justify-center w-full h-full bg-gray-100 text-gray-800 text-xs font-medium p-1 rounded 
      dark:bg-gray-700 dark:text-gray-300">
      <Tooltip>
        <template #tooltip>
          <div class="text-sm">Your total property cost</div>
        </template>
        <IconDollarOutline class="text-2xl opacity-50" />
        <div class="text-2xl text-gray-900 dark:text-white"> {{totalCost}}</div>
      </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref } from 'vue';
import { ref } from 'vue';
import websocket from '@/websocket';
import { IconDollarOutline } from '@iconify-prerendered/vue-flowbite';
import { Tooltip } from '@/afcl';

import type { AdminUser } from '@/types/Common';

const props = defineProps({
  adminUser: AdminUser,
});

const totalCost: Ref<number|null> = ref(null);

onMounted(() => {
  websocket.subscribe(`/property-cost/${props.adminUser!.pk}`, (data: any) => {
    // this callback called when we receive publish in topic from the websocket
    totalCost.value = data.totalCost;
  });
});

onOnUnmounted(() => {
  // will be called on logout
  websocket.unsubscribeAll();
});

</script>
```


Add this component into the header of the AdminForth:

```javascript title="./index.ts"
...
const admin = new AdminForth({
  ...
  customization: {
    ...
//diff-add      
    globalInjections: {
//diff-add
      header: '@@/PropertyCost.vue',
//diff-add
    }
  }
});
```

Now, in after-save hook on apartments we will calculate the sum price of all apartments for the realtor and send it to the frontend.


```javascript title="./resources/apartment.ts"
hooks: {
//diff-add
  edit: {
//diff-add
    afterSave: async ({ record, adminUser, resource, adminforth }) => {
//diff-add
      //  if realtor id is set, recalculate total cost of all apartments
//diff-add
      if (record.realtor_id) {
//diff-add
        const totalCost = (await adminforth.resource('aparts').list(Filters.EQ('realtor_id', record.realtor_id)))
//diff-add
          .map((r) => r.price).reduce((a, b) => a + b, 0);
//diff-add
        adminforth.websocket.publish(`/property-cost/${record.realtor_id}`, { type: 'message', totalCost });
//diff-add
      }
//diff-add
      return { ok: true }
//diff-add
    }
//diff-add
  },
}
```

### Initial loading

If you will try to load the page now it would not show up initial cost, but should show it once you re-save apartment.

To fix this we can do 2 ways:
- Create a dedicated API to load initial cost on PropertyCost component mount
- Catch connection to websocket, parse `realtor_id` from the topic and stream initial cost

Second way is more elegant and we will use it.

```javascript title="./index.ts"
...

const admin = new AdminForth({
  ...
  auth: {
//diff-add
    websocketSubscribed: async (topic, adminUser) => {
//diff-add
      const [subject, param] = /^\/(.+?)\/(.+)/.exec(topic)!.slice(1);
//diff-add
      if (subject === 'property-cost') {
//diff-add
        const userId = param;
//diff-add
        const totalCost = (await admin.resource('aparts').list(Filters.EQ('realtor_id', userId)))
//diff-add
          .map((r) => r.price).reduce((a, b) => a + b, 0);
//diff-add
        admin.websocket.publish(topic, { type: 'message', totalCost });
//diff-add
      }
//diff-add
    }
  }
  ...
});

```

### Authorization

Currently, any user can subscribe to the any topic. Though topic already has user id in it, we should explicitly check that user can subscribe to his own topic using `config.auth.websocketTopicAuth`


```javascript title="./index.ts"
...

const admin = new AdminForth({
  ...
  auth: {
//diff-add
    websocketTopicAuth: async (topic: string, adminUser: AdminUser) => {
//diff-add
      if (!adminUser) {
//diff-add
        // don't allow anonymous users to subscribe
//diff-add
        return false;
      }
//diff-add
      const [subject, param] = /^\/(.+?)\/(.+)/.exec(topic)!.slice(1);
//diff-add
      console.log(`Websocket user ${adminUser.username} tries to subscribe to topic ${subject} with param ${param}`);
//diff-add
      if (subject === 'property-cost') {
//diff-add
        return param === adminUser.dbUser.id;
//diff-add
      }
//diff-add
      // any other events are not allowed
//diff-add
      return false;
//diff-add
    },
    websocketSubscribed:...
  }
  ...
});
  
``` 