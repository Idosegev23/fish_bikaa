import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Fish, ShoppingCart, DollarSign, TrendingUp, Package, Users, Scissors, Scale, Monitor, Calendar, FileText, Tag } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalFishTypes: number
  pendingOrders: number
}

interface PopularFish {
  name: string
  orders: number
  revenue: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
  orders: number
}

interface CutTypeStats {
  name: string
  count: number
  percentage: number
}

interface OrderStatusStats {
  status: string
  count: number
  color: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalFishTypes: 0,
    pendingOrders: 0
  })
  const [popularFish, setPopularFish] = useState<PopularFish[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [cutTypeStats, setCutTypeStats] = useState<CutTypeStats[]>([])
  const [orderStatusStats, setOrderStatusStats] = useState<OrderStatusStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchPopularFish(),
        fetchMonthlyRevenue(),
        fetchCutTypeStats(),
        fetchOrderStatusStats()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    const [ordersResult, fishResult] = await Promise.all([
      supabase.from('orders').select('total_price, created_at'),
      supabase.from('fish_types').select('id').eq('is_active', true)
    ])

    if (ordersResult.data) {
      const totalOrders = ordersResult.data.length
      const totalRevenue = ordersResult.data.reduce((sum, order) => sum + Number(order.total_price), 0)
      
      // הזמנות היום האחרון
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const pendingOrders = ordersResult.data.filter(
        order => new Date(order.created_at) > yesterday
      ).length

      setStats({
        totalOrders,
        totalRevenue,
        totalFishTypes: fishResult.data?.length || 0,
        pendingOrders
      })
    }
  }

  const fetchPopularFish = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('order_items, total_price')

      if (orders && orders.length > 0) {
        const fishStats: { [key: string]: { orders: number; revenue: number } } = {}
        
        orders.forEach(order => {
          if (order.order_items && Array.isArray(order.order_items)) {
            order.order_items.forEach((item: any) => {
              const fishName = item.fish_name || item.fish || 'לא ידוע'
              const itemPrice = item.price || (item.quantity_kg * item.price_per_kg) || 0
              
              if (!fishStats[fishName]) {
                fishStats[fishName] = { orders: 0, revenue: 0 }
              }
              fishStats[fishName].orders += 1
              fishStats[fishName].revenue += itemPrice
            })
          }
        })

        const popularFishData = Object.entries(fishStats)
          .map(([name, stats]) => ({
            name,
            orders: stats.orders,
            revenue: Math.round(stats.revenue)
          }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 6)

        if (popularFishData.length > 0) {
          setPopularFish(popularFishData)
        } else {
          // אם אין נתונים, הצג הודעה מתאימה
          setPopularFish([{ name: 'אין נתונים זמינים', orders: 0, revenue: 0 }])
        }
      } else {
        // אין הזמנות במערכת
        setPopularFish([{ name: 'אין הזמנות עדיין', orders: 0, revenue: 0 }])
      }
    } catch (error) {
      console.error('Error fetching popular fish:', error)
      setPopularFish([{ name: 'שגיאה בטעינת נתונים', orders: 0, revenue: 0 }])
    }
  }

  const fetchMonthlyRevenue = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_price, created_at')
        .order('created_at', { ascending: true })

      if (orders && orders.length > 0) {
        const monthlyData: { [key: string]: { revenue: number; orders: number } } = {}
        
        orders.forEach(order => {
          const date = new Date(order.created_at)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, orders: 0 }
          }
          
          monthlyData[monthKey].revenue += Number(order.total_price) || 0
          monthlyData[monthKey].orders += 1
        })

        const monthlyRevenueData = Object.entries(monthlyData)
          .map(([month, data]) => ({
            month: formatMonth(month),
            revenue: Math.round(data.revenue),
            orders: data.orders
          }))
          .slice(-6) // 6 חודשים אחרונים

        if (monthlyRevenueData.length > 0) {
          setMonthlyRevenue(monthlyRevenueData)
        } else {
          setMonthlyRevenue([{ month: 'אין נתונים', revenue: 0, orders: 0 }])
        }
      } else {
        // אין הזמנות במערכת
        setMonthlyRevenue([{ month: 'אין הזמנות עדיין', revenue: 0, orders: 0 }])
      }
    } catch (error) {
      console.error('Error fetching monthly revenue:', error)
      setMonthlyRevenue([{ month: 'שגיאה בטעינת נתונים', revenue: 0, orders: 0 }])
    }
  }

  const fetchCutTypeStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('order_items')

      if (orders && orders.length > 0) {
        const cutStats: { [key: string]: number } = {}
        let totalCuts = 0
        
        orders.forEach(order => {
          if (order.order_items && Array.isArray(order.order_items)) {
            order.order_items.forEach((item: any) => {
              const cutType = item.cut || item.cut_type || 'לא ידוע'
              cutStats[cutType] = (cutStats[cutType] || 0) + 1
              totalCuts++
            })
          }
        })

        if (totalCuts > 0) {
          const cutTypeData = Object.entries(cutStats)
            .map(([name, count]) => ({
              name,
              count,
              percentage: Math.round((count / totalCuts) * 100)
            }))
            .sort((a, b) => b.count - a.count)

          setCutTypeStats(cutTypeData)
        } else {
          setCutTypeStats([{ name: 'אין נתונים זמינים', count: 0, percentage: 0 }])
        }
      } else {
        // אין הזמנות במערכת
        setCutTypeStats([{ name: 'אין הזמנות עדיין', count: 0, percentage: 0 }])
      }
    } catch (error) {
      console.error('Error fetching cut type stats:', error)
      setCutTypeStats([{ name: 'שגיאה בטעינת נתונים', count: 0, percentage: 0 }])
    }
  }

  const fetchOrderStatusStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at')

      if (orders && orders.length > 0) {
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const todayOrders = orders.filter(order => new Date(order.created_at) > oneDayAgo).length
        const weekOrders = orders.filter(order => new Date(order.created_at) > oneWeekAgo).length
        const monthOrders = orders.filter(order => new Date(order.created_at) > oneMonthAgo).length
        const olderOrders = orders.length - monthOrders

        setOrderStatusStats([
          { status: 'היום', count: todayOrders, color: '#FF6B6B' },
          { status: 'השבוע', count: weekOrders - todayOrders, color: '#4ECDC4' },
          { status: 'החודש', count: monthOrders - weekOrders, color: '#45B7D1' },
          { status: 'ישנות יותר', count: olderOrders, color: '#96CEB4' }
        ])
      } else {
        // אין הזמנות במערכת
        setOrderStatusStats([
          { status: 'אין הזמנות עדיין', count: 0, color: '#CCCCCC' }
        ])
      }
    } catch (error) {
      console.error('Error fetching order status stats:', error)
      setOrderStatusStats([
        { status: 'שגיאה בטעינת נתונים', count: 0, color: '#FF0000' }
      ])
    }
  }

  const formatMonth = (monthKey: string): string => {
    const [year, month] = monthKey.split('-')
    const monthNames = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">דשבורד אדמין</h1>
              <p className="text-gray-600">ברוכים הבאים למערכת ניהול דגי בקעת אונו</p>
            </div>
            <Link to="/" className="btn-secondary">
              לאתר הראשי
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Mobile quick actions (condensed) */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
          <button
            disabled
            className="bg-gray-400 cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 opacity-60"
            title="תכונה זו עדיין לא זמינה"
          >
            <Scale className="w-4 h-4" />
            מסך מטבח
            <span className="text-xs">(בקרוב)</span>
          </button>
          <Link to="/admin/orders" className="btn-secondary w-full text-sm">הזמנות</Link>
          <Link to="/admin/fish" className="btn-secondary w-full text-sm">דגים</Link>
          <Link to="/admin/additional-products" className="btn-secondary w-full text-sm">מוצרים משלימים</Link>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="bg-blue-500 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-blue-600">סה"כ הזמנות</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-green-600">הכנסות כוללות</p>
                <p className="text-2xl font-bold text-green-900">₪{stats.totalRevenue.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <div className="bg-purple-500 p-3 rounded-lg">
                <Fish className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-purple-600">סוגי דגים פעילים</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalFishTypes}</p>
              </div>
            </div>
          </div>

          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center">
              <div className="bg-orange-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-orange-600">הזמנות 24 שעות</p>
                <p className="text-2xl font-bold text-orange-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Display Button - Disabled */}
        <div className="mb-8">
          <button 
            disabled
            className="w-full bg-gray-400 cursor-not-allowed text-white font-bold py-6 px-8 rounded-2xl shadow-lg opacity-60 flex items-center justify-center gap-4 text-xl"
            title="תכונה זו עדיין לא זמינה"
          >
            <Monitor className="w-8 h-8" />
            <div className="text-center">
              <div className="text-2xl font-bold">📺 מסך מטבח</div>
              <div className="text-lg opacity-90">ניהול שקילות והזמנות</div>
              <div className="text-sm opacity-90 mt-1">🚧 בקרוב</div>
            </div>
            <Scale className="w-8 h-8" />
          </button>
        </div>

        {/* Quick Actions (condensed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          <Link to="/admin/fish" className="card hover:shadow-lg transition-shadow group">
            <div className="text-center p-4">
            <Package className="w-12 h-12 text-primary-600 mx-auto mb-4 group-hover:text-primary-700" />
              <h3 className="text-lg font-semibold mb-2">ניהול דגים</h3>
              <p className="text-gray-600 text-sm">הוספה, עריכה ומחיקה של דגים במערכת</p>
            </div>
          </Link>

          <Link to="/admin/orders" className="card hover:shadow-lg transition-shadow group">
            <div className="text-center p-4">
            <ShoppingCart className="w-12 h-12 text-primary-600 mx-auto mb-4 group-hover:text-primary-700" />
              <h3 className="text-lg font-semibold mb-2">רשימת הזמנות</h3>
              <p className="text-gray-600 text-sm">צפייה וניהול הזמנות לקוחות</p>
            </div>
          </Link>

          <Link to="/admin/reports" className="card hover:shadow-lg transition-shadow group">
            <div className="text-center p-4">
              <FileText className="w-12 h-12 text-primary-600 mx-auto mb-4 group-hover:text-primary-700" />
              <h3 className="text-lg font-semibold mb-2">דוחות המערכת</h3>
              <p className="text-gray-600 text-sm">כל הדוחות במקום אחד - יומי, מלאי, חגים, הכנסות</p>
            </div>
          </Link>

          <Link to="/admin/holidays" className="card hover:shadow-lg transition-shadow group">
            <div className="text-center p-4">
              <Package className="w-12 h-12 text-primary-600 mx-auto mb-4 group-hover:text-primary-700" />
              <h3 className="text-lg font-semibold mb-2">ניהול חגים</h3>
              <p className="text-gray-600 text-sm">פתיחת הזמנות לחגים והיערכות מלאי</p>
            </div>
          </Link>

          <Link to="/admin/additional-products" className="card hover:shadow-lg transition-shadow group">
            <div className="text-center p-4">
              <Package className="w-12 h-12 text-primary-600 mx-auto mb-4 group-hover:text-primary-700" />
              <h3 className="text-lg font-semibold mb-2">מוצרים משלימים</h3>
              <p className="text-gray-600 text-sm">ניהול מלאי מוצרים נלווים</p>
            </div>
          </Link>

          <Link to="/admin/meal-recommendations" className="card hover:shadow-lg transition-shadow group">
            <div className="text-center p-4">
              <Package className="w-12 h-12 text-primary-600 mx-auto mb-4 group-hover:text-primary-700" />
              <h3 className="text-lg font-semibold mb-2">המלצות מנות</h3>
              <p className="text-gray-600 text-sm">שיוך דג+חיתוך למוצרים מומלצים</p>
            </div>
          </Link>

          <Link to="/admin/availability" className="card hover:shadow-lg transition-shadow group">
            <div className="text-center p-4">
              <Package className="w-12 h-12 text-primary-600 mx-auto mb-4 group-hover:text-primary-700" />
              <h3 className="text-lg font-semibold mb-2">זמני איסוף</h3>
              <p className="text-gray-600 text-sm">ניהול שעות וכמויות איסוף יומיות</p>
            </div>
          </Link>

          <Link to="/admin/coupons" className="card hover:shadow-lg transition-shadow group bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
            <div className="text-center p-4">
              <Tag className="w-12 h-12 text-amber-600 mx-auto mb-4 group-hover:text-amber-700" />
              <h3 className="text-lg font-semibold mb-2 text-amber-900">קופונים והנחות</h3>
              <p className="text-amber-700 text-sm">ניהול קודי הנחה ומבצעים</p>
            </div>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Popular Fish Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">דגים פופולריים</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularFish}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    labelStyle={{ direction: 'rtl' }}
                    formatter={(value, name) => [value, name === 'orders' ? 'הזמנות' : 'הכנסות (₪)']}
                  />
                  <Legend 
                    formatter={(value) => value === 'orders' ? 'הזמנות' : 'הכנסות (₪)'}
                  />
                  <Bar dataKey="orders" fill="#8884d8" />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">הכנסות חודשיות</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    labelStyle={{ direction: 'rtl' }}
                    formatter={(value, name) => [value, name === 'revenue' ? 'הכנסות (₪)' : 'הזמנות']}
                  />
                  <Legend 
                    formatter={(value) => value === 'revenue' ? 'הכנסות (₪)' : 'הזמנות'}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="orders" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cut Types Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">התפלגות חיתוכים</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cutTypeStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {cutTypeStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'הזמנות']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Time Period */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">הזמנות לפי תקופה</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="status" type="category" width={80} />
                  <Tooltip formatter={(value) => [value, 'הזמנות']} />
                  <Bar dataKey="count" fill="#8884d8">
                    {orderStatusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {/* ניווט תחתון - מובייל (אדמין) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-5 text-center text-sm">
            <Link to="/admin/dashboard" className="py-3 text-primary-700 font-semibold">דשבורד</Link>
            <Link to="/admin/orders" className="py-3 text-neutral-600">הזמנות</Link>
            <Link to="/admin/fish" className="py-3 text-neutral-600">דגים</Link>
            <Link to="/admin/daily-report" className="py-3 text-neutral-600">דוח יומי</Link>
            <Link to="/admin/holidays" className="py-3 text-neutral-600">חגים</Link>
          </div>
        </div>
      </nav>
    </div>
  )
} 