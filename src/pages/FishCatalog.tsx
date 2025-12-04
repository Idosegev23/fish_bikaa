import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { FishType, CutType } from '../lib/supabase'
import type { CartItem } from '../App'
import { isByWeight, getAverageWeightKg, computeMaxUnits, getWeightDisplayText, hasKnownAverageWeight } from '../lib/fishConfig'
import { Plus, Minus, Fish, Search, X, ChevronDown } from 'lucide-react'

interface FishCatalogProps {
  onAddToCart: (item: CartItem) => void
}

export default function FishCatalog({ onAddToCart }: FishCatalogProps) {
  const [searchParams] = useSearchParams()
  const [fish, setFish] = useState<FishType[]>([])
  const [cutTypes, setCutTypes] = useState<CutType[]>([])
  const [fishPopularity, setFishPopularity] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [selectedWaterType, setSelectedWaterType] = useState<string>(searchParams.get('type') || 'all')
  const holidayParam = searchParams.get('holiday')
  const [activeHoliday, setActiveHoliday] = useState<{ name: string; start_date: string; end_date: string; pickup_deadline?: string } | null>(null)
  const isHolidayMode = holidayParam && activeHoliday
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'popularity'>('popularity')

  useEffect(() => {
    fetchFishAndCuts()
    fetchFishPopularity()
  }, [])

  useEffect(() => {
    const loadHoliday = async () => {
      const { data } = await supabase
        .from('holidays')
        .select('name, start_date, end_date, pickup_deadline')
        .eq('active', true)
        .limit(1)
        .maybeSingle()
      if (data) setActiveHoliday(data as any)
    }
    loadHoliday()
  }, [])

  const fetchFishPopularity = async () => {
    try {
      const { data, error } = await supabase
        .from('fish_popularity')
        .select('fish_name, total_quantity, order_count')

      if (error) throw error

      const popularityMap: Record<string, number> = {}
      data?.forEach(item => {
        popularityMap[item.fish_name] = parseFloat(item.total_quantity) || 0
      })
      
      setFishPopularity(popularityMap)
    } catch (error) {
      console.error('Error fetching fish popularity:', error)
    }
  }

  const fetchFishAndCuts = async () => {
    try {
      const { data: fishWithCuts, error: fishError } = await supabase
        .from('fish_types')
        .select(`
          *,
          fish_available_cuts(
            cut_type_id,
            is_active,
            price_addition,
            cut_types(*)
          )
        `)
        .eq('is_active', true)

      if (fishError) throw fishError

      const fishData = fishWithCuts?.map(fish => ({
        ...fish,
        available_cuts: fish.fish_available_cuts
          ?.filter((fac: any) => fac.is_active && fac.cut_types && fac.cut_types.is_active)
          .map((fac: any) => ({
            ...fac.cut_types,
            price_addition: fac.price_addition
          })) || []
      })) || []

      const { data: allCuts, error: cutsError } = await supabase
        .from('cut_types')
        .select('*')
        .eq('is_active', true)

      if (cutsError) throw cutsError

      setFish(fishData)
      setCutTypes(allCuts || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredAndSortedFish = () => {
    let filtered = fish
    
    // סינון דגים ללא מלאי - מציג רק מה שיש
    filtered = filtered.filter(f => f.available_kg > 0)
    
    if (selectedWaterType !== 'all') {
      filtered = filtered.filter(f => f.water_type === selectedWaterType)
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query)
      )
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'he')
        case 'price_asc':
          return a.price_per_kg - b.price_per_kg
        case 'price_desc':
          return b.price_per_kg - a.price_per_kg
        case 'popularity':
          const aPopularity = fishPopularity[a.name] || 0
          const bPopularity = fishPopularity[b.name] || 0
          if (bPopularity !== aPopularity) {
            return bPopularity - aPopularity
          }
          return b.available_kg - a.available_kg
        default:
          return 0
      }
    })
    
    return filtered
  }
  
  const filteredFish = getFilteredAndSortedFish()

  const addCartItem = (cartItem: CartItem) => {
    onAddToCart(cartItem)
    fetchFishAndCuts()
    
    const notification = document.createElement('div')
    notification.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 bg-charcoal text-white px-6 py-3 z-50 fade-in'
    notification.style.border = '1px solid #1A1A1A'
    notification.textContent = `${cartItem.fishName} נוסף לסל`
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2500)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-stone-400">טוען...</div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <section className="bg-stone-100 py-12 md:py-16">
        <div className="container-boutique">
          {isHolidayMode ? (
            <div className="text-center">
              <span className="badge-gold mb-4">הזמנה לחג</span>
              <h1 className="font-serif text-h1 text-charcoal mb-4">
                הזמנות ל{activeHoliday?.name}
              </h1>
              <p className="text-stone-500 max-w-lg mx-auto">
                {new Date(activeHoliday?.start_date || '').toLocaleDateString('he-IL')} – {new Date(activeHoliday?.end_date || '').toLocaleDateString('he-IL')}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="font-serif text-h1 text-charcoal mb-4">קטלוג הדגים</h1>
              <p className="text-stone-500 max-w-lg mx-auto">
                דגים טריים, חתוכים לפי בחירתכם
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-stone-200 sticky top-20 z-40">
        <div className="container-boutique py-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* חיפוש */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="חיפוש דג..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pr-10"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* סינון סוג מים */}
            <div className="relative">
              <select
                value={selectedWaterType}
                onChange={(e) => setSelectedWaterType(e.target.value)}
                className="select-boutique min-w-[150px]"
              >
                <option value="all">כל הסוגים</option>
                <option value="saltwater">דגי ים</option>
                <option value="freshwater">מים מתוקים</option>
                <option value="other">פרימיום</option>
              </select>
            </div>

            {/* מיון */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="select-boutique min-w-[150px]"
              >
                <option value="popularity">פופולריות</option>
                <option value="name">לפי שם</option>
                <option value="price_asc">מחיר: נמוך לגבוה</option>
                <option value="price_desc">מחיר: גבוה לנמוך</option>
              </select>
            </div>

            {/* תוצאות */}
            <span className="text-small text-stone-500">
              {filteredFish.length} דגים
            </span>
          </div>
        </div>
      </section>

      {/* Fish Grid */}
      <section className="section bg-stone-50">
        <div className="container-boutique">
          {filteredFish.length > 0 ? (
            <div className="products-grid">
              {filteredFish.map((fishItem, index) => (
                <div 
                  key={fishItem.id} 
                  className="slide-up" 
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <FishCard
                    fish={fishItem}
                    cutTypes={fishItem.available_cuts || []}
                    onAdd={addCartItem}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Fish className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">לא נמצאו דגים</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedWaterType('all')
                }}
                className="mt-4 text-small text-charcoal underline"
              >
                איפוס סינונים
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

interface FishCardProps {
  fish: FishType
  cutTypes: CutType[]
  onAdd: (item: CartItem) => void
}

function FishCard({ fish, cutTypes, onAdd }: FishCardProps) {
  const [selectedCut, setSelectedCut] = useState<number>(cutTypes[0]?.id || 1)
  const [quantity, setQuantity] = useState<number>(1)
  const [size, setSize] = useState<'S' | 'M' | 'L' | undefined>(undefined)
  const [imageError, setImageError] = useState(false)

  const selectedCutType = cutTypes.find(cut => cut.id === selectedCut)
  const finalPrice = selectedCutType 
    ? fish.price_per_kg + (selectedCutType.default_addition || 0)
    : fish.price_per_kg

  const unitsBased = !isByWeight(fish.name)
  const averageWeight = getAverageWeightKg(fish.name, size)
  const maxUnits = unitsBased ? computeMaxUnits(fish.available_kg, fish.name, size) : undefined
  const isOutOfStock = unitsBased ? (maxUnits || 0) <= 0 : fish.available_kg <= 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCutType) return

    if (unitsBased) {
      if (quantity <= 0 || (maxUnits !== undefined && quantity > maxUnits)) return
      
      const pricePerUnit = fish.price_per_kg + (selectedCutType.default_addition || 0)
      const totalPrice = pricePerUnit * quantity
      onAdd({
        fishId: fish.id,
        fishName: fish.name,
        waterType: fish.water_type,
        cutType: selectedCutType.cut_name,
        cutTypeId: selectedCutType.id,
        quantity,
        pricePerKg: pricePerUnit,
        totalPrice,
        unitsBased: true,
        averageWeightKg: averageWeight,
        size,
        unitPrice: pricePerUnit,
      })
    } else {
      if (quantity <= 0 || quantity > fish.available_kg) return
      
      const pricePerKg = fish.price_per_kg + (selectedCutType.default_addition || 0)
      const totalPrice = pricePerKg * quantity
      onAdd({
        fishId: fish.id,
        fishName: fish.name,
        waterType: fish.water_type,
        cutType: selectedCutType.cut_name,
        cutTypeId: selectedCutType.id,
        quantity,
        pricePerKg,
        totalPrice,
      })
    }
  }

  return (
    <div className="fish-card group">
      {/* תמונה */}
      <div className="fish-card-image relative">
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <span className="text-small text-stone-500">אזל המלאי</span>
          </div>
        )}
        {fish.image_url && !imageError ? (
          <img 
            src={fish.image_url} 
            alt={fish.name}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-stone-100">
            <Fish className="w-12 h-12 text-stone-300" />
          </div>
        )}
      </div>

      {/* תוכן */}
      <div className="fish-card-content">
        <div className="mb-4">
          <h3 className="fish-card-title">{fish.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="fish-card-price">₪{finalPrice}</span>
            <span className="fish-card-unit">לק״ג</span>
          </div>
          {/* משקל ממוצע */}
          {hasKnownAverageWeight(fish.name) && !isByWeight(fish.name) && (
            <p className="text-tiny text-stone-500 mt-1">
              ~{getWeightDisplayText(fish.name)} | ~₪{(finalPrice * averageWeight).toFixed(0)} ליחידה
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* מידה לדגים שהוגדרו עם מידות */}
          {fish.has_sizes && (
            <div>
              <label className="form-label">מידה</label>
              <select
                value={size || ''}
                onChange={(e) => setSize((e.target.value as 'S'|'M'|'L') || undefined)}
                className="select-boutique w-full"
              >
                <option value="">בחר מידה</option>
                <option value="S">S - קטן</option>
                <option value="M">M - בינוני</option>
                <option value="L">L - גדול</option>
              </select>
            </div>
          )}

          {/* סוג חיתוך */}
          {cutTypes.length > 0 && (
            <div>
              <label className="form-label">חיתוך</label>
              <select
                value={selectedCut}
                onChange={(e) => setSelectedCut(Number(e.target.value))}
                className="select-boutique w-full"
              >
                {cutTypes.map((cut) => (
                  <option key={cut.id} value={cut.id}>
                    {cut.cut_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* כמות */}
          <div>
            <label className="form-label">
              {unitsBased ? 'יחידות' : 'ק״ג'}
            </label>
            <div className="quantity-selector">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(unitsBased ? 1 : 0.5, quantity - (unitsBased ? 1 : 0.5)))}
                disabled={isOutOfStock || (unitsBased ? quantity <= 1 : quantity <= 0.5)}
                className="quantity-btn"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={unitsBased ? 1 : 0.5}
                max={unitsBased ? maxUnits : fish.available_kg}
                step={unitsBased ? 1 : 0.5}
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  const max = unitsBased ? (maxUnits || 0) : fish.available_kg
                  setQuantity(Math.max(unitsBased ? 1 : 0.5, Math.min(val, max)))
                }}
                className="quantity-input"
              />
              <button
                type="button"
                onClick={() => {
                  const max = unitsBased ? (maxUnits || 0) : fish.available_kg
                  setQuantity(Math.min(max, quantity + (unitsBased ? 1 : 0.5)))
                }}
                disabled={isOutOfStock || (unitsBased ? quantity >= (maxUnits || 0) : quantity >= fish.available_kg)}
                className="quantity-btn"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-tiny text-stone-400 mt-1">
              זמין: {unitsBased ? `${maxUnits || 0} יח׳` : `${fish.available_kg} ק״ג`}
            </p>
          </div>

          {/* סיכום */}
          <div className="pt-4 border-t border-stone-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-small text-stone-600">סה״כ</span>
              <span className="font-serif text-h4 text-charcoal">
                ₪{(finalPrice * quantity).toFixed(0)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isOutOfStock}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOutOfStock ? 'אזל המלאי' : 'הוסף לסל'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
