<template>
  <div class="border-t border-gray-800 bg-gray-900/40 shrink-0">
    <!-- Toggle header -->
    <button
      @click="open = !open"
      class="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-gray-200
             hover:bg-gray-800/50 transition-colors"
    >
      <span class="font-medium text-gray-300">Análisis</span>
      <span class="text-gray-700">·</span>
      <span class="text-gray-500">{{ TABS.find(t => t.id === activeTab)?.label }}</span>
      <span v-if="values.length < 4" class="text-yellow-600 ml-1">(mín. 4 puntos)</span>
      <span class="ml-auto text-gray-600">{{ open ? '▲' : '▼' }}</span>
    </button>

    <div v-if="open" class="px-4 pb-4 space-y-3">
      <!-- Analysis type tabs -->
      <div class="flex gap-1 pt-1">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          @click="switchTab(tab.id)"
          class="px-3 py-1 text-xs rounded transition-colors border"
          :class="activeTab === tab.id
            ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
            : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700'"
        >{{ tab.label }}</button>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3 flex-wrap">
        <template v-if="activeTab === 'outliers'">
          <label class="text-xs text-gray-400">Método:</label>
          <select v-model="outlierMethod" class="select-sm">
            <option value="3sigma">3σ (3-sigma)</option>
            <option value="iqr">IQR</option>
            <option value="chauvenet">Chauvenet</option>
          </select>
        </template>

        <template v-else-if="activeTab === 'denoise'">
          <label class="text-xs text-gray-400">Método:</label>
          <select v-model="denoiseMethod" class="select-sm">
            <option value="wavelet">Wavelet (db4)</option>
            <option value="emd">EMD</option>
            <option value="svm">SVR</option>
          </select>
        </template>

        <template v-else-if="activeTab === 'regression'">
          <label class="text-xs text-gray-400">Modelo:</label>
          <select v-model="regressionModel" class="select-sm">
            <option value="polynomial">Polinomial</option>
            <option value="bayesian">Bayesiano (Ridge)</option>
          </select>
          <template v-if="regressionModel === 'polynomial'">
            <label class="text-xs text-gray-400">Grado:</label>
            <input
              v-model.number="regressionDegree"
              type="number" min="1" max="10"
              class="select-sm w-14 text-center"
            />
          </template>
        </template>

        <template v-else-if="activeTab === 'predict'">
          <label class="text-xs text-gray-400">Modelo:</label>
          <select v-model="predictModel" class="select-sm">
            <option value="arima">ARIMA</option>
            <option value="gm11">GM(1,1)</option>
          </select>
          <label class="text-xs text-gray-400">Horizonte:</label>
          <input
            v-model.number="predictHorizon"
            type="number" min="1" max="365"
            class="select-sm w-16 text-center"
          />
          <span class="text-xs text-gray-600">pasos</span>
        </template>

        <button
          @click="runAnalysis"
          :disabled="running || values.length < 4"
          class="ml-auto px-3 py-1 text-xs rounded border transition-colors"
          :class="running || values.length < 4
            ? 'border-gray-700 text-gray-600 cursor-not-allowed'
            : 'border-blue-500 text-blue-300 hover:bg-blue-500/10'"
        >
          {{ running ? 'Ejecutando…' : 'Ejecutar' }}
        </button>
      </div>

      <!-- Error -->
      <div
        v-if="analysisError"
        class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2"
      >{{ analysisError }}</div>

      <!-- ── Outlier results ── -->
      <template v-if="activeTab === 'outliers' && outliersResult">
        <div class="flex gap-2 flex-wrap">
          <div class="stat-chip">
            <div class="stat-label">Outliers</div>
            <div class="stat-value" :class="outliersResult.statistics.outlier_count > 0 ? 'text-red-400' : 'text-green-400'">
              {{ outliersResult.statistics.outlier_count }}
            </div>
          </div>
          <div class="stat-chip">
            <div class="stat-label">Media</div>
            <div class="stat-value">{{ outliersResult.statistics.mean.toFixed(3) }} {{ unit }}</div>
          </div>
          <div class="stat-chip">
            <div class="stat-label">σ</div>
            <div class="stat-value">{{ outliersResult.statistics.std.toFixed(3) }} {{ unit }}</div>
          </div>
          <div class="stat-chip">
            <div class="stat-label">N</div>
            <div class="stat-value">{{ outliersResult.statistics.n }}</div>
          </div>
        </div>
        <div
          v-if="outliersResult.outliers.length === 0"
          class="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2"
        >Sin outliers detectados con el método {{ outliersResult.method }}.</div>
        <div v-else class="max-h-36 overflow-y-auto space-y-1 pr-1">
          <div
            v-for="o in outliersResult.outliers"
            :key="o.index"
            class="flex items-center gap-3 text-xs bg-red-500/10 border border-red-500/20 rounded px-3 py-1.5"
          >
            <span class="text-red-400 font-mono font-bold">{{ o.value.toFixed(3) }} {{ unit }}</span>
            <span class="text-gray-500">@</span>
            <span class="text-gray-300 font-mono">{{ fmtTs(o.timestamp) }}</span>
            <span v-if="o.criterion" class="ml-auto text-gray-600">{{ o.criterion }}</span>
            <span v-else-if="o.z_score != null" class="ml-auto text-gray-600">z={{ o.z_score.toFixed(2) }}</span>
          </div>
        </div>
      </template>

      <!-- ── Denoise results ── -->
      <template v-else-if="activeTab === 'denoise' && denoiseResult">
        <div class="h-44">
          <VChart :option="denoiseChartOpt" autoresize class="w-full h-full" />
        </div>
      </template>

      <!-- ── Regression results ── -->
      <template v-else-if="activeTab === 'regression' && regressionResult">
        <div class="flex gap-2 flex-wrap mb-1">
          <div class="stat-chip">
            <div class="stat-label">R²</div>
            <div
              class="stat-value font-bold"
              :class="regressionResult.r2_score > 0.8 ? 'text-green-400'
                    : regressionResult.r2_score > 0.5 ? 'text-yellow-400'
                    : 'text-red-400'"
            >{{ regressionResult.r2_score.toFixed(4) }}</div>
          </div>
          <div class="stat-chip">
            <div class="stat-label">Modelo</div>
            <div class="stat-value">
              {{ regressionResult.model }}{{ regressionResult.degree != null ? ` deg-${regressionResult.degree}` : '' }}
            </div>
          </div>
        </div>
        <div class="h-44">
          <VChart :option="regressionChartOpt" autoresize class="w-full h-full" />
        </div>
      </template>

      <!-- ── Predict results ── -->
      <template v-else-if="activeTab === 'predict' && predictResult">
        <div class="flex gap-2 flex-wrap mb-1">
          <div class="stat-chip">
            <div class="stat-label">Modelo</div>
            <div class="stat-value">{{ predictResult.model.toUpperCase() }}</div>
          </div>
          <div class="stat-chip">
            <div class="stat-label">Horizonte</div>
            <div class="stat-value">{{ predictResult.horizon }} pasos</div>
          </div>
          <div v-if="predictResult.order" class="stat-chip">
            <div class="stat-label">Orden ARIMA</div>
            <div class="stat-value font-mono">{{ predictResult.order.join(',') }}</div>
          </div>
        </div>
        <div class="h-44">
          <VChart :option="predictChartOpt" autoresize class="w-full h-full" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { detectOutliers, denoiseSeries, fitRegression, predictSeries } from '@/api/analysis'
