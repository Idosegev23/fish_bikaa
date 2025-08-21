import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Order } from '../../lib/supabase'
import { pdfLibService } from '../../lib/pdfLibService'
import type { DailyReportData } from '../../lib/pdfLibService'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { DollarSign, FileText, MessageCircle, TrendingUp, BarChart3, Users, Calendar, ArrowLeft } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

interface FishRevenueData {
  fishName: string
  revenue: number
  orders: number
  percentage: number
}

interface MonthlyStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  bestDay: { date: string; revenue: number }
  topFish: FishRevenueData[]
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
    const totalRevenue = monthlyOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)
    const totalOrders = monthlyOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // מציאת היום הטוב ביותר
    const dailyRevenue: { [date: string]: number } = {}
    monthlyOrders.forEach(order => {
      const date = order.created_at.slice(0, 10)
      if (!dailyRevenue[date]) dailyRevenue[date] = 0
      dailyRevenue[date] += Number(order.total_price || 0)
    })

    const bestDay = Object.entries(dailyRevenue)
      .sort(([,a], [,b]) => b - a)[0] || ['', 0]

    // דגים פופולריים
    const fishRevenue: { [fish: string]: { revenue: number; orders: number } } = {}
    monthlyOrders.forEach(order => {
      if (Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const fishName = item.fish_name || 'לא ידוע'
          if (!fishRevenue[fishName]) {
            fishRevenue[fishName] = { revenue: 0, orders: 0 }
          }
          fishRevenue[fishName].revenue += Number(item.price || 0)
          fishRevenue[fishName].orders++
        })
      }
    })

    const topFish = Object.entries(fishRevenue)
      .map(([fishName, data]) => ({
        fishName,
        revenue: data.revenue,
        orders: data.orders,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    setStats({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      bestDay: { date: bestDay[0], revenue: bestDay[1] as number },
      topFish
    })
  }

  const getDailyRevenueData = (): RevenueData[] => {
    const dailyData: { [date: string]: { revenue: number; orders: number } } = {}
    
    orders.forEach(order => {
      const date = order.created_at.slice(0, 10)
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, orders: 0 }
      }
      dailyData[date].revenue += Number(order.total_price || 0)
      dailyData[date].orders++
    })

    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('he-IL'),
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const downloadPDF = async () => {
    if (!stats) return

    setGeneratingPDF(true)
    try {
      const reportData: DailyReportData = {
        date: new Date().toISOString(),
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        orders: orders,
        fishSummary: stats.topFish.map(fish => ({
          fishName: fish.fishName,
          totalQuantity: fish.orders,
          totalWeight: fish.revenue,
          isUnits: true // נשתמש בזה להצגת הכנסות
        }))
      }

      const pdfBlob = await pdfLibService.generateDailyReport(reportData)
      const monthName = new Date(selectedMonth).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
      const filename = `דוח-הכנסות-${monthName.replace(/\s/g, '-')}.pdf`
      
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
      
      let message = `💰 *דוח הכנסות חודשי - דגי בקעת אונו*\n`
      message += `📅 חודש: ${monthName}\n\n`
      
      message += `📈 *סיכום כספי:*\n`
      message += `• סה"כ הכנסות: ₪${stats.totalRevenue.toFixed(0)}\n`
      message += `• סה"כ הזמנות: ${stats.totalOrders}\n`
      message += `• ממוצע הזמנה: ₪${stats.averageOrderValue.toFixed(0)}\n\n`
      
      if (stats.bestDay.date) {
        message += `🏆 *היום הטוב ביותר:*\n`
        message += `${new Date(stats.bestDay.date).toLocaleDateString('he-IL')} - ₪${stats.bestDay.revenue.toFixed(0)}\n\n`
      }
      
      if (stats.topFish.length > 0) {
        message += `🐟 *דגים מובילים:*\n`
        stats.topFish.slice(0, 3).forEach((fish, index) => {
          message += `${index + 1}. ${fish.fishName}: ₪${fish.revenue.toFixed(0)} (${fish.percentage.toFixed(1)}%)\n`
        })
        message += `\n`
      }
      
      message += `📊 לדוח מלא עם גרפים - הורד PDF מהמערכת\n`
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

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
                  <p className="text-sm font-medium text-orange-600">היום הטוב ביותר</p>
                  <p className="text-lg font-bold text-orange-900">
                    ₪{stats.bestDay.revenue.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.bestDay.date ? new Date(stats.bestDay.date).toLocaleDateString('he-IL') : 'אין נתונים'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* גרף הכנסות יומי */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h2 className="text-xl font-semibold mb-4">הכנסות יומיות</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDailyRevenueData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? `₪${value.toFixed(0)}` : value,
                      name === 'revenue' ? 'הכנסות' : 'הזמנות'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="הכנסות" strokeWidth={2} />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="הזמנות" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* פילוח דגים */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* טבלת דגים מובילים */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">דגים מובילים</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold">דג</th>
                      <th className="text-right py-3 px-4 font-semibold">הכנסות</th>
                      <th className="text-right py-3 px-4 font-semibold">הזמנות</th>
                      <th className="text-right py-3 px-4 font-semibold">אחוז</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topFish.map((fish, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{fish.fishName}</td>
                        <td className="py-3 px-4">₪{fish.revenue.toFixed(0)}</td>
                        <td className="py-3 px-4">{fish.orders}</td>
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

            {/* גרף עוגה */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">התפלגות הכנסות לפי דגים</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.topFish}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.fishName}: ${entry.percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {stats.topFish.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₪${value.toFixed(0)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminRevenueReport