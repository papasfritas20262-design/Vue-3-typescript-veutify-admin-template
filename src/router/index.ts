import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { watch } from 'vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pedidos',
    name: 'Pedidos',
    component: () => import('@/views/OrdersView.vue'),
    meta: { title: 'Gestion de Pedidos', requiresAuth: true },
  },
  {
    path: '/clientes',
    name: 'Clientes',
    component: () => import('@/views/CustomersView.vue'),
    meta: { title: 'Gestion de Clientes', requiresAuth: true },
  },
  {
    path: '/productos',
    name: 'Productos',
    component: () => import('@/views/ProductsView.vue'),
    meta: { title: 'Gestion de Productos', requiresAuth: true },
  },
  {
    path: '/categorias',
    name: 'Categorias',
    component: () => import('@/views/CategoriesView.vue'),
    meta: { title: 'Gestion de Categorias', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const waitUntilLoaded = (authStore: any) => {
  return new Promise<void>((resolve) => {
    if (!authStore.loading) return resolve()

    const timeout = setTimeout(() => {
      console.warn('Auth timeout: Firebase tardo demasiado.')
      stop()
      resolve()
    }, 5000)

    const stop = watch(
      () => authStore.loading,
      (loading) => {
        if (!loading) {
          clearTimeout(timeout)
          stop()
          resolve()
        }
      }
    )
  })
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  await waitUntilLoaded(authStore)

  const isLoggedIn = !!authStore.user
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !isLoggedIn) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && isLoggedIn) {
    return { name: 'Dashboard' }
  }

  return true
})

export default router