import type {
  OutlierMethod, DenoiseMethod, RegressionModel, PredictModel,
  OutliersResponse, DenoiseResponse, RegressionResponse, PredictResponse,
} from '@/types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  values: number[]
  timestamps: string[]
  unit?: string
}>()

// ── State ─────────────────────────────────────────────────────────────────────

const open = ref(false)
const running = ref(false)
const analysisError = ref<string | null>(null)
const activeTab = ref<'outliers' | 'denoise' | 'regression' | 'predict'>('outliers')

const outlierMethod    = ref<OutlierMethod>('3sigma')
const denoiseMethod    = ref<DenoiseMethod>('wavelet')
const regressionModel  = ref<RegressionModel>('polynomial')
const regressionDegree = ref(3)
const predictModel     = ref<PredictModel>('arima')
const predictHorizon   = ref(30)

const outliersResult   = ref<OutliersResponse | null>(null)
const denoiseResult    = ref<DenoiseResponse | null>(null)
const regressionResult = ref<RegressionResponse | null>(null)
const predictResult    = ref<PredictResponse | null>(null)

const TABS = [
  { id: 'outliers'   as const, label: 'Outliers'   },
  { id: 'denoise'    as const, label: 'Denoising'  },
  { id: 'regression' as const, label: 'Regresión'  },
  { id: 'predict'    as const, label: 'Predicción' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTs(ts: string) {
  return new Date(ts).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC',
  })
}

