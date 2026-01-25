import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/order-list',
    name: 'OrderList',
    component: () => import('@/views/OrderList.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/payment',
    name: 'Payment',
    component: () => import('@/views/Payment.vue')
  },
  {
    path: '/success',
    name: 'Success',
    component: () => import('@/views/Success.vue')
  },
  {
    path: '/cancel',
    name: 'Cancel',
    component: () => import('@/views/Cancel.vue')
  },
  {
    path: '/pending',
    name: 'Pending',
    component: () => import('@/views/Pending.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
