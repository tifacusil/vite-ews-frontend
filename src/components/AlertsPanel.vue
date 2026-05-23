<template>
  <div class="flex flex-col gap-2 mt-3">
    <h2 class="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
      Alertas activas — {{ store.selectedProject }}
    </h2>

    <div v-if="alerts.length === 0" class="text-gray-500 text-sm px-1 py-3">
      Sin alertas activas para este proyecto.
    </div>

    <TransitionGroup name="alert-list" tag="ul" class="flex flex-col gap-2">
      <li
        v-for="alert in alerts"
        :key="alert.sensor_id"
        class="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm"
        :class="alertClass(alert.level)"
      >
        <!-- Fila superior: sensor + badge nivel -->
        <div class="flex items-center justify-between">
          <span class="font-mono font-semibold text-xs tracking-wide">
            {{ alert.sensor_id }}
          </span>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
            :style="{ backgroundColor: levelColor(alert.level), color: '#fff' }"
          >
            {{ levelLabel(alert.level) }}
          </span>
        </div>

        <!-- Fila inferior: velocidad + timestamp -->
        <div class="flex items-center justify-between text-xs opacity-80">
          <span class="font-mono">
            {{ alert.speed_mm_day.toFixed(2) }} mm/día
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
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { ACTIVE_ALERTS } from '@/data/mock'
import type { AlertLevel } from '@/types'

const store = useProjectStore()

const alerts = computed(() => ACTIVE_ALERTS[store.selectedProject] ?? [])

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
