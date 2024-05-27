import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ResourceParent from '@/views/ResourceParent.vue'
import ListView from '@/views/ListView.vue'
import ShowView from '@/views/ShowView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/resource/:resourceId',
      component: ResourceParent,
      name: 'resource',
      children: [
        {
          path: '',
          component: ListView,
          name: 'resource-list'
        },
        {
          path: 'show/:primaryKey',
          component: () => ShowView,
          name: 'resource-show'
        }
      ]
    }, 
  ]
})

export default router
