import type { GnssReading } from '@/types'

/** Genera 180 puntos cada 2 días a partir del 2019-01-01.
 *  Imita los 3 eventos de aceleración del paper (Bai et al. 2020):
 *   - Evento 1: junio 2019 (día ~150-180) — aceleración moderada
 *   - Evento 2: julio 2019 (día ~180-210) — pico máximo (lluvia 141 mm)
 *   - Evento 3: ago-sep 2019 (día ~210-270) — segunda aceleración
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function generateGnssData(sensorId: string): GnssReading[] {
  const start = new Date('2019-01-01T00:00:00Z').getTime()
  const stepMs = 2 * 24 * 60 * 60 * 1000 // 2 days
  const readings: GnssReading[] = []
  let cumulative = 0
  let seed = sensorId.charCodeAt(0) * 13

  for (let i = 0; i < 180; i++) {
    seed++
    const r1 = seededRandom(seed++)
    const r2 = seededRandom(seed++)
    const r3 = seededRandom(seed++)
    const r4 = seededRandom(seed++)

    const dayOfYear = i * 2
    let rate: number

    // Evento 1: junio (días 150-180)
    if (dayOfYear >= 150 && dayOfYear < 180) {
      rate = 4.5 + r1 * 3.5
    }
    // Evento 2: julio — pico (días 180-212)
    else if (dayOfYear >= 180 && dayOfYear < 212) {
      rate = 9.0 + r1 * 6.0
    }
    // Evento 3: agosto-septiembre (días 212-270)
    else if (dayOfYear >= 212 && dayOfYear < 270) {
      rate = 3.5 + r1 * 2.5
    }
    else {
      rate = 0.3 + r1 * 1.2
    }

    cumulative += rate

    const dx = (r2 - 0.3) * rate * 1.4
    const dy = (r3 - 0.5) * rate * 0.9
    const dh = Math.sqrt(dx * dx + dy * dy)

    // ~10 % de lecturas no son rtk_fixed (para probar el filtro)
    const fixQuality = r4 > 0.1 ? 'rtk_fixed' : 'rtk_float'

    readings.push({
      timestamp: new Date(start + i * stepMs).toISOString(),
      displacement_x_mm: parseFloat(dx.toFixed(2)),
      displacement_y_mm: parseFloat(dy.toFixed(2)),
      displacement_horizontal_mm: parseFloat(dh.toFixed(2)),
      cumulative_displacement_mm: parseFloat(cumulative.toFixed(1)),
      fix_quality: fixQuality as GnssReading['fix_quality']
    })
  }

  return readings
}

// Pre-generados por sensor
const GNSS_SENSORS = [
  'GXZM-DB01', 'GXZM-DB02', 'GXZM-DB03', 'GXZM-DB04',
  'GXZM-DB05', 'GXZM-DB06', 'GXZM-DB07', 'GXZM-DB08'
]

export const gnssMockData: Record<string, GnssReading[]> = Object.fromEntries(
  GNSS_SENSORS.map(id => [id, generateGnssData(id)])
)

export { GNSS_SENSORS }
