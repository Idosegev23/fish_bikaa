import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Trash2, ShoppingCart, Image as ImageIcon, ArrowRight, Package, Clock, User, Mail, Phone, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

import type { CartItem } from '../App'

interface CustomerDetailsProps {
  cart: CartItem[]
  onRemoveFromCart: (index: number) => void
}

interface FormData {
  customerName: string
  email: string
  phone: string
  deliveryAddress: string
  deliveryDate: string
  deliveryTime: string
}

interface CartItemWithFish extends CartItem {
  fishImage?: string
  fishDescription?: string
}

export default function CustomerDetails({ cart, onRemoveFromCart }: CustomerDetailsProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [cartWithImages, setCartWithImages] = useState<CartItemWithFish[]>([])
  const [loadingImages, setLoadingImages] = useState(true)
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  // טעינת תמונות ומידע דגים
  useEffect(() => {
    const fetchFishData = async () => {
      if (cart.length === 0) {
        setLoadingImages(false)
        return
      }

      try {
        const fishIds = [...new Set(cart.map(item => item.fishId))]
        const { data: fishData, error } = await supabase
          .from('fish_types')
          .select('id, image_url, description')
          .in('id', fishIds)

        if (error) throw error

        const cartWithFishData = cart.map(item => {
          const fishInfo = fishData?.find(fish => fish.id === item.fishId)
          return {
            ...item,
            fishImage: fishInfo?.image_url,
            fishDescription: fishInfo?.description
          }
        })

        setCartWithImages(cartWithFishData)
      } catch (error) {
        console.error('Error fetching fish data:', error)
        setCartWithImages(cart)
      } finally {
        setLoadingImages(false)
      }
    }

    fetchFishData()
  }, [cart])

  const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  const onSubmit = async (data: FormData) => {
    if (cart.length === 0) {
      // הודעה מודרנית במקום alert
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-accent-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.36 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <span>הסל ריק! נא להוסיף פריטים לסל הקניות</span>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 4000)
      return
    }

    setLoading(true)
    
    // שמירת נתונים בLocal Storage לעכשיו
    localStorage.setItem('orderData', JSON.stringify({ ...data, cart, totalPrice }))
    
    navigate('/order-summary')
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

  if (cart.length === 0) {
    return (
      <div className="text-center py-20 card-glass max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-primary-600" />
        </div>
        <h2 className="text-3xl font-bold heading-gradient mb-4">הסל ריק</h2>
        <p className="text-neutral-500 text-lg mb-8">לא הוספתם פריטים לסל הקניות</p>
        <button 
          onClick={() => navigate('/catalog')}
          className="btn-primary hover-lift"
        >
          <Package className="w-5 h-5" />
          חזרה לקטלוג
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in">
      {/* Header */}
      <div className="text-center card-glass">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold heading-gradient mb-4">פרטי הזמנה</h1>
        <p className="text-lg sm:text-xl text-neutral-600 px-4 sm:px-0">מלאו את הפרטים שלכם להשלמת ההזמנה</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Cart Summary - מחזיק 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-3 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary-900">סיכום הזמנה</h2>
              <span className="badge-primary">
                {cart.length} פריט{cart.length > 1 ? 'ים' : ''}
              </span>
            </div>
            
            {loadingImages ? (
              <div className="space-y-4">
                {[...Array(cart.length)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 h-24 rounded-2xl"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {cartWithImages.map((item, index) => (
                  <div key={index} className="bg-gradient-to-br from-white/80 to-neutral-100/80 backdrop-blur-sm rounded-3xl p-6 border border-white/20 hover:shadow-depth transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      {/* תמונת דג */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-ocean-100 to-ocean-200 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 self-start sm:self-center">
                        {item.fishImage ? (
                          <img 
                            src={item.fishImage} 
                            alt={item.fishName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ocean-400">
                            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
                          </div>
                        )}
                      </div>

                      {/* פרטי דג */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                          <h3 className="text-lg sm:text-xl font-bold text-primary-900">{item.fishName}</h3>
                          <span className="badge-ocean text-xs sm:text-sm self-start sm:self-center">
                            {getWaterTypeIcon(item.waterType)} {getWaterTypeLabel(item.waterType)}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-sm">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Package className="w-4 h-4" />
                            <span>{item.cutType}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-600">
                            <span className="font-medium">{item.quantity} ק"ג</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-600">
                            <span>₪{item.pricePerKg}/ק"ג</span>
                          </div>
                        </div>

                        {item.fishDescription && (
                          <p className="text-neutral-500 text-sm mt-2 line-clamp-2">{item.fishDescription}</p>
                        )}
                      </div>

                      {/* מחיר ומחיקה */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4 flex-shrink-0 mt-3 sm:mt-0">
                        <div className="text-right sm:text-left">
                          <div className="text-xl sm:text-2xl font-bold text-accent-600">₪{item.totalPrice.toFixed(2)}</div>
                          <div className="text-sm text-neutral-500">סה"כ</div>
                        </div>
                        <button
                          onClick={() => onRemoveFromCart(index)}
                          className="p-2 sm:p-3 rounded-xl text-accent-500 hover:text-accent-600 hover:bg-accent-50 transition-all duration-200 group-hover:scale-105 self-end sm:self-center"
                          title="הסר מהעגלה"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* סיכום מחיר */}
                         <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 backdrop-blur-sm rounded-3xl p-4 sm:p-6 border border-primary-200/50 mt-6">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 text-xl sm:text-2xl font-bold mb-2">
                 <span className="text-primary-900">סה"כ לתשלום:</span>
                 <span className="text-accent-600">₪{totalPrice.toFixed(2)}</span>
               </div>
               <p className="text-primary-600 text-sm flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 התשלום יתבצע בעת איסוף ההזמנה בחנות
               </p>
             </div>
          </div>
        </div>

        {/* Customer Form */}
        <div className="xl:col-span-1">
          <div className="card-glass sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-accent-500 to-accent-600 p-3 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
                             <h2 className="text-xl sm:text-2xl font-bold text-accent-900">פרטי לקוח</h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-neutral-500" />
                  שם מלא *
                </label>
                <input
                  type="text"
                  {...register('customerName', { required: 'שם מלא הוא שדה חובה' })}
                  className="input-field text-lg"
                  placeholder="הכנס שם מלא"
                />
                {errors.customerName && (
                  <p className="text-accent-500 text-sm mt-2 flex items-center gap-2">
                    <span>⚠️</span> {errors.customerName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-neutral-500" />
                  דוא"ל *
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'דוא"ל הוא שדה חובה',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'כתובת דוא"ל לא תקינה'
                    }
                  })}
                  className="input-field text-lg"
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="text-accent-500 text-sm mt-2 flex items-center gap-2">
                    <span>⚠️</span> {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-neutral-500" />
                  טלפון *
                </label>
                <input
                  type="tel"
                  {...register('phone', { required: 'מספר טלפון הוא שדה חובה' })}
                  className="input-field text-lg"
                  placeholder="050-1234567"
                />
                {errors.phone && (
                  <p className="text-accent-500 text-sm mt-2 flex items-center gap-2">
                    <span>⚠️</span> {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-neutral-500" />
                  הערות נוספות
                </label>
                <textarea
                  {...register('deliveryAddress')}
                  className="input-field text-lg"
                  rows={3}
                  placeholder="הערות או בקשות מיוחדות (אופציונלי)"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-lg font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-neutral-500" />
                    תאריך איסוף *
                  </label>
                  <input
                    type="date"
                    {...register('deliveryDate', { required: 'תאריך איסוף הוא שדה חובה' })}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field text-lg"
                  />
                  {errors.deliveryDate && (
                    <p className="text-accent-500 text-sm mt-2 flex items-center gap-2">
                      <span>⚠️</span> {errors.deliveryDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-lg font-semibold text-neutral-700 mb-3">
                    שעה מועדפת *
                  </label>
                  <select 
                    {...register('deliveryTime', { required: 'שעה מועדפת היא שדה חובה' })}
                    className="input-field text-lg"
                  >
                    <option value="">בחר שעה</option>
                    <option value="08:00-10:00">🌅 08:00-10:00</option>
                    <option value="10:00-12:00">☀️ 10:00-12:00</option>
                    <option value="12:00-14:00">🌤️ 12:00-14:00</option>
                    <option value="14:00-16:00">🌞 14:00-16:00</option>
                    <option value="16:00-18:00">🌇 16:00-18:00</option>
                  </select>
                  {errors.deliveryTime && (
                    <p className="text-accent-500 text-sm mt-2 flex items-center gap-2">
                      <span>⚠️</span> {errors.deliveryTime.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-neutral-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>שולח...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>המשך להזמנה</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/catalog')}
                  className="w-full btn-secondary text-lg py-4"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Package className="w-5 h-5" />
                    <span>חזרה לקטלוג</span>
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 