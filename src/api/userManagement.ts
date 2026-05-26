import api from './index'
import type { LoginResponse, Subscription, UserProfile, RegisterRequest } from '@/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login = (username: string, password: string) =>
  api.post<LoginResponse>('/api/v1/auth/login', { username, password })

export const register = (data: RegisterRequest) =>
  api.post<UserProfile>('/api/v1/auth/register', data)

// ─── Users ───────────────────────────────────────────────────────────────────

export const getUser = (userId: number) =>
  api.get<UserProfile>(`/api/v1/users/${userId}`)

export const updateUser = (
  userId: number,
  data: { phoneE164?: string; email?: string }
) => api.put<UserProfile>(`/api/v1/users/${userId}`, data)

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const getSubscriptions = (userId: number) =>
  api.get<Subscription[]>(`/api/v1/users/${userId}/subscriptions`)

export const createSubscription = (
  userId: number,
  data: Omit<Subscription, 'id'>
) => api.post<Subscription>(`/api/v1/users/${userId}/subscriptions`, data)
