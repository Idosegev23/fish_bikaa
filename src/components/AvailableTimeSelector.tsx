import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Clock } from 'lucide-react'

interface AvailabilitySlot {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  max_orders: number
  active: boolean
  created_at: string
  updated_at: string
  current_orders?: number
}

interface AvailableTimeSelectorProps {
  selectedDate: string
  register: any
  errors: any
  onChange?: (value: string) => void
}

export default function AvailableTimeSelector({ 
  selectedDate, 
  register, 
  errors,
  onChange 
}: AvailableTimeSelectorProps) {
  const [availableSlots, setAvailableSlots] = useState<Array<AvailabilitySlot & { current_orders: number }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedDate])

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return
    
    try {
      setLoading(true)
      
      // חישוב יום בשבוע (0=ראשון, 1=שני...)
      const date = new Date(selectedDate)
      const dayOfWeek = date.getDay()
      
      // שליפת סלוטים פעילים ליום הנבחר
      const { data: slots, error: slotsError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)
        .order('start_time', { ascending: true })
      
      if (slotsError) throw slotsError
      
      if (!slots || slots.length === 0) {
        setAvailableSlots([])
        return
      }
      
      // שליפת הזמנות קיימות לתאריך הנבחר
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('delivery_time')
        .eq('delivery_date', selectedDate)
      
      if (ordersError) throw ordersError
      
      // ספירת הזמנות לכל סלוט
      const slotsWithCounts = slots.map(slot => {
        const timeRange = `${slot.start_time}-${slot.end_time}`
        const currentOrders = (orders || []).filter(order => 
          order.delivery_time === timeRange
        ).length
        
        return {
          ...slot,
          current_orders: currentOrders
        }
      })
      
      setAvailableSlots(slotsWithCounts)
      
    } catch (error) {
      console.error('Error fetching available slots:', error)
      setAvailableSlots([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // HH:MM
  }

  if (!selectedDate) {
    return (
      <div className="space-y-4">
        <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <span>שעה מועדפת *</span>
        </label>
        <div className="text-gray-500 text-center py-4 border border-gray-200 rounded-xl">
          אנא בחרו תאריך תחילה
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="text-xl font-bold text-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <span>שעה מועדפת *</span>
      </label>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">טוען שעות זמינות...</p>
        </div>
      ) : availableSlots.filter(slot => slot.current_orders < slot.max_orders).length === 0 ? (
        <div className="text-center py-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 font-medium">אין שעות איסוף זמינות לתאריך זה</p>
          <p className="text-red-600 text-sm mt-1">אנא בחרו תאריך אחר</p>
        </div>
      ) : (
        <>
          <select 
            {...register('deliveryTime', { required: 'שעה מועדפת היא שדה חובה' })}
            className="input-field text-base"
            onChange={(e) => onChange?.(e.target.value)}
          >
            <option value="">בחרו שעה מועדפת</option>
            {availableSlots
              .filter(slot => slot.current_orders < slot.max_orders) // רק סלוטים זמינים
              .map(slot => {
                const timeRange = `${formatTime(slot.start_time)}-${formatTime(slot.end_time)}`
                
                return (
                  <option 
                    key={slot.id} 
                    value={timeRange}
                  >
                    {timeRange}
                  </option>
                )
              })}
          </select>

        </>
      )}
      
      {errors.deliveryTime && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <span className="text-red-700 font-semibold">{errors.deliveryTime.message}</span>
        </div>
      )}
    </div>
  )
}