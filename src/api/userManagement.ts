import api from './index'
import type { LoginResponse, Subscription, UserProfile, RegisterRequest } from '@/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  api.post<LoginResponse>('/api/v1/auth/login', { username, password })

// API espera snake_case en el body de registro
export const register = (data: RegisterRequest) =>
  api.post<UserProfile>('/api/v1/auth/register', data)

// ─── Users ───────────────────────────────────────────────────────────────────

export const getUser = (userId: number) =>
  api.get<UserProfile>(`/api/v1/users/${userId}`)

// API espera snake_case: phone_e164, email
export const updateUser = (
  userId: number,
  data: { phone_e164?: string; email?: string }
) => api.put<UserProfile>(`/api/v1/users/${userId}`, data)

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const getSubscriptions = (userId: number) =>
  api.get<Subscription[]>(`/api/v1/users/${userId}/subscriptions`)

// API espera snake_case en el body
export const createSubscription = (
  userId: number,
  data: {
    project_id: string
    min_alert_level: string
    sms_enabled: boolean
    push_enabled: boolean
    email_enabled: boolean
  }
) => api.post<Subscription>(`/api/v1/users/${userId}/subscriptions`, data)
