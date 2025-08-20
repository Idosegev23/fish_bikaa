import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sendWhatsAppMessage } from '../lib/whatsappService'
import { Scale, CheckCircle, Clock, Package, RefreshCw, Info, ArrowRight, Send } from 'lucide-react'

interface OrderItem {
  fish_name: string
  cut?: string
  quantity_kg: number
  price_per_kg: number
  total_price: number
  unit_based?: boolean
  actual_weight?: number // המשקל בפועל לפני ניקוי
}

interface Order {
  id: number
  customer_name: string
  phone?: string
  delivery_time: string
  order_items: OrderItem[]
  status?: 'pending' | 'weighing' | 'ready' | 'completed'
  kitchen_notes?: string
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [isSmartScale, setIsSmartScale] = useState(false) // עבור העתיד
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // State עבור סליידר "הזמנה מוכנה"
  const [sliderValue, setSliderValue] = useState(0)
  const [sendingReady, setSendingReady] = useState(false)

  useEffect(() => {
    fetchPendingOrders()
    
    // עדכון אוטומטי כל 30 שניות
    const ordersInterval = setInterval(fetchPendingOrders, 30000)
    
    // עדכון שעון כל שנייה
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => {
      clearInterval(ordersInterval)
      clearInterval(timeInterval)
    }
  }, [])

  const fetchPendingOrders = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_date', today)
        .order('delivery_time', { ascending: true })

      // סינון הזמנות שצריכות שקילה (ללא status או pending או weighing - לא ready או completed)
      const filteredData = (data || []).filter(order => 
        !order.status || order.status === 'pending' || order.status === 'weighing'
      )



      if (error) throw error

      setOrders(filteredData)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const startWeighing = async (order: Order) => {
    setSelectedOrder(order)
    setSelectedItemIndex(null) // לא בוחרים פריט אוטומטית
    setWeightInput('')
    
    // עדכון סטטוס להתחלת שקילה
    await supabase
      .from('orders')
      .update({ status: 'weighing' })
      .eq('id', order.id)
  }

  const selectItem = (index: number) => {
    setSelectedItemIndex(index)
    setWeightInput('')
  }

  const saveWeight = async () => {
    if (!selectedOrder || selectedItemIndex === null || weightInput === '') return

    const weight = parseFloat(weightInput)
    if (isNaN(weight) || weight <= 0) {
      alert('נא להזין משקל תקין')
      return
    }

    try {
      // עדכון המשקל בפועל בפריט הנבחר
      const updatedItems = [...selectedOrder.order_items]
      updatedItems[selectedItemIndex].actual_weight = weight

      // שמירה במסד הנתונים
      await supabase
        .from('orders')
        .update({ order_items: updatedItems })
        .eq('id', selectedOrder.id)

      // עדכון המצב המקומי
      setSelectedOrder({ ...selectedOrder, order_items: updatedItems })
      
      // איפוס הבחירה
      setSelectedItemIndex(null)
      setWeightInput('')

      // בדיקה אם כל הפריטים נשקלו - הסליידר יופיע אוטומטית בתחתית המסך
      const allWeighed = updatedItems.every(item => item.actual_weight && item.actual_weight > 0)

    } catch (error) {
      console.error('Error saving weight:', error)
      alert('שגיאה בשמירת המשקל')
    }
  }

  const completeWeighing = async () => {
    if (!selectedOrder) return

    try {
      // עדכון סטטוס לכן להכנה
      await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', selectedOrder.id)

      // איפוס הבחירה
      setSelectedOrder(null)
      setSelectedItemIndex(null)
      setWeightInput('')

      alert('שקילה הושלמה! ההזמנה עברה לקופה')

      // המתנה קצרה ואז הסרת ההזמנה מהמסך
      setTimeout(() => {
        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
      }, 1000)

    } catch (error) {
      console.error('Error completing weighing:', error)
      alert('שגיאה בהשלמת השקילה')
    }
  }

