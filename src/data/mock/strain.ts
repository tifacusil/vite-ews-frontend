import type { StrainReading } from '@/types'

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function generateStrainData(): StrainReading[] {
  const readings: StrainReading[] = []
  const start = new Date('2019-01-01T00:00:00Z').getTime()
  const stepMs = 2 * 24 * 60 * 60 * 1000
  let seed = 99

  let strain = 180.0
  let temp = 14.0

  for (let i = 0; i < 180; i++) {
    seed++
    const r1 = seededRandom(seed++)
    const r2 = seededRandom(seed++)
    const dayOfYear = i * 2

    let ds = (r1 - 0.45) * 2.0
    if (dayOfYear >= 150 && dayOfYear < 180) ds += 1.2
    if (dayOfYear >= 180 && dayOfYear < 212) ds += 2.8
    if (dayOfYear >= 212 && dayOfYear < 270) ds += 1.0
    strain = Math.max(100, Math.min(400, strain + ds))

    const seasonalT = 18 + 9 * Math.sin((dayOfYear - 30) / 365 * 2 * Math.PI)
    temp = parseFloat((seasonalT + (r2 - 0.5) * 2.5).toFixed(1))

    readings.push({
      timestamp: new Date(start + i * stepMs).toISOString(),
      strain_microstrain: parseFloat(strain.toFixed(1)),
      temperature_celsius: temp
    })
  }

  return readings
}

export const strainMockData: Record<string, StrainReading[]> = {
  'GXZM-SG02': generateStrainData()
}
