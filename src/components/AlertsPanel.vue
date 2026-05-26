<template>
  <div class="flex flex-col gap-2 mt-3">
    <div class="flex items-center justify-between px-1">
      <h2 class="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Alertas — {{ store.selectedProject }}
      </h2>
      <span v-if="store.currentAlerts.length" class="text-xs text-gray-500">
        {{ store.currentAlerts.length }} reciente{{ store.currentAlerts.length > 1 ? 's' : '' }}
      </span>
    </div>

    <div v-if="store.currentAlerts.length === 0" class="text-gray-500 text-sm px-1 py-3">
      Sin alertas activas para este proyecto.
    </div>

    <TransitionGroup name="alert-list" tag="ul" class="flex flex-col gap-2">
      <li
        v-for="alert in store.currentAlerts"
        :key="alert.message_id"
        class="flex flex-col gap-1.5 rounded-lg border px-3 py-2 text-sm"
        :class="alertClass(alert.alert_level)"
      >
        <!-- Fila 1: sensor + badge nivel -->
        <div class="flex items-center justify-between">
          <span class="font-mono font-semibold text-xs tracking-wide">
            {{ alert.sensor_id }}
          </span>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
            :style="{ backgroundColor: levelColor(alert.alert_level), color: '#fff' }"
          >
            {{ levelLabel(alert.alert_level) }}
          </span>
        </div>

        <!-- Fila 2: velocidad de deformación -->
        <div class="flex items-center justify-between text-xs">
          <span class="font-mono text-gray-200">
            {{ alert.deformation_speed_mm_day.toFixed(1) }} mm/día
          </span>
          <span class="text-gray-500">
            umbral: {{ alert.threshold_mm_day }} mm/día
          </span>
        </div>

        <!-- Fila 3: desplazamiento actual + timestamp -->
        <div class="flex items-center justify-between text-xs opacity-70">
          <span class="font-mono">
            Δ {{ alert.current_displacement_mm.toFixed(0) }} mm
          </span>
          <span class="tabular-nums">
            {{ formatTimestamp(alert.timestamp) }}
          </span>
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '@/stores/project'
import type { AlertLevel } from '@/types'

const store = useProjectStore()

function alertClass(level: AlertLevel): string {
  return {
    red:    'alert-red',
    orange: 'alert-orange',
    blue:   'alert-blue'
  }[level] ?? 'border-gray-600'
}

const LEVEL_COLORS: Record<AlertLevel, string> = {
  red:    '#EF4444',
  orange: '#F97316',
  blue:   '#3B82F6'
}
const LEVEL_LABELS: Record<AlertLevel, string> = {
  red:    'Rojo',
  orange: 'Naranja',
  blue:   'Azul'
}

function levelColor(level: AlertLevel): string { return LEVEL_COLORS[level] }
function levelLabel(level: AlertLevel): string { return LEVEL_LABELS[level] }

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('es-MX', {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC'
}
</script>

<style scoped>
.alert-list-enter-active,
.alert-list-leave-active { transition: all 0.3s ease; }
.alert-list-enter-from,
.alert-list-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