  // פונקציה לטיפול בסליידר
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setSliderValue(newValue)
    

  }

  // פונקציה לשליחת הודעת "הזמנה מוכנה" ללקוח
  const sendOrderReady = async () => {
    const orderToProcess = selectedOrder // נשתמש בהזמנה הנוכחית במקום readyOrder
    if (!orderToProcess || sliderValue < 100) return

    setSendingReady(true)
    try {
      // עדכון סטטוס ההזמנה למוכנה
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderToProcess.id)
      
      if (updateError) {
        console.error('❌ Error updating order status:', updateError)
        throw updateError
      }

      // יצירת הודעת WhatsApp
      const message = createOrderReadyMessage(orderToProcess)
      
      // שליחת הודעה ללקוח
      await sendWhatsAppMessage(orderToProcess.phone || '', message)

      // הדפסת מדבקה
      await printOrderLabel(orderToProcess)

      // איפוס סליידר והזמנה
      resetSlider()

      // איפוס בחירת הזמנה
      setSelectedOrder(null)
      setSelectedItemIndex(null)
      setWeightInput('')

      // הודעת הצלחה
      alert('🎉 הודעה נשלחה ללקוח והמדבקה הודפסה! ההזמנה הסתיימה בהצלחה')

      // המתנה קצרה ואז הסרת ההזמנה מהמסך (אפקט חזותי)
      setTimeout(() => {
        setOrders(prev => prev.filter(o => o.id !== orderToProcess.id))
      }, 1000)

    } catch (error) {
      console.error('Error sending ready notification:', error)
      alert('שגיאה בעיבוד ההזמנה')
    } finally {
      setSendingReady(false)
    }
  }

  // הדפסת מדבקת הזמנה
  const printOrderLabel = async (order: Order) => {
    try {
      // יצירת תוכן המדבקה
      const labelContent = createLabelContent(order)
      
      // שליחה למדפסת (דרך API)
      await sendToPrinter(labelContent, order.id)
      
      console.log(`🖨️ Label printed for order ${order.id}`)
    } catch (error) {
      console.error('Error printing label:', error)
      // לא נעצור את התהליך בגלל שגיאת הדפסה
    }
  }

  // יצירת תוכן המדבקה
  const createLabelContent = (order: Order): string => {
    let content = `=== דגי בקעת אונו ===\n`
    content += `הזמנה #${order.id}\n`
    content += `לקוח: ${order.customer_name}\n`
    content += `שעת איסוף: ${order.delivery_time}\n`
    content += `------------------------\n`
    
    order.order_items.forEach((item, index) => {
      content += `${index + 1}. ${item.fish_name}`
      if (item.cut) content += ` - ${item.cut}`
      content += `\n   הוזמן: ${item.quantity_kg} ${item.unit_based ? 'יח׳' : 'ק"ג'}`
      if (item.actual_weight) {
        content += `\n   נשקל: ${item.actual_weight} ק"ג ✓`
      }
      content += `\n`
    })
    
    content += `------------------------\n`
    content += `** תשלום בקופה לפי משקל בפועל **\n`
    content += `דגי בקעת אונו - 03-1234567\n`
    
    return content
  }

  // שליחה למדפסת
  const sendToPrinter = async (labelContent: string, orderId: number) => {
    try {
      const response = await fetch('/api/print-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: labelContent,
          orderId: orderId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to print label')
      }

      console.log('Label sent to printer successfully')
    } catch (error) {
      console.error('Error sending to printer:', error)
      throw error
    }
  }

  // יצירת הודעת WhatsApp
  const createOrderReadyMessage = (order: Order): string => {
    let message = `🎉 *ההזמנה שלכם מוכנה!*\n\n`
    message += `👤 ${order.customer_name}\n`
    message += `📋 הזמנה מספר: ${order.id}\n\n`
    
    message += `🐟 *מה מוכן לאיסוף:*\n`
    order.order_items.forEach((item, index) => {
      const quantity = item.unit_based ? `${item.quantity_kg} יח׳` : `${item.quantity_kg} ק"ג`
      message += `${index + 1}. ${item.fish_name}`
      if (item.cut) message += ` - ${item.cut}`
      message += ` (${quantity})`
      if (item.actual_weight) {
        message += ` - נשקל: ${item.actual_weight} ק"ג`
      }
      message += `\n`
    })
    
    message += `\n📍 *כתובת החנות:*\n`
    message += `דגי בקעת אונו\n`
    message += `רחוב הדג 123, בקעת אונו\n\n`
    
    message += `🕒 *שעות פתיחה:*\n`
    message += `ראשון-חמישי: 08:00-20:00\n`
    message += `שישי: 08:00-15:00\n\n`
    
    message += `📞 לפרטים: 03-1234567\n`
    message += `💳 *התשלום יתבצע בקופה לפי משקל בפועל*\n`
    message += `מחכים לכם! 😊`
    
    return message
  }

  // איפוס סליידר
  const resetSlider = () => {
    setSliderValue(0)
  }

  const handleNumberInput = (num: string) => {
    if (num === '.') {
      if (!weightInput.includes('.')) {
        setWeightInput(weightInput + '.')
      }
    } else if (num === 'clear') {
      setWeightInput('')
    } else if (num === 'backspace') {
      setWeightInput(weightInput.slice(0, -1))
    } else {
      setWeightInput(weightInput + num)
    }
  }

  const selectedItem = selectedItemIndex !== null ? selectedOrder?.order_items[selectedItemIndex] : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        <span className="mr-3 text-lg">טוען הזמנות...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-8">
      {/* כותרת מותאמת למסך גדול */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Scale className="w-16 h-16 text-primary-600" />
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                🐟 מטבח - שקילת הזמנות
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                הזנת משקלים לפני ניקוי עבור הזמנות היום
              </p>
            </div>
          </div>
          
          {/* שעון ותאריך חי */}
          <div className="text-left">
            <div className="text-4xl font-bold text-primary-600 font-mono">
              {currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xl text-gray-600">
              {currentTime.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
        
        {/* אזהרה חשובה */}
        <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Info className="w-8 h-8 text-amber-600 mt-1" />
            <div>
              <h3 className="text-2xl font-bold text-amber-800">⚠️ חשוב לזכור!</h3>
              <p className="text-xl text-amber-700 mt-2">
                יש לשקול את הדגים <strong>לפני הניקוי</strong> - זה המשקל שיתומחר ללקוח
              </p>
            </div>
          </div>
        </div>
        
        {/* התראה על הזמנות חדשות */}
        {orders.filter(o => !o.status || o.status === 'pending').length > 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              <h3 className="text-2xl font-bold text-green-800">
                🚨 יש {orders.filter(o => !o.status || o.status === 'pending').length} הזמנות חדשות לשקילה!
              </h3>
            </div>
          </div>
        )}
      </div>

      {!selectedOrder ? (
        /* רשימת הזמנות לשקילה - מותאם למסך גדול */
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-4">
            📋 הזמנות בהמתנה לשקילה 
            <span className="bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-2xl">
              {orders.length}
            </span>
          </h2>
          
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
              <Package className="w-32 h-32 text-gray-400 mx-auto mb-8" />
              <h3 className="text-4xl font-semibold text-gray-900 mb-4">
                ✅ כל ההזמנות מוכנות!
              </h3>
              <p className="text-2xl text-gray-600">
                כל ההזמנות של היום כבר נשקלו 🎉
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">
                        🏷️ הזמנה #{order.id}
                      </h3>
                      <p className="text-2xl text-gray-700 font-semibold">{order.customer_name}</p>
                      <p className="text-xl text-gray-500 mt-2">
                        ⏰ איסוף: {order.delivery_time}
                      </p>
                    </div>
                    <span className={`px-6 py-3 rounded-full text-lg font-bold ${
                      order.status === 'weighing' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'weighing' ? '⚖️ בשקילה' : '⏳ ממתין'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h4 className="text-xl font-bold text-gray-900">🐟 פריטים לשקילה:</h4>
                    {order.order_items.map((item, index) => (
                      <div key={index} className={`flex justify-between items-center py-4 px-4 rounded-lg border-2 ${
                        item.actual_weight 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div>
                          <span className="text-xl font-bold">{item.fish_name}</span>
                          {item.cut && <span className="text-lg text-gray-600"> - {item.cut}</span>}
                        </div>
                        <div className="text-right">
                          <div className="text-lg">
                            <span className="text-gray-600">הוזמן: </span>
                            <span className="font-bold">
                              {item.unit_based ? `${item.quantity_kg} יח׳` : `${item.quantity_kg} ק"ג`}
                            </span>
                          </div>
                          {item.actual_weight && (
                            <div className="text-xl text-green-600 font-bold">
                              ✅ נשקל: {item.actual_weight} ק"ג
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => startWeighing(order)}
                    disabled={order.status === 'weighing'}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-2xl transition-colors flex items-center justify-center gap-4 text-2xl"
                  >
                    <Scale className="w-8 h-8" />
                    {order.status === 'weighing' ? '⚖️ המשך שקילה' : '🚀 התחל שקילה'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ממשק שקילה מותאם למסך גדול */
        <div className="max-w-6xl mx-auto space-y-8">
          {/* מידע על ההזמנה */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-primary-200 p-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center gap-4">
              ⚖️ שקילה - הזמנה #{selectedOrder.id}
            </h2>
            <p className="text-2xl text-gray-600">
              👤 {selectedOrder.customer_name} | ⏰ איסוף: {selectedOrder.delivery_time}
            </p>
            
            {/* התקדמות */}
            <div className="mt-6">
              <div className="flex justify-between text-xl text-gray-600 mb-4">
                <span className="font-bold">📊 התקדמות שקילה</span>
                <span className="font-bold text-primary-600">
                  {selectedOrder.order_items.filter(item => item.actual_weight).length} / {selectedOrder.order_items.length} ✅
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-6 rounded-full transition-all duration-500 shadow-lg"
                  style={{ 
                    width: `${(selectedOrder.order_items.filter(item => item.actual_weight).length / selectedOrder.order_items.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* רשימת פריטים לשקילה */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              בחרו פריט לשקילה:
            </h3>
            <div className="grid grid-cols-1 gap-3 mb-6">
              {selectedOrder.order_items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => selectItem(index)}
                  className={`p-4 rounded-lg border-2 text-right transition-all duration-200 ${
                    selectedItemIndex === index
                      ? 'border-primary-500 bg-primary-50'
                      : item.actual_weight
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-25'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">
                        {item.fish_name}
                        {item.cut && <span className="text-gray-600 text-base"> - {item.cut}</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        הוזמן: {item.unit_based ? `${item.quantity_kg} יח׳` : `${item.quantity_kg} ק"ג`}
                      </div>
                    </div>
                    <div className="text-left">
                      {item.actual_weight ? (
                        <div className="text-green-600 font-bold">
                          ✓ {item.actual_weight} ק"ג
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          {selectedItemIndex === index ? '👆 נבחר' : 'לחץ לשקילה'}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ממשק הזנת משקל */}
          {selectedItem && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  שקילת: {selectedItem.fish_name}
                </h3>
                {selectedItem.cut && (
                  <p className="text-lg text-gray-600">{selectedItem.cut}</p>
                )}
                <div className="mt-3 bg-blue-50 rounded-lg p-3">
                  <p className="text-blue-800 font-medium">
                    כמות מוזמנת: {selectedItem.unit_based 
                      ? `${selectedItem.quantity_kg} יחידות` 
                      : `${selectedItem.quantity_kg} ק"ג`
                    }
                  </p>
                </div>
              </div>

              {/* הזנת משקל */}
              <div className="space-y-6">
                <div className="text-center">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    משקל לפני ניקוי (ק"ג)
                  </label>
                  <div className="text-4xl font-mono bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center min-h-[80px] flex items-center justify-center">
                    {weightInput || '0.000'}
                  </div>
                </div>

                {/* מקלדת מספרים */}
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberInput(num)}
                      className="h-16 text-2xl font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNumberInput('clear')}
                    className="h-16 text-lg font-semibold bg-red-200 hover:bg-red-300 text-red-800 rounded-lg transition-colors"
                  >
                    נקה
                  </button>
                  <button
                    onClick={() => handleNumberInput('0')}
                    className="h-16 text-2xl font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleNumberInput('.')}
                    className="h-16 text-2xl font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    .
                  </button>
                </div>

                {/* כפתורי פעולה */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedItemIndex(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                  >
                    ביטול בחירה
                  </button>
                  <button
                    onClick={saveWeight}
                    disabled={!weightInput || parseFloat(weightInput) <= 0}
                    className="flex-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    שמור משקל
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* כפתור חזרה לרשימה */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              חזור לרשימת הזמנות
            </button>
          </div>

          {/* בדיקה אם ההזמנה מושלמת ב-100% */}
          {(() => {
            const isFullyWeighed = selectedOrder.order_items.every(item => item.actual_weight && item.actual_weight > 0)
            const hasPartiallyWeighed = selectedOrder.order_items.some(item => item.actual_weight)
            
            if (isFullyWeighed) {
              // הזמנה מושלמת ב-100% - הצגת סליידר "הזמנה מוכנה"
              return (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">
                      🎉 כל הפריטים נשקלו!
                    </h3>
                    <p className="text-green-700">
                      החליקו את הסליידר עד הסוף לסיום ההזמנה
                    </p>
                  </div>

                  {/* סליידר "הזמנה מוכנה" */}
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderValue}
                        onChange={handleSliderChange}
                        className="w-full h-6 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${sliderValue}%, #e5e7eb ${sliderValue}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-lg font-medium mt-2">
                        <span className="text-gray-600">החליקו לסיום ←</span>
                        <span className={`${sliderValue >= 100 ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                          {sliderValue >= 100 ? '✓ מוכן לשליחה!' : `${sliderValue}%`}
                        </span>
                      </div>
                    </div>

                    {/* כפתור שליחה - מופיע רק ב-100% */}
                    {sliderValue >= 100 && (
                      <button
                        onClick={sendOrderReady}
                        disabled={sendingReady}
                        className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all flex items-center justify-center gap-3 ${
                          sendingReady
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 transform hover:scale-105 shadow-lg animate-pulse'
                        }`}
                      >
                        {sendingReady ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            מעבד הזמנה...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            🚀 הזמנה מוכנה - שלח ללקוח
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            } else if (hasPartiallyWeighed) {
              // הזמנה חלקית - כפתור סיום רגיל
              return (
                <button
                  onClick={completeWeighing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  סיים שקילה (חלקי)
                </button>
              )
            }
            return null
          })()}
        </div>
      )}


    </div>
  )
}