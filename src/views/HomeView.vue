<template>
  <div class="flex flex-col h-screen min-w-[1280px] overflow-hidden">

    <!-- Header -->
    <header class="flex items-center gap-4 px-5 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm shrink-0">
      <div class="flex items-center gap-2">
        <!-- Logo EWS -->
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="13" fill="#1e3a5f" stroke="#3B82F6" stroke-width="1.5"/>
          <path d="M8 20 L14 8 L20 20" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" fill="none"/>
          <circle cx="14" cy="20" r="2" fill="#F97316"/>
        </svg>
        <span class="font-bold text-sm tracking-wide text-gray-100">EWS</span>
        <span class="text-gray-500 text-xs">Early Warning System · Bai et al. (2020)</span>
      </div>

      <!-- Indicador de proyecto activo -->
      <div class="ml-auto flex items-center gap-3">
        <div
          v-for="p in PROJECTS"
          :key="p.project_id"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer"
          :class="store.selectedProject === p.project_id
            ? 'border-blue-500 bg-blue-500/10 text-blue-300'
            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500'"
          @click="store.selectProject(p.project_id)"
        >
          <span
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: ALERT_COLORS[projectAlertLevel(p.project_id)] }"
          ></span>
          {{ p.name }}
        </div>

        <!-- Indicador polling -->
        <div class="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            class="w-1.5 h-1.5 rounded-full animate-pulse"
            :class="pollingError ? 'bg-red-500' : 'bg-green-500'"
          ></span>
          {{ pollingError ? 'Error' : 'Activo' }}
          · {{ pollingInterval }}s
        </div>
      </div>
    </header>

    <!-- Main — 2 columns -->
    <main class="flex flex-1 min-h-0 overflow-hidden">

      <!-- LEFT COLUMN 30% -->
      <aside class="w-[30%] shrink-0 flex flex-col gap-0 border-r border-gray-800 bg-gray-900 overflow-y-auto p-4">
        <!-- Mapa -->
        <div class="h-[280px] shrink-0">
          <ProjectMap />
        </div>

        <!-- Panel de alertas -->
        <AlertsPanel />
      </aside>

      <!-- RIGHT COLUMN 70% -->
      <section class="flex-1 min-w-0 flex flex-col bg-gray-950 overflow-hidden">

        <!-- Tabs -->
        <nav class="flex shrink-0 border-b border-gray-800 bg-gray-900/60 overflow-x-auto">
          <button
            v-for="tab in TABS"
            :key="tab.id"
            @click="store.setTab(tab.id)"
            class="relative flex items-center gap-2 px-5 py-3 text-xs font-medium whitespace-nowrap
                   transition-colors focus:outline-none"
            :class="store.activeTab === tab.id
              ? 'text-white border-b-2 border-blue-500 bg-gray-900'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'"
          >
            <span>{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </button>
        </nav>

        <!-- Chart area -->
        <div class="flex-1 min-h-0 p-5 overflow-hidden">
          <Transition name="fade" mode="out-in">
            <div :key="store.activeTab" class="h-full">
              <component :is="activeChart" class="h-full" />
            </div>
          </Transition>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProjectStore } from '@/stores/project'
import { PROJECTS, projectAlertLevel } from '@/data/mock'
import type { SensorTab } from '@/types'

import ProjectMap from '@/components/ProjectMap.vue'
import AlertsPanel from '@/components/AlertsPanel.vue'
import GnssChart from '@/components/charts/GnssChart.vue'
import RainfallChart from '@/components/charts/RainfallChart.vue'
import SoilPressureChart from '@/components/charts/SoilPressureChart.vue'
import StrainChart from '@/components/charts/StrainChart.vue'
import DeepDisplacementChart from '@/components/charts/DeepDisplacementChart.vue'

const store = useProjectStore()

const ALERT_COLORS: Record<string, string> = {
  red:    '#EF4444',
  orange: '#F97316',
  blue:   '#3B82F6',
  green:  '#22C55E'
}

interface TabDef {
  id: SensorTab
  label: string
  icon: string
}

const TABS: TabDef[] = [
  { id: 'gnss',              label: 'GNSS — Desplazamiento superficial', icon: '📡' },
  { id: 'rainfall',          label: 'Precipitación',                     icon: '🌧️' },
  { id: 'soil_pressure',     label: 'Presión de suelo',                  icon: '⛰️' },
  { id: 'strain',            label: 'Deformación (Strain)',              icon: '📏' },
  { id: 'deep_displacement', label: 'Despl. profundo (Inclinómetro)',    icon: '🕳️' }
]

const CHART_MAP: Record<SensorTab, unknown> = {
  gnss:              GnssChart,
  rainfall:          RainfallChart,
  soil_pressure:     SoilPressureChart,
  strain:            StrainChart,
  deep_displacement: DeepDisplacementChart
}

const activeChart = computed(() => CHART_MAP[store.activeTab])

// Simular polling — usa usePolling con datos mock (REQ-WEB-09)
// En producción: fetchFn llamaría al endpoint real; el interval vendría
// del último envelope (sampling_interval_seconds).
const pollingInterval = ref(3600)
const pollingError = ref<string | null>(null)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
