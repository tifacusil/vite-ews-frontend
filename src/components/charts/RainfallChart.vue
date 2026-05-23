<template>
  <div class="flex flex-col h-full gap-3">
    <div class="flex items-center gap-2 text-xs text-gray-400">
      <span class="font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700">GXZM-RG01</span>
      <span>· Barras: lluvia diaria (mm) · Línea: acumulado (mm)</span>
      <span class="ml-auto text-gray-500">Pico real: 141.4 mm el 2019-07-01</span>
    </div>

    <div class="flex-1 min-h-0">
      <VChart :option="chartOption" autoresize class="w-full h-full" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { rainfallMockData } from '@/data/mock'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent,
     DataZoomComponent, MarkLineComponent, CanvasRenderer])

const data = computed(() => rainfallMockData['GXZM-RG01'] ?? [])

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
      data: data.value.map(r => [r.timestamp, r.rainfall_mm]),
      markLine: {
        silent: true,
        data: [{
          yAxis: 141.4,
          lineStyle: { color: '#EF4444', type: 'dashed', width: 1.5 },
          label: { formatter: '141.4 mm\n2019-07-01', color: '#EF4444', fontSize: 9 }
        }]
      }
    },
    {
      name: 'Acumulado',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#22C55E', width: 2 },
      areaStyle: { color: 'rgba(34,197,94,0.08)' },
      data: data.value.map(r => [r.timestamp, r.cumulative_rainfall_mm])
    }
  ]
}))
</script>
