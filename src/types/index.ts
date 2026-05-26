// ─── Project & Alert types ──────────────────────────────────────────────────

export type ProjectId = 'shangtan' | 'lingzhan'
export type AlertLevel = 'blue' | 'orange' | 'red'
export type SensorTab = 'gnss' | 'rainfall' | 'soil_pressure' | 'strain' | 'deep_displacement'

export interface Project {
  project_id: ProjectId
  lat: number
  lng: number
  name: string
}

export interface ActiveAlert {
  sensor_id: string
  level: AlertLevel
  speed_mm_day: number
  timestamp: string
  project_id: ProjectId
}

// ─── Sensor envelope ────────────────────────────────────────────────────────

export interface SensorEnvelope<T> {
  project_id: string
  sensor_id: string
  sensor_type: SensorTab
  sampling_interval_seconds: number
  data: T[]
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string
  userId: number
  username: string
  role: string
  expiresAt: string
}

// ─── User Management ─────────────────────────────────────────────────────────

export interface Subscription {
  id: number
  projectId: string
  minAlertLevel: AlertLevel
  smsEnabled: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

// ─── Project Management ──────────────────────────────────────────────────────

export interface ProjectDetail {
  project_id: string
  name: string
  location_lat: number
  location_lng: number
  status: string
  created_at: string
}

// ─── Alert (Early Warning — API) ─────────────────────────────────────────────

export interface Alert {
  sensor_id: string
  project_id: string
  level: AlertLevel
  speed_mm_day: number
  timestamp: string
}

// ─── GNSS — REQ-WEB-04 ──────────────────────────────────────────────────────

export type FixQuality = 'rtk_fixed' | 'rtk_float' | 'dgps' | 'autonomous'

export interface GnssReading {
  timestamp: string
  displacement_x_mm: number
  displacement_y_mm: number
  displacement_horizontal_mm: number
  cumulative_displacement_mm: number
  fix_quality: FixQuality
}

// ─── Rainfall — REQ-WEB-05 ──────────────────────────────────────────────────

export interface RainfallReading {
  timestamp: string
  rainfall_mm: number
  cumulative_rainfall_mm: number
  interval_minutes: number
}

// ─── Soil Pressure — REQ-WEB-06 ─────────────────────────────────────────────

export interface SoilPressureReading {
  timestamp: string
  pressure_kpa: number
  temperature_celsius: number
}

// ─── Strain — REQ-WEB-07 ────────────────────────────────────────────────────

export interface StrainReading {
  timestamp: string
  strain_microstrain: number
  temperature_celsius: number
}

// ─── Deep Displacement — REQ-WEB-08 ─────────────────────────────────────────

export interface DeepDisplacementReading {
  timestamp: string
  depth_m: number
  tilt_x_mm: number
  tilt_y_mm: number
  cumulative_tilt_mm: number
}

// ─── User Management — perfil y registro ─────────────────────────────────────

export interface UserProfile {
  userId: number
  username: string
  email: string
  phoneE164: string | null
  role: string
  status: string
  createdAt: string
}

export interface RegisterRequest {
  username: string
  email: string
  phoneE164?: string
  password: string
  role: 'admin' | 'operator' | 'viewer'
}

// ─── Date range filter ───────────────────────────────────────────────────────

export type DateRange = '3m' | '6m' | '1y'
