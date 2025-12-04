import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Trash2, ShoppingCart, Image as ImageIcon, ArrowRight, Package, Clock, User, Mail, Phone, MapPin, Tag, Check, X, Sparkles, Plus } from 'lucide-react'
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

interface Coupon {
  id: number
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_uses?: number
  current_uses: number
  valid_from: string
  valid_until?: string
  active: boolean
}

interface RecommendedProduct {
  id: number
  name: string
  price: number
  image_url?: string
  category?: string
}

export default function CustomerDetails({ cart, onRemoveFromCart }: CustomerDetailsProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [cartWithImages, setCartWithImages] = useState<CartItemWithFish[]>([])
  const [loadingImages, setLoadingImages] = useState(true)
  const [activeHoliday, setActiveHoliday] = useState<{ name: string; start_date: string; end_date: string } | null>(null)
  const [isImmediatePickup, setIsImmediatePickup] = useState(false)
  
  // קופונים
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [checkingCoupon, setCheckingCoupon] = useState(false)
  
  // מוצרים מומלצים
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([])
  
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

  // טעינת מוצרים מומלצים
  useEffect(() => {
    const fetchRecommended = async () => {
      const { data } = await supabase
        .from('additional_products')
        .select('id, name, price, image_url, category')
        .eq('active', true)
        .gt('available_units', 0)
        .limit(6)
      
      if (data) setRecommendedProducts(data)
    }
    fetchRecommended()
  }, [])

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
    while (d.getDay() === 6) {
      d.setDate(d.getDate() - 1)
    }
    const today = new Date()
    today.setHours(0,0,0,0)
    return toISODate(d < today ? today : d)
  }

  const isHolidayMode = new URLSearchParams(window.location.search).has('holiday')
  
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

  const handleImmediatePickup = async () => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    setValue('deliveryDate', today, { shouldDirty: true, shouldValidate: true })
    setValue('deliveryTime', 'immediate', { shouldDirty: true, shouldValidate: true })
    
    setIsImmediatePickup(true)
    await trigger(['deliveryDate', 'deliveryTime'])
  }

  const handleCancelImmediate = () => {
    setValue('deliveryTime', '', { shouldDirty: true, shouldValidate: true })
    setIsImmediatePickup(false)
  }

  // חישוב מחיר עם קופון
  const subtotalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.discount_type === 'percentage') {
      return (subtotalPrice * appliedCoupon.discount_value) / 100
    }
    return appliedCoupon.discount_value
  }
  
  const discountAmount = calculateDiscount()
  const totalPrice = Math.max(0, subtotalPrice - discountAmount)

  // בדיקת קופון
  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    
    setCheckingCoupon(true)
    setCouponError('')
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single()
      
      if (error || !data) {
        setCouponError('קוד קופון לא תקין')
        return
      }
      
      const coupon = data as Coupon
      
      // בדיקת תוקף
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        setCouponError('פג תוקף הקופון')
        return
      }
      
      // בדיקת מינימום הזמנה
      if (coupon.min_order_amount && subtotalPrice < coupon.min_order_amount) {
        setCouponError(`הזמנה מינימלית לקופון זה: ₪${coupon.min_order_amount}`)
        return
      }
      
      // בדיקת מקסימום שימושים
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        setCouponError('הקופון נוצל עד תומו')
        return
      }
      
      setAppliedCoupon(coupon)
      setCouponCode('')
    } catch (err) {
      setCouponError('שגיאה בבדיקת הקופון')
    } finally {
      setCheckingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  const showNotification = (message: string, type: 'error' | 'warning' | 'success' = 'error') => {
    const notification = document.createElement('div')
    const bgColor = type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-green-500'
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up`
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.36 16.5c-.77.833.192 2.5 1.732 2.5z'}"></path>
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

    if (!data.customerName || !data.phone || !data.deliveryDate || !data.deliveryTime) {
      showNotification('יש למלא את כל השדות הנדרשים', 'warning')
      return
    }

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
      const currentTime = new Date().toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      
      const orderData = {
        ...data,
        cart,
        subtotalPrice,
        discountAmount,
        totalPrice,
        appliedCoupon: appliedCoupon ? {
          code: appliedCoupon.code,
          discount_type: appliedCoupon.discount_type,
          discount_value: appliedCoupon.discount_value,
          id: appliedCoupon.id
        } : null,
        isHolidayMode,
        isImmediatePickup,
        deliveryTime: data.deliveryTime === 'immediate' ? currentTime : data.deliveryTime
      }
      
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
    <div className="container max-w-7xl mx-auto space-y-8 fade-in px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">פרטי הזמנה</h1>
        <p className="text-sm text-neutral-600">מלאו פרטי קשר ובחרו מועד איסוף</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Cart Summary */}
        <div className="xl:col-span-3 space-y-6">
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
            
            {/* מערכת קופונים */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gold-600" />
                <span className="font-medium text-neutral-700">יש לכם קופון?</span>
              </div>
              
              {appliedCoupon ? (
                <div className="coupon-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-gold-500 to-amber-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gold-700">{appliedCoupon.code}</div>
                      <div className="text-sm text-gold-600">
                        {appliedCoupon.discount_type === 'percentage' 
                          ? `${appliedCoupon.discount_value}% הנחה` 
                          : `₪${appliedCoupon.discount_value} הנחה`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-2 hover:bg-gold-200 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gold-700" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                    placeholder="הזן קוד קופון"
                    className="input-field flex-1 text-sm"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={checkingCoupon || !couponCode.trim()}
                    className="btn-accent px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {checkingCoupon ? '...' : 'הפעל'}
                  </button>
                </div>
              )}
              
              {couponError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <X className="w-4 h-4" />
                  {couponError}
                </p>
              )}
            </div>
            
            {/* סיכום מחירים */}
            <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>סכום ביניים:</span>
                <span>₪{subtotalPrice.toFixed(2)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    הנחה ({appliedCoupon.code}):
                  </span>
                  <span>-₪{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                <span>סה"כ לתשלום:</span>
                <span className="text-primary-700">₪{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* מוצרים מומלצים */}
          {recommendedProducts.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold-500" />
                <h3 className="font-semibold text-neutral-800">מוצרים נוספים שאולי תאהבו</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recommendedProducts.map(product => (
                  <div key={product.id} className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 hover:border-gold-200 transition-all">
                    <div className="aspect-square rounded-lg bg-white overflow-hidden mb-2">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-neutral-800 truncate">{product.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-gold-600 font-bold">₪{product.price}</span>
                      <Link
                        to="/additional-products"
                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        הוסף
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link
                to="/additional-products"
                className="mt-4 text-center block text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                צפייה בכל המוצרים הנוספים →
              </Link>
            </div>
          )}
        </div>

        {/* Customer Form */}
        <div className="xl:col-span-2">
          <div className="form-section sticky top-8 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-400 to-amber-400 rounded-t-3xl"></div>
            <div className="form-header relative z-10">
              <div className="form-icon-container">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900">פרטי לקוח</h2>
                <p className="text-neutral-600 mt-1 text-sm">מלאו את הפרטים בבקשה</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <label className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-500" />
                  <span>שם מלא *</span>
                </label>
                <input
                  type="text"
                  {...register('customerName', { required: 'שם מלא הוא שדה חובה' })}
                  className="input-field"
                  placeholder="שם מלא"
                />
                {errors.customerName && (
                  <p className="text-red-600 text-sm">{errors.customerName.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-500" />
                  <span>דוא"ל</span>
                  <span className="text-sm text-neutral-500 font-normal">(אופציונלי)</span>
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    validate: (value) => !value || /^\S+@\S+$/i.test(value) || 'כתובת דוא"ל לא תקינה'
                  })}
                  className="input-field"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-500" />
                  <span>טלפון *</span>
                </label>
                <input
                  type="tel"
                  {...register('phone', { required: 'מספר טלפון הוא שדה חובה' })}
                  className="input-field"
                  placeholder="050-1234567"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-base font-bold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  <span>הערות נוספות</span>
                </label>
                <textarea
                  {...register('deliveryAddress')}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="הערות או בקשות מיוחדות (אופציונלי)"
                />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-neutral-900 mb-1">פרטי איסוף</h3>
                  <p className="text-neutral-600 text-sm">בחרו תאריך ושעה לאיסוף</p>
                </div>
                
                <div className="space-y-4">
                  <label className="text-base font-bold text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    <span>תאריך איסוף *</span>
                  </label>
                  
                  {isHolidayMode && activeHoliday && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800 font-medium">
                        🎉 הזמנה לחג {activeHoliday.name}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        טווח: {new Date(activeHoliday.start_date).toLocaleDateString('he-IL')} - {new Date(activeHoliday.end_date).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  )}
                  
                  <input
                    type="date"
                    {...register('deliveryDate', { required: 'תאריך איסוף הוא שדה חובה' })}
                    min={dateConstraints.min}
                    max={dateConstraints.max}
                    className="input-field"
                  />
                  {errors.deliveryDate && (
                    <p className="text-red-600 text-sm">{errors.deliveryDate.message}</p>
                  )}
                </div>

                {/* כפתור מעכשיו לעכשיו */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-orange-800">🚀 צריך מיד?</h4>
                      <p className="text-orange-700 text-xs">30-45 דקות</p>
                    </div>
                    {!isImmediatePickup ? (
                      <button
                        type="button"
                        onClick={handleImmediatePickup}
                        disabled={isHolidayMode}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                          isHolidayMode 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        מעכשיו לעכשיו
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-green-700 font-semibold text-sm">✅ נבחר</span>
                        <button
                          type="button"
                          onClick={handleCancelImmediate}
                          className="text-orange-600 hover:text-orange-800 underline text-xs"
                        >
                          ביטול
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {!isImmediatePickup && (
                  <AvailableTimeSelector 
                    selectedDate={watch('deliveryDate')}
                    register={register}
                    errors={errors}
                  />
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 font-semibold disabled:opacity-50"
                >
                  {loading ? 'שולח...' : `המשך לסיכום • ₪${totalPrice.toFixed(2)}`}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/catalog')}
                  className="w-full btn-secondary py-3"
                >
                  חזרה לקטלוג
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-neutral-200 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-neutral-500">סה"כ</div>
            <div className="text-lg font-bold text-primary-700">₪{totalPrice.toFixed(2)}</div>
            {appliedCoupon && (
              <div className="text-xs text-green-600">כולל הנחה</div>
            )}
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
