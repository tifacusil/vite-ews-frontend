<template>
  <div class="flex flex-col h-full gap-3">
    <div class="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
      <span class="font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700 text-gray-300">
        LZ-DB01
      </span>
      <span>· Perfil vertical de inclinómetro · Anclaje: 15 m → 48.7 mm</span>
      <span v-if="loading" class="ml-auto text-gray-500 animate-pulse">Cargando…</span>
      <span v-else-if="error" class="ml-auto text-red-400">⚠ Error al cargar</span>
      <span v-else-if="profile.length > 0" class="ml-auto text-gray-500 font-mono text-xs">
        {{ new Date(profile[0]?.timestamp ?? '').toLocaleDateString('es-MX', {
          year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC'
        }) }}
      </span>
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
import { LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import api from '@/api'
import type { SensorEnvelope, DeepDisplacementReading } from '@/types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent,
     MarkPointComponent, CanvasRenderer])

const SENSOR_ID = 'LZ-DB01'
const profile = ref<DeepDisplacementReading[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const intervalSeconds = ref(3600)

let pollTimer: ReturnType<typeof setTimeout> | null = null

async function fetchData() {
  loading.value = true
  try {
    const now = new Date()
    const from = new Date(now.getTime() - 365 * 86400_000)
    const res = await api.get<SensorEnvelope<DeepDisplacementReading>>(
      `/api/v1/sensors/${SENSOR_ID}/readings`,
      { params: { sensor_type: 'deep_displacement', from: from.toISOString(), to: now.toISOString() } }
    )
    profile.value = res.data.data
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

// Magnitud resultante √(x²+y²) por profundidad
function magnitude(x: number, y: number): number {
  return parseFloat(Math.sqrt(x * x + y * y).toFixed(2))
}

const chartOption = computed(() => {
  const p = profile.value

  return {
    backgroundColor: 'transparent',
    textStyle: { color: '#9ca3af' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      textStyle: { color: '#f3f4f6', fontSize: 12 },
      formatter: (params: any[]) => {
        const depth = params[0]?.axisValue ?? params[0]?.data[1]
        const rows = params.map((p: any) => {
          const val = Array.isArray(p.value) ? p.value[0] : p.value
          return `<span style="color:${p.color}">●</span> ${p.seriesName}: <b>${
            Number(val).toFixed(2)
          } mm</b>`
        }).join('<br/>')
        return `<div class="text-xs">Prof. ${depth} m<br/>${rows}</div>`
      }
    },
    legend: {
      data: ['Tilt X', 'Tilt Y', 'Magnitud √(X²+Y²)'],
      textStyle: { color: '#9ca3af', fontSize: 11 },
      top: 0
    },
    grid: { top: 40, right: 20, bottom: 40, left: 72 },
    xAxis: {
      type: 'value',
      name: 'Desplazamiento (mm)',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f2937' } }
    },
    yAxis: {
      type: 'value',
      name: 'Profundidad (m)',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      nameLocation: 'middle',
      nameGap: 52,
      // REQ-WEB-08: eje Y invertido — 0 arriba, máximo abajo
      inverse: true,
      min: 0,
      max: 16,
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: {
        color: '#6b7280',
        fontSize: 10,
        formatter: (v: number) => `${v} m`
      },
      splitLine: { lineStyle: { color: '#1f2937' } }
    },
    series: [
      {
        name: 'Tilt X',
        type: 'line',
        smooth: false,
        symbolSize: 7,
        symbol: 'circle',
        lineStyle: { color: '#3B82F6', width: 2 },
        itemStyle: { color: '#3B82F6' },
        data: p.map(r => [r.tilt_x_mm, r.depth_m])
      },
      {
        name: 'Tilt Y',
        type: 'line',
        smooth: false,
        symbolSize: 7,
        symbol: 'circle',
        lineStyle: { color: '#8B5CF6', width: 2 },
        itemStyle: { color: '#8B5CF6' },
        data: p.map(r => [r.tilt_y_mm, r.depth_m])
      },
      {
        name: 'Magnitud √(X²+Y²)',
        type: 'line',
        smooth: false,
        symbolSize: 9,
        symbol: 'diamond',
        lineStyle: { color: '#22C55E', width: 2.5 },
        itemStyle: { color: '#22C55E' },
        data: p.map(r => [magnitude(r.tilt_x_mm, r.tilt_y_mm), r.depth_m])
      }
    ]
  }
})
</script>
