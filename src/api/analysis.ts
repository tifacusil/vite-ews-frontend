import axios from 'axios'
import type {
  AnalysisHealthResponse,
  OutliersRequest,
  OutliersResponse,
  DenoiseRequest,
  DenoiseResponse,
  RegressionRequest,
  RegressionResponse,
  PredictRequest,
  PredictResponse,
} from '@/types'

const BASE = '/data-analysis/analysis'

const analysisApi = axios.create({
  baseURL: BASE,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

export const getHealth = () =>
  analysisApi.get<AnalysisHealthResponse>('/health')

export const detectOutliers = (body: OutliersRequest) =>
  analysisApi.post<OutliersResponse>('/outliers', body)

export const denoiseSeries = (body: DenoiseRequest) =>
  analysisApi.post<DenoiseResponse>('/denoise', body)

export const fitRegression = (body: RegressionRequest) =>
  analysisApi.post<RegressionResponse>('/regression', body)

export const predictSeries = (body: PredictRequest) =>
  analysisApi.post<PredictResponse>('/predict', body)
