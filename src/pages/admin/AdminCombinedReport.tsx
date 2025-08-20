import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Holiday, FishType, Order } from '../../lib/supabase'
import { pdfLibService } from '../../lib/pdfLibService'
import type { SupplierReportData } from '../../lib/pdfLibService'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { Calendar, FileText, MessageCircle, TrendingUp, Package } from 'lucide-react'

interface CombinedReportData {
  // נתוני מלאי 
  inventoryData: {
    fishName: string
    currentStock: number
    totalDemand: number
    shortage: number
    isUnits: boolean
  }[]
  
  // נתוני הזמנות חג
  holidayOrdersData: {
    fishName: string
    totalOrdered: number
    isUnits: boolean
  }[]
  
  selectedHoliday?: Holiday
}

const AdminCombinedReport: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [fishTypes, setFishTypes] = useState<FishType[]>([])
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<CombinedReportData | null>(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

  useEffect(() => {
    fetchHolidays()
    fetchFishTypes()
  }, [])

  const fetchHolidays = async () => {
    try {
      const { data } = await supabase
        .from('holidays')
        .select('*')
        .order('start_date', { ascending: false })
      setHolidays(data || [])
    } catch (error) {
      console.error('Error fetching holidays:', error)
    }
  }

  const fetchFishTypes = async () => {
    try {
      const { data } = await supabase
        .from('fish_types')
        .select('*')
        .eq('is_active', true)
      setFishTypes(data || [])
    } catch (error) {
      console.error('Error fetching fish types:', error)
    }
  }

  const fetchReportData = async () => {
    if (!selectedHoliday) return

    setLoading(true)
    try {
      // נתוני הזמנות לחג
      const { data: orders } = await supabase
        .from('orders')
        .select('order_items')
        .gte('delivery_date', selectedHoliday.start_date)
        .lte('delivery_date', selectedHoliday.end_date)

      // חישוב כמויות שהוזמנו בפועל
      const holidayOrdersMap: { [key: string]: { total: number; isUnits: boolean } } = {}
      
      orders?.forEach(order => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const fishName = item.fish_name || item.fishName
            if (fishName) {
              if (!holidayOrdersMap[fishName]) {
                // בדיקה אם הדג ביחידות או בק"ג
                const isUnits = !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(fishName)
                holidayOrdersMap[fishName] = { total: 0, isUnits }
              }
              
              const quantity = item.quantity || item.quantity_kg || 0
              holidayOrdersMap[fishName].total += quantity
            }
          })
        }
      })

      // נתוני מלאי מול ביקוש
      const inventoryData = fishTypes.map(fish => {
        const isUnits = !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(fish.name)
        const totalDemand = holidayOrdersMap[fish.name]?.total || 0
        const currentStock = fish.available_kg
        const shortage = Math.max(0, totalDemand - currentStock)
        
        return {
          fishName: fish.name,
          currentStock,
          totalDemand,
          shortage,
          isUnits
        }
      }).filter(item => item.totalDemand > 0) // רק דגים שהוזמנו

      const holidayOrdersData = Object.entries(holidayOrdersMap).map(([fishName, data]) => ({
        fishName,
        totalOrdered: data.total,
        isUnits: data.isUnits
      }))

      setReportData({
        inventoryData,
        holidayOrdersData,
        selectedHoliday
      })

    } catch (error) {
      console.error('Error fetching report data:', error)
      alert('❌ שגיאה בטעינת נתוני הדוח')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!reportData || !selectedHoliday) return

    setGeneratingPDF(true)
    try {
      // יצירת נתונים לPDF
      const supplierReportData: SupplierReportData = {
        startDate: selectedHoliday.start_date,
        endDate: selectedHoliday.end_date,
        totalOrders: reportData.holidayOrdersData.length,
        fishRequirements: reportData.holidayOrdersData.map(item => ({
          fishName: item.fishName,
          totalRequired: item.totalOrdered,
          isUnits: item.isUnits
        }))
      }

      const pdfBlob = await pdfLibService.generateSupplierReport(supplierReportData)
      const filename = `דוח-משולב-${selectedHoliday.name}-${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`
      
      pdfLibService.downloadPDF(pdfBlob, filename)
      alert('דוח הורד בהצלחה')

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('❌ שגיאה ביצירת הדוח')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const sendReportViaWhatsApp = async () => {
    if (!reportData || !selectedHoliday) return

    setSendingWhatsApp(true)
    try {
      let message = `📊 *דוח משולב - דגי בקעת אונו*\n`
      message += `🎉 חג: ${selectedHoliday.name}\n`
      message += `📅 תאריך: ${new Date().toLocaleDateString('he-IL')}\n\n`
      
      message += `📦 *הזמנות בפועל:*\n`
      reportData.holidayOrdersData.forEach(item => {
        const quantity = item.isUnits ? 
          `${Math.floor(item.totalOrdered)} יחידות` : 
          `${item.totalOrdered.toFixed(1)} ק"ג`
        message += `• ${item.fishName}: ${quantity}\n`
      })

      message += `\n📋 *מצב מלאי:*\n`
      reportData.inventoryData.forEach(item => {
        if (item.shortage > 0) {
          const shortageText = item.isUnits ? 
            `${Math.floor(item.shortage)} יחידות` : 
            `${item.shortage.toFixed(1)} ק"ג`
          message += `⚠️ ${item.fishName}: חסר ${shortageText}\n`
        }
      })

      message += `\n🐟 דגי בקעת אונו`

      const adminPhone = import.meta.env.VITE_ADMIN_PHONE || '972508503310'
      await sendWhatsAppMessage(adminPhone, message)
      alert('דוח נשלח בוואטסאפ בהצלחה')

    } catch (error) {
      console.error('Error sending WhatsApp:', error)
      alert('❌ שגיאה בשליחת הדוח')
    } finally {
      setSendingWhatsApp(false)
    }
  }

  useEffect(() => {
    if (selectedHoliday) {
      fetchReportData()
    }
  }, [selectedHoliday])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">דוח משולב - חג ומלאי</h1>
        <p className="text-gray-600">דוח מקיף שמציג הזמנות בפועל ומצב מלאי לחג</p>
      </div>

      {/* בחירת חג */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 text-primary-600 ml-2" />
          <h2 className="text-xl font-semibold">בחירת חג</h2>
        </div>
        
        <select
          value={selectedHoliday?.id || ''}
          onChange={(e) => {
            const holiday = holidays.find(h => h.id === parseInt(e.target.value))
            setSelectedHoliday(holiday || null)
          }}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">בחר חג...</option>
          {holidays.map(holiday => (
            <option key={holiday.id} value={holiday.id}>
              {holiday.name} - {new Date(holiday.start_date).toLocaleDateString('he-IL')} עד {new Date(holiday.end_date).toLocaleDateString('he-IL')}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני דוח...</p>
        </div>
      )}

      {reportData && selectedHoliday && (
        <>
          {/* כפתורי פעולה */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={downloadPDF}
                disabled={generatingPDF}
                className="btn-primary flex items-center space-x-2 space-x-reverse w-full md:w-auto disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{generatingPDF ? 'יוצר PDF...' : 'הורד דוח PDF'}</span>
              </button>
              
              <button
                onClick={sendReportViaWhatsApp}
                disabled={sendingWhatsApp}
                className="btn-secondary flex items-center space-x-2 space-x-reverse disabled:opacity-50 w-full md:w-auto"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{sendingWhatsApp ? 'שולח...' : 'שלח בוואטסאפ'}</span>
              </button>
            </div>
          </div>

          {/* תצוגת הזמנות בפועל */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 ml-2" />
              <h2 className="text-xl font-semibold">הזמנות בפועל לחג {selectedHoliday.name}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-semibold">דג</th>
                    <th className="text-right py-3 px-4 font-semibold">כמות שהוזמנה</th>
                    <th className="text-right py-3 px-4 font-semibold">יחידת מדידה</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.holidayOrdersData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.fishName}</td>
                      <td className="py-3 px-4">
                        {item.isUnits ? Math.floor(item.totalOrdered) : item.totalOrdered.toFixed(1)}
                      </td>
                      <td className="py-3 px-4">
                        {item.isUnits ? 'יחידות' : 'ק"ג'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* תצוגת מצב מלאי */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-orange-600 ml-2" />
              <h2 className="text-xl font-semibold">מצב מלאי מול ביקוש</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-semibold">דג</th>
                    <th className="text-right py-3 px-4 font-semibold">מלאי נוכחי</th>
                    <th className="text-right py-3 px-4 font-semibold">ביקוש</th>
                    <th className="text-right py-3 px-4 font-semibold">חסר</th>
                    <th className="text-right py-3 px-4 font-semibold">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.inventoryData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.fishName}</td>
                      <td className="py-3 px-4">
                        {item.isUnits ? Math.floor(item.currentStock) : item.currentStock.toFixed(1)}
                        {item.isUnits ? ' יחידות' : ' ק"ג'}
                      </td>
                      <td className="py-3 px-4">
                        {item.isUnits ? Math.floor(item.totalDemand) : item.totalDemand.toFixed(1)}
                        {item.isUnits ? ' יחידות' : ' ק"ג'}
                      </td>
                      <td className="py-3 px-4">
                        {item.shortage > 0 ? (
                          <span className="text-red-600 font-medium">
                            {item.isUnits ? Math.floor(item.shortage) : item.shortage.toFixed(1)}
                            {item.isUnits ? ' יחידות' : ' ק"ג'}
                          </span>
                        ) : (
                          <span className="text-green-600">מספיק</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.shortage > 0 ? (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                            ⚠️ חסר
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                            ✅ במלאי
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminCombinedReport