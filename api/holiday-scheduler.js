// API endpoint לתזמון אוטומטי של דוחות חגים
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // רק GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // בדיקת חגים שמתקרבים (7 ימים מהיום)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    const { data: upcomingHolidays, error: holidaysError } = await supabase
      .from('holidays')
      .select('id, name, start_date, end_date, active')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .lte('start_date', sevenDaysFromNow.toISOString().split('T')[0])

    if (holidaysError) throw holidaysError

    if (!upcomingHolidays || upcomingHolidays.length === 0) {
      return res.status(200).json({ 
        message: 'אין חגים מתקרבים בשבוע הקרוב',
        holidays: []
      })
    }

    const reports = []

    // עבור כל חג מתקרב, יצירת דוח
    for (const holiday of upcomingHolidays) {
      try {
        // שליפת הזמנות לחג
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('order_items')
          .eq('holiday_id', holiday.id)
          .eq('is_holiday_order', true)

        if (ordersError) throw ordersError

        if (!orders || orders.length === 0) {
          reports.push({
            holiday: holiday.name,
            status: 'no_orders',
            message: 'אין הזמנות לחג זה'
          })
          continue
        }

        // איסוף דרישות דגים
        const fishSummary = {}
        
        orders.forEach(order => {
          if (order.order_items && Array.isArray(order.order_items)) {
            order.order_items.forEach(item => {
              const fishName = item.fish_name || ''
              const quantity = item.quantity_kg || 0
              
              if (fishName && quantity > 0) {
                fishSummary[fishName] = (fishSummary[fishName] || 0) + quantity
              }
            })
          }
        })

        // שליפת נתוני דגים ומלאי
        const { data: fishTypes, error: fishError } = await supabase
          .from('fish_types')
          .select('name, stock_kg, is_active')
          .eq('is_active', true)

        if (fishError) throw fishError

        const fishMap = new Map((fishTypes || []).map(f => [f.name, f]))
        
        // יצירת רשימת דרישות
        const requirements = Object.entries(fishSummary).map(([fishName, totalKg]) => {
          const fishData = fishMap.get(fishName)
          const currentStock = fishData?.stock_kg || 0
          
          // בדיקה אם דג נמכר ביחידות או בק"ג
          const isKgBased = /סלמון|טונה|ברבוניה/i.test(fishName)
          
          let displayQuantity = totalKg
          let unit = 'kg'
          
          if (!isKgBased) {
            // המרה ליחידות (משקל ממוצע 0.5 ק"ג לדג)
            displayQuantity = Math.ceil(totalKg / 0.5)
            unit = 'units'
          }
          
          const deficit = Math.max(0, displayQuantity - currentStock)
          
          return {
            fish_name: fishName,
            total_quantity: displayQuantity,
            unit,
            current_stock: currentStock,
            deficit
          }
        }).filter(r => r.deficit > 0) // רק דגים שחסרים

        if (requirements.length === 0) {
          reports.push({
            holiday: holiday.name,
            status: 'sufficient_stock',
            message: 'מלאי מספיק לכל הדגים'
          })
          continue
        }

        // יצירת תוכן הדוח
        const reportContent = {
          holiday: holiday.name,
          start_date: holiday.start_date,
          requirements,
          total_deficit_items: requirements.length,
          generated_at: new Date().toISOString()
        }

        // שליחת מייל לאדמין (אם מוגדר)
        if (process.env.ADMIN_EMAIL && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await sendEmailReport(reportContent)
        }

        reports.push({
          holiday: holiday.name,
          status: 'report_generated',
          requirements,
          deficit_items: requirements.length
        })

      } catch (error) {
        console.error(`Error processing holiday ${holiday.name}:`, error)
        reports.push({
          holiday: holiday.name,
          status: 'error',
          error: error.message
        })
      }
    }

    return res.status(200).json({
      message: 'בדיקת חגים מתקרבים הושלמה',
      processed_holidays: upcomingHolidays.length,
      reports
    })

  } catch (error) {
    console.error('Error in holiday scheduler:', error)
    return res.status(500).json({ 
      error: 'שגיאה בבדיקת חגים מתקרבים',
      details: error.message 
    })
  }
}

async function sendEmailReport(reportContent) {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    // יצירת תוכן הדוח בHTML
    const requirementsList = reportContent.requirements
      .map(req => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${req.fish_name}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            ${req.total_quantity} ${req.unit === 'kg' ? 'ק"ג' : 'יח׳'}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            ${req.current_stock} ${req.unit === 'kg' ? 'ק"ג' : 'יח׳'}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #dc2626;">
            ${req.deficit} ${req.unit === 'kg' ? 'ק"ג' : 'יח׳'}
          </td>
        </tr>
      `).join('')

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2 style="color: #1f2937;">דוח ספקים - ${reportContent.holiday}</h2>
        <p><strong>תאריך החג:</strong> ${new Date(reportContent.start_date).toLocaleDateString('he-IL')}</p>
        <p><strong>תאריך יצירת הדוח:</strong> ${new Date(reportContent.generated_at).toLocaleDateString('he-IL')}</p>
        
        <h3 style="color: #dc2626;">דגים שחסרים במלאי (${reportContent.total_deficit_items} פריטים):</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; border: 1px solid #ddd;">דג</th>
              <th style="padding: 12px; border: 1px solid #ddd;">כמות נדרשת</th>
              <th style="padding: 12px; border: 1px solid #ddd;">מלאי נוכחי</th>
              <th style="padding: 12px; border: 1px solid #ddd;">חסר</th>
            </tr>
          </thead>
          <tbody>
            ${requirementsList}
          </tbody>
        </table>
        
        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          דוח זה נוצר אוטומטי 7 ימים לפני החג כדי לעזור לך להיערך עם הספקים.
        </p>
      </div>
    `

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `דוח ספקים - ${reportContent.holiday} (${reportContent.total_deficit_items} פריטים חסרים)`,
      html: htmlContent
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email report sent for ${reportContent.holiday}`)

  } catch (error) {
    console.error('Error sending email report:', error)
    // לא נזרוק error כדי שהתהליך ימשיך
  }
}