import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Fish, ShoppingCart, DollarSign, TrendingUp, Package, Scissors, Scale, Monitor, Calendar, FileText, Tag, Settings, Clock, Waves } from 'lucide-react'
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

const COLORS = ['#023859', '#026873', '#6FA8BF', '#B4D2D9', '#013440', '#82CA9D']

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
          setPopularFish([{ name: 'אין נתונים זמינים', orders: 0, revenue: 0 }])
        }
      } else {
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
          .slice(-6)

        if (monthlyRevenueData.length > 0) {
          setMonthlyRevenue(monthlyRevenueData)
        } else {
          setMonthlyRevenue([{ month: 'אין נתונים', revenue: 0, orders: 0 }])
        }
      } else {
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
          { status: 'היום', count: todayOrders, color: '#026873' },
          { status: 'השבוע', count: weekOrders - todayOrders, color: '#6FA8BF' },
          { status: 'החודש', count: monthOrders - weekOrders, color: '#B4D2D9' },
          { status: 'ישנות יותר', count: olderOrders, color: '#023859' }
        ])
      } else {
        setOrderStatusStats([
          { status: 'אין הזמנות עדיין', count: 0, color: '#B4D2D9' }
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
      <div className="flex justify-center items-center min-h-screen bg-[#F5F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#026873] mx-auto mb-4"></div>
          <p className="text-[#023859]">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      {/* Header */}
      <header className="bg-[#023859] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#026873] p-2 rounded-lg">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">לוח בקרה</h1>
                <p className="text-[#B4D2D9] text-sm">דגי בקעת אונו - מערכת ניהול</p>
              </div>
            </div>
            <Link 
              to="/" 
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-colors border border-white/20"
            >
              לאתר הראשי
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Mobile quick actions */}
        <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
          <Link to="/admin/orders" className="bg-white border border-[#B4D2D9] text-[#023859] font-medium py-3 px-4 rounded-lg text-sm text-center hover:bg-[#B4D2D9]/10 transition-colors">
            הזמנות
          </Link>
          <Link to="/admin/fish" className="bg-white border border-[#B4D2D9] text-[#023859] font-medium py-3 px-4 rounded-lg text-sm text-center hover:bg-[#B4D2D9]/10 transition-colors">
            דגים
          </Link>
          <Link to="/admin/additional-products" className="bg-white border border-[#B4D2D9] text-[#023859] font-medium py-3 px-4 rounded-lg text-sm text-center hover:bg-[#B4D2D9]/10 transition-colors">
            מוצרים משלימים
          </Link>
          <Link to="/admin/reports" className="bg-white border border-[#B4D2D9] text-[#023859] font-medium py-3 px-4 rounded-lg text-sm text-center hover:bg-[#B4D2D9]/10 transition-colors">
            דוחות
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 shadow-soft hover:shadow-medium transition-shadow">
            <div className="flex items-center">
              <div className="bg-[#023859] p-3 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-[#023859]/60">סה"כ הזמנות</p>
                <p className="text-2xl font-bold text-[#023859]">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 shadow-soft hover:shadow-medium transition-shadow">
            <div className="flex items-center">
              <div className="bg-[#026873] p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-[#023859]/60">הכנסות כוללות</p>
                <p className="text-2xl font-bold text-[#026873]">₪{stats.totalRevenue.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 shadow-soft hover:shadow-medium transition-shadow">
            <div className="flex items-center">
              <div className="bg-[#6FA8BF] p-3 rounded-xl">
                <Fish className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-[#023859]/60">סוגי דגים פעילים</p>
                <p className="text-2xl font-bold text-[#023859]">{stats.totalFishTypes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 shadow-soft hover:shadow-medium transition-shadow">
            <div className="flex items-center">
              <div className="bg-[#013440] p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-[#023859]/60">הזמנות 24 שעות</p>
                <p className="text-2xl font-bold text-[#023859]">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#023859] mb-4">פעולות מהירות</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link to="/admin/fish" className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <Fish className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#023859] mb-1">ניהול דגים</h3>
                <p className="text-xs text-[#023859]/60">הוספה ועריכה</p>
              </div>
            </Link>

            <Link to="/admin/orders" className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <ShoppingCart className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#023859] mb-1">הזמנות</h3>
                <p className="text-xs text-[#023859]/60">צפייה וניהול</p>
              </div>
            </Link>

            <Link to="/admin/reports" className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <FileText className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#023859] mb-1">דוחות</h3>
                <p className="text-xs text-[#023859]/60">יומי, מלאי, הכנסות</p>
              </div>
            </Link>

            <Link to="/admin/holidays" className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <Calendar className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#023859] mb-1">חגים</h3>
                <p className="text-xs text-[#023859]/60">ניהול הזמנות חג</p>
              </div>
            </Link>

            <Link to="/admin/additional-products" className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <Package className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#023859] mb-1">מוצרים נלווים</h3>
                <p className="text-xs text-[#023859]/60">ניהול מלאי</p>
              </div>
            </Link>

            <Link to="/admin/fish-cuts" className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <Scissors className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#023859] mb-1">חיתוכים לדגים</h3>
                <p className="text-xs text-[#023859]/60">שיוך חיתוכים</p>
              </div>
            </Link>

            <Link to="/admin/availability" className="bg-white rounded-xl p-5 border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <Clock className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#023859] mb-1">זמני איסוף</h3>
                <p className="text-xs text-[#023859]/60">שעות וכמויות</p>
              </div>
            </Link>

            <Link to="/admin/coupons" className="bg-white rounded-xl p-5 border border-[#026873]/30 hover:border-[#026873] hover:shadow-medium transition-all group">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#026873]/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#026873] transition-colors">
                  <Tag className="w-6 h-6 text-[#026873] group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-[#026873] mb-1">קופונים</h3>
                <p className="text-xs text-[#026873]/60">הנחות ומבצעים</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Popular Fish Chart */}
          <div className="bg-white rounded-xl p-6 border border-[#B4D2D9]/30 shadow-soft">
            <h3 className="text-lg font-semibold text-[#023859] mb-4">דגים פופולריים</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularFish}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B4D2D9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#023859' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: '#023859' }} />
                  <Tooltip 
                    labelStyle={{ direction: 'rtl' }}
                    formatter={(value, name) => [value, name === 'orders' ? 'הזמנות' : 'הכנסות (₪)']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #B4D2D9', borderRadius: '8px' }}
                  />
                  <Legend 
                    formatter={(value) => value === 'orders' ? 'הזמנות' : 'הכנסות (₪)'}
                  />
                  <Bar dataKey="orders" fill="#023859" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" fill="#6FA8BF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-xl p-6 border border-[#B4D2D9]/30 shadow-soft">
            <h3 className="text-lg font-semibold text-[#023859] mb-4">הכנסות חודשיות</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B4D2D9" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#023859' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: '#023859' }} />
                  <Tooltip 
                    labelStyle={{ direction: 'rtl' }}
                    formatter={(value, name) => [value, name === 'revenue' ? 'הכנסות (₪)' : 'הזמנות']}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #B4D2D9', borderRadius: '8px' }}
                  />
                  <Legend 
                    formatter={(value) => value === 'revenue' ? 'הכנסות (₪)' : 'הזמנות'}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#023859" strokeWidth={2} dot={{ fill: '#023859' }} />
                  <Line type="monotone" dataKey="orders" stroke="#026873" strokeWidth={2} dot={{ fill: '#026873' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cut Types Distribution */}
          <div className="bg-white rounded-xl p-6 border border-[#B4D2D9]/30 shadow-soft">
            <h3 className="text-lg font-semibold text-[#023859] mb-4">התפלגות חיתוכים</h3>
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
                    fill="#023859"
                    dataKey="count"
                  >
                    {cutTypeStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'הזמנות']} 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #B4D2D9', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Time Period */}
          <div className="bg-white rounded-xl p-6 border border-[#B4D2D9]/30 shadow-soft">
            <h3 className="text-lg font-semibold text-[#023859] mb-4">הזמנות לפי תקופה</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStatusStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#B4D2D9" />
                  <XAxis type="number" tick={{ fill: '#023859' }} />
                  <YAxis dataKey="status" type="category" width={80} tick={{ fill: '#023859' }} />
                  <Tooltip 
                    formatter={(value) => [value, 'הזמנות']} 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #B4D2D9', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#023859" radius={[0, 4, 4, 0]}>
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

      {/* ניווט תחתון - מובייל */}
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-[#B4D2D9]/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-5 text-center text-xs">
            <Link to="/admin/dashboard" className="py-3 text-[#026873] font-semibold flex flex-col items-center gap-1">
              <Settings className="w-5 h-5" />
              <span>דשבורד</span>
            </Link>
            <Link to="/admin/orders" className="py-3 text-[#023859]/60 flex flex-col items-center gap-1">
              <ShoppingCart className="w-5 h-5" />
              <span>הזמנות</span>
            </Link>
            <Link to="/admin/fish" className="py-3 text-[#023859]/60 flex flex-col items-center gap-1">
              <Fish className="w-5 h-5" />
              <span>דגים</span>
            </Link>
            <Link to="/admin/daily-report" className="py-3 text-[#023859]/60 flex flex-col items-center gap-1">
              <FileText className="w-5 h-5" />
              <span>דוח יומי</span>
            </Link>
            <Link to="/admin/holidays" className="py-3 text-[#023859]/60 flex flex-col items-center gap-1">
              <Calendar className="w-5 h-5" />
              <span>חגים</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}
