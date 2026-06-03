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

// ─── Recent Alerts (puerto 8088 — /alerts/recent) ────────────────────────────

export interface RecentAlert {
  alert_level: AlertLevel
  alert_type: string
  current_displacement_mm: number
  previous_displacement_mm: number
  deformation_speed_mm_day: number
  threshold_mm_day: number
  message_id: string
  project_id: string
  sensor_id: string
  schema_version: string
  timestamp: string
}

export interface RecentAlertsResponse {
  alerts: RecentAlert[]
}

// ─── Date range filter ───────────────────────────────────────────────────────

export type DateRange = '3m' | '6m' | '1y'

// ─── Analysis Service ────────────────────────────────────────────────────────

export interface AnalysisRequest {
  values: number[]
  timestamps: string[]
}

// Health

export interface AnalysisHealthResponse {
  status: 'ok' | 'degraded'
  redis: 'connected' | 'unavailable'
  consul: 'registered' | 'unregistered'
  version: string
  libs: {
    pywt: 'available' | 'unavailable'
    PyEMD: 'available' | 'unavailable'
    statsmodels: 'available' | 'unavailable'
  }
}

// Outliers

export type OutlierMethod = '3sigma' | 'chauvenet' | 'iqr'

export interface OutliersRequest extends AnalysisRequest {
  method: OutlierMethod
}

export interface OutlierItem {
  index: number
  timestamp: string
  value: number
  threshold_upper?: number
  threshold_lower?: number
  criterion?: 'exceeds_upper' | 'exceeds_lower'
  z_score?: number
  probability?: number
}

export interface OutliersResponse {
  method: OutlierMethod
  outliers: OutlierItem[]
  statistics: {
    mean: number
    std: number
    n: number
    outlier_count: number
  }
}

// Denoise

export type DenoiseMethod = 'wavelet' | 'emd' | 'svm'

export interface DenoiseRequest extends AnalysisRequest {
  method: DenoiseMethod
}

export interface DenoiseParamsWavelet {
  wavelet: string
  level: number
  threshold: number
  mode: string
  sigma: number
}

export interface DenoiseParamsEmd {
  imf_count: number
  removed_imfs: number[]
  strategy: string
  quantile: number
  zcrs: number[]
}

export interface DenoiseParamsSvm {
  kernel: string
  C: number
  epsilon: number
  gamma: number
  feature: string
}

export interface DenoiseParamsFallback {
  fallback: 'moving_average'
  window: number
}

export interface DenoiseResponse {
  denoised_values: number[]
  method: DenoiseMethod
  params: DenoiseParamsWavelet | DenoiseParamsEmd | DenoiseParamsSvm | DenoiseParamsFallback
}

// Regression

export type RegressionModel = 'polynomial' | 'bayesian'

export interface RegressionRequest extends AnalysisRequest {
  model: RegressionModel
  degree?: number
}

export interface RegressionResponse {
  coefficients: number[]
  fitted_values: number[]
  r2_score: number
  model: RegressionModel
  degree: number | null
}

// Predict

export type PredictModel = 'arima' | 'gm11'

export interface PredictRequest extends AnalysisRequest {
  model: PredictModel
  horizon: number
  arima_order?: [number, number, number]
}

export interface PredictResponse {
  predicted_values: number[]
  predicted_timestamps: string[]
  confidence_lower: number[] | null
  confidence_upper: number[] | null
  model: PredictModel
  horizon: number
  order: [number, number, number] | null
}

// Error

export interface AnalysisErrorResponse {
  error: 'validation_error' | 'internal_error'
  message: string | Record<string, string[]>
}
