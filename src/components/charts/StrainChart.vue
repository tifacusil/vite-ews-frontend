<template>
  <div class="flex flex-col h-full gap-3">
    <div class="flex items-center gap-3 text-xs">
      <span class="font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700 text-gray-300">
        GXZM-SG02
      </span>
      <label class="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          v-model="showTemperature"
          class="accent-amber-500 w-3.5 h-3.5"
        />
        <span class="text-gray-400">Mostrar temperatura (°C)</span>
      </label>
    </div>

    <div class="flex-1 min-h-0">
      <VChart :option="chartOption" autoresize class="w-full h-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { strainMockData } from '@/data/mock'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const data = computed(() => strainMockData['GXZM-SG02'] ?? [])
const showTemperature = ref(true)

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  textStyle: { color: '#9ca3af' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    textStyle: { color: '#f3f4f6', fontSize: 12 }
  },
  legend: {
    data: showTemperature.value
      ? ['Deformación (µε)', 'Temperatura (°C)']
      : ['Deformación (µε)'],
    textStyle: { color: '#9ca3af', fontSize: 11 },
    top: 0
  },
  grid: { top: 40, right: showTemperature.value ? 70 : 20, bottom: 60, left: 72 },
  xAxis: {
    type: 'time',
    axisLine: { lineStyle: { color: '#374151' } },
    axisLabel: { color: '#6b7280', fontSize: 10 },
    splitLine: { lineStyle: { color: '#1f2937' } }
  },
  yAxis: [
    {
      type: 'value',
      name: 'µε',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1f2937' } }
    },
    ...(showTemperature.value ? [{
      type: 'value',
      name: '°C',
      nameTextStyle: { color: '#6b7280', fontSize: 10 },
      position: 'right',
      axisLine: { lineStyle: { color: '#374151' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      splitLine: { show: false }
    }] : [])
  ],
  dataZoom: [
    { type: 'slider', bottom: 8, height: 20, textStyle: { color: '#6b7280' },
      borderColor: '#374151', fillerColor: 'rgba(244,114,182,0.1)',
      handleStyle: { color: '#f472b6' } },
    { type: 'inside' }
  ],
  series: [
    {
      name: 'Deformación (µε)',
      type: 'line',
      yAxisIndex: 0,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#f472b6', width: 2 },
      areaStyle: { color: 'rgba(244,114,182,0.07)' },
      data: data.value.map(r => [r.timestamp, r.strain_microstrain])
    },
    ...(showTemperature.value ? [{
      name: 'Temperatura (°C)',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' },
      data: data.value.map(r => [r.timestamp, r.temperature_celsius])
    }] : [])
  ]
}))
</script>
