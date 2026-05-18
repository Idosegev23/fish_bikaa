import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Order } from '../../lib/supabase'
import { pdfLibService } from '../../lib/pdfLibService'
import type { BusinessActivityReportData } from '../../lib/pdfLibService'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { FileText, MessageCircle, TrendingUp, BarChart3, Users, Calendar, ArrowLeft, Package, Clock, ShoppingCart } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

interface ActivityData {
  date: string
  orders: number
  customers: number
}

interface FishActivityData {
  fishName: string
  orders: number
  quantity: number
  percentage: number
}

interface MonthlyStats {
  totalOrders: number
  totalCustomers: number
  averageOrdersPerDay: number
  bestDay: { date: string; orders: number }
  topFish: FishActivityData[]
  holidayOrdersCount: number
  regularOrdersCount: number
  peakHours: { hour: string; orders: number }[]
  customerRetention: number
}

const AdminRevenueReport: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  )
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [stats, setStats] = useState<MonthlyStats | null>(null)

  useEffect(() => {
    fetchMonthlyData()
  }, [selectedMonth])

  const fetchMonthlyData = async () => {
    setLoading(true)
    try {
      const startOfMonth = `${selectedMonth}-01`
      const endOfMonth = new Date(new Date(selectedMonth).getFullYear(), new Date(selectedMonth).getMonth() + 1, 0)
        .toISOString().slice(0, 10)

      const { data } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: true })

      const monthlyOrders = data || []
      setOrders(monthlyOrders)
      calculateStats(monthlyOrders)
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (monthlyOrders: Order[]) => {
    const totalOrders = monthlyOrders.length
    const uniqueCustomers = new Set(monthlyOrders.map(order => order.customer_name)).size
    
    // ספירת ימי עבודה בחודש
    const startOfMonth = new Date(selectedMonth + '-01')
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0)
    const workingDays = endOfMonth.getDate()
    
    const averageOrdersPerDay = workingDays > 0 ? totalOrders / workingDays : 0

    // מציאת היום העמוס ביותר
    const dailyOrders: { [date: string]: number } = {}
    monthlyOrders.forEach(order => {
      const date = order.created_at.slice(0, 10)
      if (!dailyOrders[date]) dailyOrders[date] = 0
      dailyOrders[date]++
    })

    const bestDay = Object.entries(dailyOrders)
      .sort(([,a], [,b]) => b - a)[0] || ['', 0]

    // דגים פופולריים
    const fishActivity: { [fish: string]: { orders: number; quantity: number } } = {}
    monthlyOrders.forEach(order => {
      if (Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const fishName = item.fish_name || 'לא ידוע'
          if (!fishActivity[fishName]) {
            fishActivity[fishName] = { orders: 0, quantity: 0 }
          }
          fishActivity[fishName].orders++
          fishActivity[fishName].quantity += Number(item.quantity_kg || item.quantity || 0)
        })
      }
    })

    const topFish = Object.entries(fishActivity)
      .map(([fishName, data]) => ({
        fishName,
        orders: data.orders,
        quantity: data.quantity,
        percentage: totalOrders > 0 ? (data.orders / totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)

    // הזמנות חג לעומת רגילות
    const holidayOrders = monthlyOrders.filter(order => order.is_holiday_order).length
    const regularOrders = totalOrders - holidayOrders

    // שעות שיא
    const hourlyOrders: { [hour: string]: number } = {}
    monthlyOrders.forEach(order => {
      const hour = new Date(order.created_at).getHours()
      const hourString = `${hour}:00`
      if (!hourlyOrders[hourString]) hourlyOrders[hourString] = 0
      hourlyOrders[hourString]++
    })

    const peakHours = Object.entries(hourlyOrders)
      .map(([hour, orders]) => ({ hour, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 3)

    // שימור לקוחות (לקוחות שהזמינו יותר מפעם אחת)
    const customerOrderCount: { [customer: string]: number } = {}
    monthlyOrders.forEach(order => {
      if (!customerOrderCount[order.customer_name]) {
        customerOrderCount[order.customer_name] = 0
      }
      customerOrderCount[order.customer_name]++
    })

    const returningCustomers = Object.values(customerOrderCount).filter(count => count > 1).length
    const customerRetention = uniqueCustomers > 0 ? (returningCustomers / uniqueCustomers) * 100 : 0

    setStats({
      totalOrders,
      totalCustomers: uniqueCustomers,
      averageOrdersPerDay,
      bestDay: { date: bestDay[0], orders: bestDay[1] as number },
      topFish,
      holidayOrdersCount: holidayOrders,
      regularOrdersCount: regularOrders,
      peakHours,
      customerRetention
    })
  }

  const getDailyActivityData = (): ActivityData[] => {
    const dailyData: { [date: string]: { orders: number; customers: Set<string> } } = {}
    
    orders.forEach(order => {
      const date = order.created_at.slice(0, 10)
      if (!dailyData[date]) {
        dailyData[date] = { orders: 0, customers: new Set() }
      }
      dailyData[date].orders++
      dailyData[date].customers.add(order.customer_name)
    })

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('he-IL'),
        orders: data.orders,
        customers: data.customers.size
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // גרף הזמנות יומי
  const getOrdersChartData = () => {
    const dailyData = getDailyActivityData()
    return {
      labels: dailyData.map(item => item.date),
      datasets: [
        {
          label: 'הזמנות',
          data: dailyData.map(item => item.orders),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
        }
      ]
    }
  }

  // גרף דגים פופולריים
  const getTopFishChartData = () => {
    if (!stats || !stats.topFish.length) return { labels: [], datasets: [] }
    
    const colors = [
      'rgba(239, 68, 68, 0.8)',   // אדום
      'rgba(34, 197, 94, 0.8)',   // ירוק
      'rgba(59, 130, 246, 0.8)',  // כחול
      'rgba(245, 158, 11, 0.8)',  // צהוב
      'rgba(168, 85, 247, 0.8)'   // סגול
    ]
    
    return {
      labels: stats.topFish.map(fish => fish.fishName),
      datasets: [
        {
          data: stats.topFish.map(fish => fish.orders),
          backgroundColor: colors.slice(0, stats.topFish.length),
          borderWidth: 2,
        }
      ]
    }
  }

  // גרף השוואת חג לרגיל
  const getHolidayVsRegularChartData = () => {
    if (!stats) return { labels: [], datasets: [] }
    
    return {
      labels: ['הזמנות רגילות', 'הזמנות חג'],
      datasets: [
        {
          data: [stats.regularOrdersCount, stats.holidayOrdersCount],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // ירוק לרגיל
            'rgba(245, 158, 11, 0.8)'   // כתום לחג
          ],
          borderWidth: 2,
        }
      ]
    }
  }

  const downloadPDF = async () => {
    if (!stats) return

    setGeneratingPDF(true)
    try {
      const monthName = new Date(selectedMonth).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
      
      const reportData: BusinessActivityReportData = {
        month: monthName,
        totalOrders: stats.totalOrders,
        totalCustomers: stats.totalCustomers,
        averageOrdersPerDay: stats.averageOrdersPerDay,
        bestDay: stats.bestDay,
        topFish: stats.topFish,
        holidayOrdersCount: stats.holidayOrdersCount,
        regularOrdersCount: stats.regularOrdersCount,
        peakHours: stats.peakHours,
        customerRetention: stats.customerRetention
      }

      const pdfBlob = await pdfLibService.generateBusinessActivityReport(reportData)
      const filename = `דוח-פעילות-עסקית-${monthName.replace(/\s/g, '-')}.pdf`
      
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
    if (!stats) return

    setSendingWhatsApp(true)
    try {
      const monthName = new Date(selectedMonth).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
      
      let message = `📊 *דוח פעילות עסקית - דגי בקעת אונו*\n`
      message += `📅 חודש: ${monthName}\n\n`
      
      message += `📈 *סיכום פעילות:*\n`
      message += `• סה"כ הזמנות: ${stats.totalOrders}\n`
      message += `• לקוחות פעילים: ${stats.totalCustomers}\n`
      message += `• ממוצע הזמנות ליום: ${stats.averageOrdersPerDay.toFixed(1)}\n`
      message += `• שימור לקוחות: ${stats.customerRetention.toFixed(1)}%\n\n`
      
      if (stats.bestDay.date) {
        message += `🏆 *היום העמוס ביותר:*\n`
        message += `${new Date(stats.bestDay.date).toLocaleDateString('he-IL')} - ${stats.bestDay.orders} הזמנות\n\n`
      }
      
      message += `🎉 *סוגי הזמנות:*\n`
      message += `• הזמנות רגילות: ${stats.regularOrdersCount}\n`
      message += `• הזמנות חג: ${stats.holidayOrdersCount}\n\n`
      
      if (stats.topFish.length > 0) {
        message += `🐟 *דגים פופולריים:*\n`
        stats.topFish.slice(0, 3).forEach((fish, index) => {
          message += `${index + 1}. ${fish.fishName}: ${fish.orders} הזמנות (${fish.percentage.toFixed(1)}%)\n`
        })
        message += `\n`
      }

      if (stats.peakHours.length > 0) {
        message += `⏰ *שעות שיא:*\n`
        stats.peakHours.forEach((hour, index) => {
          message += `${index + 1}. ${hour.hour}: ${hour.orders} הזמנות\n`
        })
        message += `\n`
      }
      
      message += `📊 לדוח מלא עם גרפים - הורד PDF מהמערכת\n`
      message += `🏪 דגי בקעת אונו`

      const adminPhone = import.meta.env.VITE_ADMIN_PHONE
      if (!adminPhone) { alert('מספר טלפון מנהל לא הוגדר (VITE_ADMIN_PHONE)'); return }
      await sendWhatsAppMessage(adminPhone, message)
      alert('דוח נשלח בוואטסאפ בהצלחה')

    } catch (error) {
      console.error('Error sending WhatsApp:', error)
      alert('❌ שגיאה בשליחת הדוח')
    } finally {
      setSendingWhatsApp(false)
    }
  }



  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4 space-x-reverse mb-4">
          <Link to="/admin/reports" className="text-primary-600 hover:text-primary-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">דוח פעילות עסקית</h1>
            <p className="text-gray-600">ניתוח עסקי מפורט - הזמנות, מגמות ודגים פופולריים - נשלח כל 1 לחודש</p>
          </div>
        </div>
      </div>

      {/* בחירת חודש */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 text-primary-600 ml-2" />
          <h2 className="text-xl font-semibold">בחירת חודש</h2>
        </div>
        
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני הכנסות...</p>
        </div>
      )}

      {stats && !loading && (
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

          {/* סיכום פעילות */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-blue-600">סה"כ הזמנות</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-green-600">לקוחות פעילים</p>
                  <p className="text-3xl font-bold text-green-900">
                    {new Set(orders.map(o => o.customer_name)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-purple-500 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-purple-600">יום עמוס ביותר</p>
                  <p className="text-lg font-bold text-purple-900">
                    {stats.bestDay ? new Date(stats.bestDay.date).toLocaleDateString('he-IL') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-orange-600">שימור לקוחות</p>
                  <p className="text-lg font-bold text-orange-900">
                    {stats.customerRetention.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.bestDay.date ? new Date(stats.bestDay.date).toLocaleDateString('he-IL') : 'אין נתונים'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* גרף פעילות יומית */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h2 className="text-xl font-semibold mb-4">פעילות יומית - הזמנות</h2>
            <div className="h-80">
              <Line 
                data={getOrdersChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: true,
                      text: 'מגמת הזמנות יומית'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'מספר הזמנות'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'תאריך'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* פילוח דגים */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* טבלת דגים פופולריים */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">דגים פופולריים</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold">דג</th>
                      <th className="text-right py-3 px-4 font-semibold">הזמנות</th>
                      <th className="text-right py-3 px-4 font-semibold">כמות</th>
                      <th className="text-right py-3 px-4 font-semibold">אחוז</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topFish.map((fish, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{fish.fishName}</td>
                        <td className="py-3 px-4">{fish.orders}</td>
                        <td className="py-3 px-4">{fish.quantity.toFixed(1)}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {fish.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* גרף עוגה - דגים פופולריים */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">התפלגות הזמנות לפי דגים</h2>
              <div className="h-64">
                <Doughnut 
                  data={getTopFishChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                      title: {
                        display: true,
                        text: 'דגים פופולריים'
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* גרפים נוספים */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* השוואת חג לרגיל */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">השוואת סוגי הזמנות</h2>
              <div className="h-64">
                <Doughnut 
                  data={getHolidayVsRegularChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                      title: {
                        display: true,
                        text: 'חג לעומת רגיל'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* שעות שיא */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">שעות שיא</h2>
              <div className="space-y-4">
                {stats.peakHours.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="mr-3 font-medium">{hour.hour}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                      <span className="text-lg font-bold">{hour.orders} הזמנות</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* סיכום נוסף */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">תובנות עסקיות</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Package className="w-8 h-8 text-blue-600 ml-3" />
                  <div>
                    <p className="text-sm text-blue-600">הזמנות חג</p>
                    <p className="text-xl font-bold text-blue-900">{stats.holidayOrdersCount}</p>
                    <p className="text-xs text-blue-500">
                      {stats.totalOrders > 0 ? ((stats.holidayOrdersCount / stats.totalOrders) * 100).toFixed(1) : 0}% מכלל ההזמנות
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ShoppingCart className="w-8 h-8 text-green-600 ml-3" />
                  <div>
                    <p className="text-sm text-green-600">הזמנות רגילות</p>
                    <p className="text-xl font-bold text-green-900">{stats.regularOrdersCount}</p>
                    <p className="text-xs text-green-500">
                      {stats.totalOrders > 0 ? ((stats.regularOrdersCount / stats.totalOrders) * 100).toFixed(1) : 0}% מכלל ההזמנות
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-purple-600 ml-3" />
                  <div>
                    <p className="text-sm text-purple-600">ממוצע הזמנות ליום</p>
                    <p className="text-xl font-bold text-purple-900">{stats.averageOrdersPerDay.toFixed(1)}</p>
                    <p className="text-xs text-purple-500">בחודש הנבחר</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-orange-600 ml-3" />
                  <div>
                    <p className="text-sm text-orange-600">שימור לקוחות</p>
                    <p className="text-xl font-bold text-orange-900">{stats.customerRetention.toFixed(1)}%</p>
                    <p className="text-xs text-orange-500">הזמינו יותר מפעם אחת</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminRevenueReport