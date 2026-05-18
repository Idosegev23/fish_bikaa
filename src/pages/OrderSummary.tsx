import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CartItem } from '../App'
import { CheckCircle, Loader, Mail } from 'lucide-react'
import { sendOrderNotifications } from '../lib/whatsappService'

interface OrderSummaryProps {
  cart: CartItem[]
  onClearCart: () => void
}

interface OrderData {
  customerName: string
  email: string
  phone: string
  deliveryAddress: string
  deliveryDate: string
  deliveryTime: string
  cart: CartItem[]
  totalPrice: number
  isHolidayMode?: boolean
  isImmediatePickup?: boolean
  extras?: Array<{
    id: number
    name: string
    price: number
    quantity: number
    unit: string
  }>
  extrasTotal?: number
}

export default function OrderSummary({ cart, onClearCart }: OrderSummaryProps) {
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [stockError, setStockError] = useState<Array<{ fishName: string; requested: number; available: number }> | null>(null)
  // הצעות מוצרים משלימים
  type AdditionalProduct = { id: number; name: string; price: number; unit: string; image_url?: string; available_units: number }
  const [suggestedProducts, setSuggestedProducts] = useState<AdditionalProduct[]>([])
  const [mealRecommendations, setMealRecommendations] = useState<Record<string, string[]>>({})
  const [extrasModalOpen, setExtrasModalOpen] = useState(false)
  const [extrasReviewed, setExtrasReviewed] = useState(false)
  const [selectedExtras, setSelectedExtras] = useState<Record<number, number>>({})
  const [extrasSubmitting, setExtrasSubmitting] = useState(false)
  
  // התראה חכמה לחג
  const [activeHoliday, setActiveHoliday] = useState<{ id: number; name: string; start_date: string; end_date: string; pickup_deadline?: string; supplier_report_deadline?: string } | null>(null)
  const [holidayAlertOpen, setHolidayAlertOpen] = useState(false)
  const [isHolidayOrder, setIsHolidayOrder] = useState(false)
  const [holidayAlertChecked, setHolidayAlertChecked] = useState(false)

  useEffect(() => {
    // טעינת נתוני הזמנה מLocal Storage
    const savedOrderData = localStorage.getItem('orderData')
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData))
    } else {
      // אם אין נתונים, חזרה לדף הקודם
      navigate('/customer-details')
    }
  }, [navigate])

  // טעינת חג פעיל ובדיקה אם ההזמנה קשורה לחג
  useEffect(() => {
    const loadActiveHoliday = async () => {
      const { data } = await supabase
        .from('holidays')
        .select('id, name, start_date, end_date, pickup_deadline, supplier_report_deadline')
        .eq('active', true)
        .limit(1)
        .maybeSingle()
      
      if (data) {
        setActiveHoliday(data as any)
        
        // בדיקה אם התאריך בטווח הזמנות החג
        if (orderData?.deliveryDate) {
          const deliveryDate = new Date(orderData.deliveryDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          // הצג פופאפ רק אם ההזמנה יכולה עוד להשפיע על דוח הספקים
          
          let showPopup = false
          
          // אם יש תאריך דוח ספקים, זה הקובע את הרלוונטיות
          if (data.supplier_report_deadline) {
            const reportDeadline = new Date(data.supplier_report_deadline)
            // הצג פופאפ רק אם עוד לא יצא הדוח לספקים
            showPopup = today <= reportDeadline
          } 
          // אם אין תאריך דוח ספקים אבל יש pickup_deadline
          else if (data.pickup_deadline) {
            const pickupDeadline = new Date(data.pickup_deadline)
            // הצג פופאפ אם תאריך האיסוף בטווח הרלוונטי
            showPopup = deliveryDate >= today && deliveryDate <= pickupDeadline
          } 
          // אם אין שום תאריך מוגדר, השתמש בלוגיקה הישנה
          else {
            const holidayStart = new Date(data.start_date)
            const daysDiff = Math.ceil((holidayStart.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
            showPopup = daysDiff >= 0 && daysDiff <= 3
          }
          
          // הצג פופאפ רק אם זה לא הזמנת חג ולא "מעכשיו לעכשיו" (כדי להציע להפוך לחג)
          if (showPopup && !holidayAlertChecked && !orderData?.isHolidayMode && !orderData?.isImmediatePickup) {
            setHolidayAlertOpen(true)
            setHolidayAlertChecked(true)
          }
        }
      }
    }
    
    if (orderData) {
      loadActiveHoliday()
    }
  }, [orderData])

  // הפקת תגיות הצעה מהסל
  const deriveSuggestionTags = (items: CartItem[]): string[] => {
    const tags = new Set<string>()
    items.forEach(item => {
      const fish = item.fishName || ''
      const cut = (item.cutType || '').toLowerCase()
      const isSalmonOrTuna = /סלמון|טונה/.test(fish)
      if (isSalmonOrTuna) {
        // לקוחות סלמון/טונה מרבים בסשימי/סושי
        tags.add('sashimi'); tags.add('soy'); tags.add('wasabi'); tags.add('nori'); tags.add('rice')
      }
      if (cut.includes('סטייק')) { tags.add('grill'); tags.add('spices') }
      if (cut.includes('פרוס')) { tags.add('stew'); tags.add('spices') }
      if (cut.includes('פילטים')) { tags.add('fry'); tags.add('breadcrumbs'); tags.add('lemon') }
      if (cut.includes('טחון')) { tags.add('spices') }
    })
    return Array.from(tags)
  }

  // טעינת מוצרים משלימים מוצעים ופתיחת פופאפ מיד
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        if (!orderData) return
        
        // 1) הצעות מבוססות קורלציה אמיתית מהמסד נתונים
        const mealKeys = new Set<string>()
        
        // איסוף כל cut_type_ids מהסל
        const cutTypeIds = orderData.cart
          .map(item => item.cutTypeId)
          .filter(id => id !== undefined) as number[]
        
        if (cutTypeIds.length > 0) {
          // שליפת meal_tags לפי cut_type_ids אמיתיים
          const { data: cutMealData } = await supabase
            .from('cut_meal_tags')
            .select('meal_tag')
            .in('cut_type_id', cutTypeIds)
          
          cutMealData?.forEach(item => {
            mealKeys.add(item.meal_tag)
          })
        }
        
        // הוספה מיוחדת לסלמון/טונה - תמיד מציע סושי/סשימי
        orderData.cart.forEach(i => {
          if (/סלמון|טונה/i.test(i.fishName)) {
            mealKeys.add('סושי')
            mealKeys.add('סשימי')
          }
        })
        
        let mealProducts: any[] = []
        if (mealKeys.size > 0) {
          const { data } = await supabase
            .from('additional_products')
            .select('id, name, price, unit, image_url, available_units')
            .eq('active', true)
            .gt('available_units', 0)
            .overlaps('meal_tags', Array.from(mealKeys))
            .limit(20)
          mealProducts = (data as any) || []
        }

        // 2) הצעות כלליות לפי suggest_tags (fallback)
        const tags = deriveSuggestionTags(orderData.cart)
        let tagProducts: any[] = []
        if (tags.length > 0) {
          const { data, error } = await supabase
            .from('additional_products')
            .select('id, name, price, unit, image_url, available_units')
            .eq('active', true)
            .gt('available_units', 0)
            .overlaps('suggest_tags', tags)
            .limit(10)
          if (error) throw error
          tagProducts = (data as any) || []
        }

        // 3) איחוד שתי הרשימות
        const byId = new Map<number, any>()
        ;[...mealProducts, ...tagProducts].forEach(p => { if (!byId.has(p.id)) byId.set(p.id, p) })
        const finalProducts = Array.from(byId.values())
        
        setSuggestedProducts(finalProducts)
        
        // 4) פתיחת פופאפ מיד אם יש המלצות ועוד לא נבדק
        if (finalProducts.length > 0 && !extrasReviewed) {
          setTimeout(() => setExtrasModalOpen(true), 500) // עיכוב קצר לתצוגה נעימה
        }
      } catch (e) {
        console.error('Error loading suggested products', e)
      }
    }
    loadSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData?.cart])

  // פעולה מרוכזת לכפתור "שלח הזמנה"
  const handleCheckoutClick = () => {
    if (!orderData) return
    // כעת פשוט שולח - הפופאפ כבר הוצג בתחילת הטעינה
    submitOrder()
  }

  // הוספת מוצרים משלימים להזמנה
  const handleExtrasSubmit = async () => {
    setExtrasSubmitting(true)
    try {
      // איסוף המוצרים שנבחרו
      const selectedItems = Object.entries(selectedExtras)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = suggestedProducts.find(p => p.id === Number(productId))
          return product ? {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            unit: product.unit
          } : null
        })
        .filter(item => item !== null)

      if (selectedItems.length > 0) {
        // הוספה ל-localStorage או state המקומי
        const currentOrderData = JSON.parse(localStorage.getItem('orderData') || '{}')
        currentOrderData.extras = selectedItems
        currentOrderData.extrasTotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        localStorage.setItem('orderData', JSON.stringify(currentOrderData))
        
        // עדכון ה-state המקומי
        setOrderData(currentOrderData)
        
        // הודעת הצלחה
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg z-50'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>${selectedItems.length} מוצרים נוספו לסיכום!</span>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      }
    } catch (error) {
      console.error('Error adding extras:', error)
    } finally {
      setExtrasSubmitting(false)
      setExtrasModalOpen(false)
      setExtrasReviewed(true)
      // לא שולח אוטומטית - נותן למשתמש לראות את הסיכום המעודכן
    }
  }

  const submitOrder = async () => {
    if (!orderData || !orderData.cart || orderData.cart.length === 0) {
      try {
        const { showToast } = await import('../components/Toast')
        showToast('error', 'הסל ריק! נא להוסיף פריטים לפני שליחת ההזמנה')
      } catch { /* toast not available */ }
      return
    }

    setSubmitting(true)
    try {
      // בדיקת מלאי בזמן אמת לפני יצירת ההזמנה
      const isInventoryOk = await validateInventory(orderData.cart)
      if (!isInventoryOk) {
        setSubmitting(false)
        return
      }

      // בדיקת זמינות שעת איסוף
      const isTimeSlotAvailable = await validateTimeSlot(orderData.deliveryDate, orderData.deliveryTime)
      if (!isTimeSlotAvailable) {
        setSubmitting(false)
        return
      }

      // יצירת order_items למסד הנתונים (יחידות -> ק"ג לפי משקל ממוצע)
      const orderItems = orderData.cart.map(item => ({
        fish_name: item.fishName,
        cut: item.cutType,
        quantity_kg: item.unitsBased ? Number(((item.averageWeightKg || 1) * item.quantity).toFixed(2)) : item.quantity,
        price: item.totalPrice
      }))

      // המרת מוצרים משלימים שנבחרו
      const extrasArray = (orderData.extras || []).map((extra: any) => ({
        product_id: extra.id,
        name: extra.name,
        unit: extra.unit,
        quantity: extra.quantity,
        price: extra.price,
        total: Number((extra.price * extra.quantity).toFixed(2))
      }))
      const extras_total = extrasArray.reduce((s: number, x: any) => s + x.total, 0)

      // שליחה למסד הנתונים
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: orderData.customerName,
            email: orderData.email,
            phone: orderData.phone,
            delivery_address: orderData.deliveryAddress || '',
            delivery_date: orderData.deliveryDate,
            delivery_time: orderData.deliveryTime,
            order_items: orderItems,
            extras: extrasArray,
            extras_total: extras_total,
            total_price: Number((orderData.totalPrice + extras_total).toFixed(2)),
            is_holiday_order: isHolidayOrder,
            holiday_id: isHolidayOrder && activeHoliday ? activeHoliday.id : null
          }
        ])
        .select()

      if (error) throw error

      // עדכון מלאי דגים - הורדת המשקלים שהוזמנו
      await updateFishInventory(orderData.cart)
      // עדכון מלאי מוצרים משלימים
      if (extrasArray.length > 0) {
        await updateExtrasInventory(extrasArray)
      }

      // שליחת הודעות WhatsApp
      await sendOrderNotifications(orderData, data[0]?.id?.toString() || 'N/A')

      // ניקוי נתונים מקומיים
      localStorage.removeItem('orderData')
      onClearCart()
      setSubmitted(true)

      console.log('Order submitted successfully:', data)
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('שגיאה בשליחת ההזמנה. נא לנסות שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  // ולידציה: בדיקת מלאי נוכחי עבור כל פריט בסל (יחידות -> ק"ג)
  const validateInventory = async (cartItems: CartItem[]) => {
    try {
      const fishQuantities: { [fishName: string]: number } = {}
      cartItems.forEach(item => {
        const addKg = item.unitsBased ? (item.averageWeightKg || 1) * item.quantity : item.quantity
        fishQuantities[item.fishName] = Number(((fishQuantities[item.fishName] || 0) + addKg).toFixed(2))
      })

      const fishNames = Object.keys(fishQuantities)
      if (fishNames.length === 0) return true

      const { data, error } = await supabase
        .from('fish_types')
        .select('name, available_kg')
        .in('name', fishNames)

      if (error) throw error

      const nameToAvailable: Record<string, number> = {}
      ;(data || []).forEach(row => {
        nameToAvailable[row.name] = Number(row.available_kg) || 0
      })

      const insufficients: Array<{ fishName: string; requested: number; available: number }> = []
      fishNames.forEach(name => {
        const requested = fishQuantities[name]
        const available = nameToAvailable[name] ?? 0
        if (requested > available) {
          insufficients.push({ fishName: name, requested, available })
        }
      })

      if (insufficients.length > 0) {
        setStockError(insufficients)
        return false
      }

      setStockError(null)
      return true
    } catch (err) {
      console.error('Error validating inventory:', err)
      setStockError(null)
      try {
        const { showToast } = await import('../components/Toast')
        showToast('warning', 'לא הצלחנו לבדוק מלאי. נסו שנית')
      } catch { /* toast not available */ }
      return false
    }
  }

  // ולידציה: בדיקת זמינות שעת איסוף
  const validateTimeSlot = async (deliveryDate: string, deliveryTime: string) => {
    try {
      // חישוב יום בשבוע
      const date = new Date(deliveryDate)
      const dayOfWeek = date.getDay()
      
      // חילוץ שעות מהפורמט "HH:MM-HH:MM"
      if (!deliveryTime.includes('-')) {
        // פורמט לא סטנדרטי (למשל "immediate") – דלג על ולידציה
        return true
      }
      const [startTime, endTime] = deliveryTime.split('-')
      
      // שליפת הסלוט המתאים
      const { data: slots, error: slotsError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('start_time', startTime + ':00')
        .eq('end_time', endTime + ':00')
        .eq('active', true)
        .limit(1)
      
      if (slotsError) throw slotsError
      
      if (!slots || slots.length === 0) {
        // הודעת שגיאה
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚠️</span>
            <span>השעה שנבחרה אינה זמינה יותר</span>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 5000)
        return false
      }
      
      const slot = slots[0]
      
      // ספירת הזמנות קיימות לתאריך ושעה
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('delivery_date', deliveryDate)
        .eq('delivery_time', deliveryTime)
      
      if (ordersError) throw ordersError
      
      const currentOrders = (orders || []).length
      
      if (currentOrders >= slot.max_orders) {
        // הודעת שגיאה
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-2xl">⚠️</span>
            <span>השעה שנבחרה מלאה (${currentOrders}/${slot.max_orders})</span>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 5000)
        return false
      }
      
      return true
      
    } catch (error) {
      console.error('Error validating time slot:', error)
      // במקרה של שגיאה, נאפשר המשך אך נתריע
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <span>שגיאה בבדיקת זמינות. נמשיך בהזמנה</span>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 5000)
      return true
    }
  }

  const updateFishInventory = async (cartItems: CartItem[]) => {
    try {
      const fishQuantities: { [fishName: string]: number } = {}
      cartItems.forEach(item => {
        const addKg = item.unitsBased ? (item.averageWeightKg || 1) * item.quantity : item.quantity
        fishQuantities[item.fishName] = Number(((fishQuantities[item.fishName] || 0) + addKg).toFixed(2))
      })

      // עדכון מלאי עבור כל דג
      for (const [fishName, totalQuantity] of Object.entries(fishQuantities)) {
        // קבלת המלאי הנוכחי
        const { data: fishData, error: fetchError } = await supabase
          .from('fish_types')
          .select('id, available_kg')
          .eq('name', fishName)
          .single()

        if (fetchError) {
          console.error(`Error fetching fish data for ${fishName}:`, fetchError)
          continue
        }

        // בדיקה שיש מספיק מלאי
        const newQuantity = Number((fishData.available_kg - totalQuantity).toFixed(2))
        if (newQuantity < 0) {
          console.warn(`Warning: Not enough inventory for ${fishName}. Available: ${fishData.available_kg}, Ordered(kg): ${totalQuantity}`)
          // אפשר לקבוע מדיניות - להתיר מלאי שלילי או לחסום
          // כרגע נמשיך גם עם מלאי שלילי כדי לא לחסום הזמנות
        }

        // עדכון המלאי
        const { error: updateError } = await supabase
          .from('fish_types')
          .update({ 
            available_kg: Math.max(0, newQuantity), // מניעת מלאי שלילי
            updated_at: new Date().toISOString()
          })
          .eq('id', fishData.id)

        if (updateError) {
          console.error(`Error updating inventory for ${fishName}:`, updateError)
        } else {
          console.log(`Updated inventory for ${fishName}: ${fishData.available_kg} -> ${Math.max(0, newQuantity)}`)
        }
      }
    } catch (error) {
      console.error('Error updating fish inventory:', error)
      // חשוב: כישלון בעדכון המלאי לא יחסום את ההזמנה
      // אבל נרשום שגיאה ללוגים
    }
  }

  const updateExtrasInventory = async (extras: Array<{ product_id: number; quantity: number } & any>) => {
    try {
      for (const ex of extras) {
        const { data: row, error } = await supabase
          .from('additional_products')
          .select('id, available_units')
          .eq('id', ex.product_id)
          .single()
        if (error || !row) continue
        const newQty = Math.max(0, Number(row.available_units) - Number(ex.quantity || 0))
        await supabase
          .from('additional_products')
          .update({ available_units: newQty })
          .eq('id', row.id)
      }
    } catch (e) {
      console.error('Error updating additional products inventory', e)
    }
  }



  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ההזמנה נשלחה בהצלחה!
        </h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="text-3xl ml-3">📱</div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">הודעת WhatsApp נשלחה!</h3>
              <p className="text-green-700">
                נשלחה הודעת אישור למספר הטלפון שלכם והודעה למנהל החנות
              </p>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mb-8">
          תקבלו הודעת WhatsApp עם פרטי ההזמנה. נתראה באיסוף!
        </p>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            חזרה לעמוד הראשי
          </button>
          <br />
          <button
            onClick={() => navigate('/catalog')}
            className="btn-secondary"
          >
            הזמנה חדשה
          </button>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-28">
      {/* פופאפ הצעות מוצרים משלימים */}
      {extrasModalOpen && suggestedProducts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setExtrasModalOpen(false); setExtrasReviewed(true) }}></div>
          <div className="relative bg-white rounded-2xl shadow-large border border-neutral-200 max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">השלמות מומלצות להזמנה</h3>
            <p className="text-neutral-700 mb-4">מצאנו מוצרים שיכולים להתאים למה שבחרת. בחר כמות והמשך:</p>
            <div className="max-h-80 overflow-y-auto space-y-3">
              {suggestedProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 border rounded-lg p-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-md border" />
                  ) : (
                    <div className="w-14 h-14 bg-neutral-100 rounded-md border" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-neutral-900">{p.name}</div>
                    <div className="text-sm text-neutral-600">₪{p.price.toFixed(2)} / {p.unit}</div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={p.available_units}
                    className="w-24 input-field"
                    value={selectedExtras[p.id] || 0}
                    onChange={e => setSelectedExtras({ ...selectedExtras, [p.id]: Math.max(0, Math.min(Number(e.target.value || 0), p.available_units)) })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
              <button onClick={() => { setExtrasModalOpen(false); setExtrasReviewed(true) }} className="btn-secondary w-full sm:w-auto">דלג והמשך</button>
              <button onClick={handleExtrasSubmit} className="btn-primary w-full sm:w-auto" disabled={extrasSubmitting}>
                {extrasSubmitting ? 'מוסיף...' : 'הוסף והמשך'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* פופאפ חוסר במלאי */}
      {stockError && stockError.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setStockError(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-large border border-neutral-200 max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-red-700 mb-2">חלק מהפריטים זמינים בכמות נמוכה</h3>
            <p className="text-neutral-700 mb-4">נא לעדכן את הכמויות בהתאם למלאי הנוכחי:</p>
            <div className="space-y-2 mb-4">
              {stockError.map((it) => (
                <div key={it.fishName} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="font-semibold text-red-800">{it.fishName}</div>
                  <div className="text-sm text-red-700">
                    ביקשת: {it.requested} ק"ג • זמין: {it.available} ק"ג
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button onClick={() => setStockError(null)} className="btn-secondary w-full sm:w-auto">
                סגור
              </button>
              <button onClick={() => navigate('/customer-details')} className="btn-primary w-full sm:w-auto">
                עדכון כמויות בסל
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">סיכום הזמנה</h1>
        <p className="text-gray-600 text-sm">בדקו את הפרטים ולחצו על שליחה</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">פרטי הזמנה</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">פריטים</h3>
              <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg mt-2 bg-white">
                {orderData.cart.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2">
                    {/* Thumb */}
                    <div className="w-14 h-14 rounded-md bg-neutral-100 overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {('fishImage' in item && (item as any).fishImage) ? (
                        <img src={(item as any).fishImage} alt={item.fishName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-100" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">{item.fishName}</div>
                      <div className="text-xs text-neutral-600 truncate">{item.cutType} • {item.quantity} {item.unitsBased ? 'יח׳' : 'ק"ג'}</div>
                    </div>
                    {/* Price + remove */}
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-neutral-900 whitespace-nowrap">₪{item.totalPrice.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* מוצרים משלימים */}
            {orderData.extras && orderData.extras.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">מוצרים משלימים</h3>
                  <button 
                    onClick={() => {
                      // טעינת הכמויות הנוכחיות למודאל
                      const currentExtras: Record<number, number> = {}
                      orderData.extras?.forEach(extra => {
                        currentExtras[extra.id] = extra.quantity
                      })
                      setSelectedExtras(currentExtras)
                      setExtrasReviewed(false)
                      setExtrasModalOpen(true)
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded"
                  >
                    ערוך תוספות
                  </button>
                </div>
                <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg mt-2 bg-white">
                  {orderData.extras.map((extra: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-2">
                      <div className="w-14 h-14 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-xs">תוספת</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 truncate">{extra.name}</div>
                        <div className="text-xs text-neutral-600 truncate">{extra.quantity} {extra.unit}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
                          ₪{(extra.price * extra.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* אם אין מוצרים משלימים אבל יש המלצות */}
            {(!orderData.extras || orderData.extras.length === 0) && suggestedProducts.length > 0 && extrasReviewed && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-800 font-medium">יש לנו המלצות מוצרים שיתאימו להזמנה</p>
                    <p className="text-xs text-blue-600">רוצה לראות אותן שוב?</p>
                  </div>
                  <button 
                    onClick={() => {
                      // איפוס הכמויות
                      setSelectedExtras({})
                      setExtrasReviewed(false)
                      setExtrasModalOpen(true)
                    }}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    הצג המלצות
                  </button>
                </div>
              </div>
            )}

            <div className="border-t pt-3">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span>סה"כ דגים:</span>
                  <span>₪{orderData.totalPrice.toFixed(2)}</span>
                </div>
                {orderData.extrasTotal && orderData.extrasTotal > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>סה"כ תוספות:</span>
                    <span>₪{orderData.extrasTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base font-semibold border-t pt-2">
                  <span>סה"כ לתשלום:</span>
                  <span className="text-primary-700">
                    ₪{(orderData.totalPrice + (orderData.extrasTotal || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">זמן איסוף</h3>
              {orderData.isImmediatePickup ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <p className="font-semibold text-orange-800">איסוף מיידי</p>
                      <p className="text-sm text-orange-700">
                        זמן הזמנה: {orderData.deliveryTime} | תאריך: {orderData.deliveryDate}
                      </p>
                      <p className="text-sm text-orange-700">ההזמנה תהיה מוכנה בתוך 30-45 דקות</p>
                      <p className="text-xs text-orange-600 mt-1">
                        תקבלו הודעת WhatsApp כשההזמנה מוכנה לאיסוף
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {new Date(orderData.deliveryDate).toLocaleDateString('he-IL')} • {orderData.deliveryTime}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">פרטי לקוח</h2>
          
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">שם:</span>
              <span className="mr-2">{orderData.customerName}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">דוא"ל:</span>
              <span className="mr-2">{orderData.email}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">טלפון:</span>
              <span className="mr-2">{orderData.phone}</span>
            </div>
            
            {orderData.deliveryAddress && (
              <div>
                <span className="font-medium text-gray-700">כתובת/הערות:</span>
                <span className="mr-2">{orderData.deliveryAddress}</span>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ללא תשלום באתר – שליחת הזמנה בלבד. התשלום בעת איסוף.
          </div>
        </div>
      </div>

      {/* Action Buttons - דסקטופ/טאבלט */}
      <div className="hidden md:flex flex-row gap-4 justify-center">
        <button onClick={handleCheckoutClick} disabled={submitting} className="btn-primary px-8 py-3 text-lg disabled:opacity-50 flex items-center justify-center">
          {submitting ? (<><Loader className="w-4 h-4 animate-spin ml-2" /> שולח הזמנה...</>) : ('אישור ושליחת הזמנה')}
        </button>
        <button onClick={() => navigate('/customer-details')} className="btn-secondary px-8 py-3 text-lg" disabled={submitting}>חזרה לעריכה</button>
      </div>

      {/* סרגל תחתון צף - מובייל */}
      {orderData && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-neutral-200 p-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="text-neutral-500">סה"כ לתשלום</div>
              <div className="text-xl font-bold text-primary-700">₪{orderData.totalPrice.toFixed(2)}</div>
            </div>
            <button onClick={handleCheckoutClick} disabled={submitting} className="btn-primary flex-1 py-3 disabled:opacity-50">
              {submitting ? 'שולח...' : 'אישור ושליחת הזמנה'}
            </button>
          </div>
        </div>
      )}

      {/* מודל התראת חג */}
      {holidayAlertOpen && activeHoliday && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">🎉</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">זיהינו חג בקרוב!</h3>
                <p className="text-neutral-600 text-sm">
                  נראה שההזמנה שלך מתוזמנת ל{activeHoliday.name} 
                  ({new Date(activeHoliday.start_date).toLocaleDateString('he-IL')})
                  {activeHoliday.pickup_deadline && (
                    <span className="block mt-1 text-orange-600 font-medium">
                      אחרון איסוף: {new Date(activeHoliday.pickup_deadline).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                <p className="text-neutral-700 text-sm font-medium mb-3">האם ההזמנה הזו היא עבור החג?</p>
                <div className="space-y-2 text-xs text-neutral-600">
                  <p>• הזמנות חג מקבלות עדיפות בהכנה</p>
                  <p>• עוזר לנו להיערך עם הספקים</p>
                  <p>• מבטיח זמינות המלאי</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsHolidayOrder(true)
                    setHolidayAlertOpen(false)
                  }}
                  className="btn-primary flex-1 py-3"
                >
                  כן, זו הזמנה לחג
                </button>
        <button
                  onClick={() => {
                    setIsHolidayOrder(false)
                    setHolidayAlertOpen(false)
                  }}
                  className="btn-secondary flex-1 py-3"
                >
                  לא, הזמנה רגילה
        </button>
      </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 