function switchTab(tab: typeof activeTab.value) {
  activeTab.value = tab
  analysisError.value = null
  outliersResult.value   = null
  denoiseResult.value    = null
  regressionResult.value = null
  predictResult.value    = null
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function runAnalysis() {
  running.value = true
  analysisError.value = null
  const body = { values: props.values, timestamps: props.timestamps }
  try {
    if (activeTab.value === 'outliers') {
      const res = await detectOutliers({ ...body, method: outlierMethod.value })
      outliersResult.value = res.data
    } else if (activeTab.value === 'denoise') {
      const res = await denoiseSeries({ ...body, method: denoiseMethod.value })
      denoiseResult.value = res.data
    } else if (activeTab.value === 'regression') {
      const res = await fitRegression({ ...body, model: regressionModel.value, degree: regressionDegree.value })
      regressionResult.value = res.data
    } else {
      const res = await predictSeries({ ...body, model: predictModel.value, horizon: predictHorizon.value })
      predictResult.value = res.data
    }
  } catch (err: any) {
    const msg = err.response?.data?.message
    analysisError.value = typeof msg === 'string' ? msg
      : (err instanceof Error ? err.message : String(err))
  } finally {
    running.value = false
  }
}

// ── Mini chart base ───────────────────────────────────────────────────────────

const miniBase = {
  backgroundColor: 'transparent',
  textStyle: { color: '#9ca3af' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    textStyle: { color: '#f3f4f6', fontSize: 11 },
  },
  grid: { top: 28, right: 12, bottom: 24, left: 54 },
  xAxis: {
    type: 'time',
    axisLabel: { color: '#6b7280', fontSize: 9 },
    axisLine: { lineStyle: { color: '#374151' } },
    splitLine: { lineStyle: { color: '#1f2937' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#6b7280', fontSize: 9 },
    axisLine: { lineStyle: { color: '#374151' } },
    splitLine: { lineStyle: { color: '#1f2937' } },
  },
}

const historySeries = computed(() =>
  props.timestamps.map((t, i) => [t, props.values[i]])
)

const denoiseChartOpt = computed(() => ({
  ...miniBase,
  legend: { data: ['Original', 'Denoised'], textStyle: { color: '#9ca3af', fontSize: 10 }, top: 4 },
  series: [
    { name: 'Original', type: 'line', showSymbol: false, lineStyle: { color: '#4b5563', width: 1 }, data: historySeries.value },
    { name: 'Denoised', type: 'line', showSymbol: false, lineStyle: { color: '#3B82F6', width: 1.5 },
      data: denoiseResult.value ? props.timestamps.map((t, i) => [t, denoiseResult.value!.denoised_values[i]]) : [] },
  ],
}))

const regressionChartOpt = computed(() => ({
  ...miniBase,
  legend: { data: ['Original', 'Ajuste'], textStyle: { color: '#9ca3af', fontSize: 10 }, top: 4 },
  series: [
    { name: 'Original', type: 'line', showSymbol: false, lineStyle: { color: '#4b5563', width: 1 }, data: historySeries.value },
    { name: 'Ajuste', type: 'line', showSymbol: false, lineStyle: { color: '#F97316', width: 1.5 },
      data: regressionResult.value ? props.timestamps.map((t, i) => [t, regressionResult.value!.fitted_values[i]]) : [] },
  ],
}))

const predictChartOpt = computed(() => {
  if (!predictResult.value) return { ...miniBase, series: [] }
  const pr = predictResult.value
  const series: any[] = [
    { name: 'Histórico', type: 'line', showSymbol: false, lineStyle: { color: '#4b5563', width: 1 }, data: historySeries.value },
    { name: 'Predicción', type: 'line', showSymbol: false, lineStyle: { color: '#22C55E', width: 1.5 },
      data: pr.predicted_timestamps.map((t, i) => [t, pr.predicted_values[i]]) },
  ]
  if (pr.confidence_upper && pr.confidence_lower) {
    series.push({
      name: 'IC sup.', type: 'line', showSymbol: false,
      lineStyle: { color: '#22C55E', type: 'dashed', width: 0.8, opacity: 0.5 },
      data: pr.predicted_timestamps.map((t, i) => [t, pr.confidence_upper![i]]),
    })
    series.push({
      name: 'IC inf.', type: 'line', showSymbol: false,
      lineStyle: { color: '#22C55E', type: 'dashed', width: 0.8, opacity: 0.5 },
      areaStyle: { color: 'rgba(34,197,94,0.08)' },
      data: pr.predicted_timestamps.map((t, i) => [t, pr.confidence_lower![i]]),
    })
  }
  return {
    ...miniBase,
    legend: { data: ['Histórico', 'Predicción'], textStyle: { color: '#9ca3af', fontSize: 10 }, top: 4 },
    series,
  }
})
</script>

<style scoped>
.select-sm {
  @apply bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100
         focus:outline-none focus:border-blue-500;
}
.stat-chip {
  @apply bg-gray-800 rounded px-3 py-1.5 text-xs;
}
.stat-label {
  @apply text-gray-500 mb-0.5;
}
.stat-value {
  @apply text-white font-mono;
}
</style>
