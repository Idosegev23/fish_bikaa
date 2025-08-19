import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import type { AvailabilitySlot } from '../../lib/supabase'
import { ArrowLeft, Plus, Trash2, Clock, Settings, Edit2, Save, X, Copy, Zap, Calendar } from 'lucide-react'

const DAYS_HEBREW = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
]

export default function AdminAvailability() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [editingSlot, setEditingSlot] = useState<number | null>(null)
  const [showQuickSetup, setShowQuickSetup] = useState(false)
  
  // טופס הוספת סלוט חדש
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '10:00',
    end_time: '11:00',
    max_orders: 10
  })

  // טמפלייטים מוכנים
  const templates = {
    regular: {
      name: 'שעות עבודה רגילות',
      description: 'ראשון-חמישי 09:00-17:00',
      slots: [
        { days: [1, 2, 3, 4, 5], times: [
          { start: '09:00', end: '10:00', capacity: 15 },
          { start: '10:00', end: '11:00', capacity: 15 },
          { start: '11:00', end: '12:00', capacity: 15 },
          { start: '12:00', end: '13:00', capacity: 10 },
          { start: '13:00', end: '14:00', capacity: 10 },
          { start: '14:00', end: '15:00', capacity: 15 },
          { start: '15:00', end: '16:00', capacity: 15 },
          { start: '16:00', end: '17:00', capacity: 15 }
        ]}
      ]
    },
    weekend: {
      name: 'סוף שבוע',
      description: 'שישי-שבת 08:00-14:00',
      slots: [
        { days: [6, 0], times: [
          { start: '08:00', end: '09:00', capacity: 20 },
          { start: '09:00', end: '10:00', capacity: 20 },
          { start: '10:00', end: '11:00', capacity: 20 },
          { start: '11:00', end: '12:00', capacity: 15 },
          { start: '12:00', end: '13:00', capacity: 15 },
          { start: '13:00', end: '14:00', capacity: 10 }
        ]}
      ]
    },
    holiday: {
      name: 'ערב חג',
      description: 'שעות מוגברות לחגים',
      slots: [
        { days: [1, 2, 3, 4, 5], times: [
          { start: '07:00', end: '08:00', capacity: 25 },
          { start: '08:00', end: '09:00', capacity: 25 },
          { start: '09:00', end: '10:00', capacity: 25 },
          { start: '10:00', end: '11:00', capacity: 25 },
          { start: '11:00', end: '12:00', capacity: 20 },
          { start: '12:00', end: '13:00', capacity: 20 },
          { start: '13:00', end: '14:00', capacity: 20 },
          { start: '14:00', end: '15:00', capacity: 20 },
          { start: '15:00', end: '16:00', capacity: 15 },
          { start: '16:00', end: '17:00', capacity: 15 }
        ]}
      ]
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })
      
      if (error) throw error
      setSlots((data as AvailabilitySlot[]) || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSlot = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('availability_slots')
        .insert([newSlot])
      
      if (error) throw error
      
      setNewSlot({
        day_of_week: 1,
        start_time: '10:00',
        end_time: '11:00',
        max_orders: 10
      })
      
      await fetchSlots()
      
      // הודעת הצלחה
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>סלוט נוסף בהצלחה!</span>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)
      
    } catch (error) {
      console.error('Error adding slot:', error)
      alert('שגיאה בהוספת סלוט')
    } finally {
      setLoading(false)
    }
  }

  const updateSlot = async (id: number, updates: Partial<AvailabilitySlot>) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      await fetchSlots()
      setEditingSlot(null)
    } catch (error) {
      console.error('Error updating slot:', error)
      alert('שגיאה בעדכון סלוט')
    }
  }

  const deleteSlot = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הסלוט?')) return
    
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchSlots()
    } catch (error) {
      console.error('Error deleting slot:', error)
      alert('שגיאה במחיקת סלוט')
    }
  }

  const toggleSlotActive = async (id: number, active: boolean) => {
    await updateSlot(id, { active })
  }

  // החלת טמפלייט
  const applyTemplate = async (templateKey: keyof typeof templates) => {
    try {
      setLoading(true)
      const template = templates[templateKey]
      
      const slotsToAdd = []
      for (const slotGroup of template.slots) {
        for (const day of slotGroup.days) {
          for (const time of slotGroup.times) {
            slotsToAdd.push({
              day_of_week: day,
              start_time: time.start,
              end_time: time.end,
              max_orders: time.capacity,
              active: true
            })
          }
        }
      }
      
      const { error } = await supabase
        .from('availability_slots')
        .insert(slotsToAdd)
      
      if (error) throw error
      await fetchSlots()
      
      // הודעת הצלחה
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50'
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>טמפלייט "${template.name}" הוחל בהצלחה!</span>
        </div>
      `
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)
      
    } catch (error) {
      console.error('Error applying template:', error)
      alert('שגיאה בהחלת הטמפלייט')
    } finally {
      setLoading(false)
    }
  }

  // ניקוי כל הסלוטים
  const clearAllSlots = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל זמני האיסוף?')) return
    
    try {
      setLoading(true)
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .neq('id', 0) // מחק הכל
      
      if (error) throw error
      await fetchSlots()
      
    } catch (error) {
      console.error('Error clearing slots:', error)
      alert('שגיאה במחיקת הסלוטים')
    } finally {
      setLoading(false)
    }
  }

  // שכפול יום לימים אחרים
  const duplicateDay = async (sourceDayOfWeek: number, targetDays: number[]) => {
    try {
      setLoading(true)
      const sourceSlots = slots.filter(slot => slot.day_of_week === sourceDayOfWeek)
      
      const slotsToAdd = []
      for (const targetDay of targetDays) {
        for (const sourceSlot of sourceSlots) {
          slotsToAdd.push({
            day_of_week: targetDay,
            start_time: sourceSlot.start_time,
            end_time: sourceSlot.end_time,
            max_orders: sourceSlot.max_orders,
            active: sourceSlot.active
          })
        }
      }
      
      const { error } = await supabase
        .from('availability_slots')
        .insert(slotsToAdd)
      
      if (error) throw error
      await fetchSlots()
      
    } catch (error) {
      console.error('Error duplicating day:', error)
      alert('שגיאה בשכפול היום')
    } finally {
      setLoading(false)
    }
  }

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = []
    }
    acc[slot.day_of_week].push(slot)
    return acc
  }, {} as Record<number, AvailabilitySlot[]>)

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
                <h1 className="text-2xl font-bold text-gray-900">ניהול זמני איסוף</h1>
                <p className="text-gray-600">הגדרת שעות וכמויות הזמנות לכל יום</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* כלים מהירים */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">כלים מהירים</h2>
            <span className="text-sm text-gray-500">התחל בטמפלייט מוכן או נקה הכל</span>
          </div>
          
          <div className="space-y-6">
            {/* טמפלייטים מוכנים */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">טמפלייטים מוכנים:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(templates).map(([key, template]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <button
                      onClick={() => applyTemplate(key as keyof typeof templates)}
                      disabled={loading}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      החל טמפלייט
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* פעולות מהירות */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowQuickSetup(!showQuickSetup)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  שכפול יום
                </button>
                
                <button
                  onClick={clearAllSlots}
                  disabled={loading || slots.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  נקה הכל ({slots.length} סלוטים)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* שכפול יום */}
        {showQuickSetup && (
          <div className="card mb-8 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Copy className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">שכפול יום לימים אחרים</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              בחר יום שכבר הגדרת עבורו זמנים, ושכפל אותו לימים אחרים בלחיצה אחת
            </p>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {DAYS_HEBREW.map((day, index) => {
                const daySlots = groupedSlots[index] || []
                const hasSlots = daySlots.length > 0
                return (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">{day}</div>
                    {hasSlots ? (
                      <button
                        onClick={() => {
                          const targetDaysOptions = DAYS_HEBREW.map((d, i) => ({ day: d, index: i }))
                            .filter(item => item.index !== index)
                          
                          const selectedDays: number[] = []
                          
                          for (const option of targetDaysOptions) {
                            if (confirm(`האם לשכפל את ${day} גם ל${option.day}?`)) {
                              selectedDays.push(option.index)
                            }
                          }
                          
                          if (selectedDays.length > 0) {
                            const dayNames = selectedDays.map(i => DAYS_HEBREW[i]).join(', ')
                            if (confirm(`בטוח לשכפל ${day} (${daySlots.length} זמנים) לימים: ${dayNames}?`)) {
                              duplicateDay(index, selectedDays)
                            }
                          }
                        }}
                        className="w-full bg-green-100 hover:bg-green-200 text-green-800 text-xs font-medium py-2 px-2 rounded border border-green-300 transition-colors"
                      >
                        📅 {daySlots.length} זמנים
                        <br />
                        <span className="text-xs opacity-75">שכפל →</span>
                      </button>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-400 text-xs py-2 px-2 rounded border border-gray-200">
                        ריק
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowQuickSetup(false)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <X className="w-4 h-4" />
                סגור
              </button>
            </div>
          </div>
        )}

        {/* הוספת סלוט חדש */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">הוספת סלוט זמן חדש</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">יום בשבוע</label>
              <select 
                value={newSlot.day_of_week}
                onChange={(e) => setNewSlot({...newSlot, day_of_week: Number(e.target.value)})}
                className="input-field"
              >
                {DAYS_HEBREW.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת התחלה</label>
              <input 
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שעת סיום</label>
              <input 
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מקס' הזמנות</label>
              <input 
                type="number"
                min="1"
                max="100"
                value={newSlot.max_orders}
                onChange={(e) => setNewSlot({...newSlot, max_orders: Number(e.target.value)})}
                className="input-field"
              />
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={addSlot}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף סלוט
              </button>
            </div>
          </div>
        </div>

        {/* רשימת סלוטים לפי ימים */}
        <div className="space-y-6">
          {DAYS_HEBREW.map((dayName, dayIndex) => {
            const daySlots = groupedSlots[dayIndex] || []
            
            return (
              <div key={dayIndex} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold">{dayName}</h3>
                  <span className="text-sm text-gray-500">({daySlots.length} סלוטים)</span>
                </div>
                
                {daySlots.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">אין סלוטים מוגדרים ליום {dayName}</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {daySlots.map((slot) => (
                      <div 
                        key={slot.id} 
                        className={`border rounded-xl p-4 ${slot.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        {editingSlot === slot.id ? (
                          <EditSlotForm 
                            slot={slot}
                            onSave={(updates) => updateSlot(slot.id, updates)}
                            onCancel={() => setEditingSlot(null)}
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-lg font-semibold text-gray-900">
                                {slot.start_time} - {slot.end_time}
                              </div>
                              <div className="text-sm text-gray-600">
                                מקסימום {slot.max_orders} הזמנות
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                slot.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {slot.active ? 'פעיל' : 'לא פעיל'}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingSlot(slot.id)}
                                className="text-blue-600 hover:text-blue-700 p-2"
                                title="ערוך"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => toggleSlotActive(slot.id, !slot.active)}
                                className={`text-sm px-3 py-1 rounded-lg ${
                                  slot.active 
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {slot.active ? 'השבת' : 'הפעל'}
                              </button>
                              
                              <button
                                onClick={() => deleteSlot(slot.id)}
                                className="text-red-600 hover:text-red-700 p-2"
                                title="מחק"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  )
}

// רכיב עריכת סלוט
function EditSlotForm({ 
  slot, 
  onSave, 
  onCancel 
}: { 
  slot: AvailabilitySlot
  onSave: (updates: Partial<AvailabilitySlot>) => void
  onCancel: () => void 
}) {
  const [startTime, setStartTime] = useState(slot.start_time)
  const [endTime, setEndTime] = useState(slot.end_time)
  const [maxOrders, setMaxOrders] = useState(slot.max_orders)

  const handleSave = () => {
    onSave({
      start_time: startTime,
      end_time: endTime,
      max_orders: maxOrders
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה</label>
        <input 
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="input-field"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">שעת סיום</label>
        <input 
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="input-field"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">מקס' הזמנות</label>
        <input 
          type="number"
          min="1"
          max="100"
          value={maxOrders}
          onChange={(e) => setMaxOrders(Number(e.target.value))}
          className="input-field"
        />
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          <Save className="w-4 h-4" />
          שמור
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary flex items-center gap-2 px-4 py-2"
        >
          <X className="w-4 h-4" />
          ביטול
        </button>
      </div>
    </div>
  )
}