import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import { isByWeight, computeMaxUnits } from '../../lib/fishConfig'
import { ArrowLeft, Download, FileText, Mail, Calendar } from 'lucide-react'

type Holiday = {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
}

type FishRequirement = {
  fish_name: string
  total_quantity: number
  unit: 'kg' | 'units'
  current_stock: number
  deficit: number
}

export default function AdminSupplierReport() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedHolidayId, setSelectedHolidayId] = useState<number | null>(null)
  const [requirements, setRequirements] = useState<FishRequirement[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('id, name, start_date, end_date, active')
        .order('start_date', { ascending: false })
      
      if (error) throw error
      const list = (data as Holiday[]) || []
      setHolidays(list)
      
      // בחר חג פעיל כברירת מחדל
      const active = list.find(h => h.active)
      if (active) {
        setSelectedHolidayId(active.id)
        await fetchRequirements(active.id)
      } else if (list.length > 0) {
        setSelectedHolidayId(list[0].id)
        await fetchRequirements(list[0].id)
      }
    } catch (error) {
      console.error('Error fetching holidays:', error)
    }
  }

  const fetchRequirements = async (holidayId: number) => {
    try {
      setLoading(true)
      
      // שליפת הזמנות לחג
      const { data: orders } = await supabase
        .from('orders')
        .select('order_items')
        .eq('holiday_id', holidayId)
        .eq('is_holiday_order', true)

      if (!orders || orders.length === 0) {
        setRequirements([])
        return
      }

      // איסוף כל הדגים מההזמנות
      const fishSummary: Record<string, number> = {}
      
      orders.forEach(order => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const fishName = item.fish_name || ''
            const quantity = item.quantity_kg || 0
            
            if (fishName && quantity > 0) {
              fishSummary[fishName] = (fishSummary[fishName] || 0) + quantity
            }
          })
        }
      })

      // שליפת נתוני דגים ומלאי נוכחי
      const { data: fishTypes } = await supabase
        .from('fish_types')
        .select('name, price_per_kg, available_kg, is_active')
        .eq('is_active', true)

      const fishMap = new Map((fishTypes || []).map(f => [f.name, f]))
      
      // יצירת רשימת דרישות
      const reqList: FishRequirement[] = Object.entries(fishSummary).map(([fishName, totalKg]) => {
        const fishData = fishMap.get(fishName)
        const currentStockKg = fishData?.available_kg || 0
        
        // בדיקה אם דג נמכר ביחידות או בק"ג
        const isKgBased = isByWeight(fishName)
        
        let displayQuantity = totalKg
        let currentStock = currentStockKg
        let unit: 'kg' | 'units' = 'kg'
        
        if (!isKgBased) {
          // המרה ליחידות
          displayQuantity = Math.ceil(totalKg / 0.5) // משקל ממוצע לדג
          currentStock = computeMaxUnits(currentStockKg, fishName)
          unit = 'units'
        }
        
        const deficit = Math.max(0, displayQuantity - currentStock)
        
        return {
          fish_name: fishName,
          total_quantity: displayQuantity,
          unit,
          current_stock: currentStock,
          deficit
        }
      }).sort((a, b) => b.total_quantity - a.total_quantity)

      setRequirements(reqList)
    } catch (error) {
      console.error('Error fetching requirements:', error)
      setRequirements([])
    } finally {
      setLoading(false)
    }
  }

  const handleHolidayChange = async (holidayId: number) => {
    setSelectedHolidayId(holidayId)
    await fetchRequirements(holidayId)
  }

  const generatePDFReport = async () => {
    if (!selectedHolidayId || requirements.length === 0) return
    
    setGenerating(true)
    try {
      const selectedHoliday = holidays.find(h => h.id === selectedHolidayId)
      if (!selectedHoliday) return

      // יצירת תוכן הדוח
      const reportContent = {
        holiday: selectedHoliday,
        requirements: requirements.filter(r => r.deficit > 0), // רק דגים שחסרים
        generated_at: new Date().toISOString(),
        total_items: requirements.length,
        deficit_items: requirements.filter(r => r.deficit > 0).length
      }

      // כאן תוכל להוסיף יצירת PDF אמיתית
      // לעת עתה - הורדת JSON
      const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `supplier-report-${selectedHoliday.name}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      // הודעת הצלחה
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>דוח ספקים נוצר בהצלחה!</span>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)

    } catch (error) {
      console.error('Error generating report:', error)
      alert('שגיאה ביצירת הדוח')
    } finally {
      setGenerating(false)
    }
  }

  const selectedHoliday = holidays.find(h => h.id === selectedHolidayId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">דוח ספקים לחגים</h1>
                <p className="text-gray-600">סיכום הזמנות ודרישות מלאי</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* בחירת חג */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            בחירת חג לדוח
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              value={selectedHolidayId || ''}
              onChange={(e) => handleHolidayChange(Number(e.target.value))}
              className="input-field"
            >
              <option value="">בחר חג</option>
              {holidays.map(holiday => (
                <option key={holiday.id} value={holiday.id}>
                  {holiday.name} ({new Date(holiday.start_date).toLocaleDateString('he-IL')})
                  {holiday.active && ' - פעיל'}
                </option>
              ))}
            </select>
            
            <button 
              onClick={generatePDFReport}
              disabled={!selectedHolidayId || requirements.length === 0 || generating}
              className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  יוצר דוח...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  הורד דוח ספקים
                </>
              )}
            </button>
          </div>
        </div>

        {/* תוצאות */}
        {selectedHoliday && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                דרישות מלאי עבור {selectedHoliday.name}
              </h2>
              <div className="text-sm text-gray-600">
                {requirements.length} סוגי דגים • {requirements.filter(r => r.deficit > 0).length} חסרים במלאי
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : requirements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                אין הזמנות לחג זה עדיין
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th className="text-right">דג</th>
                      <th className="text-center">כמות נדרשת</th>
                      <th className="text-center">מלאי נוכחי</th>
                      <th className="text-center">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((req, index) => (
                      <tr key={index} className={req.deficit > 0 ? 'bg-red-50' : 'bg-green-50'}>
                        <td className="font-medium">{req.fish_name}</td>
                        <td className="text-center">
                          {req.total_quantity} {req.unit === 'kg' ? 'ק"ג' : 'יח׳'}
                        </td>
                        <td className="text-center">
                          {req.current_stock} {req.unit === 'kg' ? 'ק"ג' : 'יח׳'}
                        </td>
                        <td className="text-center">
                          {req.deficit > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              חסר {req.deficit} {req.unit === 'kg' ? 'ק"ג' : 'יח׳'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              מלאי מספיק
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <AdminBottomNav />
    </div>
  )
}