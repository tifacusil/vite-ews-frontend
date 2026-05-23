import type { SoilPressureReading } from '@/types'

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function generateSoilPressureData(): SoilPressureReading[] {
  const readings: SoilPressureReading[] = []
  const start = new Date('2019-01-01T00:00:00Z').getTime()
  const stepMs = 2 * 24 * 60 * 60 * 1000
  let seed = 77

  let pressure = 40.0
  let temp = 14.0

  for (let i = 0; i < 180; i++) {
    seed++
    const r1 = seededRandom(seed++)
    const r2 = seededRandom(seed++)
    const dayOfYear = i * 2

    // Presión aumenta con los eventos de lluvia
    let dp = (r1 - 0.48) * 0.6
    if (dayOfYear >= 150 && dayOfYear < 180) dp += 0.25
    if (dayOfYear >= 180 && dayOfYear < 212) dp += 0.55
    if (dayOfYear >= 212 && dayOfYear < 270) dp += 0.20
    pressure = Math.max(30, Math.min(70, pressure + dp))

    // Temperatura sigue estacionalidad (máx ~27 en julio, mín ~10 en enero)
    const seasonalT = 18 + 9 * Math.sin((dayOfYear - 30) / 365 * 2 * Math.PI)
    temp = parseFloat((seasonalT + (r2 - 0.5) * 2).toFixed(1))

    readings.push({
      timestamp: new Date(start + i * stepMs).toISOString(),
      pressure_kpa: parseFloat(pressure.toFixed(2)),
      temperature_celsius: temp
    })
  }

  return readings
}

export const soilPressureMockData: Record<string, SoilPressureReading[]> = {
  'GXZM-SP01': generateSoilPressureData()
}
