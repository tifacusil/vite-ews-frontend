<template>
  <div class="flex flex-col h-full gap-3">
    <div class="flex items-center gap-2 text-xs text-gray-400">
      <span class="font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700">GXZM-RG01</span>
      <span>· Barras: lluvia diaria (mm) · Línea: acumulado (mm)</span>
      <span v-if="loading" class="ml-auto text-gray-500 animate-pulse">Cargando…</span>
      <span v-else-if="error" class="ml-auto text-red-400">⚠ Error al cargar</span>
      <span v-else class="ml-auto text-gray-500">Pico: {{ peakLabel }}</span>
    </div>

    <!-- Error inline -->
    <div
      v-if="error && !loading"
      class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
    >
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
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import api from '@/api'
import type { SensorEnvelope, RainfallReading } from '@/types'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent,
     DataZoomComponent, MarkLineComponent, CanvasRenderer])

const SENSOR_ID = 'GXZM-RG01'
const sensorData = ref<RainfallReading[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const intervalSeconds = ref(3600)

let pollTimer: ReturnType<typeof setTimeout> | null = null

async function fetchData() {
  loading.value = true
  try {
    const now = new Date()
    const from = new Date(now.getTime() - 365 * 86400_000)
    const res = await api.get<SensorEnvelope<RainfallReading>>(
      `/api/v1/sensors/${SENSOR_ID}/readings`,
      { params: { sensor_type: 'rainfall', from: from.toISOString(), to: now.toISOString() } }
    )
    sensorData.value = res.data.data
    intervalSeconds.value = res.data.sampling_interval_seconds ?? 3600
    error.value = null
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
    if (pollTimer !== null) clearTimeout(pollTimer)
    pollTimer = setTimeout(fetchData, intervalSeconds.value * 1000)
  }
}

onMounted(fetchData)
onUnmounted(() => { if (pollTimer !== null) clearTimeout(pollTimer) })

const peakLabel = computed(() => {
  if (sensorData.value.length === 0) return '—'
  const max = sensorData.value.reduce((a, b) => a.rainfall_mm > b.rainfall_mm ? a : b)
  return `${max.rainfall_mm.toFixed(1)} mm el ${new Date(max.timestamp).toLocaleDateString('es-MX', { timeZone: 'UTC' })}`
})

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  textStyle: { color: '#9ca3af' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    textStyle: { color: '#f3f4f6', fontSize: 12 },
    axisPointer: { type: 'cross', crossStyle: { color: '#4b5563' } },
    formatter: (params: any[]) => {
      const ts = new Date(params[0].axisValue).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC'
      })
      const rows = params.map((p: any) => {
        const val = Array.isArray(p.value) ? p.value[1] : p.value
        const unit = p.seriesName === 'Lluvia diaria' ? ' mm' : ' mm (acum.)'
        return `<span style="color:${p.color}">●</span> ${p.seriesName}: <b>${
          val != null ? Number(val).toFixed(1) : '—'
        }${unit}</b>`
      }).join('<br/>')
      return `<div class="text-xs">${ts}<br/>${rows}</div>`
    }
  },
  legend: {
    data: ['Lluvia diaria', 'Acumulado'],
    textStyle: { color: '#9ca3af', fontSize: 11 },
    top: 0
  },
  grid: { top: 40, right: 70, bottom: 60, left: 60 },
  xAxis: {
    type: 'time',
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6b7280', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1f2937' } }
  },
  yAxis: [
    {
      type: 'value',
      name: 'mm/día',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f2937' } }
    },
    {
      type: 'value',
      name: 'Acum (mm)',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      position: 'right',
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { show: false }
    }
  ],
  dataZoom: [
    { type: 'slider', bottom: 8, height: 20, textStyle: { color: '#6b7280' },
      borderColor: '#374151', fillerColor: 'rgba(14,165,233,0.1)',
      handleStyle: { color: '#0ea5e9' } },
    { type: 'inside' }
  ],
  series: [
    {
      name: 'Lluvia diaria',
      type: 'bar',
      yAxisIndex: 0,
      itemStyle: {
        color: (params: any) => {
          const v = Array.isArray(params.value) ? params.value[1] : params.value
          if (v >= 100) return '#EF4444'
          if (v >= 50)  return '#F97316'
          if (v >= 25)  return '#3B82F6'
          return '#0ea5e9'
        }
      },
      barMaxWidth: 6,
      data: sensorData.value.map(r => [r.timestamp, r.rainfall_mm])
    },
    {
      name: 'Acumulado',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#22C55E', width: 2 },
      areaStyle: { color: 'rgba(34,197,94,0.08)' },
      data: sensorData.value.map(r => [r.timestamp, r.cumulative_rainfall_mm])
    }
  ]
}))
</script>
