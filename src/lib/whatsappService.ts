export interface OrderItem {
  fish_name: string
  cut?: string
  quantity_kg: number
  price_per_kg: number
  total_price: number
  unitsBased?: boolean
}

// תמיכה במבנה CartItem מהאפליקציה
export interface CartItem {
  fishName: string
  cutType?: string
  quantity: number
  pricePerKg: number
  totalPrice: number
  unitsBased?: boolean
  // שדות נוספים מ-CartItem
  fishId?: number
  waterType?: string
  cutTypeId?: number
  averageWeightKg?: number
  unitPrice?: number
}

// Union type שתומך בשני המבנים
export type OrderCartItem = OrderItem | CartItem

export interface OrderData {
  customerName: string
  email: string
  phone: string
  deliveryAddress: string
  deliveryDate: string
  deliveryTime: string
  cart: OrderCartItem[]
  totalPrice: number
  isHolidayMode?: boolean
}

// פונקציה ליצירת הודעת WhatsApp ללקוח
export function createCustomerWhatsAppMessage(orderData: OrderData, orderId: string): string {
  const formatPrice = (price: number) => `₪${price.toFixed(2)}`
  
  let message = `🐟 *דגי בקעת אונו - אישור הזמנה*\n`
  message += `\n📋 *מספר הזמנה:* ${orderId}\n`
  message += `👤 *שלום ${orderData.customerName}*\n\n`
  
  message += `✅ *הזמנתך התקבלה בהצלחה!*\n\n`
  
  // פרטי ההזמנה
  message += `📦 *פרטי ההזמנה:*\n`
  orderData.cart.forEach((item, index) => {
    // התמודדות עם שני מבנים אפשריים של הסל
    const fishName = (item as any).fish_name || (item as any).fishName || 'לא ידוע'
    const cutType = (item as any).cut || (item as any).cutType || ''
    const quantity = (item as any).quantity_kg || (item as any).quantity || 0
    const isUnits = (item as any).unit_based || (item as any).unitsBased || false
    
    const quantityText = isUnits ? `${quantity} יח׳` : `${quantity} ק"ג`
    message += `${index + 1}. ${fishName}`
    if (cutType) message += ` - ${cutType}`
    message += `\n   כמות: ${quantityText}\n`
  })
  
  message += `\n💳 *התשלום יתבצע בחנות לפי משקל בפועל*\n\n`
  
  // פרטי איסוף
  message += `📅 *פרטי איסוף:*\n`
  message += `📍 כתובת: ${orderData.deliveryAddress}\n`
  message += `📅 תאריך: ${new Date(orderData.deliveryDate).toLocaleDateString('he-IL')}\n`
  message += `🕒 שעה: ${orderData.deliveryTime}\n\n`
  
  if (orderData.isHolidayMode) {
    message += `🎉 *הזמנה מיוחדת לחג*\n`
    message += `ההזמנה מיועדת לתאריכי החג שנבחרו\n\n`
  }
  
  message += `📞 *פרטי יצירת קשר:*\n`
  message += `חנות: דגי בקעת אונו\n`
  message += `טלפון: 03-1234567\n`
  message += `כתובת: רחוב הדג 123, בקעת אונו\n\n`
  
  message += `🙏 *תודה שבחרתם בנו!*\n`
  message += `נתראה באיסוף 😊`
  
  return message
}

// פונקציה ליצירת הודעת WhatsApp לאדמין
export function createAdminWhatsAppMessage(orderData: OrderData, orderId: string): string {
  const formatPrice = (price: number) => `₪${price.toFixed(2)}`
  
  let message = `🚨 *הזמנה חדשה מהאתר!*\n\n`
  message += `📋 *מספר הזמנה:* ${orderId}\n\n`
  
  // פרטי לקוח
  message += `👤 *פרטי לקוח:*\n`
  message += `שם: ${orderData.customerName}\n`
  message += `טלפון: ${orderData.phone}\n`
  message += `אימייל: ${orderData.email}\n\n`
  
  // פרטי איסוף
  message += `📅 *פרטי איסוף:*\n`
  message += `תאריך: ${new Date(orderData.deliveryDate).toLocaleDateString('he-IL')}\n`
  message += `שעה: ${orderData.deliveryTime}\n`
  message += `כתובת: ${orderData.deliveryAddress}\n\n`
  
  if (orderData.isHolidayMode) {
    message += `🎉 *הזמנה לחג*\n\n`
  }
  
  // סיכום הזמנה
  message += `🐟 *פרטי הזמנה:*\n`
  orderData.cart.forEach((item, index) => {
    // התמודדות עם שני מבנים אפשריים של הסל
    const fishName = (item as any).fish_name || (item as any).fishName || 'לא ידוע'
    const cutType = (item as any).cut || (item as any).cutType || ''
    const quantity = (item as any).quantity_kg || (item as any).quantity || 0
    const isUnits = (item as any).unit_based || (item as any).unitsBased || false
    
    const quantityText = isUnits ? `${quantity} יח׳` : `${quantity} ק"ג`
    message += `${index + 1}. ${fishName}`
    if (cutType) message += ` (${cutType})`
    message += ` - ${quantityText}\n`
  })
  
  message += `\n💳 *התשלום יתבצע בקופה לפי משקל בפועל*\n\n`
  
  message += `📱 *לצפייה באדמין:*\n`
  message += `${window.location.origin}/admin/orders`
  
  return message
}

