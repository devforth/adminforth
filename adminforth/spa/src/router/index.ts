import { createRouter, createWebHistory } from 'vue-router'
import ResourceParent from '@/views/ResourceParent.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/resource/:resourceId',
      component: ResourceParent,
      name: 'resource',
      children: [
        {
          path: '',
          component: () => import('@/views/ListView.vue'),
          name: 'resource-list'
        },
        {
          path: 'show/:primaryKey',
          component: () => import('@/views/ShowView.vue'),
          name: 'resource-show'
        },
        {
          path: 'edit/:primaryKey',
          component: () => import('@/views/EditView.vue'),
          name: 'resource-edit'
        },
        {
          path: 'create',
          component: () => import('@/views/CreateView.vue'),
          name: 'resource-create'
        },
      ]
    }, 
    /* IMPORTANT:ADMINFORTH ROUTES */
  ]
})

export default router
