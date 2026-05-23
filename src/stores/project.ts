import { defineStore } from 'pinia'
import type { ProjectId, SensorTab } from '@/types'

export const useProjectStore = defineStore('project', {
  state: () => ({
    selectedProject: 'shangtan' as ProjectId,
    activeTab: 'gnss' as SensorTab,
    selectedGnssSensor: 'GXZM-DB03'
  }),

  actions: {
    selectProject(id: ProjectId) {
      this.selectedProject = id
      // Al cambiar proyecto, resetear sensor GNSS según proyecto
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
    }
  }
})
