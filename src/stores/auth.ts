import { defineStore } from 'pinia'
import api from '@/api'
import type { LoginResponse } from '@/types'

interface AuthUser {
  userId: number
  username: string
  role: string
}

function loadUser(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem('jwt_user') ?? 'null')
  } catch {
    return null
  }
}

/** Devuelve true si el token almacenado ya expiró (o no existe `expires_at`). */
function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('jwt_expires_at')
  if (!expiresAt) return false // sin info de expiración → asumir válido
  return Date.now() >= new Date(expiresAt).getTime() - 30_000
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('jwt_token') as string | null,
    user: loadUser()
  }),

  getters: {
    isAuthenticated(): boolean {
      return !!this.token && !isTokenExpired()
    }
  },

  actions: {
    async login(username: string, password: string): Promise<void> {
      const res = await api.post<LoginResponse>('/api/v1/auth/login', { username, password })
      const { token, user_id, username: uname, role, expires_at } = res.data
      this.token = token
      this.user = { userId: user_id, username: uname, role }
      localStorage.setItem('jwt_token', token)
      localStorage.setItem('jwt_user', JSON.stringify({ userId: user_id, username: uname, role }))
      if (expires_at) {
        localStorage.setItem('jwt_expires_at', expires_at)
      }
    },

    logout(): void {
      this.token = null
      this.user = null
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_user')
      localStorage.removeItem('jwt_expires_at')
      window.location.href = '/login'
    }
  }
})
