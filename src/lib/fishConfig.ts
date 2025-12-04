export type FishSize = 'S' | 'M' | 'L'

// דגים הנמכרים לפי משקל שהלקוח בוחר (לא לפי יחידות קבועות)
const KG_BY_WEIGHT_FISH: string[] = [
  'סלמון',
  'טונה אדומה', 
  'טונה כחולה',
  'טונה',
  'נסיכת נילוס',
  'נסיכה',
  'אינטיאס'
]

// משקלים ממוצעים לפי שם דג (בק"ג)
const AVERAGE_WEIGHTS: Record<string, number> = {
  'קרפיון': 1.5,
  'פרידה': 0.7,
  'ברבוניה': 0.1,
  'לוקוס לבן': 1.5,
  'לוקוס': 1.5,
  'דניס': 0.7,
  'לברק': 0.7,
  'מוסר ים': 1.5,
  'מוסרים': 1.5,
  'בורי': 1.3,
  'ברמונדי': 1.0,
  'פורל': 0.6,
  'מושט': 0.9,
  // דגים שנמכרים לפי משקל - אין משקל ממוצע קבוע
  'סלמון': 0,
  'טונה אדומה': 0,
  'טונה': 0,
  'נסיכת נילוס': 0,
  'נסיכה': 0,
  'אינטיאס': 0
}

// דגים שתומכים בגדלים (S/M/L)
const SIZEABLE_FISH: string[] = ['דניס', 'לברק']

// גדלים לדניס ולברק
const SIZE_WEIGHTS: Record<string, Record<FishSize, number>> = {
  'דניס': {
    'S': 0.5,   // ~400-600g
    'M': 0.7,   // ~600-800g  
    'L': 0.9    // ~800g+
  },
  'לברק': {
    'S': 0.5,   // ~400-600g
    'M': 0.7,   // ~600-800g
    'L': 0.9    // ~800g+
  }
}

export function isByWeight(fishName: string): boolean {
  return KG_BY_WEIGHT_FISH.some(name => 
    fishName.includes(name) || name.includes(fishName)
  )
}

export function isSizeableFish(fishName: string): boolean {
  return SIZEABLE_FISH.some(name => 
    fishName.includes(name) || name.includes(fishName)
  )
}

export function getAverageWeightKg(fishName: string, size?: FishSize): number {
  // בדיקה אם זה דג עם גדלים
  const sizeableKey = SIZEABLE_FISH.find(name => 
    fishName.includes(name) || name.includes(fishName)
  )
  
  if (sizeableKey && size && SIZE_WEIGHTS[sizeableKey]) {
    return SIZE_WEIGHTS[sizeableKey][size]
  }
  
  // חיפוש משקל ממוצע לפי שם
  for (const [name, weight] of Object.entries(AVERAGE_WEIGHTS)) {
    if (fishName.includes(name) || name.includes(fishName)) {
      return weight
    }
  }
  
  // ברירת מחדל
  return 1.0
}

export function computeMaxUnits(availableKg: number, fishName: string, size?: FishSize): number {
  const avg = getAverageWeightKg(fishName, size)
  if (avg <= 0) return Infinity // דגים לפי משקל - אין הגבלת יחידות
  return Math.max(0, Math.floor(availableKg / avg))
}

// פונקציה חדשה - האם יש משקל ממוצע ידוע לדג
export function hasKnownAverageWeight(fishName: string): boolean {
  const weight = getAverageWeightKg(fishName)
  return weight > 0
}

// פונקציה חדשה - קבלת תיאור משקל לתצוגה
export function getWeightDisplayText(fishName: string, size?: FishSize): string {
  if (isByWeight(fishName)) {
    return 'לפי משקל שתבחר'
  }
  
  if (isSizeableFish(fishName)) {
    const weights = SIZE_WEIGHTS[fishName] || SIZE_WEIGHTS['דניס']
    return `S≈${weights.S}ק"ג | M≈${weights.M}ק"ג | L≈${weights.L}ק"ג`
  }
  
  const weight = getAverageWeightKg(fishName)
  if (weight > 0) {
    return `משקל ממוצע: ~${weight}ק"ג`
  }
  
  return ''
}
