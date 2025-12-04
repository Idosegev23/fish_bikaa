import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { FishType, CutType } from '../lib/supabase'
import type { CartItem } from '../App'
import { isByWeight, isSizeableFish, getAverageWeightKg, computeMaxUnits, getWeightDisplayText, hasKnownAverageWeight } from '../lib/fishConfig'
import { Plus, Minus, Filter, Image as ImageIcon, CheckCircle, AlertCircle, Fish, Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react'

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
  
  // חיפוש וסינון
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'popularity'>('popularity')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [showFilters, setShowFilters] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)

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

      // יצירת מפה של פופולאריות דגים
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
      // טעינת דגים עם החיתוכים המתאימים להם מטבלת fish_available_cuts
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

      // המרת הנתונים לפורמט הנוח יותר - רק חיתוכים פעילים
      const fishData = fishWithCuts?.map(fish => ({
        ...fish,
        available_cuts: fish.fish_available_cuts
          ?.filter((fac: any) => fac.is_active && fac.cut_types && fac.cut_types.is_active)
          .map((fac: any) => ({
            ...fac.cut_types,
            price_addition: fac.price_addition // תוספת מחיר ספציפית לדג אם יש
          })) || []
      })) || []

      // טעינת כל סוגי החיתוכים הפעילים (להצגה כללית)
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

  // פונקציה לסינון ומיון דגים
  const getFilteredAndSortedFish = () => {
    let filtered = fish
    
    // סינון לפי סוג מים
    if (selectedWaterType !== 'all') {
      filtered = filtered.filter(f => f.water_type === selectedWaterType)
    }
    
    // סינון לפי חיפוש טקסט
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query) ||
        f.water_type.toLowerCase().includes(query)
      )
    }
    
    // סינון לפי מחיר
    filtered = filtered.filter(f => 
      f.price_per_kg >= priceRange[0] && f.price_per_kg <= priceRange[1]
    )
    
    // סינון לפי זמינות
    if (availableOnly) {
      filtered = filtered.filter(f => f.available_kg > 0)
    }
    
    // מיון
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'he')
        case 'price_asc':
          return a.price_per_kg - b.price_per_kg
        case 'price_desc':
          return b.price_per_kg - a.price_per_kg
        case 'popularity':
          // מיון לפי פופולאריות אמיתית מההזמנות
          const aPopularity = fishPopularity[a.name] || 0
          const bPopularity = fishPopularity[b.name] || 0
          if (bPopularity !== aPopularity) {
            return bPopularity - aPopularity
          }
          // אם אין נתוני פופולאריות, מיון לפי כמות זמינה
          return b.available_kg - a.available_kg
        default:
          return 0
      }
    })
    
    return filtered.map(f => ({
      ...f,
      isHolidayRecommended: holidayParam === 'rosh-hashanah' ? 
        ['דניס','לברק','סלמון','בורי'].includes(f.name) : false
    }))
  }
  
  const filteredFish = getFilteredAndSortedFish()

  const addCartItem = (cartItem: CartItem) => {
    onAddToCart(cartItem)
    fetchFishAndCuts()
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${cartItem.fishName} (${cartItem.cutType}) נוסף לסל הקניות!</span>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Fish className="w-6 h-6 text-primary-600 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12 fade-in">
      {/* Header מודרני */}
      <div className="text-center card-glass">
        {isHolidayMode ? (
          <>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
              🎉 מצב הזמנה לחג
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="heading-gradient">הזמנות ל{activeHoliday?.name}</span>
            </h1>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-primary-800">תאריכי החג:</span>
                  <p className="text-primary-700">
                    {new Date(activeHoliday?.start_date || '').toLocaleDateString('he-IL')} – {new Date(activeHoliday?.end_date || '').toLocaleDateString('he-IL')}
                  </p>
                </div>
                {activeHoliday?.pickup_deadline && (
                  <div>
                    <span className="font-semibold text-accent-800">מועד אחרון להזמנה:</span>
                    <p className="text-accent-700">
                      {new Date(activeHoliday.pickup_deadline).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              בחרו את הדגים להזמנה לחג. ההזמנות יסופקו בתאריכי החג שנבחרו.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold heading-gradient mb-6">קטלוג דגים</h1>
            <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              בחרו את הדג שתרצו, סוג החיתוך והכמות. המחירים מעודכנים בזמן אמת והמלאי מתעדכן באופן מיידי.
            </p>
          </>
        )}
      </div>

      {/* חיפוש וסינונים מתקדמים */}
      <div className="space-y-6">
        {/* שורת חיפוש ומיון */}
        <div className="card-modern p-6 space-y-4">
          {/* שורה עליונה - חיפוש ופעולות */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* חיפוש */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חפש דג לפי שם, תיאור או סוג..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 backdrop-blur-sm text-neutral-800 placeholder-neutral-400"
              />
            </div>
            
            {/* מיון */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/90 backdrop-blur-sm text-neutral-800 min-w-[160px]"
              >
                <option value="popularity">פופולאריות</option>
                <option value="name">מיון לפי שם</option>
                <option value="price_asc">מחיר: נמוך לגבוה</option>
                <option value="price_desc">מחיר: גבוה לנמוך</option>
              </select>
            </div>
            
            {/* כפתור סינונים */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                showFilters 
                  ? 'bg-primary-500 text-white border-primary-500' 
                  : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>סינונים</span>
            </button>
          </div>
          
          {/* פאנל סינונים מתקדם */}
          {showFilters && (
            <div className="border-t border-neutral-100 pt-6 mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* סוג מים */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">סוג מים</label>
        <select
          value={selectedWaterType}
          onChange={(e) => setSelectedWaterType(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
        >
                    <option value="all">כל הסוגים</option>
          <option value="saltwater">מים מלוחים</option>
          <option value="freshwater">מים מתוקים</option>
          <option value="other">מיוחדים</option>
        </select>
      </div>

                {/* טווח מחירים */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700">
                    מחיר לק"ג: ₪{priceRange[0]} - ₪{priceRange[1]}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full accent-primary-500"
                    />
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-primary-500"
                    />
                  </div>
                </div>
                
                {/* זמינות */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="w-4 h-4 accent-primary-500"
                    />
                    רק זמינים במלאי
                  </label>
                </div>
                
                {/* איפוס סינונים */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedWaterType('all')
                      setPriceRange([0, 500])
                      setAvailableOnly(false)
                      setSortBy('popularity')
                    }}
                    className="w-full px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium"
                  >
                    איפוס סינונים
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* תוצאות */}
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>נמצאו {filteredFish.length} דגים</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
            >
              <X className="w-4 h-4" />
              ניקוי חיפוש
            </button>
          )}
        </div>
      </div>

      {/* Fish Grid מודרני */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredFish.map((fishItem, index) => (
          <div key={fishItem.id} className="slide-up" style={{animationDelay: `${index * 0.1}s`}}>
          <FishCard
            fish={fishItem}
              cutTypes={fishItem.available_cuts || []}
              onAdd={addCartItem}
              popularity={fishPopularity[fishItem.name] || 0}
          />
          </div>
        ))}
      </div>

      {filteredFish.length === 0 && (
        <div className="text-center py-20 card-glass">
          <div className="w-20 h-20 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Fish className="w-10 h-10 text-neutral-400" />
          </div>
          <p className="text-neutral-500 text-xl font-medium">לא נמצאו דגים בקטגוריה זו</p>
          <p className="text-neutral-400 mt-2">נסו לבחור קטגוריה אחרת או לחזור מאוחר יותר</p>
        </div>
      )}
    </div>
  )
}

interface FishCardProps {
  fish: FishType
  cutTypes: CutType[]
  onAdd: (item: CartItem) => void
  popularity?: number
}

function FishCard({ fish, cutTypes, onAdd, popularity = 0 }: FishCardProps) {
  const [selectedCut, setSelectedCut] = useState<number>(cutTypes[0]?.id || 1)
  const [quantity, setQuantity] = useState<number>(1)
  const [size, setSize] = useState<'S' | 'M' | 'L' | undefined>(undefined)
  const [imageError, setImageError] = useState(false)

  const selectedCutType = cutTypes.find(cut => cut.id === selectedCut)
  const finalPrice = selectedCutType 
    ? fish.price_per_kg + selectedCutType.default_addition 
    : fish.price_per_kg

  const unitsBased = !isByWeight(fish.name)
  const averageWeight = getAverageWeightKg(fish.name, size)
  const maxUnits = unitsBased ? computeMaxUnits(fish.available_kg, fish.name, size) : undefined
  const isOutOfStock = unitsBased ? (maxUnits || 0) <= 0 : fish.available_kg <= 0
  const isLowStock = unitsBased ? (maxUnits || 0) > 0 && (maxUnits || 0) <= 5 : fish.available_kg > 0 && fish.available_kg <= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCutType) return

    if (unitsBased) {
      if (quantity <= 0 || (maxUnits !== undefined && quantity > maxUnits)) {
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-accent-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.36 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span>לא ניתן להזמין יותר מהמלאי הזמין (${maxUnits || 0} יחידות)</span>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 4000)
        return
      }
      const pricePerUnit = selectedCutType ? fish.price_per_kg + selectedCutType.default_addition : fish.price_per_kg
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
      if (quantity > 0 && quantity <= fish.available_kg) {
        const pricePerKg = fish.price_per_kg + selectedCutType.default_addition
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
    } else if (quantity > fish.available_kg) {
      // הודעת שגיאה מודרנית
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-accent-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.36 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <span>לא ניתן להזמין יותר מהמלאי הזמין (${fish.available_kg} ק"ג)</span>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 4000)
      }
    }
  }

  const getWaterTypeIcon = (waterType: string) => {
    switch(waterType) {
      case 'saltwater': return '🌊'
      case 'freshwater': return '💧'
      case 'other': return '⭐'
      default: return '🐟'
    }
  }

  const getWaterTypeLabel = (waterType: string) => {
    switch(waterType) {
      case 'saltwater': return 'מים מלוחים'
      case 'freshwater': return 'מים מתוקים'
      case 'other': return 'מיוחד'
      default: return 'לא ידוע'
    }
  }

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 p-6">
      {/* Fish Image מעוצבת */}
      <div className="relative w-full h-48 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl mb-6 overflow-hidden">
        {/* תג מצב מלאי */}
        <div className="absolute top-3 right-3 z-10">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full shadow-md">
              אזל המלאי
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-md">
              מלאי נמוך
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full shadow-md">
              זמין
            </span>
          )}
        </div>

        {/* תג פופולאריות */}
        {popularity > 5 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
              פופולרי
            </span>
          </div>
        )}

        {/* תג סוג מים */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-1 bg-primary-500 text-white text-xs font-medium rounded-full shadow-md">
            {getWaterTypeIcon(fish.water_type)} {getWaterTypeLabel(fish.water_type)}
          </span>
        </div>

        {fish.image_url && !imageError ? (
          <img 
            src={fish.image_url} 
            alt={fish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-400 group-hover:scale-105 transition-transform duration-500">
            <Fish className="w-16 h-16 mb-2 opacity-60" />
            <span className="text-sm font-medium opacity-70">{fish.name}</span>
          </div>
        )}
      </div>

      {/* Fish Info מעוצבת */}
      <div className="space-y-4">
        <div className="border-b border-neutral-100 pb-4">
          <h3 className="text-xl font-bold text-neutral-800 mb-2">{fish.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary-600">₪{finalPrice}</span>
            <span className="text-sm text-neutral-500">
              לק"ג (ברוטו)
            </span>
          </div>
          {/* הצגת משקל ממוצע */}
          {hasKnownAverageWeight(fish.name) && !isByWeight(fish.name) && (
            <div className="text-sm bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-lg p-2.5 mt-2">
              <div className="flex items-center gap-2 text-blue-700">
                <span className="text-lg">⚖️</span>
                {isSizeableFish(fish.name) ? (
                  <span className="font-medium">{getWeightDisplayText(fish.name)}</span>
                ) : (
                  <div className="flex justify-between items-center flex-1">
                    <span>{getWeightDisplayText(fish.name)}</span>
                    <span className="font-bold">~₪{(finalPrice * getAverageWeightKg(fish.name)).toFixed(0)} ליחידה</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* דגים לפי משקל */}
          {isByWeight(fish.name) && (
            <div className="text-sm bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-2.5 mt-2">
              <div className="flex items-center gap-2 text-amber-700">
                <span className="text-lg">📏</span>
                <span className="font-medium">נמכר לפי משקל שתבחר</span>
              </div>
            </div>
          )}
          {fish.description && (
            <p className="text-neutral-600 text-sm mt-3 leading-relaxed">
              {fish.description}
            </p>
          )}
          
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dennis sizes */}
          {isSizeableFish(fish.name) && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                מידת הדג:
              </label>
              <select
                value={size || ''}
                onChange={(e) => setSize((e.target.value as 'S'|'M'|'L') || undefined)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
              >
                <option value="">בחר מידה</option>
                <option value="S">S - קטן</option>
                <option value="M">M - בינוני</option>
                <option value="L">L - גדול</option>
              </select>
            </div>
          )}
          {/* Cut Type Selection מעוצבת */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              סוג חיתוך:
            </label>
            <select
              value={selectedCut}
              onChange={(e) => setSelectedCut(Number(e.target.value))}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
            >
              {cutTypes.map((cut) => (
                <option key={cut.id} value={cut.id}>
                  {cut.cut_name}{cut.default_addition > 0 ? ` (+₪${cut.default_addition})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity/Units מעוצבת */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {unitsBased ? 'כמות (יחידות):' : 'כמות (ק"ג):'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (unitsBased) {
                    setQuantity(Math.max(1, quantity - 1))
                  } else {
                    setQuantity(Math.max(0.5, quantity - 0.5))
                  }
                }}
                disabled={isOutOfStock || (unitsBased ? quantity <= 1 : quantity <= 0.5)}
                className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              
              {unitsBased ? (
                <input
                  type="number"
                  min={1}
                  max={maxUnits}
                  step={1}
                  value={quantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setQuantity(1)
                    } else {
                      const newQuantity = Number(value)
                      setQuantity(Math.max(1, Math.min(newQuantity, maxUnits || 0)))
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm text-center"
                />
              ) : (
                <input
                  type="number"
                  min="0.5"
                  max={fish.available_kg}
                  step="0.5"
                  value={quantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setQuantity(0.5)
                    } else {
                      const newQuantity = Number(value)
                      setQuantity(Math.min(newQuantity, fish.available_kg))
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm text-center"
                />
              )}
              
              <button
                type="button"
                onClick={() => {
                  if (unitsBased) {
                    setQuantity(Math.min(maxUnits || 0, quantity + 1))
                  } else {
                    setQuantity(Math.min(fish.available_kg, quantity + 0.5))
                  }
                }}
                disabled={isOutOfStock || (unitsBased ? quantity >= (maxUnits || 0) : quantity >= fish.available_kg)}
                className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {unitsBased ? (
                <>זמין: {maxUnits || 0} יחידות (≈ {averageWeight}ק"ג ליחידה)</>
              ) : (
                <>זמין: {fish.available_kg} ק"ג</>
              )}
            </p>
          </div>

          {/* Price Summary */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-600">סה"כ:</span>
              <span className="text-lg font-bold text-neutral-800">₪{(finalPrice * quantity).toFixed(2)}</span>
            </div>
            <div className="text-xs text-neutral-500">
              {quantity} {unitsBased ? 'יחידות' : 'ק"ג'} × ₪{finalPrice}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            type="submit"
            disabled={isOutOfStock || fish.available_kg < quantity}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isOutOfStock ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>אזל המלאי</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>הוסף לסל</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 