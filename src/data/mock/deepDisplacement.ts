import type { DeepDisplacementReading } from '@/types'

/** Perfil de inclinómetro de barreno — REQ-WEB-08.
 *  Profundidades: [2, 4, 6, 8, 10, 12, 14, 15] m
 *  Anclaje: depth_m = 15.0 → cumulative_tilt_mm = 48.7
 *
 *  El desplazamiento acumulado crece hacia la superficie (depth = 0).
 *  Patrón típico de deslizamiento superficial: máx desplazamiento arriba,
 *  disminuye hacia el punto de anclaje inferior.
 */
export function generateDeepDisplacementProfile(timestamp: string): DeepDisplacementReading[] {
  const depths = [2, 4, 6, 8, 10, 12, 14, 15]
  // Ancla en 15 m: cumulative_tilt_mm = 48.7
  // A mayor profundidad, menor desplazamiento (más cercano a roca base)
  const anchorCumulative = 48.7
  const maxSurface = 142.5 // estimado en superficie

  return depths.map((depth_m, idx) => {
    // Factor de desplazamiento: 1.0 en superficie → anchorCumulative en 15 m
    const normalizedDepth = depth_m / 15.0
    // Curva no-lineal: mayor movimiento en zona superficial
    const factor = 1.0 - Math.pow(normalizedDepth, 0.65)
    const cumulative = anchorCumulative + (maxSurface - anchorCumulative) * factor

    // Componentes x e y con algo de ruido determinista
    const seed = idx * 7.3
    const angle = seed % (2 * Math.PI)
    const tilt_x = cumulative * Math.cos(angle) * 0.65
    const tilt_y = cumulative * Math.sin(angle) * 0.35

    return {
      timestamp,
      depth_m,
      tilt_x_mm: parseFloat(tilt_x.toFixed(2)),
      tilt_y_mm: parseFloat(tilt_y.toFixed(2)),
      cumulative_tilt_mm: parseFloat(cumulative.toFixed(1))
    }
  })
}

export const deepDisplacementMockData: Record<string, DeepDisplacementReading[]> = {
  'LZ-DB01': generateDeepDisplacementProfile('2019-06-15T06:00:00Z')
}
