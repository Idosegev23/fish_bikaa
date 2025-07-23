import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CartItem } from '../App'
import { CheckCircle, Loader, Mail } from 'lucide-react'
import EmailService from '../lib/emailService'

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
}

export default function OrderSummary({ cart, onClearCart }: OrderSummaryProps) {
  const navigate = useNavigate()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

  const submitOrder = async () => {
    if (!orderData) return

    setSubmitting(true)
    try {
      // יצירת order_items למסד הנתונים
      const orderItems = orderData.cart.map(item => ({
        fish_name: item.fishName,
        cut: item.cutType,
        quantity_kg: item.quantity,
        price: item.totalPrice
      }))

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
            total_price: orderData.totalPrice
          }
        ])
        .select()

      if (error) throw error

      // עדכון מלאי דגים - הורדת המשקלים שהוזמנו
      await updateFishInventory(orderData.cart)

      // שליחת מיילים
      await sendOrderEmails(orderData, data[0]?.id)

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

  const updateFishInventory = async (cartItems: CartItem[]) => {
    try {
      // קיבוץ כמויות לפי שם הדג (במקרה שאותו דג הוזמן מספר פעמים)
      const fishQuantities: { [fishName: string]: number } = {}
      
      cartItems.forEach(item => {
        if (fishQuantities[item.fishName]) {
          fishQuantities[item.fishName] += item.quantity
        } else {
          fishQuantities[item.fishName] = item.quantity
        }
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
        const newQuantity = fishData.available_kg - totalQuantity
        if (newQuantity < 0) {
          console.warn(`Warning: Not enough inventory for ${fishName}. Available: ${fishData.available_kg}, Ordered: ${totalQuantity}`)
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

  const sendOrderEmails = async (orderData: OrderData, orderId?: string) => {
    try {
      // הכנת נתוני המייל
      const emailData = {
        customerName: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        deliveryAddress: orderData.deliveryAddress,
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        orderItems: orderData.cart,
        totalPrice: orderData.totalPrice,
        orderId: orderId?.toString()
      }

      // שליחת מייל ללקוח (עם הפעלת המערכת האמיתית)
      const customerTemplate = EmailService.generateCustomerEmail(emailData)
      console.log('🚀 Attempting to send customer email...')
      const customerEmailSent = await EmailService.sendEmail(
        orderData.email, 
        customerTemplate, 
        'customer'
      )

      // שליחת מייל לאדמין (עם הפעלת המערכת האמיתית)
      const adminTemplate = EmailService.generateAdminEmail(emailData)
      console.log('🚀 Attempting to send admin email...')
      const adminEmailSent = await EmailService.sendEmail(
        'triroars@gmail.com', 
        adminTemplate, 
        'admin'
      )

      if (customerEmailSent) {
        console.log('✅ Customer email sent successfully')
      } else {
        console.warn('⚠️ Failed to send customer email')
      }

      if (adminEmailSent) {
        console.log('✅ Admin email sent successfully')
      } else {
        console.warn('⚠️ Failed to send admin email')
      }

    } catch (error) {
      console.error('Error sending emails:', error)
      // שגיאה בשליחת מיילים לא תחסום את ההזמנה
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ההזמנה נשלחה בהצלחה!
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600 ml-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">מיילים נשלחו!</h3>
              <p className="text-blue-700">
                נשלח אישור הזמנה לכתובת המייל שלכם והודעה למנהל החנות
              </p>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mb-8">
          קיבלתם הודעת אישור בדוא"ל. נתרה עמכם בקרוב לגבי ההזמנה.
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">סיכום הזמנה</h1>
        <p className="text-gray-600">אנא בדקו את הפרטים ולחצו על אישור לשליחת ההזמנה</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">פרטי הזמנה</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">פריטים</h3>
              <div className="space-y-2 mt-2">
                {orderData.cart.map((item, index) => (
                  <div key={index} className="flex justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <span className="font-medium">{item.fishName}</span>
                      <span className="text-gray-600 text-sm block">
                        {item.cutType} • {item.quantity} ק"ג
                      </span>
                    </div>
                    <span className="font-semibold">₪{item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>סה"כ לתשלום:</span>
                <span className="text-fish-600">₪{orderData.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700">זמן איסוף</h3>
              <p className="text-gray-600">
                {new Date(orderData.deliveryDate).toLocaleDateString('he-IL')} • {orderData.deliveryTime}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">פרטי לקוח</h2>
          
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

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>חשוב:</strong> התשלום יתבצע במזומן או בכרטיס אשראי בעת איסוף ההזמנה מהחנות.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={submitOrder}
          disabled={submitting}
          className="btn-primary px-8 py-3 text-lg disabled:opacity-50 flex items-center justify-center"
        >
          {submitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin ml-2" />
              שולח הזמנה...
            </>
          ) : (
            'אישור ושליחת הזמנה'
          )}
        </button>
        
        <button
          onClick={() => navigate('/customer-details')}
          className="btn-secondary px-8 py-3 text-lg"
          disabled={submitting}
        >
          חזרה לעריכה
        </button>
      </div>
    </div>
  )
} 