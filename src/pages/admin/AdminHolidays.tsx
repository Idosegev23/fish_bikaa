import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Plus, Trash2, Calendar, Settings } from 'lucide-react'

type Holiday = {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
  pickup_deadline?: string
  supplier_report_deadline?: string
}

type OrderRow = {
  id: string
  created_at: string
  delivery_date: string
  order_items: Array<{ fish_name: string; cut?: string; quantity_kg: number }>
}

export default function AdminHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedHolidayId, setSelectedHolidayId] = useState<number | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [importing, setImporting] = useState(false)
  const [apiHolidays, setApiHolidays] = useState<Array<{ baseName: string; start_date: string; end_date: string }>>([])
  const [autoSeeded, setAutoSeeded] = useState(false)
  const [activationPopup, setActivationPopup] = useState<{ show: boolean; holiday: Holiday | null }>({ show: false, holiday: null })
  const [activationData, setActivationData] = useState({
    orderStartDate: '',
    orderEndDate: '',
    supplierReportDate: ''
  })

  // טען חגים מהמסד
  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('holidays')
        .select('id, name, start_date, end_date, active, pickup_deadline, supplier_report_deadline')
        .order('start_date', { ascending: true })
      if (error) throw error
      const list = (data as Holiday[]) || []
      setHolidays(list)
      if (list.length > 0) {
        const active = list.find(h => h.active)
        setSelectedHolidayId(active ? active.id : list[0].id)
      } else {
        setSelectedHolidayId(null)
      }
    } catch (e) {
      console.error('Error loading holidays:', e)
    } finally {
      setLoading(false)
    }
  }

  const selectedHoliday = useMemo(
    () => holidays.find(h => h.id === selectedHolidayId) || null,
    [holidays, selectedHolidayId]
  )



  const removeHoliday = async (id: number) => {
    try {
      setLoading(true)
      await supabase.from('holidays').delete().eq('id', id)
      await fetchHolidays()
    } catch (e) {
      console.error('Error deleting holiday:', e)
      alert('שגיאה במחיקת חג')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: number) => {
    const target = holidays.find(h => h.id === id)
    if (!target) return

    if (target.active) {
      // השבתה - ישירה ללא פופאפ
      try {
        setLoading(true)
        await supabase.from('holidays').update({ active: false }).eq('id', id)
        await fetchHolidays()
      } catch (e) {
        console.error('Error deactivating holiday:', e)
        alert('שגיאה בהשבתת חג')
      } finally {
        setLoading(false)
      }
    } else {
      // הפעלה - פתיחת פופאפ
      setActivationData({
        orderStartDate: target.start_date,
        orderEndDate: target.end_date,
        supplierReportDate: ''
      })
      setActivationPopup({ show: true, holiday: target })
    }
  }

  const activateHoliday = async () => {
    if (!activationPopup.holiday) return
    
    try {
      setLoading(true)
      // השבתת כל החגים הפעילים
      await supabase.from('holidays').update({ active: false }).eq('active', true)
      
      // הפעלת החג הנבחר עם הנתונים החדשים
      await supabase
        .from('holidays')
        .update({ 
          active: true,
          pickup_deadline: activationData.orderEndDate,
          supplier_report_deadline: activationData.supplierReportDate || null
        })
        .eq('id', activationPopup.holiday.id)
      
      await fetchHolidays()
      setSelectedHolidayId(activationPopup.holiday.id)
      setActivationPopup({ show: false, holiday: null })
      
      // הודעה מודרנית
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50 animate-slide-up'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <span>🎉</span>
          <span>החג "${activationPopup.holiday.name}" הופעל בהצלחה!</span>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 4000)
      
    } catch (e) {
      console.error('Error activating holiday:', e)
      alert('שגיאה בהפעלת חג')
    } finally {
      setLoading(false)
    }
  }

  // Fetch orders for selected holiday window
  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedHoliday) return
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, created_at, delivery_date, order_items')
          .gte('delivery_date', selectedHoliday.start_date)
          .lte('delivery_date', selectedHoliday.end_date)
          .order('created_at', { ascending: false })

        if (error) throw error
        setOrders((data as unknown as OrderRow[]) || [])
      } catch (e) {
        console.error('Error fetching holiday orders:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [selectedHoliday?.start_date, selectedHoliday?.end_date])

  // Import Israeli holidays from Nager.Date API
  const importIsraeliHolidays = async () => {
    try {
      setImporting(true)
      const year = new Date().getFullYear()
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IL`)
      if (!res.ok) throw new Error('Failed to fetch holidays')
      const data: Array<{ localName: string; name: string; date: string } & any> = await res.json()
      // Map relevant Jewish holidays and estimate end_date as date (single day) or by API when available
      const mapped = data
        .filter(h => h.localName && h.date)
        .map(h => ({
          baseName: h.localName,
          start_date: h.date,
          end_date: h.date,
        }))
      setApiHolidays(mapped)
    } catch (e) {
      console.error('Error importing holidays:', e)
      alert('שגיאה בייבוא חגים. נסה שוב מאוחר יותר.')
    } finally {
      setImporting(false)
    }
  }

  // Build list from data.gov.il CKAN DataStore API (no UI state side-effects)
  const fetchCKANHolidaysList = async (): Promise<Array<{ baseName: string; start_date: string; end_date: string }>> => {
    try {
      const endpoint = 'https://data.gov.il/api/3/action/datastore_search?resource_id=67492cda-b36e-45f4-9ed1-0471af297e8b&limit=500'
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Failed to fetch CKAN holidays')
      const json = await res.json()
      const records: any[] = json?.result?.records || []

      const normalizeDate = (raw: any): string | null => {
        if (!raw) return null
        const str = String(raw).trim()
        // If ISO-like (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10)
        // If DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
          const [dd, mm, yyyy] = str.split('/')
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
        }
        // If MM/DD/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
          const [mm, dd, yyyy] = str.split('/')
          return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
        }
        // Try Date parse fallback
        const d = new Date(str)
        if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10)
        return null
      }

      const pickFirst = (obj: any, candidates: string[]): any => {
        for (const key of candidates) {
          if (obj[key] != null && obj[key] !== '') return obj[key]
        }
        // try case-insensitive
        const lowerMap: Record<string, any> = {}
        Object.keys(obj || {}).forEach(k => { lowerMap[k.toLowerCase()] = obj[k] })
        for (const key of candidates) {
          const v = lowerMap[key.toLowerCase()]
          if (v != null && v !== '') return v
        }
        return null
      }

      const nameCandidates = ['שם החג', 'שם_החג', 'holiday_name', 'Holiday_Name', 'hebrew_name', 'Holiday', 'holiday', 'name', 'Title']
      const startCandidates = [
        'תאריך תחילה לועזי', 'תאריך_תחילה_לועזי', 'תאריך תחילה', 'תאריך_תחילה',
        'start_date', 'from_date', 'begin_gregorian', 'gregorian_date', 'תאריך לועזי', 'date', 'dtstart', 'start', 'תאריך'
      ]
      const endCandidates = [
        'תאריך סיום לועזי', 'תאריך_סיום_לועזי', 'תאריך סיום', 'תאריך_סיום',
        'end_date', 'to_date', 'end', 'dtend'
      ]

      const mapped = records
        .map((rec: any) => {
          const baseName = String(pickFirst(rec, nameCandidates) || '').trim()
          const startRaw = pickFirst(rec, startCandidates)
          const endRaw = pickFirst(rec, endCandidates)
          const start_date = normalizeDate(startRaw)
          const end_date = normalizeDate(endRaw) || start_date
          return baseName && start_date ? { baseName, start_date, end_date: end_date || start_date } : null
        })
        .filter(Boolean) as Array<{ baseName: string; start_date: string; end_date: string }>

      // Deduplicate
      const uniqueMap = new Map<string, { baseName: string; start_date: string; end_date: string }>()
      mapped.forEach(h => {
        const key = `${h.baseName}__${h.start_date}__${h.end_date}`
        if (!uniqueMap.has(key)) uniqueMap.set(key, h)
      })

      return Array.from(uniqueMap.values())
    } catch (e) {
      console.error('Error importing CKAN holidays:', e)
      return []
    }
  }

  // Seed once: fetch from CKAN and upsert into DB as inactive, only if table empty
  const seedHolidaysOnce = async () => {
    try {
      if (autoSeeded) return
      if (holidays.length > 0) { setAutoSeeded(true); return }
      setImporting(true)
      const ckanList = await fetchCKANHolidaysList()
      if (!ckanList || ckanList.length === 0) { setAutoSeeded(true); return }
      setLoading(true)
      const rows = ckanList.map(h => ({ name: h.baseName, start_date: h.start_date, end_date: h.end_date, active: false }))
      const { error } = await supabase
        .from('holidays')
        .upsert(rows as any, { onConflict: 'name,start_date,end_date' })
      if (error) throw error
      await fetchHolidays()
      setAutoSeeded(true)
    } catch (e) {
      console.error('Error seeding holidays:', e)
    } finally {
      setLoading(false)
      setImporting(false)
    }
  }

  // Auto-seed on first load if table empty (runs once)
  useEffect(() => {
    if (!autoSeeded && holidays.length === 0) {
      seedHolidaysOnce()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holidays.length, autoSeeded])

  const quickCreateHoliday = async (h: { baseName: string; start_date: string; end_date: string }) => {
    try {
      setLoading(true)
      await supabase.from('holidays').update({ active: false }).eq('active', true)
      const { data, error } = await supabase
        .from('holidays')
        .insert([{ name: h.baseName, start_date: h.start_date, end_date: h.end_date, active: true }])
        .select('id')
        .single()
      if (error) throw error
      await fetchHolidays()
      setSelectedHolidayId(data.id)
    } catch (e) {
      console.error('Error quick-creating holiday:', e)
      alert('שגיאה ביצירת חג מה-API')
    } finally {
      setLoading(false)
    }
  }

  // Aggregate requirements by fish and cut
  const requirements = useMemo(() => {
    const byFish: Record<string, number> = {}
    const byFishAndCut: Record<string, number> = {}
    orders.forEach(o => {
      if (Array.isArray(o.order_items)) {
        o.order_items.forEach(item => {
          const qty = Number(item.quantity_kg) || 0
          byFish[item.fish_name] = (byFish[item.fish_name] || 0) + qty
          const key = `${item.fish_name}__${item.cut || 'ללא חיתוך'}`
          byFishAndCut[key] = (byFishAndCut[key] || 0) + qty
        })
      }
    })
    return { byFish, byFishAndCut }
  }, [orders])

  const [inventory, setInventory] = useState<Record<string, number>>({})
  const [fishUnits, setFishUnits] = useState<Record<string, 'units' | 'kg'>>({})
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const names = Object.keys(requirements.byFish)
        if (names.length === 0) { setInventory({}); setFishUnits({}); return }
        const { data, error } = await supabase
          .from('fish_types')
          .select('name, available_kg, sale_unit')
          .in('name', names)
        if (error) throw error
        const inventoryMap: Record<string, number> = {}
        const unitsMap: Record<string, 'units' | 'kg'> = {}
        ;(data || []).forEach((row: any) => { 
          inventoryMap[row.name] = Number(row.available_kg) || 0
          unitsMap[row.name] = row.sale_unit || 'units'
        })
        setInventory(inventoryMap)
        setFishUnits(unitsMap)
      } catch (e) {
        console.error('Error loading inventory:', e)
      }
    }
    loadInventory()
  }, [requirements])

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <header className="bg-[#023859] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 py-5">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/dashboard" className="text-[#6FA8BF] hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">ניהול חגים</h1>
                <p className="text-[#B4D2D9] text-sm">פתיחת הזמנות לחגים ותכנון הכנות</p>
              </div>
            </div>
            {selectedHoliday && (
              <Link 
                to={`/catalog?holiday=${encodeURIComponent(selectedHoliday.name.replace(/\s+/g, '-').replace(/"|\'|"|"|׳|"/g, '').toLowerCase())}`} 
                className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-colors border border-white/20 w-full md:w-auto text-center"
              >
                צפה בממשק לקוח: {selectedHoliday.name}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">

        {/* Holidays List */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">חגים במערכת</h2>
            <p className="text-sm text-neutral-600">לחץ "הפעל" כדי להתחיל לקבל הזמנות לחג</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {holidays.length === 0 && (
              <div className="text-neutral-600">אין חגים מוגדרים</div>
            )}
            {holidays.map(h => (
              <div key={h.id} className={`border rounded-xl p-4 ${h.active ? 'border-primary-300 bg-primary-50/50' : 'border-neutral-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-neutral-900">{h.name}</div>
                    <div className="text-sm text-neutral-600">
                      {new Date(h.start_date).toLocaleDateString('he-IL')} – {new Date(h.end_date).toLocaleDateString('he-IL')}
                      {h.supplier_report_deadline && (
                        <div className="text-xs text-blue-600 mt-1">
                          דוח לספקים: {new Date(h.supplier_report_deadline).toLocaleDateString('he-IL')}
                        </div>
                      )}
                      {h.pickup_deadline && (
                        <div className="text-xs text-orange-600 mt-1">
                          סיום איסוף: {new Date(h.pickup_deadline).toLocaleDateString('he-IL')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedHolidayId(h.id)} className="btn-secondary text-sm">בחר</button>
                    <button onClick={() => toggleActive(h.id)} className={`text-sm ${h.active ? 'btn-secondary' : 'btn-primary'}`}>{h.active ? 'השבת' : 'הפעל'}</button>
                    <button onClick={() => removeHoliday(h.id)} className="text-red-600 hover:text-red-700 p-2" title="מחק"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements Overview */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-neutral-500" />
            <h2 className="text-lg font-semibold">היקפי הכנה לחג {selectedHoliday ? `– ${selectedHoliday.name}` : ''}</h2>
          </div>
          {!selectedHoliday ? (
            <div className="text-neutral-600">בחר חג כדי לראות את היקפי ההכנה.</div>
          ) : loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                {(() => {
                  let totalOrderedUnits = 0
                  let totalOrderedKg = 0
                  let totalDeficitUnits = 0
                  let totalDeficitKg = 0
                  
                  Object.entries(requirements.byFish).forEach(([fish, qty]) => {
                    const available = inventory[fish] || 0
                    const deficit = Math.max(qty - available, 0)
                    
                    if (fishUnits[fish] === 'kg') {
                      totalOrderedKg += qty
                      totalDeficitKg += deficit
                    } else {
                      totalOrderedUnits += Math.floor(qty)
                      totalDeficitUnits += Math.floor(deficit)
                    }
                  })
                  
                  const formatSummary = (units: number, kg: number) => {
                    const parts = []
                    if (units > 0) parts.push(`${units} יח׳`)
                    if (kg > 0) parts.push(`${kg.toFixed(1)} ק״ג`)
                    return parts.length > 0 ? parts.join(' + ') : '0'
                  }
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-neutral-700">סה"כ הוזמן לחג זה (כל הדגים):</div>
                        <div className="text-lg font-bold text-primary-700">{formatSummary(totalOrderedUnits, totalOrderedKg)}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-neutral-700">סה"כ חסר להשלמה (כל הדגים):</div>
                        <div className={`text-lg font-bold ${(totalDeficitUnits + totalDeficitKg) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {formatSummary(totalDeficitUnits, totalDeficitKg)}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {Object.keys(requirements.byFish).length === 0 && (
                  <div className="text-neutral-600">אין הזמנות בתקופת החג שנבחרה.</div>
                )}
                {Object.entries(requirements.byFish).map(([fish, qty]) => {
                  const available = inventory[fish] || 0
                  const needMore = Math.max(qty - available, 0)
                  const unit = fishUnits[fish] === 'kg' ? 'ק"ג' : 'יח׳'
                  const isUnits = fishUnits[fish] === 'units'
                  
                  const formatQuantity = (value: number) => {
                    return isUnits ? Math.floor(value).toString() : value.toFixed(1)
                  }
                  
                  return (
                    <div key={fish} className="border rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-neutral-900">{fish}</div>
                        <div className="text-primary-700 font-bold">הוזמן: {formatQuantity(qty)} {unit}</div>
                      </div>
                      <div className="mt-2 text-sm text-neutral-700">מלאי נוכחי: {formatQuantity(available)} {unit}</div>
                      <div className={`mt-1 text-sm font-semibold ${needMore > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {needMore > 0 ? `חסר להשלמה: ${formatQuantity(needMore)} ${unit}` : 'המלאי מספק'}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">דג</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">סה"כ הוזמן</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">מלאי נוכחי</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">חסר להשלמה</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {Object.entries(requirements.byFish).map(([fish, qty]) => {
                      const available = inventory[fish] || 0
                      const needMore = Math.max(qty - available, 0)
                      const unit = fishUnits[fish] === 'kg' ? 'ק"ג' : 'יח׳'
                      const isUnits = fishUnits[fish] === 'units'
                      
                      const formatQuantity = (value: number) => {
                        return isUnits ? Math.floor(value).toString() : value.toFixed(1)
                      }
                      
                      return (
                        <tr key={fish}>
                          <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{fish}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{formatQuantity(qty)} {unit}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{formatQuantity(available)} {unit}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${needMore > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatQuantity(needMore)} {unit}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <AdminBottomNav />

      {/* Holiday Activation Popup */}
      {activationPopup.show && activationPopup.holiday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-900">
                  הפעלת חג: {activationPopup.holiday.name}
                </h3>
                <button 
                  onClick={() => setActivationPopup({ show: false, holiday: null })}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>תאריכי החג:</strong> {new Date(activationPopup.holiday.start_date).toLocaleDateString('he-IL')} – {new Date(activationPopup.holiday.end_date).toLocaleDateString('he-IL')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    מתי להתחיל לקבל הזמנות לחג?
                  </label>
                  <input 
                    type="date" 
                    value={activationData.orderStartDate}
                    onChange={(e) => setActivationData(prev => ({ ...prev, orderStartDate: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    עד מתי לקבל הזמנות לחג?
                  </label>
                  <input 
                    type="date" 
                    value={activationData.orderEndDate}
                    onChange={(e) => setActivationData(prev => ({ ...prev, orderEndDate: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    מתי לשלוח דוח הזמנות לספק? (אופציונלי)
                  </label>
                  <input 
                    type="date" 
                    value={activationData.supplierReportDate}
                    onChange={(e) => setActivationData(prev => ({ ...prev, supplierReportDate: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setActivationPopup({ show: false, holiday: null })}
                  className="btn-secondary flex-1"
                >
                  ביטול
                </button>
                <button 
                  onClick={activateHoliday}
                  disabled={!activationData.orderStartDate || !activationData.orderEndDate}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הפעל חג
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

