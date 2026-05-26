import { defineStore } from 'pinia'
import api from '@/api'
import type { SensorTab, ProjectDetail, Subscription } from '@/types'

// Alert interno normalizado (no hay endpoint /alerts, se deriva de lecturas futuras)
export interface StoreAlert {
  sensor_id: string
  project_id: string
  level: 'blue' | 'orange' | 'red'
  speed_mm_day: number
  timestamp: string
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    selectedProject: 'shangtan' as string,
    activeTab: 'gnss' as SensorTab,
    selectedGnssSensor: 'GXZM-DB03',
    projects: [] as ProjectDetail[],
    alerts: [] as StoreAlert[],
    pollingInterval: 3600,
    pollingError: null as string | null
  }),

  getters: {
    currentAlerts(state): StoreAlert[] {
      if (!Array.isArray(state.alerts)) return []
      return state.alerts.filter(a => a.project_id === state.selectedProject)
    },

    alertLevelFor(state): (projectId: string) => string {
      return (projectId: string) => {
        if (!Array.isArray(state.alerts)) return 'green'
        const list = state.alerts.filter(a => a.project_id === projectId)
        if (list.some(a => a.level === 'red'))    return 'red'
        if (list.some(a => a.level === 'orange')) return 'orange'
        if (list.some(a => a.level === 'blue'))   return 'blue'
        return 'green'
      }
    },

    /** Sensores GNSS del proyecto seleccionado (de la lista de sensores del proyecto). */
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
      // Resetear sensor GNSS al primero disponible
      const proj = this.projects.find(p => p.project_id === id)
      if (proj?.sensors) {
        const first = proj.sensors.find(
          s => s.sensor_type === 'gnss' && !s.sensor_id.includes('BASE')
        )
        if (first) this.selectedGnssSensor = first.sensor_id
      }
    },

    setTab(tab: SensorTab) {
      this.activeTab = tab
    },

    setGnssSensor(sensorId: string) {
      this.selectedGnssSensor = sensorId
    },

    setPollingInterval(seconds: number) {
      this.pollingInterval = seconds
    },

    setPollingError(err: string | null) {
      this.pollingError = err
    },

    async loadProjects(userId: number): Promise<void> {
      // 1. Obtener suscripciones (API devuelve snake_case)
      const subsRes = await api.get<Subscription[]>(`/api/v1/users/${userId}/subscriptions`)
      const projectIds = [...new Set(subsRes.data.map(s => s.project_id).filter(Boolean))]

      // 2. Cargar detalle de cada proyecto
      const results = await Promise.allSettled(
        projectIds.map(id =>
          api.get<ProjectDetail>(`/api/v1/projects/${id}`).then(r => r.data)
        )
      )

      this.projects = results
        .filter((r): r is PromiseFulfilledResult<ProjectDetail> => r.status === 'fulfilled')
        .map(r => r.value)

      // 3. Seleccionar primer proyecto si el actual no está en la lista
      if (
        this.projects.length > 0 &&
        !this.projects.find(p => p.project_id === this.selectedProject)
      ) {
        this.selectProject(this.projects[0].project_id)
      } else {
        // Asegurar que el sensor GNSS por defecto es válido para este proyecto
        this.selectProject(this.selectedProject)
      }
    },

    /** El endpoint /alerts no existe en la API actual — no hace nada. */
    async loadAlerts(): Promise<void> {
      // Reservado para cuando la API implemente GET /api/v1/alerts
      this.alerts = []
    }
  }
})
