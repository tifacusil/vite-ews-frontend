import type { RainfallReading } from '@/types'

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

/** Genera precipitación diaria 2019-01-01 → 2019-12-31.
 *  Pico real del paper: 141.4 mm el 2019-07-01.
 *  Patrón monzónico de Guangxi: temporada húmeda may-sep.
 */
export function generateRainfallData(): RainfallReading[] {
  const readings: RainfallReading[] = []
  const start = new Date('2019-01-01T00:00:00Z').getTime()
  const dayMs = 24 * 60 * 60 * 1000
  let cumulative = 0
  let seed = 42

  for (let i = 0; i < 365; i++) {
    seed++
    const r = seededRandom(seed)
    const date = new Date(start + i * dayMs)
    const month = date.getUTCMonth() // 0-11

    let rainfall = 0

    // Día del pico real del paper
    const isPeakDay = i === 181 // 2019-07-01 = día 182 (0-indexado: 181)

    if (isPeakDay) {
      rainfall = 141.4
    } else {
      // Temporada seca (dic-mar): lluvia escasa
      if (month >= 11 || month <= 2) {
        rainfall = r < 0.15 ? r * 8 : 0
      }
      // Transición (abr, oct-nov)
      else if (month === 3 || month >= 9) {
        rainfall = r < 0.30 ? r * 20 : 0
      }
      // Temporada húmeda (may-jun): moderada
      else if (month >= 4 && month <= 5) {
        rainfall = r < 0.45 ? r * 40 + seededRandom(seed + 100) * 15 : 0
      }
      // Plena temporada monzónica (jul-sep)
      else if (month >= 6 && month <= 8) {
        rainfall = r < 0.55 ? r * 60 + seededRandom(seed + 200) * 20 : 0
      }
    }

    rainfall = parseFloat(Math.max(0, rainfall).toFixed(1))
    cumulative += rainfall

    readings.push({
      timestamp: date.toISOString(),
      rainfall_mm: rainfall,
      cumulative_rainfall_mm: parseFloat(cumulative.toFixed(1)),
      interval_minutes: 1440 // diario
    })
  }

  return readings
}

export const rainfallMockData: Record<string, RainfallReading[]> = {
  'GXZM-RG01': generateRainfallData()
}
