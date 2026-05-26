import { defineStore } from 'pinia'
import api from '@/api'
import type { SensorTab, ProjectDetail, Subscription, RecentAlert, RecentAlertsResponse, AlertLevel } from '@/types'

// Jerarquía de niveles: cuánto más alto el índice, más severo
const LEVEL_ORDER: AlertLevel[] = ['blue', 'orange', 'red']

function levelGte(level: AlertLevel, minLevel: AlertLevel): boolean {
  return LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(minLevel)
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    selectedProject: 'shangtan' as string,
    activeTab: 'gnss' as SensorTab,
    selectedGnssSensor: 'GXZM-DB03',
    projects: [] as ProjectDetail[],
    // Suscripciones del usuario (para filtrar por min_alert_level por proyecto)
    subscriptions: [] as Subscription[],
    // Alertas recientes ya filtradas por proyecto y suscripción
    alerts: [] as RecentAlert[],
    pollingInterval: 3600,
    pollingError: null as string | null
  }),

  getters: {
    /** Alertas del proyecto seleccionado, filtradas por min_alert_level de la suscripción. */
    currentAlerts(state): RecentAlert[] {
      if (!Array.isArray(state.alerts)) return []
      const sub = state.subscriptions.find(s => s.project_id === state.selectedProject)
      const minLevel: AlertLevel = sub?.min_alert_level ?? 'blue'
      return state.alerts.filter(
        a => a.project_id === state.selectedProject && levelGte(a.alert_level, minLevel)
      )
    },

    /** Nivel máximo de alerta de un proyecto (para el mapa y el header). */
    alertLevelFor(state): (projectId: string) => string {
      return (projectId: string) => {
        if (!Array.isArray(state.alerts)) return 'green'
        const list = state.alerts.filter(a => a.project_id === projectId)
        if (list.some(a => a.alert_level === 'red'))    return 'red'
        if (list.some(a => a.alert_level === 'orange')) return 'orange'
        if (list.some(a => a.alert_level === 'blue'))   return 'blue'
        return 'green'
      }
    },

    /** Sensores GNSS del proyecto seleccionado. */
    gnssSensors(state): string[] {
      const proj = state.projects.find(p => p.project_id === state.selectedProject)
      if (!proj?.sensors) return ['GXZM-DB03']
      return proj.sensors
        .filter(s => s.sensor_type === 'gnss' && !s.sensor_id.includes('BASE'))
        .map(s => s.sensor_id)
    }
  },

  actions: {
    selectProject(id: string) {
      this.selectedProject = id
      if (id === 'lingzhan') {
        this.activeTab = 'deep_displacement'
      } else {
        if (this.activeTab === 'deep_displacement') this.activeTab = 'gnss'
      }
      const proj = this.projects.find(p => p.project_id === id)
      if (proj?.sensors) {
        const first = proj.sensors.find(
          s => s.sensor_type === 'gnss' && !s.sensor_id.includes('BASE')
        )
        if (first) this.selectedGnssSensor = first.sensor_id
      }
    },

    setTab(tab: SensorTab) { this.activeTab = tab },
    setGnssSensor(sensorId: string) { this.selectedGnssSensor = sensorId },
    setPollingInterval(seconds: number) { this.pollingInterval = seconds },
    setPollingError(err: string | null) { this.pollingError = err },

    async loadProjects(userId: number): Promise<void> {
      // 1. Suscripciones del usuario
      const subsRes = await api.get<Subscription[]>(`/api/v1/users/${userId}/subscriptions`)
      this.subscriptions = Array.isArray(subsRes.data) ? subsRes.data : []
      const projectIds = [...new Set(this.subscriptions.map(s => s.project_id).filter(Boolean))]

      // 2. Detalle de cada proyecto
      const results = await Promise.allSettled(
        projectIds.map(id =>
          api.get<ProjectDetail>(`/api/v1/projects/${id}`).then(r => r.data)
        )
      )
      this.projects = results
        .filter((r): r is PromiseFulfilledResult<ProjectDetail> => r.status === 'fulfilled')
        .map(r => r.value)

      // 3. Seleccionar proyecto
      if (this.projects.length > 0 && !this.projects.find(p => p.project_id === this.selectedProject)) {
        this.selectProject(this.projects[0].project_id)
      } else {
        this.selectProject(this.selectedProject)
      }
    },

    /**
     * GET /alerts/recent — servicio de alertas en puerto 8088.
     * No requiere auth. Trae las 200 más recientes y filtra por proyectos del usuario.
     */
    async loadAlerts(): Promise<void> {
      try {
        const res = await api.get<RecentAlertsResponse>('/api/v1/alerts/recent', {
          params: { limit: 200 }
        })
        const allAlerts = Array.isArray(res.data?.alerts) ? res.data.alerts : []

        // Filtrar solo los proyectos a los que el usuario está suscrito
        const myProjects = new Set(this.subscriptions.map(s => s.project_id))
        this.alerts = allAlerts.filter(a => myProjects.size === 0 || myProjects.has(a.project_id))
      } catch {
        this.alerts = []
      }
    }
  }
})
