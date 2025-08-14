import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Order } from '../../lib/supabase'
import { ArrowLeft, Download, Calendar, Search } from 'lucide-react'

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, dateFilter])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // סינון לפי טקסט
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm)
      )
    }

    // סינון לפי תאריך
    if (dateFilter) {
      filtered = filtered.filter(order =>
        order.delivery_date === dateFilter
      )
    }

    setFilteredOrders(filtered)
  }

  const exportToCSV = () => {
    const headers = ['תאריך הזמנה', 'שם לקוח', 'טלפון', 'דוא"ל', 'תאריך איסוף', 'שעה', 'סכום', 'פריטים']
    
    const csvData = filteredOrders.map(order => [
      new Date(order.created_at).toLocaleDateString('he-IL'),
      order.customer_name,
      order.phone,
      order.email,
      new Date(order.delivery_date).toLocaleDateString('he-IL'),
      order.delivery_time,
      `₪${order.total_price}`,
      order.order_items.map((item: any) => `${item.fish_name} (${item.cut}) x${item.quantity_kg}ק"ג`).join('; ')
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getTotalRevenue = () => {
    return filteredOrders.reduce((sum, order) => sum + Number(order.total_price), 0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fish-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/dashboard" className="text-fish-600 hover:text-fish-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">רשימת הזמנות</h1>
                <p className="text-gray-600">צפייה וניהול הזמנות לקוחות</p>
              </div>
            </div>
            <button 
              onClick={exportToCSV}
              className="btn-primary flex items-center space-x-2 space-x-reverse"
            >
              <Download className="w-4 h-4" />
              <span>ייצוא לCSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline ml-2" />
                חיפוש לקוח
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="שם, טלפון או דוא״ל"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline ml-2" />
                תאריך איסוף
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="btn-secondary text-sm"
                >
                  נקה סינון
                </button>
              )}
              <div className="text-sm text-gray-600">
                {filteredOrders.length} הזמנות • סה״כ: ₪{getTotalRevenue().toFixed(2)}
              </div>
            </div>
          </div>
        </div>

      {/* Orders - Mobile first cards + Table on md+ */}
      <div className="space-y-4 md:space-y-6">
        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-neutral-500">
                    {new Date(order.created_at).toLocaleDateString('he-IL')} • {new Date(order.created_at).toLocaleTimeString('he-IL')}
                  </div>
                  <div className="font-semibold text-neutral-900 mt-1">{order.customer_name}</div>
                  <div className="text-sm text-neutral-600">{order.phone} • {order.email}</div>
                </div>
                <div className="text-primary-700 font-bold">₪{Number(order.total_price).toFixed(2)}</div>
              </div>
              <div className="mt-3 text-sm text-neutral-600">
                איסוף: {new Date(order.delivery_date).toLocaleDateString('he-IL')} • {order.delivery_time}
              </div>
              <div className="mt-3 border-t border-neutral-200 pt-3 space-y-1">
                {order.order_items.map((item: any, index: number) => (
                  <div key={index} className="text-sm flex justify-between">
                    <span className="text-neutral-700">{item.fish_name} • {item.cut}</span>
                    <span className="text-neutral-500">{item.quantity_kg} ק"ג</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך הזמנה</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">איסוף</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פריטים</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סכום</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('he-IL')}
                      <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString('he-IL')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.phone}</div>
                      <div className="text-xs text-gray-500">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(order.delivery_date).toLocaleDateString('he-IL')}</div>
                      <div className="text-sm text-gray-500">{order.delivery_time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {order.order_items.map((item: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.fish_name}</span>
                            <span className="text-gray-500 text-xs block">{item.cut} • {item.quantity_kg} ק"ג</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">₪{Number(order.total_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {orders.length === 0 ? 'אין הזמנות במערכת' : 'לא נמצאו הזמנות התואמות לחיפוש'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
} 