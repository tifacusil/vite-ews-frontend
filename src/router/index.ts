import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true }
    },
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { requiresAdmin: true }
    }
  ]
})

router.beforeEach(to => {
  const token = localStorage.getItem('jwt_token')

  // Rutas públicas — sin guard
  if (to.meta.public) return

  // Sin token → login
  if (!token) return { name: 'login' }

  // Guard de admin
  if (to.meta.requiresAdmin) {
    try {
      const user = JSON.parse(localStorage.getItem('jwt_user') ?? 'null')
      if (user?.role !== 'admin') return { name: 'home' }
    } catch {
      return { name: 'home' }
    }
  }
})

export default router
