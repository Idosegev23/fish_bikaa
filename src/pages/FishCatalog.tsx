import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { FishType, CutType } from '../lib/supabase'
import type { CartItem } from '../App'
import { Plus, Filter, Image as ImageIcon, CheckCircle, AlertCircle, Fish } from 'lucide-react'

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
    
    // הודעה מקצועית
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-ocean-lg z-50 animate-slide-up'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${fishItem.name} (${cutType.cut_name}) נוסף לסל</span>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="ocean-loading"></div>
      </div>
    )
  }

  return (
    <div className="space-y-12 fade-in">
      {/* Professional Header */}
      <div className="text-center card-glass p-12">
        <h1 className="heading-responsive font-bold text-deep-900 mb-6">קטלוג דגים</h1>
        <p className="text-lg text-deep-600 max-w-4xl mx-auto leading-relaxed">
          בחרו את הדג המועדף עליכם, סוג החיתוך והכמות. כל המחירים מעודכנים בזמן אמת.
        </p>
      </div>

      {/* Professional Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 card p-6">
        <div className="flex items-center gap-3">
          <div className="ocean-gradient p-3 rounded-xl">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <span className="text-deep-700 font-semibold text-lg">סינון לפי סוג מים:</span>
        </div>
        <select
          value={selectedWaterType}
          onChange={(e) => setSelectedWaterType(e.target.value)}
          className="input-field w-full sm:w-auto text-lg font-medium"
        >
          <option value="all">כל הדגים</option>
          <option value="saltwater">מים מלוחים</option>
          <option value="freshwater">מים מתוקים</option>
          <option value="other">מיוחדים</option>
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
        <div className="text-center py-20 card">
          <div className="w-20 h-20 bg-deep-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Fish className="w-10 h-10 text-deep-400" />
          </div>
          <p className="text-deep-600 text-xl font-medium">לא נמצאו דגים בקטגוריה זו</p>
          <p className="text-deep-500 mt-2">נסו לבחור קטגוריה אחרת</p>
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

  const getWaterTypeClass = (waterType: string) => {
    switch(waterType) {
      case 'saltwater': return 'bg-ocean-100 text-ocean-800 border-ocean-200'
      case 'freshwater': return 'bg-wave-100 text-wave-800 border-wave-200'
      case 'other': return 'bg-sand-100 text-sand-800 border-sand-200'
      default: return 'bg-deep-100 text-deep-800 border-deep-200'
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
    <div className="professional-card group">
      {/* Professional Fish Image */}
      <div className="relative w-full h-52 fish-image-container mb-6">
        {/* Stock Status */}
        <div className="absolute top-4 left-4 z-10">
          {isOutOfStock ? (
            <span className="badge-coral text-sm font-medium">אזל המלאי</span>
          ) : isLowStock ? (
            <span className="badge-warning text-sm font-medium">מלאי נמוך</span>
          ) : (
            <span className="badge-success text-sm font-medium">זמין במלאי</span>
          )}
        </div>

        {/* Water Type Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`badge ${getWaterTypeClass(fish.water_type)}`}>
            {getWaterTypeLabel(fish.water_type)}
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
          <div className="flex items-center justify-center h-full text-deep-400 group-hover:scale-105 transition-transform duration-500">
            <ImageIcon className="w-16 h-16 opacity-50" />
          </div>
        )}
      </div>

      {/* Professional Fish Info */}
      <div className="space-y-6 p-6">
        <div>
          <h3 className="text-2xl font-bold text-deep-900 mb-2">{fish.name}</h3>
          {fish.description && (
            <p className="text-deep-600 leading-relaxed">{fish.description}</p>
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

          {/* Professional Price Display */}
          <div className="surface-glass p-6 rounded-2xl">
            <div className="flex justify-between items-center text-lg text-deep-700 mb-2">
              <span>מחיר לק"ג:</span>
              <span className="font-semibold">₪{finalPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-deep-900">סה"כ:</span>
              <span className="text-2xl font-bold text-ocean-600">₪{(finalPrice * quantity).toFixed(2)}</span>
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