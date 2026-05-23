import type { Project, ActiveAlert } from '@/types'

export { gnssMockData, GNSS_SENSORS } from './gnss'
export { rainfallMockData } from './rainfall'
export { soilPressureMockData } from './soilPressure'
export { strainMockData } from './strain'
export { deepDisplacementMockData } from './deepDisplacement'

// ─── Proyectos ───────────────────────────────────────────────────────────────

export const PROJECTS: Project[] = [
  { project_id: 'shangtan', lat: 24.52, lng: 111.30, name: 'Shangtan (上滩)' },
  { project_id: 'lingzhan', lat: 24.38, lng: 106.55, name: 'Lingzhan (岭寨)' }
]

// ─── Alertas activas por proyecto ────────────────────────────────────────────

export const ACTIVE_ALERTS: Record<string, ActiveAlert[]> = {
  shangtan: [
    {
      sensor_id: 'GXZM-DB03',
      level: 'orange',
      speed_mm_day: 14.31,
      timestamp: '2019-07-01T16:40:00Z',
      project_id: 'shangtan'
    },
    {
      sensor_id: 'GXZM-DB04',
      level: 'blue',
      speed_mm_day: 10.55,
      timestamp: '2019-07-01T16:40:00Z',
      project_id: 'shangtan'
    }
  ],
  lingzhan: [
    {
      sensor_id: 'LZ-DB01',
      level: 'red',
      speed_mm_day: 21.4,
      timestamp: '2019-07-01T18:00:00Z',
      project_id: 'lingzhan'
    }
  ]
}

/** Máximo nivel de alerta de un proyecto ('green' si no hay alertas). */
export function projectAlertLevel(projectId: string): string {
  const alerts = ACTIVE_ALERTS[projectId] ?? []
  if (alerts.some(a => a.level === 'red')) return 'red'
  if (alerts.some(a => a.level === 'orange')) return 'orange'
  if (alerts.some(a => a.level === 'blue')) return 'blue'
  return 'green'
}
