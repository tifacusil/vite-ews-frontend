<template>
  <div class="flex flex-col h-full gap-3">
    <!-- Controles -->
    <div class="flex items-center gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-400">Sensor:</label>
        <select
          v-model="selectedSensor"
          class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100
                 focus:outline-none focus:border-blue-500"
        >
          <option v-for="s in GNSS_SENSORS" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div class="flex items-center gap-1">
        <label class="text-xs text-gray-400 mr-1">Rango:</label>
        <button
          v-for="r in ranges"
          :key="r.value"
          @click="selectedRange = r.value"
          class="px-2 py-1 text-xs rounded border transition-colors"
          :class="selectedRange === r.value
            ? 'bg-blue-600 border-blue-500 text-white'
            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'"
        >{{ r.label }}</button>
      </div>

      <div class="ml-auto text-xs text-gray-500 font-mono">
        {{ filteredData.length }} puntos rtk_fixed
      </div>
    </div>

    <!-- Chart -->
    <div class="flex-1 min-h-0">
      <VChart
        :option="chartOption"
        autoresize
        class="w-full h-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, ToolboxComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { gnssMockData, GNSS_SENSORS } from '@/data/mock'
import { useProjectStore } from '@/stores/project'
import type { DateRange } from '@/types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent,
     DataZoomComponent, ToolboxComponent, CanvasRenderer])

const store = useProjectStore()

const selectedSensor = ref('GXZM-DB03')
const selectedRange = ref<DateRange>('1y')

// Sincronizar con store
watch(selectedSensor, s => store.setGnssSensor(s))

const ranges: Array<{ label: string; value: DateRange }> = [
  { label: '3 meses', value: '3m' },
  { label: '6 meses', value: '6m' },
  { label: '1 año',   value: '1y' }
]

function cutoffDate(range: DateRange): Date {
  const last = new Date('2019-12-29T00:00:00Z')
  if (range === '3m') return new Date(last.getTime() - 90  * 86400_000)
  if (range === '6m') return new Date(last.getTime() - 180 * 86400_000)
  return new Date(last.getTime() - 365 * 86400_000)
}

const filteredData = computed(() => {
  const raw = gnssMockData[selectedSensor.value] ?? []
  // REQ-WEB-04: filtrar silenciosamente fix_quality != rtk_fixed
  const fixed = raw.filter(r => r.fix_quality === 'rtk_fixed')
  const cutoff = cutoffDate(selectedRange.value)
  return fixed.filter(r => new Date(r.timestamp) >= cutoff)
})

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  textStyle: { color: '#9ca3af' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    textStyle: { color: '#f3f4f6', fontSize: 12 },
    formatter: (params: any[]) => {
      const ts = new Date(params[0].axisValue).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC'
      })
      const rows = params.map((p: any) =>
        `<span style="color:${p.color}">●</span> ${p.seriesName}: <b>${
          typeof p.value === 'number' ? p.value.toFixed(2) : p.value[1].toFixed(2)
        } mm</b>`
      ).join('<br/>')
      return `<div class="text-xs">${ts}<br/>${rows}</div>`
    }
  },
  legend: {
    data: ['Dx', 'Dy', 'Dh (horizontal)', 'Acumulado'],
    textStyle: { color: '#9ca3af', fontSize: 11 },
    top: 0
  },
  grid: { top: 40, right: 20, bottom: 60, left: 60, containLabel: false },
  xAxis: {
    type: 'time',
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6b7280', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1f2937' } }
  },
  yAxis: {
    type: 'value',
    name: 'mm',
    nameTextStyle: { color: '#6b7280', fontSize: 10 },
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6b7280', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1f2937' } }
  },
  dataZoom: [
    { type: 'slider', bottom: 8, height: 20, textStyle: { color: '#6b7280' },
      borderColor: '#374151', fillerColor: 'rgba(59,130,246,0.1)',
      handleStyle: { color: '#3B82F6' } },
    { type: 'inside' }
  ],
  series: [
    {
      name: 'Dx',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#3B82F6', width: 1.5 },
      data: filteredData.value.map(r => [r.timestamp, r.displacement_x_mm])
    },
    {
      name: 'Dy',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#8B5CF6', width: 1.5 },
      data: filteredData.value.map(r => [r.timestamp, r.displacement_y_mm])
    },
    {
      name: 'Dh (horizontal)',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#F97316', width: 2 },
      data: filteredData.value.map(r => [r.timestamp, r.displacement_horizontal_mm])
    },
    {
      name: 'Acumulado',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#22C55E', width: 2.5 },
      data: filteredData.value.map(r => [r.timestamp, r.cumulative_displacement_mm])
    }
  ]
}))
</script>
