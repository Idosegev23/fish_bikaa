import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { FishType, CutType } from '../lib/supabase'
import type { CartItem } from '../App'
import { Plus, Filter, Image as ImageIcon, CheckCircle, AlertCircle, Star, Fish } from 'lucide-react'

interface FishCatalogProps {
  onAddToCart: (item: CartItem) => void
}

export default function FishCatalog({ onAddToCart }: FishCatalogProps) {
  const [searchParams] = useSearchParams()
  const [fish, setFish] = useState<FishType[]>([])
  const [cutTypes, setCutTypes] = useState<CutType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWaterType, setSelectedWaterType] = useState<string>(
    searchParams.get('type') || 'all'
  )

  useEffect(() => {
    fetchFishAndCuts()
  }, [])

  const fetchFishAndCuts = async () => {
    try {
      // טעינת דגים עם החיתוכים המתאימים להם
      const { data: fishWithCuts, error: fishError } = await supabase
        .from('fish_types')
        .select(`
          *,
          fish_cut_prices(
            cut_type_id,
            cut_types(*)
          )
        `)
        .eq('is_active', true)

      if (fishError) throw fishError

      // המרת הנתונים לפורמט הנוח יותר
      const fishData = fishWithCuts?.map(fish => ({
        ...fish,
        available_cuts: fish.fish_cut_prices?.map((fcp: any) => fcp.cut_types).filter(Boolean) || []
      })) || []

      // טעינת כל סוגי החיתוכים (להצגה כללית)
      const { data: allCuts, error: cutsError } = await supabase
        .from('cut_types')
        .select('*')

      if (cutsError) throw cutsError

      setFish(fishData)
      setCutTypes(allCuts || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFish = selectedWaterType === 'all' 
    ? fish 
    : fish.filter(f => f.water_type === selectedWaterType)

  const handleAddToCart = (fishItem: FishType, cutType: CutType, quantity: number) => {
    const pricePerKg = fishItem.price_per_kg + cutType.default_addition
    const totalPrice = pricePerKg * quantity

    const cartItem: CartItem = {
      fishId: fishItem.id,
      fishName: fishItem.name,
      waterType: fishItem.water_type,
      cutType: cutType.cut_name,
      quantity,
      pricePerKg,
      totalPrice
    }

    onAddToCart(cartItem)
    
    // רענון נתוני הדגים אחרי הוספה לסל
    fetchFishAndCuts()
    
    // הודעה מודרנית עם סטיילינג
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${fishItem.name} (${cutType.cut_name}) נוסף לסל הקניות!</span>
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
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold heading-gradient mb-6">קטלוג דגים</h1>
        <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
          בחרו את הדג שתרצו, סוג החיתוך והכמות. המחירים מעודכנים בזמן אמת והמלאי מתעדכן באופן מיידי.
        </p>
      </div>

      {/* Filter מעוצב */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 card-glass">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-xl">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <span className="text-neutral-700 font-semibold text-base sm:text-lg">סינון לפי סוג מים:</span>
        </div>
        <select
          value={selectedWaterType}
          onChange={(e) => setSelectedWaterType(e.target.value)}
          className="input-field w-full sm:w-auto text-base sm:text-lg font-medium bg-white/80 backdrop-blur-sm"
        >
          <option value="all">🐟 כל הדגים</option>
          <option value="saltwater">🌊 מים מלוחים</option>
          <option value="freshwater">💧 מים מתוקים</option>
          <option value="other">⭐ מיוחדים</option>
        </select>
      </div>

      {/* Fish Grid מודרני */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredFish.map((fishItem, index) => (
          <div key={fishItem.id} className="slide-up" style={{animationDelay: `${index * 0.1}s`}}>
            <FishCard
              fish={fishItem}
              cutTypes={fishItem.available_cuts || []}
              onAddToCart={handleAddToCart}
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
  onAddToCart: (fish: FishType, cutType: CutType, quantity: number) => void
}

function FishCard({ fish, cutTypes, onAddToCart }: FishCardProps) {
  const [selectedCut, setSelectedCut] = useState<number>(cutTypes[0]?.id || 1)
  const [quantity, setQuantity] = useState<number>(1)
  const [imageError, setImageError] = useState(false)

  const selectedCutType = cutTypes.find(cut => cut.id === selectedCut)
  const finalPrice = selectedCutType 
    ? fish.price_per_kg + selectedCutType.default_addition 
    : fish.price_per_kg

  const isOutOfStock = fish.available_kg <= 0
  const isLowStock = fish.available_kg > 0 && fish.available_kg <= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCutType && quantity > 0 && quantity <= fish.available_kg) {
      onAddToCart(fish, selectedCutType, quantity)
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
    <div className="card-glass hover-lift group">
      {/* Fish Image מעוצבת */}
      <div className="relative w-full h-52 bg-gradient-to-br from-ocean-100 to-ocean-200 rounded-3xl mb-6 overflow-hidden">
        {/* תג מצב מלאי */}
        <div className="absolute top-4 left-4 z-10">
          {isOutOfStock ? (
            <span className="status-error text-sm font-medium">אזל המלאי</span>
          ) : isLowStock ? (
            <span className="status-warning text-sm font-medium">מלאי נמוך</span>
          ) : (
            <span className="status-success text-sm font-medium">זמין במלאי</span>
          )}
        </div>

        {/* תג סוג מים */}
        <div className="absolute top-4 right-4 z-10">
          <span className="badge-ocean">
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
          <div className="flex flex-col items-center justify-center h-full text-ocean-400 group-hover:scale-105 transition-transform duration-500">
            <ImageIcon className="w-16 h-16 mb-3 opacity-50" />
            <span className="text-6xl opacity-70">{getWaterTypeIcon(fish.water_type)}</span>
          </div>
        )}
      </div>

      {/* Fish Info מעוצבת */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-primary-900 mb-2 text-wrap">{fish.name}</h3>
          {fish.description && (
            <p className="text-neutral-600 leading-relaxed text-sm sm:text-base text-wrap">{fish.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cut Type Selection מעוצבת */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-neutral-700 mb-3">
              סוג חיתוך:
            </label>
            <select
              value={selectedCut}
              onChange={(e) => setSelectedCut(Number(e.target.value))}
              className="input-field text-base sm:text-lg"
            >
              {cutTypes.map((cut) => (
                <option key={cut.id} value={cut.id}>
                  {cut.cut_name} (+₪{cut.default_addition})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity מעוצבת */}
          <div>
            <label className="block text-base sm:text-lg font-semibold text-neutral-700 mb-3">
              כמות (ק"ג):
            </label>
            <input
              type="number"
              min="0.5"
              max={fish.available_kg}
              step="0.5"
              value={quantity}
              onChange={(e) => {
                const newQuantity = Number(e.target.value)
                setQuantity(Math.min(newQuantity, fish.available_kg))
              }}
              className="input-field text-base sm:text-lg"
            />
            <p className="text-sm text-neutral-500 mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              מקסימום זמין: {fish.available_kg} ק"ג
            </p>
          </div>

          {/* Price Display מעוצבת */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 backdrop-blur-sm p-6 rounded-3xl border border-primary-200/50">
            <div className="flex justify-between items-center text-lg text-primary-700 mb-2">
              <span>מחיר לק"ג:</span>
              <span className="font-semibold">₪{finalPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-primary-900">סה"כ:</span>
              <span className="text-2xl font-bold text-accent-600">₪{(finalPrice * quantity).toFixed(2)}</span>
            </div>
          </div>

          {/* Add to Cart Button מעוצב */}
          <button
            type="submit"
            disabled={isOutOfStock || fish.available_kg < quantity}
            className="w-full btn-primary text-base sm:text-lg py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isOutOfStock ? (
              <>
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>אזל המלאי</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>הוסף לסל</span>
              </>
            )}
          </button>

          {/* Availability מעוצבת */}
          <div className="text-center">
            {isOutOfStock ? (
              <div className="flex items-center justify-center gap-2 text-accent-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">אזל המלאי</span>
              </div>
            ) : fish.available_kg >= quantity ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">זמין במלאי: {fish.available_kg} ק"ג</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-accent-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">אין מספיק במלאי</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
} 