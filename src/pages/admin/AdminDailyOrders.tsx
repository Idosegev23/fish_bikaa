import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { SHOP_INFO } from '../../lib/shopInfo'
import { Clock, User, MapPin, Phone, Mail, Package, CheckCircle, Printer, RefreshCw } from 'lucide-react'

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
  email: string
  phone: string
  delivery_address: string
  delivery_date: string
  delivery_time: string
  order_items: OrderItem[]
  total_price: number
  status?: 'pending' | 'ready' | 'completed'
  created_at: string
  is_holiday_order?: boolean
}

export default function AdminDailyOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  // תאריך היום לפי שעון ישראל (לא UTC)
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }))
  const [processingOrder, setProcessingOrder] = useState<number | null>(null)

  useEffect(() => {
    fetchDailyOrders()
  }, [selectedDate])

  const fetchDailyOrders = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_date', selectedDate)
        .order('delivery_time', { ascending: true })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching daily orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const markOrderReady = async (order: Order) => {
    // אישור לפני שליחת הודעה ללקוח (אי אפשר לבטל הודעה שנשלחה)
    if (!window.confirm(`לסמן את הזמנה #${order.id} כמוכנה ולשלוח הודעת WhatsApp ל${order.customer_name}?`)) return

    try {
      setProcessingOrder(order.id)

      // עדכון סטטוס ההזמנה
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', order.id)

      if (error) throw error

      // שליחת הודעת WhatsApp ללקוח
      await sendOrderReadyWhatsApp(order)

      // הדפסת מדבקה
      await printOrderLabel(order)

      // עדכון המצב המקומי
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: 'ready' as const } : o
      ))

      console.log(`✅ Order ${order.id} marked as ready`)

    } catch (error) {
      console.error('Error marking order as ready:', error)
      alert('שגיאה בעדכון ההזמנה')
    } finally {
      setProcessingOrder(null)
    }
  }

  const sendOrderReadyWhatsApp = async (order: Order) => {
    try {
      const message = createOrderReadyMessage(order)
      await sendWhatsAppMessage(order.phone, message)
      console.log(`📱 Ready notification sent to ${order.phone}`)
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
    }
  }

  const createOrderReadyMessage = (order: Order): string => {
    let message = `🎉 *ההזמנה שלכם מוכנה!*\n\n`
    message += `👤 ${order.customer_name}\n`
    message += `📋 הזמנה מספר: ${order.id}\n\n`
    
    message += `🐟 *מה מוכן לאיסוף:*\n`
    order.order_items.forEach((item, index) => {
      const quantity = item.unit_based ? `${item.quantity_kg} יח׳` : `${item.quantity_kg} ק"ג`
      message += `${index + 1}. ${item.fish_name}`
      if (item.cut) message += ` - ${item.cut}`
      message += ` (${quantity})\n`
    })
    
    // כתובת וטלפון מתוך SHOP_INFO - שדה ריק לא יוצג
    if (SHOP_INFO.address) {
      message += `\n📍 *כתובת החנות:*\n`
      message += `${SHOP_INFO.name}\n`
      message += `${SHOP_INFO.address}\n\n`
    } else {
      message += `\n`
    }

    if (SHOP_INFO.hours) {
      message += `🕒 *שעות פתיחה:*\n${SHOP_INFO.hours}\n\n`
    }

    if (SHOP_INFO.phone) {
      message += `📞 לפרטים: ${SHOP_INFO.phone}\n`
    }
    message += `💳 *התשלום יתבצע בקופה לפי משקל בפועל*\n`
    message += `מחכים לכם! 😊`
    
    return message
  }

  const printOrderLabel = async (order: Order) => {
    try {
      // יצירת תוכן המדבקה
      const labelContent = createLabelContent(order)
      
      // שליחה למדפסת (דרך API או Print API)
      await sendToPrinter(labelContent, order.id)
      
      console.log(`🖨️ Label printed for order ${order.id}`)
    } catch (error) {
      console.error('Error printing label:', error)
    }
  }

  const createLabelContent = (order: Order): string => {
    let content = `דגי בקעת אונו\n`
    content += `================\n`
    content += `הזמנה #${order.id}\n`
    content += `${new Date(order.created_at).toLocaleDateString('he-IL')}\n\n`
    
    content += `לקוח: ${order.customer_name}\n`
    content += `טלפון: ${order.phone}\n`
    content += `זמן איסוף: ${order.delivery_time}\n\n`
    
    content += `פריטים להכנה:\n`
    content += `-------------\n`
    order.order_items.forEach((item, index) => {
      const orderedQuantity = item.unit_based ? `${item.quantity_kg} יח׳` : `${item.quantity_kg.toFixed(1)} ק"ג`
      content += `${index + 1}. ${item.fish_name}`
      if (item.cut) content += ` (${item.cut})`
      content += `\n   הוזמן: ${orderedQuantity}`
      if (item.actual_weight) {
        content += `\n   נשקל: ${item.actual_weight} ק"ג ✓`
      }
      content += `\n`
    })
    
    content += `\n** תשלום בקופה לפי משקל בפועל **\n`
    content += `================\n`
    content += `תודה שבחרתם בנו!`
    
    return content
  }

  const sendToPrinter = async (content: string, orderId: number) => {
    try {
      // אפשרות 1: שליחה ל-API שמתחבר למדפסת
      const response = await fetch('/api/print-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, orderId })
      })

      // שגיאת HTTP - מעבר לגיבוי
      if (!response.ok) {
        throw new Error(`Print API failed: ${response.status}`)
      }

      // אפשרות 2: שימוש ב-Web Print API (אם הדפדפן תומך)
      // if ('print' in window) {
      //   const printWindow = window.open('', '_blank')
      //   printWindow?.document.write(`<pre>${content}</pre>`)
      //   printWindow?.print()
      //   printWindow?.close()
      // }
      
    } catch (error) {
      console.error('Printer error:', error)
      // גיבוי: פתיחת חלון הדפסה רגיל
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap;">${content}</pre>`)
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200' // ברירת מחדל להזמנות חדשות
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'pending': return 'בהכנה'
      case 'ready': return 'מוכן לאיסוף'
      case 'completed': return 'הושלם'
      default: return 'חדש' // ברירת מחדל להזמנות חדשות
    }
  }

  const formatQuantity = (item: OrderItem) => {
    return item.unit_based ? `${item.quantity_kg} יח׳` : `${item.quantity_kg.toFixed(1)} ק"ג`
  }

  const ordersByTimeSlot = orders.reduce((acc, order) => {
    const timeSlot = order.delivery_time
    if (!acc[timeSlot]) acc[timeSlot] = []
    acc[timeSlot].push(order)
    return acc
  }, {} as Record<string, Order[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
        <span className="mr-3 text-lg">טוען הזמנות...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* כותרת וניווט */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              ניהול הזמנות יומי
            </h1>
            <p className="text-gray-600 mt-1">
              הזמנות לתאריך {new Date(selectedDate).toLocaleDateString('he-IL')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={fetchDailyOrders}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              רענן
            </button>
          </div>
        </div>
        
        {/* סטטיסטיקות */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-blue-700">סה"כ הזמנות</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending' || !o.status).length}
            </div>
            <div className="text-sm text-yellow-700">בהכנה</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'ready').length}
            </div>
            <div className="text-sm text-green-700">מוכן לאיסוף</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {orders.filter(o => o.status === 'completed').length}
            </div>
            <div className="text-sm text-purple-700">הושלמו</div>
          </div>
        </div>
      </div>

      {/* הזמנות לפי זמני איסוף */}
      {Object.keys(ordersByTimeSlot).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            אין הזמנות לתאריך זה
          </h3>
          <p className="text-gray-600">
            לא נמצאו הזמנות לתאריך {new Date(selectedDate).toLocaleDateString('he-IL')}
          </p>
        </div>
      ) : (
        Object.entries(ordersByTimeSlot)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([timeSlot, timeOrders]) => (
            <div key={timeSlot} className="space-y-4">
              {/* כותרת זמן איסוף */}
              <div className="flex items-center gap-3 bg-primary-50 rounded-lg p-4">
                <Clock className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-primary-900">
                  זמן איסוף: {timeSlot}
                </h2>
                <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                  {timeOrders.length} הזמנות
                </span>
              </div>

              {/* כרטיסי הזמנות */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {timeOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* כותרת כרטיס */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">הזמנה #{order.id}</h3>
                          <p className="opacity-90">{order.customer_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>

                    {/* פרטי לקוח */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{order.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 truncate">{order.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{order.delivery_address}</span>
                        </div>
                      </div>
                    </div>

                    {/* פרטי הזמנה */}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">פרטי ההזמנה:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="py-2 border-b border-gray-50 last:border-0">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {item.fish_name}
                                  {item.cut && <span className="text-gray-600 text-sm"> - {item.cut}</span>}
                                </div>
                                <div className="text-sm text-gray-600">
                                  הוזמן: {formatQuantity(item)}
                                </div>
                                {item.actual_weight && (
                                  <div className="text-sm text-green-600 font-medium">
                                    נשקל: {item.actual_weight} ק"ג ✓
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                {item.actual_weight ? (
                                  <div className="text-lg font-bold text-green-600">
                                    {item.actual_weight} ק"ג
                                  </div>
                                ) : (
                                  <div className="text-lg font-bold text-gray-500">
                                    {formatQuantity(item)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* הערה על תשלום */}
                      <div className="pt-3 mt-3 border-t border-gray-200 text-center">
                        <span className="text-sm text-gray-600 bg-yellow-50 px-3 py-1 rounded-full">
                          💳 תשלום בקופה לפי משקל בפועל
                        </span>
                      </div>
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="p-4 bg-gray-50 flex gap-3">
                      {(order.status === 'pending' || !order.status) && (
                        <button
                          onClick={() => markOrderReady(order)}
                          disabled={processingOrder === order.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {processingOrder === order.id ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                          הזמנה מוכנה
                        </button>
                      )}
                      
                      <button
                        onClick={() => printOrderLabel(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Printer className="w-5 h-5" />
                        הדפס
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  )
}