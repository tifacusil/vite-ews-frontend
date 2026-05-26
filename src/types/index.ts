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

// ─── Sensor readings API response ────────────────────────────────────────────
// La API devuelve: { total, offset, limit, items: [{ projectId, sensorId, timestamp, payload }] }

export interface ApiReadingItem<TPayload> {
  projectId: string
  sensorId: string
  sensorType: string
  timestamp: string
  receivedAt: string
  payload: TPayload
}

export interface ApiReadingsResponse<TPayload> {
  total: number
  offset: number
  limit: number
  items: ApiReadingItem<TPayload>[]
}

// ─── Auth ────────────────────────────────────────────────────────────────────
// La API devuelve snake_case: user_id, expires_at

export interface LoginResponse {
  token: string
  user_id: number
  username: string
  role: string
  expires_at: string
}

// ─── User Management ─────────────────────────────────────────────────────────
// La API devuelve snake_case en todos los campos

export interface Subscription {
  id: number
  project_id: string
  min_alert_level: AlertLevel
  sms_enabled: boolean
  push_enabled: boolean
  email_enabled: boolean
}

// ─── Project Management ──────────────────────────────────────────────────────

export interface ProjectDetail {
  project_id: string
  name: string
  location_lat: number
  location_lng: number
  status: string
  created_at: string
  sensors?: ProjectSensor[]
}

export interface ProjectSensor {
  sensor_id: string
  project_id: string
  sensor_type: string
  model: string
  status: string
}

// ─── User Profile ─────────────────────────────────────────────────────────────
// La API devuelve snake_case: user_id, phone_e164, created_at

export interface UserProfile {
  user_id: number
  username: string
  email: string
  phone_e164: string | null
  role: string
  status: string
  created_at: string
}

export interface RegisterRequest {
  username: string
  email: string
  phone_e164?: string
  password: string
  role: 'admin' | 'operator' | 'viewer'
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

// ─── Date range filter ───────────────────────────────────────────────────────

export type DateRange = '3m' | '6m' | '1y'
