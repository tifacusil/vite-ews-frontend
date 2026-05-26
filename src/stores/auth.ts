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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('jwt_token') as string | null,
    user: loadUser()
  }),

  getters: {
    isAuthenticated(): boolean {
      return !!this.token
    }
  },

  actions: {
    async login(username: string, password: string): Promise<void> {
      const res = await api.post<LoginResponse>('/api/v1/auth/login', { username, password })
      const { token, userId, username: uname, role } = res.data
      this.token = token
      this.user = { userId, username: uname, role }
      localStorage.setItem('jwt_token', token)
      localStorage.setItem('jwt_user', JSON.stringify({ userId, username: uname, role }))
    },

    logout(): void {
      this.token = null
      this.user = null
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('jwt_user')
      window.location.href = '/login'
    }
  }
})
