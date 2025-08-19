import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import EmailService from '../../lib/emailService'
import { ArrowLeft, Download, Mail, Calendar, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'

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
  const [sendingEmail, setSendingEmail] = useState(false)

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

  const downloadCSV = () => {
    try {
      const csvData = EmailService.generateOrdersCSV(stats.todayOrders)
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `daily-report-${selectedDate}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error generating CSV:', error)
      alert('שגיאה ביצירת קובץ CSV')
    }
  }

  const sendDailyReport = async () => {
    setSendingEmail(true)
    try {
      const csvData = EmailService.generateOrdersCSV(stats.todayOrders)
      const reportTemplate = EmailService.generateDailyReportEmail(stats.todayOrders, csvData)
      
      // Try to send via API endpoint first, then fallback to mock
      const emailSent = await EmailService.sendEmail(
        'triroars@gmail.com',
        reportTemplate,
        'admin'
      )

      if (emailSent) {
        alert('דוח יומי נשלח בהצלחה למייל!')
        console.log('📧 Daily report email sent successfully')
        // כאן במימוש אמיתי נשלח גם את קובץ ה-CSV
        console.log('📎 CSV data:', csvData.substring(0, 200) + '...')
      } else {
        alert('שגיאה בשליחת הדוח')
      }
    } catch (error) {
      console.error('Error sending daily report:', error)
      alert('שגיאה בשליחת הדוח')
    } finally {
      setSendingEmail(false)
    }
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
                onClick={downloadCSV}
                className="btn-secondary flex items-center space-x-2 space-x-reverse w-full md:w-auto"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
                <span>הורד CSV</span>
              </button>
              <button
                onClick={sendDailyReport}
                disabled={sendingEmail || loading}
                className="btn-primary flex items-center space-x-2 space-x-reverse disabled:opacity-50 w-full md:w-auto"
              >
                <Mail className="w-4 h-4" />
                <span>{sendingEmail ? 'שולח...' : 'שלח דוח במייל'}</span>
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