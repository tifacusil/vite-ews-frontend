<template>
  <div class="flex flex-col h-full">
    <h2 class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">
      Proyectos monitoreados
    </h2>

    <!-- SVG Map -->
    <div class="relative rounded-xl overflow-hidden border border-gray-700 bg-gray-800 flex-1 min-h-0">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        class="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Fondo tipo terreno -->
        <defs>
          <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#1a3a1a" />
            <stop offset="60%"  stop-color="#1f4a2e" />
            <stop offset="100%" stop-color="#16352a" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <!-- Fondo -->
        <rect width="100%" height="100%" fill="url(#terrainGrad)" />

        <!-- Contorno de ríos/montañas estilizado -->
        <path
          d="M20,180 Q80,140 120,160 Q160,175 200,150 Q240,125 300,145 Q340,155 380,130"
          fill="none" stroke="#2d6a4f" stroke-width="2" opacity="0.5"
        />
        <path
          d="M20,220 Q60,200 100,215 Q150,228 200,210 Q260,192 320,205 Q360,212 395,195"
          fill="none" stroke="#2d6a4f" stroke-width="1.5" opacity="0.4"
        />
        <!-- Sombreado de relieve -->
        <ellipse cx="100" cy="170" rx="60" ry="30" fill="#1a4a28" opacity="0.3" />
        <ellipse cx="300" cy="150" rx="70" ry="35" fill="#1a4a28" opacity="0.3" />
        <ellipse cx="60"  cy="100" rx="40" ry="25" fill="#152a1a" opacity="0.25" />
        <ellipse cx="350" cy="100" rx="50" ry="28" fill="#152a1a" opacity="0.25" />

        <!-- Graticule (líneas de coordenadas) -->
        <g stroke="#ffffff" stroke-width="0.4" opacity="0.08">
          <line v-for="lx in 7" :key="'vl'+lx" :x1="lx*(W/8)" y1="0" :x2="lx*(W/8)" :y2="H" />
          <line v-for="ly in 5" :key="'hl'+ly" x1="0" :y1="ly*(H/6)" :x2="W" :y2="ly*(H/6)" />
        </g>

        <!-- Etiquetas de coordenadas -->
        <text x="4" y="10" fill="#4ade80" font-size="7" opacity="0.5">24.7°N</text>
        <text x="4" :y="H-4" fill="#4ade80" font-size="7" opacity="0.5">23.9°N</text>
        <text x="2" :y="H/2" fill="#4ade80" font-size="7" opacity="0.5" transform-origin="center">106°E→112°E</text>

        <!-- Marcadores de proyecto -->
        <g
          v-for="project in store.projects"
          :key="project.project_id"
          :transform="`translate(${projectX(project.location_lng)}, ${projectY(project.location_lat)})`"
          class="cursor-pointer"
          @click="onMarkerClick(project.project_id)"
        >
          <!-- Pulso exterior animado -->
          <circle
            r="18"
            :fill="alertColor(project.project_id)"
            opacity="0.15"
            class="animate-ping"
            style="transform-origin: 0 0;"
          />
          <!-- Aro exterior -->
          <circle
            r="14"
            :fill="alertColor(project.project_id)"
            opacity="0.2"
          />
          <!-- Marcador principal -->
          <circle
            r="8"
            :fill="alertColor(project.project_id)"
            :stroke="isSelected(project.project_id) ? '#ffffff' : 'transparent'"
            stroke-width="2"
            filter="url(#glow)"
          />
          <!-- Icono interior -->
          <circle r="3" fill="#ffffff" opacity="0.9" />

          <!-- Etiqueta -->
          <g transform="translate(12, -2)">
            <rect
              x="-2" y="-8" :width="labelWidth(project.name)" height="16"
              rx="4"
              :fill="isSelected(project.project_id) ? '#1f2937' : '#111827'"
              :stroke="alertColor(project.project_id)"
              stroke-width="1"
              opacity="0.9"
            />
            <text
              x="4" y="4"
              fill="#f3f4f6"
              font-size="9"
              font-family="monospace"
              font-weight="600"
            >{{ project.name }}</text>
          </g>
        </g>

        <!-- Leyenda de niveles -->
        <g transform="translate(8, 20)">
          <rect x="0" y="0" width="70" height="56" rx="4" fill="#111827" opacity="0.85" />
          <text x="5" y="11" fill="#9ca3af" font-size="7" font-weight="600">NIVEL ALERTA</text>
          <g v-for="(l, i) in legend" :key="l.label" :transform="`translate(5, ${20 + i * 12})`">
            <circle r="4" :fill="l.color" />
            <text x="10" y="4" fill="#d1d5db" font-size="8">{{ l.label }}</text>
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()

// Dimensiones del SVG (unidades virtuales)
const W = 410
const H = 260

// Rango geográfico con padding
const LNG_MIN = 105.5
const LNG_MAX = 112.5
const LAT_MIN = 23.9
const LAT_MAX = 25.0

// Padding interno en unidades SVG
const PAD = 30

function projectX(lng: number): number {
  return PAD + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (W - PAD * 2)
}
function projectY(lat: number): number {
  // latitud invertida (norte = arriba)
  return PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (H - PAD * 2)
}

const ALERT_COLORS: Record<string, string> = {
  red:    '#EF4444',
  orange: '#F97316',
  blue:   '#3B82F6',
  green:  '#22C55E'
}

function alertColor(projectId: string): string {
  return ALERT_COLORS[store.alertLevelFor(projectId)] ?? '#22C55E'
}

function isSelected(id: string): boolean {
  return store.selectedProject === id
}

function onMarkerClick(id: string): void {
  store.selectProject(id)
}

function labelWidth(name: string): number {
  return name.length * 5.5 + 8
}

const legend = [
  { label: 'Red  ≥20 mm/día',  color: '#EF4444' },
  { label: 'Naranja ≥15 mm/día', color: '#F97316' },
  { label: 'Azul ≥10 mm/día',  color: '#3B82F6' },
  { label: 'Verde sin alerta',  color: '#22C55E' }
]
</script>
