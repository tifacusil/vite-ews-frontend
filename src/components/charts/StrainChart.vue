<template>
  <div class="flex flex-col h-full gap-3 overflow-hidden">
    <div class="flex items-center gap-3 text-xs">
      <span class="font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700 text-gray-300">GXZM-SG02</span>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" v-model="showTemperature" class="accent-amber-500 w-3.5 h-3.5" />
        <span class="text-gray-400">Mostrar temperatura (°C)</span>
      </label>
      <span v-if="loading" class="ml-auto text-gray-500 animate-pulse">Cargando…</span>
      <span v-else-if="error" class="ml-auto text-red-400">⚠ Error al cargar</span>
    </div>

    <div v-if="error && !loading"
      class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
      {{ error }}
    </div>

    <div class="flex-1 min-h-0">
      <VChart :option="chartOption" autoresize class="w-full h-full" />
    </div>

    <AnalysisPanel
      :values="sensorData.map(r => r.strain_microstrain)"
      :timestamps="sensorData.map(r => r.timestamp)"
      unit="µε"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import api from '@/api'
import type { ApiReadingsResponse, StrainReading } from '@/types'
import AnalysisPanel from '@/components/AnalysisPanel.vue'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const SENSOR_ID = 'GXZM-SG02'
const sensorData = ref<StrainReading[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showTemperature = ref(true)

let pollTimer: ReturnType<typeof setTimeout> | null = null

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get<ApiReadingsResponse<StrainReading>>(
      `/api/v1/sensors/${SENSOR_ID}/readings`,
      { params: { sensor_type: 'strain', limit: 1000 } }
    )
    sensorData.value = res.data.items.map(item => ({ timestamp: item.timestamp, ...item.payload }))
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
    if (pollTimer !== null) clearTimeout(pollTimer)
    pollTimer = setTimeout(fetchData, 3600 * 1000)
  }
}

onMounted(fetchData)
onUnmounted(() => { if (pollTimer !== null) clearTimeout(pollTimer) })

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  textStyle: { color: '#9ca3af' },
  tooltip: { trigger: 'axis', backgroundColor: '#1f2937', borderColor: '#374151', textStyle: { color: '#f3f4f6', fontSize: 12 } },
  legend: { data: showTemperature.value ? ['Deformación (µε)', 'Temperatura (°C)'] : ['Deformación (µε)'], textStyle: { color: '#9ca3af', fontSize: 11 }, top: 0 },
  grid: { top: 40, right: showTemperature.value ? 70 : 20, bottom: 60, left: 72 },
  xAxis: { type: 'time', axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6b7280', fontSize: 10 }, splitLine: { lineStyle: { color: '#1f2937' } } },
  yAxis: [
    { type: 'value', name: 'µε', nameTextStyle: { color: '#6b7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6b7280', fontSize: 10 }, splitLine: { lineStyle: { color: '#1f2937' } } },
    ...(showTemperature.value ? [{ type: 'value', name: '°C', nameTextStyle: { color: '#6b7280', fontSize: 10 }, position: 'right', axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6b7280', fontSize: 10 }, splitLine: { show: false } }] : [])
  ],
  dataZoom: [
    { type: 'slider', bottom: 8, height: 20, textStyle: { color: '#6b7280' }, borderColor: '#374151', fillerColor: 'rgba(244,114,182,0.1)', handleStyle: { color: '#f472b6' } },
    { type: 'inside' }
  ],
  series: [
    { name: 'Deformación (µε)', type: 'line', yAxisIndex: 0, smooth: true, showSymbol: false, lineStyle: { color: '#f472b6', width: 2 }, areaStyle: { color: 'rgba(244,114,182,0.07)' }, data: sensorData.value.map(r => [r.timestamp, r.strain_microstrain]) },
    ...(showTemperature.value ? [{ name: 'Temperatura (°C)', type: 'line', yAxisIndex: 1, smooth: true, showSymbol: false, lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' }, data: sensorData.value.map(r => [r.timestamp, r.temperature_celsius]) }] : [])
  ]
}))
</script>
