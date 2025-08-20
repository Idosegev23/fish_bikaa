import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Trash2, ShoppingCart, Image as ImageIcon, ArrowRight, Package, Clock, User, Mail, Phone, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AvailableTimeSelector from '../components/AvailableTimeSelector'

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
  const [activeHoliday, setActiveHoliday] = useState<{ name: string; start_date: string; end_date: string } | null>(null)
  const [isImmediatePickup, setIsImmediatePickup] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, setValue, trigger, watch } = useForm<FormData>()

  // ניקוי נתוני הזמנה קודמת בכניסה לדף
  useEffect(() => {
    localStorage.removeItem('orderData')
  }, [])

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

  useEffect(() => {
    const loadHoliday = async () => {
      const { data } = await supabase
        .from('holidays')
        .select('name, start_date, end_date')
        .eq('active', true)
        .limit(1)
        .maybeSingle()
      if (data) setActiveHoliday(data as any)
    }
    loadHoliday()
  }, [])

  const toISODate = (d: Date) => d.toISOString().split('T')[0]
  const computePreHolidayDate = (startISO: string) => {
    const d = new Date(startISO)
    d.setDate(d.getDate() - 1)
    // הימנעות משבת (6)
    while (d.getDay() === 6) {
      d.setDate(d.getDate() - 1)
    }
    const today = new Date()
    today.setHours(0,0,0,0)
    return toISODate(d < today ? today : d)
  }

  // Check if we're in holiday mode based on URL params
  const isHolidayMode = new URLSearchParams(window.location.search).has('holiday')
  
  // Calculate date constraints for holiday mode
  const getDateConstraints = () => {
    if (isHolidayMode && activeHoliday) {
      return {
        min: activeHoliday.start_date,
        max: activeHoliday.end_date
      }
    }
    return {
      min: new Date().toISOString().split('T')[0],
      max: undefined
    }
  }
  
  const dateConstraints = getDateConstraints()

  // פונקציה למעבר ל"מעכשיו לעכשיו"
  const handleImmediatePickup = async () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // הגדרת תאריך היום ושעה "מעכשיו לעכשיו"
    setValue('deliveryDate', today, { shouldDirty: true, shouldValidate: true })
    setValue('deliveryTime', 'immediate', { shouldDirty: true, shouldValidate: true })
    
    setIsImmediatePickup(true)
    
    // ואליציה של השדות
    await trigger(['deliveryDate', 'deliveryTime'])
  }

  // פונקציה לביטול "מעכשיו לעכשיו"
  const handleCancelImmediate = () => {
    setValue('deliveryTime', '', { shouldDirty: true, shouldValidate: true })
    setIsImmediatePickup(false)
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  const showNotification = (message: string, type: 'error' | 'warning' = 'error') => {
    const notification = document.createElement('div')
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-amber-500'
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up`
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.36 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <span>${message}</span>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 4000)
  }

  const onSubmit = async (data: FormData) => {
    if (cart.length === 0) {
      showNotification('הסל ריק! נא להוסיף פריטים לסל הקניות')
      return
    }

    // בדיקת שדות חובה (אימייל אופציונלי)
    if (!data.customerName || !data.phone || !data.deliveryDate || !data.deliveryTime) {
      showNotification('יש למלא את כל השדות הנדרשים', 'warning')
      return
    }

    // בדיקת תאריך במצב חג
    if (isHolidayMode && activeHoliday) {
      const selectedDate = new Date(data.deliveryDate)
      const startDate = new Date(activeHoliday.start_date)
      const endDate = new Date(activeHoliday.end_date)
      
      if (selectedDate < startDate || selectedDate > endDate) {
        showNotification(`התאריך שנבחר אינו בטווח החג (${new Date(activeHoliday.start_date).toLocaleDateString('he-IL')} - ${new Date(activeHoliday.end_date).toLocaleDateString('he-IL')})`, 'warning')
        return
      }
    }

    setLoading(true)
    
    try {
      // עיבוד נתוני הזמנה
      // אם זה מעכשיו לעכשיו, נגדיר שעה נוכחית אמיתית
      const currentTime = new Date().toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      
      const orderData = {
        ...data,
        cart,
        totalPrice,
        isHolidayMode,
        isImmediatePickup,
        // אם זה "מעכשיו לעכשיו", נשמור שעה נוכחית אמיתית
        deliveryTime: data.deliveryTime === 'immediate' ? currentTime : data.deliveryTime
      }
      
      // שמירת נתונים בLocal Storage
      localStorage.setItem('orderData', JSON.stringify(orderData))
      
      navigate('/order-summary')
    } catch (error) {
      console.error('Error saving order data:', error)
      showNotification('שגיאה בשמירת הנתונים. נא לנסות שוב.')
    } finally {
      setLoading(false)
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

  if (cart.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center card-glass relative overflow-hidden">
          <div className="absolute inset-0 wave-animation opacity-5"></div>
          <div className="relative z-10 py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <ShoppingCart className="w-16 h-16 text-white float-animation" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-800 via-accent-600 to-primary-800 bg-clip-text text-transparent mb-6">
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
      {/* Header קטן ונקי */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">פרטי הזמנה</h1>
        <p className="text-sm text-neutral-600">מלאו פרטי קשר ובחרו מועד איסוף</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
        {/* Cart Summary קומפקטי */}
        <div className="xl:col-span-3 space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">סיכום הזמנה</h2>
              <span className="text-sm text-neutral-600">{cart.length} פריטים</span>
            </div>
            {loadingImages ? (
              <div className="space-y-2">
                {[...Array(cart.length)].map((_, i) => (
                  <div key={i} className="h-14 bg-neutral-100 animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg bg-white">
                {cartWithImages.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2">
                    <div className="w-14 h-14 rounded-md bg-neutral-100 overflow-hidden flex-shrink-0">
                      {item.fishImage ? (
                        <img src={item.fishImage} alt={item.fishName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">{item.fishName}</div>
                      <div className="text-xs text-neutral-600 truncate">{item.cutType} • {item.unitsBased ? `${item.quantity} יח׳` : `${item.quantity} ק"ג`}</div>
                    </div>
                    <div className="text-sm font-semibold text-neutral-900 whitespace-nowrap">₪{item.totalPrice.toFixed(2)}</div>
                    <button onClick={() => onRemoveFromCart(index)} className="text-red-600 hover:text-red-700 p-2" title="הסר">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-base font-semibold">
              <span>סה"כ:</span>
              <span className="text-primary-700">₪{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Customer Form */}
        <div className="xl:col-span-2">
          <div className="form-section sticky top-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-neutral-200 rounded-t-3xl"></div>
            <div className="form-header relative z-10">
              <div className="form-icon-container bg-gradient-to-br from-accent-500 to-pink-500">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900">פרטי לקוח</h2>
                <p className="text-neutral-600 mt-1 text-sm">מלאו את הפרטים בבקשה</p>
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
                   className="input-field text-base"
                   placeholder="שם מלא"
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
                  <span>דוא"ל</span>
                  <span className="text-sm text-neutral-500 font-normal">(אופציונלי)</span>
              </label>
              <input
                type="email"
                {...register('email', { 
                  validate: (value) => !value || /^\S+@\S+$/i.test(value) || 'כתובת דוא"ל לא תקינה'
                })}
                   className="input-field text-base"
                   placeholder="your@email.com"
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
                   className="input-field text-base"
                   placeholder="050-1234567"
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
                  className="input-field text-base resize-none"
                  rows={4}
                  placeholder="הערות או בקשות מיוחדות (אופציונלי)"
              />
            </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200 space-y-8">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">פרטי איסוף</h3>
                  <p className="text-neutral-600 text-sm">בחרו תאריך ושעה לאיסוף</p>
                </div>
                
                <div className="space-y-4">
                <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span>תאריך איסוף *</span>
                </label>
                <div className="space-y-3">
                  {isHolidayMode && activeHoliday && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800 font-medium">
                        🎉 הזמנה לחג {activeHoliday.name}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        ניתן לבחור רק תאריכים בטווח החג: {new Date(activeHoliday.start_date).toLocaleDateString('he-IL')} - {new Date(activeHoliday.end_date).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      {...register('deliveryDate', { required: 'תאריך איסוף הוא שדה חובה' })}
                      min={dateConstraints.min}
                      max={dateConstraints.max}
                      className="input-field text-base"
                    />
                    {isHolidayMode && activeHoliday && (
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={async () => {
                          setValue('deliveryDate', activeHoliday.start_date, { shouldDirty: true, shouldValidate: true })
                          await trigger('deliveryDate')
                        }}
                      >
                        בחר יום ראשון של {activeHoliday.name}
                      </button>
                    )}
                  </div>
                </div>
                {errors.deliveryDate && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <span className="text-red-700 font-semibold">{errors.deliveryDate.message}</span>
                    </div>
                )}
              </div>

              {/* כפתור "מעכשיו לעכשיו" */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-orange-800 text-lg">🚀 צריך מיד?</h4>
                    <p className="text-orange-700 text-sm">קבלו את ההזמנה בתוך 30-45 דקות</p>
                  </div>
                  {!isImmediatePickup ? (
                    <button
                      type="button"
                      onClick={handleImmediatePickup}
                      disabled={isHolidayMode} // לא זמין במצב חג
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        isHolidayMode 
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      }`}
                    >
                      מעכשיו לעכשיו
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-green-700 font-semibold flex items-center gap-1">
                        ✅ מעכשיו לעכשיו
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelImmediate}
                        className="text-orange-600 hover:text-orange-800 underline text-sm"
                      >
                        ביטול
                      </button>
                    </div>
                  )}
                </div>
                {isHolidayMode && (
                  <p className="text-amber-600 text-xs mt-2">
                    * "מעכשיו לעכשיו" לא זמין בהזמנות חג
                  </p>
                )}
              </div>

              {/* בורר שעות - מוסתר במצב "מעכשיו לעכשיו" */}
              {!isImmediatePickup && (
                <AvailableTimeSelector 
                  selectedDate={watch('deliveryDate')}
                  register={register}
                  errors={errors}
                />
              )}
            </div>

              <div className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">המשך להזמנה</h3>
                  <p className="text-neutral-600 text-sm">כל הפרטים נראים טוב? המשיכו לסיכום</p>
                </div>
                
              <button
                type="submit"
                disabled={loading}
                  className="w-full btn-primary text-base py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {loading ? 'שולח...' : 'המשך לסיכום והשליחה'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                  className="w-full btn-secondary text-base py-3 font-semibold"
              >
                  חזרה לקטלוג
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>

      {/* סרגל תחתון צף - מובייל לצמצום גלילה */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-neutral-200 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-neutral-500">סה"כ</div>
            <div className="text-lg font-bold text-primary-700">₪{totalPrice.toFixed(2)}</div>
          </div>
          <button
            onClick={() => (document.querySelector('form') as HTMLFormElement)?.requestSubmit()}
            className="btn-primary flex-1 py-3"
            disabled={loading}
          >
            המשך
          </button>
        </div>
      </div>
    </div>
  )
} 