import { createRouter, createWebHistory } from 'vue-router'
import ResourceParent from '@/views/ResourceParent.vue'
import { useUserStore } from '@/stores/user'
/* IMPORTANT:ADMINFORTH ROUTES IMPORTS */

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: 'login' },
      beforeEnter: async (to, from, next) => {
        const userStore = useUserStore()
        if(localStorage.getItem('isAuthorized') === 'true'){
          next({name: 'home'})
        } else {
          next()
        }
      }
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
    /* IMPORTANT:ADMINFORTH ROUTES */
  ]
})





export default router
