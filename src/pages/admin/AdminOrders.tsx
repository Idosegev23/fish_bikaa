import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import type { Order } from '../../lib/supabase'
import { ArrowLeft, Download, Calendar, Search, Eye, X } from 'lucide-react'

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderModalOpen, setOrderModalOpen] = useState(false)

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

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order)
    setOrderModalOpen(true)
  }

  const closeOrderModal = () => {
    setSelectedOrder(null)
    setOrderModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F5F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#026873] mx-auto mb-4"></div>
          <p className="text-[#023859]">טוען הזמנות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      {/* Header */}
      <header className="bg-[#023859] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 py-5">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/dashboard" className="text-[#6FA8BF] hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">רשימת הזמנות</h1>
                <p className="text-[#B4D2D9] text-sm">צפייה וניהול הזמנות לקוחות</p>
              </div>
            </div>
            <button 
              onClick={exportToCSV}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-colors border border-white/20 flex items-center space-x-2 space-x-reverse w-full md:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              <span>ייצוא לCSV</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft border border-[#B4D2D9]/30 p-6 mb-6">
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
            <div 
              key={order.id} 
              className="card cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary-200"
              onClick={() => openOrderModal(order)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-neutral-500">
                    {new Date(order.created_at).toLocaleDateString('he-IL')} • {new Date(order.created_at).toLocaleTimeString('he-IL')}
                  </div>
                  <div className="font-semibold text-neutral-900 mt-1">{order.customer_name}</div>
                  <div className="text-sm text-neutral-600">{order.phone} • {order.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-primary-700 font-bold">₪{Number(order.total_price).toFixed(2)}</div>
                  <Eye className="w-4 h-4 text-primary-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-neutral-600">
                איסוף: {new Date(order.delivery_date).toLocaleDateString('he-IL')} • {order.delivery_time}
              </div>
              <div className="mt-3 border-t border-neutral-200 pt-3 space-y-1">
                {order.order_items.slice(0, 2).map((item: any, index: number) => (
                  <div key={index} className="text-sm flex justify-between">
                    <span className="text-neutral-700">{item.fish_name} • {item.cut}</span>
                    <span className="text-neutral-500">{item.quantity_kg} ק"ג</span>
                  </div>
                ))}
                {order.order_items.length > 2 && (
                  <div className="text-xs text-primary-600 font-medium">
                    ועוד {order.order_items.length - 2} פריטים... (לחץ לפרטים)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="bg-white rounded-xl shadow-soft border border-[#B4D2D9]/30 overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#B4D2D9]/30">
              <thead className="bg-[#F5F9FA]">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#023859] uppercase tracking-wider">תאריך הזמנה</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#023859] uppercase tracking-wider">לקוח</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#023859] uppercase tracking-wider">איסוף</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#023859] uppercase tracking-wider">פריטים</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#023859] uppercase tracking-wider">סכום</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#023859] uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#B4D2D9]/20">
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
                        {order.order_items.slice(0, 2).map((item: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.fish_name}</span>
                            <span className="text-gray-500 text-xs block">{item.cut} • {item.quantity_kg} ק"ג</span>
                          </div>
                        ))}
                        {order.order_items.length > 2 && (
                          <div className="text-xs text-primary-600 font-medium">
                            ועוד {order.order_items.length - 2} פריטים...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700">₪{Number(order.total_price).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        פרטים
                      </button>
                    </td>
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

      <AdminBottomNav />

      {/* Order Details Modal */}
      {orderModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">פרטי הזמנה #{selectedOrder.id}</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  נוצרה: {new Date(selectedOrder.created_at).toLocaleDateString('he-IL')} • {new Date(selectedOrder.created_at).toLocaleTimeString('he-IL')}
                </p>
              </div>
              <button
                onClick={closeOrderModal}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-900 mb-3">פרטי לקוח</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-neutral-600">שם:</span>
                    <div className="font-medium">{selectedOrder.customer_name}</div>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-600">טלפון:</span>
                    <div className="font-medium">{selectedOrder.phone}</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-neutral-600">דוא"ל:</span>
                    <div className="font-medium">{selectedOrder.email}</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm text-neutral-600">כתובת איסוף:</span>
                    <div className="font-medium">{selectedOrder.delivery_address}</div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-900 mb-3">פרטי איסוף</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-neutral-600">תאריך:</span>
                    <div className="font-medium">{new Date(selectedOrder.delivery_date).toLocaleDateString('he-IL')}</div>
                  </div>
                  <div>
                    <span className="text-sm text-neutral-600">שעה:</span>
                    <div className="font-medium">{selectedOrder.delivery_time}</div>
                  </div>
                </div>
              </div>

              {/* Fish Orders */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">דגים בהזמנה</h3>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  {selectedOrder.order_items.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 border-b border-neutral-100 last:border-b-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-lg">🐟</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900">{item.fish_name}</div>
                        <div className="text-sm text-neutral-600">{item.cut}</div>
                        <div className="text-sm text-neutral-500">{item.quantity_kg} ק"ג</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-neutral-900">₪{Number(item.price_total).toFixed(2)}</div>
                        <div className="text-sm text-neutral-500">₪{Number(item.price_per_kg).toFixed(2)}/ק"ג</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extras */}
              {selectedOrder.extras && selectedOrder.extras.length > 0 && (
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">מוצרים משלימים</h3>
                  <div className="border border-neutral-200 rounded-xl overflow-hidden">
                    {selectedOrder.extras.map((extra: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-4 border-b border-neutral-100 last:border-b-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-sm font-medium">+</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900">{extra.name}</div>
                          <div className="text-sm text-neutral-600">{extra.quantity} {extra.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-neutral-900">₪{Number(extra.total).toFixed(2)}</div>
                          <div className="text-sm text-neutral-500">₪{Number(extra.price).toFixed(2)}/{extra.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Holiday Info */}
              {selectedOrder.is_holiday_order && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h3 className="font-semibold text-amber-800 mb-2">🎉 הזמנת חג</h3>
                  <p className="text-sm text-amber-700">הזמנה זו מסומנת כהזמנת חג</p>
                </div>
              )}

              {/* Total */}
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>סה"כ דגים:</span>
                    <span>₪{(Number(selectedOrder.total_price) - Number(selectedOrder.extras_total || 0)).toFixed(2)}</span>
                  </div>
                  {selectedOrder.extras_total && Number(selectedOrder.extras_total) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>סה"כ תוספות:</span>
                      <span>₪{Number(selectedOrder.extras_total).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold border-t border-primary-200 pt-2">
                    <span>סה"כ לתשלום:</span>
                    <span className="text-primary-700">₪{Number(selectedOrder.total_price).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 