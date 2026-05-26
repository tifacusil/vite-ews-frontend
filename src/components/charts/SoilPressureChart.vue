<template>
  <div class="flex flex-col h-full gap-3">
    <div class="flex items-center gap-3 text-xs">
      <span class="font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700 text-gray-300">GXZM-SP01</span>
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
import type { ApiReadingsResponse, SoilPressureReading } from '@/types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const SENSOR_ID = 'GXZM-SP01'
const sensorData = ref<SoilPressureReading[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showTemperature = ref(true)

let pollTimer: ReturnType<typeof setTimeout> | null = null

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get<ApiReadingsResponse<SoilPressureReading>>(
      `/api/v1/sensors/${SENSOR_ID}/readings`,
      { params: { sensor_type: 'soil_pressure', limit: 1000 } }
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
  legend: { data: showTemperature.value ? ['Presión (kPa)', 'Temperatura (°C)'] : ['Presión (kPa)'], textStyle: { color: '#9ca3af', fontSize: 11 }, top: 0 },
  grid: { top: 40, right: showTemperature.value ? 70 : 20, bottom: 60, left: 65 },
  xAxis: { type: 'time', axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6b7280', fontSize: 10 }, splitLine: { lineStyle: { color: '#1f2937' } } },
  yAxis: [
    { type: 'value', name: 'kPa', nameTextStyle: { color: '#6b7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6b7280', fontSize: 10 }, splitLine: { lineStyle: { color: '#1f2937' } } },
    ...(showTemperature.value ? [{ type: 'value', name: '°C', nameTextStyle: { color: '#6b7280', fontSize: 10 }, position: 'right', axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#6b7280', fontSize: 10 }, splitLine: { show: false } }] : [])
  ],
  dataZoom: [
    { type: 'slider', bottom: 8, height: 20, textStyle: { color: '#6b7280' }, borderColor: '#374151', fillerColor: 'rgba(168,85,247,0.1)', handleStyle: { color: '#a855f7' } },
    { type: 'inside' }
  ],
  series: [
    { name: 'Presión (kPa)', type: 'line', yAxisIndex: 0, smooth: true, showSymbol: false, lineStyle: { color: '#a855f7', width: 2 }, areaStyle: { color: 'rgba(168,85,247,0.08)' }, data: sensorData.value.map(r => [r.timestamp, r.pressure_kpa]) },
    ...(showTemperature.value ? [{ name: 'Temperatura (°C)', type: 'line', yAxisIndex: 1, smooth: true, showSymbol: false, lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' }, data: sensorData.value.map(r => [r.timestamp, r.temperature_celsius]) }] : [])
  ]
}))
</script>
