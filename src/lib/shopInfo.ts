// פרטי החנות - מקור יחיד לכל האתר, הודעות WhatsApp, מיילים ו-PDF
// יש למלא את הערכים האמיתיים. שדה ריק = הרכיב שמשתמש בו לא יוצג.
export const SHOP_INFO = {
  name: 'דגי בקעת אונו',
  // טלפון לתצוגה, למשל '03-5551234'
  phone: '',
  // מספר WhatsApp בפורמט בינלאומי ללא +, למשל '972501234567'
  whatsapp: '',
  // כתובת מלאה, למשל 'רחוב X 1, קריית אונו'
  address: '',
  email: '',
  // שעות פתיחה לתצוגה, למשל 'א׳-ה׳ 08:00-19:00, ו׳ 07:00-14:00'
  hours: '',
}

// קישור חיוג מהטלפון לתצוגה
export const shopTelHref = () => `tel:${SHOP_INFO.phone.replace(/[^\d+]/g, '')}`

// קישור WhatsApp עם הודעה אופציונלית
export const shopWhatsappHref = (text?: string) =>
  `https://wa.me/${SHOP_INFO.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`
