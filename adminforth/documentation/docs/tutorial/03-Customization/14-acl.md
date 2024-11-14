# AdminForth Components Library


ACL is a new set of components which you can use as build blocks. 
This allows to keep the design consistent with minimal efforts. ACL components will follow styling standard and respect theme colors.


## Button

```vue
<Button @click="doSmth" :loader="showLoader" class="w-full">
  Your button text
</Button>
```

```js
import Button from '@/acl/Button.vue'
```

loader prop would show loader when it's true.


## Link

```vue
<Link to="/login">Go to login</Link>
```

```js
import Link from '@/acl/Link.vue'
```