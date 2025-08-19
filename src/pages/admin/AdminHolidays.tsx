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
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pickupDeadline, setPickupDeadline] = useState('')
  const [supplierReportDeadline, setSupplierReportDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedHolidayId, setSelectedHolidayId] = useState<number | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [importing, setImporting] = useState(false)
  const [apiHolidays, setApiHolidays] = useState<Array<{ baseName: string; start_date: string; end_date: string }>>([])
  const [autoSeeded, setAutoSeeded] = useState(false)

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

  const addHoliday = async () => {
    if (!name || !startDate || !endDate) return
    try {
      setLoading(true)
      // השבת כל החגים הפעילים
      await supabase.from('holidays').update({ active: false }).eq('active', true)
      // יצירת חג חדש כפעיל
      const { data, error } = await supabase
        .from('holidays')
        .insert([{ 
          name, 
          start_date: startDate, 
          end_date: endDate, 
          pickup_deadline: pickupDeadline || null,
          supplier_report_deadline: supplierReportDeadline || null,
          active: true 
        }])
        .select('id')
        .single()
      if (error) throw error
      setName('')
      setStartDate('')
      setEndDate('')
      setPickupDeadline('')
      setSupplierReportDeadline('')
      await fetchHolidays()
      setSelectedHolidayId(data.id)
    } catch (e) {
      console.error('Error creating holiday:', e)
      alert('שגיאה ביצירת החג. יש לוודא שטבלת holidays קיימת ומדיניות RLS מאפשרת כתיבה.')
    } finally {
      setLoading(false)
    }
  }

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
    try {
      setLoading(true)
      // אם נהפוך לאקטיבי, נבטל אחרים
      const target = holidays.find(h => h.id === id)
      const toActive = !(target?.active)
      if (toActive) {
        await supabase.from('holidays').update({ active: false }).eq('active', true)
      }
      await supabase.from('holidays').update({ active: toActive }).eq('id', id)
      await fetchHolidays()
      setSelectedHolidayId(id)
    } catch (e) {
      console.error('Error toggling holiday:', e)
      alert('שגיאה בעדכון סטטוס חג')
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
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const names = Object.keys(requirements.byFish)
        if (names.length === 0) { setInventory({}); return }
        const { data, error } = await supabase
          .from('fish_types')
          .select('name, available_kg')
          .in('name', names)
        if (error) throw error
        const map: Record<string, number> = {}
        ;(data || []).forEach((row: any) => { map[row.name] = Number(row.available_kg) || 0 })
        setInventory(map)
      } catch (e) {
        console.error('Error loading inventory:', e)
      }
    }
    loadInventory()
  }, [requirements])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ניהול חגים</h1>
                <p className="text-gray-600">פתיחת הזמנות לחגים ותכנון הכנות</p>
              </div>
            </div>
            <Link to="/catalog?holiday=rosh-hashanah" className="btn-secondary w-full md:w-auto">כפתור לקוח: הזמנות לראש השנה</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Create Holiday */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-neutral-500" />
            <h2 className="text-lg font-semibold">פתיחת הזמנות לחג</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="שם החג (למשל: ראש השנה)" className="input-field" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">תאריך התחלה</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">תאריך סיום</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  דוח לספקים 
                  <span className="text-xs text-gray-500 block">מתי לשלוח דוח</span>
                </label>
                <input type="date" value={supplierReportDeadline} onChange={e => setSupplierReportDeadline(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  סיום איסוף
                  <span className="text-xs text-gray-500 block">עד מתי לקבל הזמנות</span>
                </label>
                <input type="date" value={pickupDeadline} onChange={e => setPickupDeadline(e.target.value)} className="input-field" />
              </div>
            </div>

            <button onClick={addHoliday} className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto">
              <Plus className="w-4 h-4" /> פתח הזמנות לחג
            </button>
          </div>
          {/* ייבוא אוטומטי: נעשה ברקע פעם אחת כאשר הטבלה ריקה. אין צורך בכפתורים. */}
        </div>

        {/* Holidays List */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">חגים פעילים</h2>
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
                  let totalDeficit = 0
                  Object.entries(requirements.byFish).forEach(([fish, qty]) => {
                    const available = inventory[fish] || 0
                    totalDeficit += Math.max(qty - available, 0)
                  })
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-neutral-700">סה"כ חסר להשלמה (כל הדגים):</div>
                      <div className={`text-lg font-bold ${totalDeficit > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totalDeficit} ק"ג</div>
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
                  return (
                    <div key={fish} className="border rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-neutral-900">{fish}</div>
                        <div className="text-primary-700 font-bold">סה"כ דרוש: {qty} ק"ג</div>
                      </div>
                      <div className="mt-2 text-sm text-neutral-700">מלאי נוכחי: {available} ק"ג</div>
                      <div className={`mt-1 text-sm font-semibold ${needMore > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {needMore > 0 ? `חסר להשלמה: ${needMore} ק"ג` : 'המלאי מספק'}
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
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">סה"כ דרוש (ק"ג)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">מלאי נוכחי (ק"ג)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600">חסר להשלמה (ק"ג)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {Object.entries(requirements.byFish).map(([fish, qty]) => {
                      const available = inventory[fish] || 0
                      const needMore = Math.max(qty - available, 0)
                      return (
                        <tr key={fish}>
                          <td className="px-4 py-3 text-sm text-neutral-900 font-medium">{fish}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{qty}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{available}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${needMore > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{needMore}</td>
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
    </div>
  )
}

