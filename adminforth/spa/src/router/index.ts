import { createRouter, createWebHistory } from 'vue-router';
import ResourceParent from '@/views/ResourceParent.vue';
import PageNotFound from '@/views/PageNotFound.vue';

/* IMPORTANT:ADMINFORTH ROUTES IMPORTS */

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { 
        title: 'Login', 
        customLayout: true 
      },
      // beforeEnter: async (to, from, next) => {
      //   if(localStorage.getItem('isAuthorized') === 'true') {
      //     // check if url has next=... and redirect to it
      //     console.log('to.query', to.query)
      //     if (to.query.next) {
      //       next(to.query.next.toString())
      //     } else {
      //       next({name: 'home'});
      //     }
      //   } else {
      //     next()
      //   }
      // }
    },
    {
      path: '/resource/:resourceId',
      component: ResourceParent,
      name: 'resource',
      children: [
        {
          path: '',
          component: () => import('@/views/ListView.vue'),
          name: 'resource-list',
          meta: { title: 'list',type: 'list' }
        },
        {
          path: 'show/:primaryKey',
          component: () => import('@/views/ShowView.vue'),
          name: 'resource-show',
          meta: { title: 'show', type: 'show'}

        },
        {
          path: 'edit/:primaryKey',
          component: () => import('@/views/EditView.vue'),
          name: 'resource-edit',
          meta: { title: 'edit', type: 'edit'}
        },
        {
          path: 'create',
          component: () => import('@/views/CreateView.vue'),
          name: 'resource-create',
          meta: { title: 'create', type: 'create'}

        },
      ]
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { 
        title: 'Settings', 
        customLayout: true 
      },
    },
    /* IMPORTANT:ADMINFORTH ROUTES */
    { path: "/:pathMatch(.*)*", component: PageNotFound },
  ]
})

export default router
