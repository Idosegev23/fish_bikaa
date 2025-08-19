export type FishSize = 'S' | 'M' | 'L'

const KG_BY_WEIGHT_FISH: string[] = [
  'סלמון',
  'טונה אדומה',
  'טונה כחולה',
  'ברבוניה'
]

export function isByWeight(fishName: string): boolean {
  return KG_BY_WEIGHT_FISH.includes(fishName)
}

export function isSizeableFish(fishName: string): boolean {
  return fishName === 'דניס'
}

export function getAverageWeightKg(fishName: string, size?: FishSize): number {
  if (fishName === 'דניס') {
    switch (size) {
      case 'S':
        return 0.35 // ~300–400g (S)
      case 'M':
        return 0.5  // ~400–600g (M)
      case 'L':
        return 0.7  // ~600–800g (L)
      default:
        return 0.5
    }
  }
  // ברירת מחדל לדגים הנמכרים לפי יחידה
  return 1.0
}

export function computeMaxUnits(availableKg: number, fishName: string, size?: FishSize): number {
  const avg = getAverageWeightKg(fishName, size)
  if (avg <= 0) return 0
  return Math.max(0, Math.floor(availableKg / avg))
}

