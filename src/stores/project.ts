import { defineStore } from 'pinia'
import api from '@/api'
import type { SensorTab, ProjectDetail, Alert, Subscription } from '@/types'

export const useProjectStore = defineStore('project', {
  state: () => ({
    selectedProject: 'shangtan' as string,
    activeTab: 'gnss' as SensorTab,
    selectedGnssSensor: 'GXZM-DB03',
    projects: [] as ProjectDetail[],
    alerts: [] as Alert[],
    pollingInterval: 3600,
    pollingError: null as string | null
  }),

  getters: {
    /** Alertas del proyecto actualmente seleccionado. */
    currentAlerts(state): Alert[] {
      return state.alerts.filter(a => a.project_id === state.selectedProject)
    },

    /** Nivel máximo de alerta de cualquier proyecto (para el mapa y el header). */
    alertLevelFor(state): (projectId: string) => string {
      return (projectId: string) => {
        const list = state.alerts.filter(a => a.project_id === projectId)
        if (list.some(a => a.level === 'red'))    return 'red'
        if (list.some(a => a.level === 'orange')) return 'orange'
        if (list.some(a => a.level === 'blue'))   return 'blue'
        return 'green'
      }
    }
  },

  actions: {
    selectProject(id: string) {
      this.selectedProject = id
      // Al cambiar proyecto, ajustar tab según disponibilidad
      if (id === 'lingzhan') {
        this.activeTab = 'deep_displacement'
      } else {
        if (this.activeTab === 'deep_displacement') this.activeTab = 'gnss'
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

    /**
     * Carga los proyectos del usuario:
     * 1. GET /api/v1/users/{userId}/subscriptions
     * 2. GET /api/v1/projects/{projectId}  (por cada subscripción)
     */
    async loadProjects(userId: number): Promise<void> {
      const subsRes = await api.get<Subscription[]>(`/api/v1/users/${userId}/subscriptions`)
      const projectIds = [...new Set(subsRes.data.map(s => s.projectId))]

      const projectResults = await Promise.allSettled(
        projectIds.map(id =>
          api.get<ProjectDetail>(`/api/v1/projects/${id}`).then(r => r.data)
        )
      )

      this.projects = projectResults
        .filter((r): r is PromiseFulfilledResult<ProjectDetail> => r.status === 'fulfilled')
        .map(r => r.value)

      // Si el proyecto seleccionado ya no existe en la lista, seleccionar el primero
      if (
        this.projects.length > 0 &&
        !this.projects.find(p => p.project_id === this.selectedProject)
      ) {
        this.selectProject(this.projects[0].project_id)
      }
    },

    /** GET /api/v1/alerts — reemplaza ACTIVE_ALERTS mock. */
    async loadAlerts(): Promise<void> {
      const res = await api.get<Alert[]>('/api/v1/alerts')
      this.alerts = res.data
    }
  }
})
