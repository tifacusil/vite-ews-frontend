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

/** Devuelve true si existe un token vigente (no expirado). */
function hasValidToken(): boolean {
  const token = localStorage.getItem('jwt_token')
  if (!token) return false
  const expiresAt = localStorage.getItem('jwt_expires_at')
  if (!expiresAt) return true // sin info → asumir válido, el interceptor del API lo controlará
  return Date.now() < new Date(expiresAt).getTime() - 30_000
}

router.beforeEach(to => {
  // Rutas públicas — sin guard
  if (to.meta.public) return

  // Sin token válido → login
  if (!hasValidToken()) {
    // Limpiar storage si el token expiró
    if (localStorage.getItem('jwt_token')) {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_user')
      localStorage.removeItem('jwt_expires_at')
    }
    return { name: 'login' }
  }

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
