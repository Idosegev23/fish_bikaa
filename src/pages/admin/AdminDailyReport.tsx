import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import { pdfService, type DailyReportData } from '../../lib/pdfService'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { ArrowLeft, Download, MessageCircle, Calendar, TrendingUp, DollarSign, ShoppingCart, FileText } from 'lucide-react'

interface DailyStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  popularFish: Array<{ name: string; count: number }>
  todayOrders: any[]
}

export default function AdminDailyReport() {
  const [stats, setStats] = useState<DailyStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    popularFish: [],
    todayOrders: []
  })
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    fetchDailyReport()
  }, [selectedDate])

  const fetchDailyReport = async () => {
    setLoading(true)
    try {
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      // טעינת הזמנות היום
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const todayOrders = orders || []
      const totalRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total_price), 0)
      const averageOrderValue = todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0

      // ניתוח דגים פופולריים
      const fishCount: { [key: string]: number } = {}
      todayOrders.forEach(order => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const fishName = item.fish_name || item.fish || 'לא ידוע'
            fishCount[fishName] = (fishCount[fishName] || 0) + 1
          })
        }
      })

      const popularFish = Object.entries(fishCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setStats({
        totalOrders: todayOrders.length,
        totalRevenue,
        averageOrderValue,
        popularFish,
        todayOrders
      })

    } catch (error) {
      console.error('Error fetching daily report:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateFishSummary = () => {
    const fishMap = new Map()
    
    stats.todayOrders.forEach(order => {
      if (Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const fishName = item.fish_name || 'לא ידוע'
          const quantity = item.quantity_kg || item.quantity || 0
          const isUnits = item.unit_based || false
          
          if (!fishMap.has(fishName)) {
            fishMap.set(fishName, {
              fishName,
              totalQuantity: 0,
              totalWeight: 0,
              isUnits
            })
          }
          
          const fishData = fishMap.get(fishName)
          if (isUnits) {
            fishData.totalQuantity += quantity
          } else {
            fishData.totalWeight += quantity
          }
        })
      }
    })
    
    return Array.from(fishMap.values())
  }

  const downloadPDF = async () => {
    setGeneratingPDF(true)
    try {
      const reportData: DailyReportData = {
        date: selectedDate,
        orders: stats.todayOrders,
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        fishSummary: generateFishSummary()
      }
      
      const pdfBlob = await pdfService.generateDailyReport(reportData)
      const filename = `דוח-יומי-${new Date(selectedDate).toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`
      
      pdfService.downloadPDF(pdfBlob, filename)
      alert('✅ הדוח הורד בהצלחה!')
    } catch (error) {
      alert('❌ שגיאה ביצירת הדוח')
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const sendReportViaWhatsApp = async () => {
    setSendingWhatsApp(true)
    try {
      // יצירת הודעת טקסט מקוצרת
      const message = createWhatsAppReportMessage()
      
      // שליחת הודעה (צריך מספר אדמין)
      const adminPhone = import.meta.env.VITE_ADMIN_PHONE
      if (!adminPhone) {
        alert('❌ מספר אדמין לא מוגדר')
        return
      }
      
      await sendWhatsAppMessage(adminPhone, message)
      alert('✅ הדוח נשלח בוואטסאפ!')
    } catch (error) {
      alert('❌ שגיאה בשליחת הדוח')
      console.error('Error sending WhatsApp report:', error)
    } finally {
      setSendingWhatsApp(false)
    }
  }
  
  const createWhatsAppReportMessage = () => {
    const dateStr = new Date(selectedDate).toLocaleDateString('he-IL')
    const fishSummary = generateFishSummary()
    
    let message = `📊 *דוח יומי - דגי בקעת אונו*\n`
    message += `📅 תאריך: ${dateStr}\n\n`
    message += `📈 *סיכום כללי:*\n`
    message += `• סה"כ הזמנות: ${stats.totalOrders}\n`
    message += `• הזמנות שהושלמו: ${stats.todayOrders.filter(o => o.status === 'completed').length}\n`
    message += `• הזמנות בהכנה: ${stats.todayOrders.filter(o => o.status === 'pending' || o.status === 'weighing').length}\n\n`
    
    if (fishSummary.length > 0) {
      message += `🐟 *סיכום דגים:*\n`
      fishSummary.forEach(fish => {
        const quantity = fish.isUnits ? `${fish.totalQuantity} יח׳` : `${fish.totalWeight.toFixed(1)} ק"ג`
        message += `• ${fish.fishName}: ${quantity}\n`
      })
      message += `\n`
    }
    
    message += `📱 *הודעה אוטומטית ממערכת ההזמנות*\n`
    message += `💾 לדוח מפורט יותר, הורידו קובץ PDF מהמערכת`
    
    return message
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">דוח יומי</h1>
                <p className="text-gray-600">סיכום הזמנות והכנסות יומיות</p>
              </div>
            </div>
            <div className="flex space-x-3 space-x-reverse w-full md:w-auto">
              <button
                onClick={downloadPDF}
                disabled={generatingPDF || loading}
                className="btn-secondary flex items-center space-x-2 space-x-reverse w-full md:w-auto disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{generatingPDF ? 'יוצר PDF...' : 'הורד דוח PDF'}</span>
              </button>
              <button
                onClick={sendReportViaWhatsApp}
                disabled={sendingWhatsApp || loading}
                className="btn-primary flex items-center space-x-2 space-x-reverse disabled:opacity-50 w-full md:w-auto"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{sendingWhatsApp ? 'שולח...' : 'שלח בוואטסאפ'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Date Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Calendar className="w-5 h-5 text-gray-500" />
            <label className="font-medium text-gray-700">בחר תאריך:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field w-auto"
              max={new Date().toISOString().split('T')[0]}
            />
            <button
              onClick={fetchDailyReport}
              disabled={loading}
              className="btn-secondary disabled:opacity-50"
            >
              {loading ? 'טוען...' : 'עדכן דוח'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-blue-600">הזמנות היום</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-green-500 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-green-600">הכנסות היום</p>
                    <p className="text-3xl font-bold text-green-900">₪{stats.totalRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="mr-4">
                    <p className="text-sm font-medium text-purple-600">ממוצע הזמנה</p>
                    <p className="text-3xl font-bold text-purple-900">₪{stats.averageOrderValue.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Fish */}
            {stats.popularFish.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">דגים פופולריים היום</h3>
                <div className="space-y-3">
                  {stats.popularFish.map((fish, index) => (
                    <div key={fish.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold ml-3">
                          {index + 1}
                        </span>
                        <span className="font-medium">{fish.name}</span>
                      </div>
                      <span className="text-gray-600">{fish.count} הזמנות</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  הזמנות ב-{new Date(selectedDate).toLocaleDateString('he-IL')}
                </h3>
              </div>

              {stats.todayOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">לא נמצאו הזמנות לתאריך זה</p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="md:hidden p-4 space-y-4">
                    {stats.todayOrders.map((order) => (
                      <div key={order.id} className="card">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-neutral-500">
                              {new Date(order.created_at).toLocaleTimeString('he-IL')}
                            </div>
                            <div className="font-semibold text-neutral-900 mt-1">{order.customer_name}</div>
                            <div className="text-sm text-neutral-600">{order.phone} • {order.email}</div>
                          </div>
                          <div className="text-primary-700 font-bold">₪{Number(order.total_price).toFixed(2)}</div>
                        </div>
                        <div className="mt-3 text-sm text-neutral-600">
                          איסוף: {order.delivery_date} {order.delivery_time}
                        </div>
                        <div className="mt-3 border-t border-neutral-200 pt-3 space-y-1">
                          {Array.isArray(order.order_items) ? (
                            order.order_items.map((item: any, index: number) => (
                              <div key={index} className="text-sm flex justify-between">
                                <span className="text-neutral-700">{item.fish_name} • {item.cut}</span>
                                <span className="text-neutral-500">{item.quantity_kg} ק"ג</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-neutral-500">פרטי פריטים לא זמינים</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">זמן</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">לקוח</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">טלפון</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פריטים</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סה"כ</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">איסוף</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.todayOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(order.created_at).toLocaleTimeString('he-IL')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.phone}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {Array.isArray(order.order_items) 
                                ? order.order_items.map((item: any, index: number) => (
                                    <div key={index} className="text-xs">
                                      {item.fish_name} ({item.cut}) - {item.quantity_kg}ק"ג
                                    </div>
                                  ))
                                : 'לא זמין'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              ₪{order.total_price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.delivery_date} {order.delivery_time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>

      <AdminBottomNav />
    </div>
  )
} 