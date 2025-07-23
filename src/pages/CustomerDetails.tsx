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
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center card-glass relative overflow-hidden">
          <div className="absolute inset-0 wave-animation opacity-5"></div>
          <div className="relative z-10 py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-ocean-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <ShoppingCart className="w-16 h-16 text-white float-animation" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-800 via-ocean-600 to-primary-800 bg-clip-text text-transparent mb-6">
              🛒 הסל ריק
            </h2>
            <p className="text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              עדיין לא הוספתם דגים טריים לסל הקניות שלכם
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <button 
          onClick={() => navigate('/catalog')}
                className="btn-primary text-2xl py-6 px-12 shadow-2xl hover:shadow-3xl"
              >
                <div className="flex items-center gap-4">
                  <Package className="w-8 h-8" />
                  <span>🐟 בואו נתחיל לקנות!</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/')}
                className="btn-secondary text-xl py-5 px-10"
              >
                <div className="flex items-center gap-3">
                  <span>🏠</span>
                  <span>חזרה לעמוד הבית</span>
                </div>
        </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto space-y-10 fade-in px-4 sm:px-6 lg:px-8">
      {/* Stunning Header */}
      <div className="text-center card-glass relative overflow-hidden">
        <div className="absolute inset-0 wave-animation opacity-10"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-ocean-500 rounded-full mb-6 shadow-2xl">
            <ShoppingCart className="w-10 h-10 text-white float-animation" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-800 via-ocean-600 to-primary-800 bg-clip-text text-transparent mb-6">פרטי הזמנה</h1>
          <p className="text-xl sm:text-2xl text-slate-600 px-4 sm:px-8 leading-relaxed">מלאו את הפרטים שלכם להשלמת ההזמנה 🐟</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
        {/* Enhanced Cart Summary - מחזיק 3 columns */}
        <div className="xl:col-span-3 space-y-8">
          <div className="card-gradient relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-ocean-400 to-accent-500 rounded-t-3xl"></div>
            <div className="form-header">
              <div className="form-icon-container">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-800 to-ocean-700 bg-clip-text text-transparent">סיכום הזמנה</h2>
                <p className="text-slate-600 mt-1">הדגים הטריים שבחרתם</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge px-6 py-3 text-lg font-bold">
                  {cart.length} פריט{cart.length > 1 ? 'ים' : ''}
                </span>
              </div>
            </div>
            
            {loadingImages ? (
              <div className="space-y-6">
                {[...Array(cart.length)].map((_, index) => (
                  <div key={index} className="cart-item shimmer-effect">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl animate-pulse"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl animate-pulse"></div>
                        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg animate-pulse w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {cartWithImages.map((item, index) => (
                  <div key={index} className="cart-item relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-ocean-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                      {/* Enhanced Fish Image */}
                      <div className="cart-item-image relative group-hover:scale-105">
                        {item.fishImage ? (
                          <img 
                            src={item.fishImage} 
                            alt={item.fishName}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ocean-500">
                            <ImageIcon className="w-8 h-8 opacity-70 float-animation" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>

                      {/* Enhanced Fish Details */}
                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-800 to-ocean-700 bg-clip-text text-transparent">{item.fishName}</h3>
                          <span className="badge-ocean text-sm font-bold shadow-lg">
                            <span className="text-lg">{getWaterTypeIcon(item.waterType)}</span>
                            {getWaterTypeLabel(item.waterType)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-3 rounded-2xl border border-primary-200">
                            <Package className="w-5 h-5 text-primary-600" />
                            <span className="font-semibold text-primary-800">{item.cutType}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-3 rounded-2xl border border-emerald-200">
                            <span className="w-5 h-5 text-emerald-600 font-bold text-lg">⚖️</span>
                            <span className="font-semibold text-emerald-800">{item.quantity} ק"ג</span>
                          </div>
                          <div className="flex items-center gap-3 bg-gradient-to-br from-amber-50 to-amber-100 px-4 py-3 rounded-2xl border border-amber-200">
                            <span className="w-5 h-5 text-amber-600 font-bold text-lg">💰</span>
                            <span className="font-semibold text-amber-800">₪{item.pricePerKg}/ק"ג</span>
                          </div>
                        </div>

                        {item.fishDescription && (
                          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200">
                            <p className="text-slate-700 text-sm leading-relaxed">{item.fishDescription}</p>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Price and Delete */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6 flex-shrink-0">
                        <div className="text-center sm:text-right bg-gradient-to-br from-accent-100 via-accent-50 to-red-50 p-6 rounded-3xl border border-accent-200 shadow-lg">
                          <div className="text-3xl font-black bg-gradient-to-r from-accent-600 to-red-600 bg-clip-text text-transparent mb-1">₪{item.totalPrice.toFixed(2)}</div>
                          <div className="text-sm font-semibold text-accent-700 flex items-center justify-center gap-1">
                            <span>💳</span> סה"כ
                          </div>
                </div>
                  <button
                    onClick={() => onRemoveFromCart(index)}
                          className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 hover:from-red-100 hover:to-red-200 hover:text-red-700 border border-red-200 transition-all duration-500 hover:scale-110 hover:shadow-xl group-hover:animate-pulse"
                          title="הסר מהעגלה"
                  >
                          <Trash2 className="w-5 h-5" />
                  </button>
                      </div>
                </div>
              </div>
            ))}
              </div>
            )}

            {/* Enhanced Price Summary */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-50 rounded-3xl p-8 border-2 border-emerald-200 shadow-2xl mt-8">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-400"></div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6">
                  <div className="text-center sm:text-right">
                    <h3 className="text-2xl font-bold text-emerald-800 mb-2">💰 סה"כ לתשלום</h3>
                    <div className="text-5xl font-black bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 bg-clip-text text-transparent pulse-primary">
                      ₪{totalPrice.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-6xl animate-bounce">
                    🐟
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200">
                  <p className="text-emerald-700 text-lg flex items-center justify-center gap-3 font-semibold">
                    <Clock className="w-6 h-6" />
                    <span>התשלום יתבצע בעת איסוף ההזמנה בחנות 🏪</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Customer Form */}
        <div className="xl:col-span-2">
          <div className="form-section sticky top-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-500 via-pink-400 to-purple-500 rounded-t-3xl"></div>
            <div className="form-header relative z-10">
              <div className="form-icon-container bg-gradient-to-br from-accent-500 to-pink-500">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-accent-800 to-pink-700 bg-clip-text text-transparent">פרטי לקוח</h2>
                <p className="text-slate-600 mt-1">מלאו את הפרטים בבקשה 👤</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span>שם מלא *</span>
              </label>
              <input
                type="text"
                {...register('customerName', { required: 'שם מלא הוא שדה חובה' })}
                  className="input-field text-xl"
                  placeholder="הכנס את שמך המלא 👤"
              />
              {errors.customerName && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-700 font-semibold">{errors.customerName.message}</span>
                  </div>
              )}
            </div>

              <div className="space-y-4">
                <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span>דוא"ל *</span>
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
                  className="input-field text-xl"
                  placeholder="📧 your.email@example.com"
              />
              {errors.email && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-700 font-semibold">{errors.email.message}</span>
                  </div>
              )}
            </div>

              <div className="space-y-4">
                <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <span>טלפון *</span>
              </label>
              <input
                type="tel"
                {...register('phone', { required: 'מספר טלפון הוא שדה חובה' })}
                  className="input-field text-xl"
                  placeholder="📱 050-1234567"
              />
              {errors.phone && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <span className="text-red-700 font-semibold">{errors.phone.message}</span>
                  </div>
              )}
            </div>

              <div className="space-y-4">
                <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <span>הערות נוספות</span>
              </label>
              <textarea
                {...register('deliveryAddress')}
                  className="input-field text-xl resize-none"
                  rows={4}
                  placeholder="📝 הערות או בקשות מיוחדות (אופציונלי)"
              />
            </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200 space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">📅 פרטי איסוף</h3>
                  <p className="text-slate-600">בחרו מתי ובאיזה שעה לאסוף את ההזמנה</p>
                </div>
                
                <div className="space-y-4">
                  <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span>תאריך איסוף *</span>
                </label>
                <input
                  type="date"
                  {...register('deliveryDate', { required: 'תאריך איסוף הוא שדה חובה' })}
                  min={new Date().toISOString().split('T')[0]}
                    className="input-field text-xl"
                />
                {errors.deliveryDate && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <span className="text-red-700 font-semibold">{errors.deliveryDate.message}</span>
                    </div>
                )}
              </div>

                <div className="space-y-4">
                  <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span>שעה מועדפת *</span>
                </label>
                <select 
                  {...register('deliveryTime', { required: 'שעה מועדפת היא שדה חובה' })}
                    className="input-field text-xl"
                  >
                    <option value="">🕰️ בחרו שעה מועדפת</option>
                    <option value="08:00-10:00">🌅 בוקר מוקדם - 08:00-10:00</option>
                    <option value="10:00-12:00">☀️ בוקר - 10:00-12:00</option>
                    <option value="12:00-14:00">🌤️ צהריים - 12:00-14:00</option>
                    <option value="14:00-16:00">🌞 אחר הצהריים - 14:00-16:00</option>
                    <option value="16:00-18:00">🌇 ערב - 16:00-18:00</option>
                </select>
                {errors.deliveryTime && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <span className="text-red-700 font-semibold">{errors.deliveryTime.message}</span>
                    </div>
                )}
              </div>
            </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 border border-slate-200 space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent mb-2">🚀 השלמת ההזמנה</h3>
                  <p className="text-slate-600">כל הפרטים נראים טוב? בואו נמשיך!</p>
                </div>
                
              <button
                type="submit"
                disabled={loading}
                  className="w-full btn-primary text-2xl py-6 font-bold shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  {loading ? (
                    <div className="flex items-center justify-center gap-4 relative z-10">
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>🔄 שולח הזמנה...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4 relative z-10">
                      <span>🎆 המשך להזמנה</span>
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                  className="w-full btn-secondary text-xl py-5 font-semibold shadow-lg hover:shadow-2xl"
              >
                  <div className="flex items-center justify-center gap-4">
                    <Package className="w-6 h-6" />
                    <span>🔙 חזרה לקטלוג</span>
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