// פונקציה לשליחת הודעת WhatsApp באמצעות GreenAPI
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // ניקוי מספר טלפון (הסרת רווחים ותווים מיוחדים)
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
    
    // אם המספר מתחיל ב-0, נהפוך ל-972 (ישראל)
    const internationalPhone = cleanPhone.startsWith('0') 
      ? '972' + cleanPhone.substring(1) 
      : cleanPhone
    
    // שליחה באמצעות GreenAPI
    const success = await sendWhatsAppWithGreenAPI(internationalPhone, message)
    
    if (success) {
      console.log('WhatsApp message sent successfully via GreenAPI to:', internationalPhone)
      return true
    } else {
      // אם GreenAPI נכשל, נפתח WhatsApp Web כגיבוי
      console.warn('GreenAPI failed, falling back to WhatsApp Web')
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${internationalPhone}?text=${encodedMessage}`
      window.open(whatsappUrl, '_blank')
      return true
    }
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return false
  }
}

// פונקציה לשליחת הודעות לגם לקוח וגם אדמין
export async function sendOrderNotifications(orderData: OrderData, orderId: string): Promise<void> {
  try {
    console.log('📦 Order data for WhatsApp:', JSON.stringify(orderData, null, 2))
    
    // הודעה ללקוח
    const customerMessage = createCustomerWhatsAppMessage(orderData, orderId)
    console.log('📱 Customer WhatsApp message:', customerMessage)
    await sendWhatsAppMessage(orderData.phone, customerMessage)
    
    // הודעה לאדמין (מספר של החנות)
    const adminPhone = import.meta.env.VITE_ADMIN_PHONE || '0501234567' // ניתן להגדיר ב-.env
    const adminMessage = createAdminWhatsAppMessage(orderData, orderId)
    console.log('📱 Admin WhatsApp message:', adminMessage)
    await sendWhatsAppMessage(adminPhone, adminMessage)
    
    console.log('Order notifications sent successfully')
    
  } catch (error) {
    console.error('Error sending order notifications:', error)
    // לא נזרוק שגיאה כדי שלא לעצור את תהליך ההזמנה
    console.warn('WhatsApp notifications failed, but order was saved successfully')
  }
}

// פונקציה לשליחה של הודעת WhatsApp עם GreenAPI
export async function sendWhatsAppWithGreenAPI(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // הגדרות GreenAPI - ניתן להגדיר ב-.env
    const instanceId = import.meta.env.VITE_GREENAPI_INSTANCE_ID
    const apiToken = import.meta.env.VITE_GREENAPI_TOKEN
    
    if (!instanceId || !apiToken) {
      console.warn('GreenAPI credentials not configured')
      return false
    }
    
    // URL של GreenAPI
    const apiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`
    
    // נתוני ההודעה
    const payload = {
      chatId: `${phoneNumber}@c.us`,
      message: message
    }
    
    console.log('🚀 Sending WhatsApp via GreenAPI to:', phoneNumber)
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ GreenAPI response:', result)
      return true
    } else {
      const error = await response.text()
      console.error('❌ GreenAPI error:', error)
      return false
    }
    
  } catch (error) {
    console.error('Error sending WhatsApp with GreenAPI:', error)
    return false
  }
}

// פונקציה לשליחה של הודעת WhatsApp עם Twilio (לגיבוי)
export async function sendWhatsAppWithTwilio(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // כאן נשתמש ב-Twilio WhatsApp API
    // זה דורש הגדרה של Twilio Account וWebhooks
    
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: message
      })
    })
    
    return response.ok
    
  } catch (error) {
    console.error('Error sending WhatsApp with Twilio:', error)
    return false
  }
}