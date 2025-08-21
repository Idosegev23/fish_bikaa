import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Holiday, Order } from '../../lib/supabase'
import { pdfLibService } from '../../lib/pdfLibService'
import type { HolidayOrdersReportData } from '../../lib/pdfLibService'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { Calendar, FileText, MessageCircle, TrendingUp, Users, ArrowLeft, ChevronDown, Check } from 'lucide-react'

interface HolidayOrderData {
  fishName: string
  totalQuantity: number
  totalWeight: number
  isUnits: boolean
  orderCount: number
}

const AdminHolidayOrdersReport: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [holidayOrders, setHolidayOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    fetchHolidays()
  }, [])

  // סגירת dropdown כשלוחצים מחוץ לו
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (dropdownOpen && !target.closest('.relative')) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

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

  const fetchHolidayOrders = async (holiday: Holiday) => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('is_holiday_order', true)
        .eq('holiday_id', holiday.id)
        .order('created_at', { ascending: false })
      
      setHolidayOrders(data || [])
    } catch (error) {
      console.error('Error fetching holiday orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateHolidayFishSummary = (): HolidayOrderData[] => {
    const fishMap = new Map<string, HolidayOrderData>()
    
    holidayOrders.forEach(order => {
      if (Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const fishName = item.fish_name || 'לא ידוע'
          const quantity = item.quantity_kg || item.quantity || 0
          const isUnits = !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(fishName)
          
          if (!fishMap.has(fishName)) {
            fishMap.set(fishName, {
              fishName,
              totalQuantity: 0,
              totalWeight: 0,
              isUnits,
              orderCount: 0
            })
          }
          
          const fishData = fishMap.get(fishName)!
          if (isUnits) {
            fishData.totalQuantity += quantity
          } else {
            fishData.totalWeight += quantity
          }
        })
      }
    })

    // ספירת הזמנות לכל דג
    holidayOrders.forEach(order => {
      if (Array.isArray(order.order_items)) {
        const uniqueFish = new Set<string>()
        order.order_items.forEach((item: any) => {
          const fishName = item.fish_name || 'לא ידוע'
          uniqueFish.add(fishName)
        })
        
        uniqueFish.forEach(fishName => {
          const fishData = fishMap.get(fishName)
          if (fishData) {
            fishData.orderCount++
          }
        })
      }
    })
    
    return Array.from(fishMap.values()).sort((a, b) => b.orderCount - a.orderCount)
  }

  const downloadPDF = async () => {
    if (!selectedHoliday) return

    setGeneratingPDF(true)
    try {
      const fishSummary = generateHolidayFishSummary()
      
      console.log('Holiday Orders:', holidayOrders)
      console.log('Fish Summary:', fishSummary)
      
      const reportData: HolidayOrdersReportData = {
        holidayName: selectedHoliday.name,
        startDate: selectedHoliday.start_date,
        endDate: selectedHoliday.end_date,
        totalOrders: holidayOrders.length,
        fishOrders: fishSummary.map(fish => ({
          fishName: fish.fishName,
          totalQuantity: fish.isUnits ? fish.totalQuantity : fish.totalWeight,
          isUnits: fish.isUnits,
          orderCount: fish.orderCount
        }))
      }
      
      console.log('Report Data:', reportData)

      const pdfBlob = await pdfLibService.generateHolidayOrdersReport(reportData)
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

  const sendReportViaWhatsApp = async () => {
    if (!selectedHoliday) return

    setSendingWhatsApp(true)
    try {
      const fishSummary = generateHolidayFishSummary()
      
      let message = `🎉 *דוח הזמנות חג - דגי בקעת אונו*\n`
      message += `📅 חג: ${selectedHoliday.name}\n`
      message += `📊 תקופה: ${new Date(selectedHoliday.start_date).toLocaleDateString('he-IL')} - ${new Date(selectedHoliday.end_date).toLocaleDateString('he-IL')}\n\n`
      
      message += `📈 *סיכום כללי:*\n`
      message += `• סה"כ הזמנות לחג: ${holidayOrders.length}\n`
      message += `• לקוחות שהזמינו: ${new Set(holidayOrders.map(o => o.customer_name)).size}\n\n`
      
      if (fishSummary.length > 0) {
        message += `🐟 *סיכום דגים שהוזמנו:*\n`
        fishSummary.forEach(fish => {
          const quantity = fish.isUnits ? 
            `${Math.floor(fish.totalQuantity)} יח'` : 
            `${fish.totalWeight.toFixed(1)} ק"ג`
          message += `• ${fish.fishName}: ${quantity} (${fish.orderCount} הזמנות)\n`
        })
        message += `\n`
      }
      
      message += `🏪 דגי בקעת אונו`

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

  const handleHolidaySelect = (holiday: Holiday) => {
    setSelectedHoliday(holiday)
    fetchHolidayOrders(holiday)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4 space-x-reverse mb-4">
          <Link to="/admin/reports" className="text-primary-600 hover:text-primary-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">דוח הזמנות לחג</h1>
            <p className="text-gray-600">סיכום הזמנות שבוצעו לחג ספציפי - נשלח 7-10 ימים לפני החג</p>
          </div>
        </div>
      </div>

      {/* בחירת חג */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 text-primary-600 ml-2" />
          <h2 className="text-xl font-semibold">בחירת חג</h2>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white flex items-center justify-between text-right"
          >
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            <span className={selectedHoliday ? 'text-gray-900' : 'text-gray-500'}>
              {selectedHoliday 
                ? `${selectedHoliday.name} - ${new Date(selectedHoliday.start_date).toLocaleDateString('he-IL')} עד ${new Date(selectedHoliday.end_date).toLocaleDateString('he-IL')}` 
                : 'בחר חג...'
              }
            </span>
          </button>
          
          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {holidays.length === 0 ? (
                <div className="p-3 text-gray-500 text-center">אין חגים זמינים</div>
              ) : (
                holidays.map(holiday => (
                  <button
                    key={holiday.id}
                    onClick={() => {
                      handleHolidaySelect(holiday)
                      setDropdownOpen(false)
                    }}
                    className="w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {selectedHoliday?.id === holiday.id && (
                        <Check className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <span className="text-gray-900">
                      {holiday.name} - {new Date(holiday.start_date).toLocaleDateString('he-IL')} עד {new Date(holiday.end_date).toLocaleDateString('he-IL')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען הזמנות חג...</p>
        </div>
      )}

      {selectedHoliday && !loading && (
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

          {/* סיכום כללי */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-purple-600">סה"כ הזמנות</p>
                  <p className="text-3xl font-bold text-purple-900">{holidayOrders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-blue-600">לקוחות שהזמינו</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {new Set(holidayOrders.map(o => o.customer_name)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-green-600">ימים עד החג</p>
                  <p className="text-3xl font-bold text-green-900">
                    {Math.max(0, Math.ceil((new Date(selectedHoliday.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* סיכום דגים */}
          {generateHolidayFishSummary().length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-orange-600 ml-2" />
                <h2 className="text-xl font-semibold">סיכום דגים שהוזמנו לחג</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold">דג</th>
                      <th className="text-right py-3 px-4 font-semibold">כמות שהוזמנה</th>
                      <th className="text-right py-3 px-4 font-semibold">יחידת מדידה</th>
                      <th className="text-right py-3 px-4 font-semibold">מספר הזמנות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateHolidayFishSummary().map((fish, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{fish.fishName}</td>
                        <td className="py-3 px-4">
                          {fish.isUnits ? Math.floor(fish.totalQuantity) : fish.totalWeight.toFixed(1)}
                        </td>
                        <td className="py-3 px-4">
                          {fish.isUnits ? 'יחידות' : 'ק"ג'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {fish.orderCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* רשימת לקוחות */}
          {holidayOrders.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-green-600 ml-2" />
                <h2 className="text-xl font-semibold">רשימת לקוחות שהזמינו לחג</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {holidayOrders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="font-medium text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-600">{order.phone}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      איסוף: {order.delivery_date} {order.delivery_time}
                    </div>
                    <div className="text-xs text-gray-500">
                      הוזמן: {new Date(order.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {holidayOrders.length === 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
              <p className="text-gray-500 text-lg">לא נמצאו הזמנות לחג זה</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminHolidayOrdersReport