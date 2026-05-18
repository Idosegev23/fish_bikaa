import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import { pdfLibService, type SupplierReportData } from '../../lib/pdfLibService'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { ArrowLeft, FileText, MessageCircle, Calendar, TrendingUp } from 'lucide-react'

type Holiday = {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
}

type HolidayOrderSummary = {
  fish_name: string
  total_ordered: number
  unit: 'kg' | 'units'
  order_count: number
}

export default function AdminHolidaySupplierReport() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedHolidayId, setSelectedHolidayId] = useState<number | null>(null)
  const [orderSummary, setOrderSummary] = useState<HolidayOrderSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('id, name, start_date, end_date, active')
        .order('start_date', { ascending: false })
      
      if (error) throw error
      const list = (data as Holiday[]) || []
      setHolidays(list)
      
      // בחר חג פעיל כברירת מחדל
      const active = list.find(h => h.active)
      if (active) {
        setSelectedHolidayId(active.id)
        await fetchHolidayOrders(active.id)
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
    }
  }

  const fetchHolidayOrders = async (holidayId: number) => {
    setLoading(true)
    try {
      const selectedHoliday = holidays.find(h => h.id === holidayId)
      if (!selectedHoliday) return

      // טעינת הזמנות לתקופת החג
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('delivery_date', selectedHoliday.start_date)
        .lte('delivery_date', selectedHoliday.end_date)

      if (error) throw error

      setTotalOrders(orders?.length || 0)

      // חישוב סיכום דגים
      const fishSummary = new Map<string, HolidayOrderSummary>()

      orders?.forEach(order => {
        if (Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const fishName = item.fish_name || 'לא ידוע'
            const quantity = item.quantity_kg || item.quantity || 0
            const isUnits = item.unit_based || false

            if (!fishSummary.has(fishName)) {
              fishSummary.set(fishName, {
                fish_name: fishName,
                total_ordered: 0,
                unit: isUnits ? 'units' : 'kg',
                order_count: 0
              })
            }

            const summary = fishSummary.get(fishName)!
            summary.total_ordered += quantity
            summary.order_count += 1
          })
        }
      })

      setOrderSummary(Array.from(fishSummary.values()).sort((a, b) => b.total_ordered - a.total_ordered))
    } catch (error) {
      console.error('Error fetching holiday orders:', error)
      setOrderSummary([])
    } finally {
      setLoading(false)
    }
  }

  const handleHolidayChange = async (holidayId: number) => {
    setSelectedHolidayId(holidayId)
    await fetchHolidayOrders(holidayId)
  }

  const downloadHolidaySupplierPDF = async () => {
    if (!selectedHolidayId || orderSummary.length === 0) return
    
    setGeneratingPDF(true)
    try {
      const selectedHoliday = holidays.find(h => h.id === selectedHolidayId)
      if (!selectedHoliday) return

      const reportData: SupplierReportData = {
        startDate: selectedHoliday.start_date,
        endDate: selectedHoliday.end_date,
        fishRequirements: orderSummary.map(item => ({
          fishName: item.fish_name,
          totalRequired: item.total_ordered,
          isUnits: item.unit === 'units'
        })),
        totalOrders
      }
      
      const pdfBlob = await pdfLibService.generateSupplierReport(reportData)
      const filename = `דוח-הזמנות-חג-${selectedHoliday.name}-${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`
      
      pdfLibService.downloadPDF(pdfBlob, filename)
      alert('דוח הורד בהצלחה')

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('❌ שגיאה ביצירת הדוח')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const sendHolidayReportViaWhatsApp = async () => {
    if (!selectedHolidayId || orderSummary.length === 0) return
    
    setSendingWhatsApp(true)
    try {
      const selectedHoliday = holidays.find(h => h.id === selectedHolidayId)
      if (!selectedHoliday) return

      const message = createHolidayWhatsAppMessage(selectedHoliday)
      
      const adminPhone = import.meta.env.VITE_ADMIN_PHONE
      if (!adminPhone) {
        alert('❌ מספר אדמין לא מוגדר')
        return
      }
      
      await sendWhatsAppMessage(adminPhone, message)
      alert('✅ דוח הזמנות החג נשלח בוואטסאפ!')

    } catch (error) {
      console.error('Error sending WhatsApp report:', error)
      alert('❌ שגיאה בשליחת הדוח')
    } finally {
      setSendingWhatsApp(false)
    }
  }

  const createHolidayWhatsAppMessage = (holiday: Holiday) => {
    const startDate = new Date(holiday.start_date).toLocaleDateString('he-IL')
    const endDate = new Date(holiday.end_date).toLocaleDateString('he-IL')
    
    let message = `📊 *דוח הזמנות חג - דגי בקעת אונו*\n`
    message += `🎉 חג: ${holiday.name}\n`
    message += `📅 תקופה: ${startDate} - ${endDate}\n\n`
    
    message += `📈 *סיכום כללי:*\n`
    message += `• סה"כ הזמנות: ${totalOrders}\n`
    message += `• סוגי דגים שהוזמנו: ${orderSummary.length}\n\n`
    
    if (orderSummary.length > 0) {
      message += `🐟 *כמויות שהוזמנו בפועל:*\n`
      orderSummary.forEach(item => {
        const quantity = item.unit === 'units' ? `${item.total_ordered} יח׳` : `${item.total_ordered.toFixed(1)} ק"ג`
        message += `• ${item.fish_name}: ${quantity} (${item.order_count} הזמנות)\n`
      })
      message += `\n`
    }
    
    message += `💡 *מידע לספק:*\n`
    message += `• אלה הכמויות שהלקוחות הזמינו בפועל\n`
    message += `• מומלץ להוסיף מרווח בטחון של 10-15%\n`
    message += `• לדוח מפורט - הורידו PDF מהמערכת\n\n`
    
    message += `📱 *הודעה אוטומטית ממערכת ההזמנות*`
    
    return message
  }

  const selectedHoliday = holidays.find(h => h.id === selectedHolidayId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link 
                to="/admin/dashboard" 
                className="ml-4 flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 ml-1" />
                חזרה לדשבורד
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">דוח הזמנות חג</h1>
                <p className="text-gray-600">כמויות שהוזמנו בפועל לחג</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* בחירת חג ויצירת דוח */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר חג
              </label>
              <select
                value={selectedHolidayId || ''}
                onChange={(e) => handleHolidayChange(Number(e.target.value))}
                className="input-field"
              >
                <option value="">בחר חג</option>
                {holidays.map(holiday => (
                  <option key={holiday.id} value={holiday.id}>
                    {holiday.name} ({new Date(holiday.start_date).toLocaleDateString('he-IL')})
                    {holiday.active && ' - פעיל'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={downloadHolidaySupplierPDF}
                disabled={!selectedHolidayId || orderSummary.length === 0 || generatingPDF}
                className="btn-secondary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    יוצר PDF...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    הורד דוח PDF
                  </>
                )}
              </button>
              
              <button 
                onClick={sendHolidayReportViaWhatsApp}
                disabled={!selectedHolidayId || orderSummary.length === 0 || sendingWhatsApp}
                className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingWhatsApp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    שלח בוואטסאפ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* תוצאות */}
        {selectedHoliday && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                הזמנות עבור {selectedHoliday.name}
              </h2>
              <div className="text-sm text-gray-600">
                {totalOrders} הזמנות • {orderSummary.length} סוגי דגים
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : orderSummary.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>אין הזמנות לחג זה</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סוג דג</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">כמות שהוזמנה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יחידת מדידה</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מספר הזמנות</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderSummary.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.fish_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-lg">
                            {item.unit === 'units' ? Math.floor(item.total_ordered) : item.total_ordered.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.unit === 'units' ? 'יחידות' : 'קילוגרם'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.order_count} הזמנות
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <AdminBottomNav />
    </div>
  )
}