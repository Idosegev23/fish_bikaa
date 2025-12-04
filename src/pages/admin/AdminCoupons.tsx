import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { 
  Tag, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Calendar, 
  Percent, 
  DollarSign,
  Copy,
  Gift,
  AlertCircle
} from 'lucide-react'

interface Coupon {
  id: number
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_uses?: number
  current_uses: number
  valid_from: string
  valid_until?: string
  active: boolean
  created_at: string
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_order_amount: 0,
    max_uses: undefined as number | undefined,
    valid_until: ''
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setCoupons(data)
    }
    setLoading(false)
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm({ ...form, code })
  }

  const saveCoupon = async () => {
    if (!form.code) return

    const payload = {
      code: form.code.toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount || 0,
      max_uses: form.max_uses || null,
      valid_until: form.valid_until || null,
      active: true
    }

    if (editingCoupon) {
      const { error } = await supabase
        .from('coupons')
        .update(payload)
        .eq('id', editingCoupon.id)
      
      if (!error) {
        setEditingCoupon(null)
        setShowForm(false)
        resetForm()
        await loadCoupons()
      }
    } else {
      const { error } = await supabase
        .from('coupons')
        .insert([payload])
      
      if (!error) {
        setShowForm(false)
        resetForm()
        await loadCoupons()
      }
    }
  }

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_uses: undefined,
      valid_until: ''
    })
  }

  const editCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_uses: coupon.max_uses,
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : ''
    })
    setShowForm(true)
  }

  const toggleActive = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ active: !coupon.active })
      .eq('id', coupon.id)
    
    if (!error) {
      await loadCoupons()
    }
  }

  const deleteCoupon = async (id: number) => {
    if (!confirm('האם למחוק את הקופון?')) return
    
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)
    
    if (!error) {
      await loadCoupons()
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const isMaxedOut = (coupon: Coupon) => {
    if (!coupon.max_uses) return false
    return coupon.current_uses >= coupon.max_uses
  }

  return (
    <div className="min-h-screen bg-[#F5F9FA]">
      <header className="bg-[#023859] shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#026873] rounded-xl flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ניהול קופונים</h1>
                <p className="text-sm text-[#B4D2D9]">צור והפעל קודי הנחה</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowForm(true); setEditingCoupon(null); resetForm(); }}
                className="bg-[#026873] hover:bg-[#013440] text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                קופון חדש
              </button>
              <Link to="/admin/dashboard" className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-colors border border-white/20 text-sm">
                חזרה לדשבורד
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* טופס הוספה/עריכה */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Gift className="w-5 h-5 text-gold-500" />
                {editingCoupon ? 'עריכת קופון' : 'קופון חדש'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingCoupon(null); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* קוד הקופון */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">קוד קופון</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20"
                    className="input-field flex-1"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <button
                    onClick={generateCode}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                  >
                    יצר
                  </button>
                </div>
              </div>

              {/* סוג הנחה */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">סוג הנחה</label>
                <select
                  value={form.discount_type}
                  onChange={e => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="input-field"
                >
                  <option value="percentage">אחוזים (%)</option>
                  <option value="fixed">סכום קבוע (₪)</option>
                </select>
              </div>

              {/* ערך הנחה */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ערך הנחה {form.discount_type === 'percentage' ? '(%)' : '(₪)'}
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })}
                  min="0"
                  max={form.discount_type === 'percentage' ? 100 : undefined}
                  className="input-field"
                />
              </div>

              {/* מינימום הזמנה */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מינימום הזמנה (₪)</label>
                <input
                  type="number"
                  value={form.min_order_amount}
                  onChange={e => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                  min="0"
                  className="input-field"
                />
              </div>

              {/* מקסימום שימושים */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">מקסימום שימושים (ריק = ללא הגבלה)</label>
                <input
                  type="number"
                  value={form.max_uses || ''}
                  onChange={e => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : undefined })}
                  min="1"
                  placeholder="ללא הגבלה"
                  className="input-field"
                />
              </div>

              {/* תוקף */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תוקף עד (ריק = ללא הגבלה)</label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* תיאור */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">תיאור (אופציונלי)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="למשל: הנחת קיץ ללקוחות חדשים"
                  className="input-field"
                />
              </div>
            </div>

            {/* תצוגה מקדימה */}
            {form.code && (
              <div className="coupon-card mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gold-600 font-numbers">{form.code}</div>
                    <div className="text-sm text-gray-600">{form.description || 'קופון הנחה'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gold-600">
                      {form.discount_type === 'percentage' ? `${form.discount_value}%` : `₪${form.discount_value}`}
                    </div>
                    {form.min_order_amount > 0 && (
                      <div className="text-xs text-gray-500">בקנייה מעל ₪{form.min_order_amount}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowForm(false); setEditingCoupon(null); resetForm(); }}
                className="btn-secondary"
              >
                ביטול
              </button>
              <button
                onClick={saveCoupon}
                disabled={!form.code || form.discount_value <= 0}
                className="btn-accent"
              >
                {editingCoupon ? 'עדכן קופון' : 'צור קופון'}
              </button>
            </div>
          </div>
        )}

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-gray-800">{coupons.length}</div>
            <div className="text-sm text-gray-500">סה"כ קופונים</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{coupons.filter(c => c.active).length}</div>
            <div className="text-sm text-gray-500">קופונים פעילים</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-gold-600">{coupons.reduce((sum, c) => sum + c.current_uses, 0)}</div>
            <div className="text-sm text-gray-500">שימושים כוללים</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-red-600">{coupons.filter(c => isExpired(c.valid_until)).length}</div>
            <div className="text-sm text-gray-500">קופונים שפגו</div>
          </div>
        </div>

        {/* רשימת קופונים */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner w-10 h-10"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">עדיין אין קופונים</p>
            <p className="text-gray-400 text-sm mt-1">צור קופון חדש כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon, index) => {
              const expired = isExpired(coupon.valid_until)
              const maxed = isMaxedOut(coupon)
              const isDisabled = !coupon.active || expired || maxed
              
              return (
                <div 
                  key={coupon.id}
                  className={`
                    bg-white rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl slide-up
                    ${isDisabled ? 'opacity-60 border-gray-200' : 'border-gold-200'}
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Header */}
                  <div className={`px-4 py-3 ${isDisabled ? 'bg-gray-100' : 'bg-gradient-to-r from-gold-50 to-amber-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-xl font-bold font-numbers text-gold-600 hover:text-gold-700 flex items-center gap-1"
                        >
                          {coupon.code}
                          {copiedCode === coupon.code ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 opacity-50" />
                          )}
                        </button>
                      </div>
                      <div className={`
                        px-2 py-1 rounded-full text-xs font-bold
                        ${coupon.active && !expired && !maxed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                        }
                      `}>
                        {!coupon.active ? 'מושבת' : expired ? 'פג תוקף' : maxed ? 'נוצל' : 'פעיל'}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {coupon.discount_type === 'percentage' ? (
                          <Percent className="w-5 h-5 text-gold-500" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-gold-500" />
                        )}
                        <span className="text-2xl font-bold text-gray-800">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `₪${coupon.discount_value}`
                          }
                        </span>
                      </div>
                      {coupon.min_order_amount > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          מעל ₪{coupon.min_order_amount}
                        </span>
                      )}
                    </div>

                    {coupon.description && (
                      <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {coupon.valid_until 
                          ? `עד ${new Date(coupon.valid_until).toLocaleDateString('he-IL')}`
                          : 'ללא הגבלת זמן'
                        }
                      </div>
                      <div>
                        שימושים: {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`
                          flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                          ${coupon.active 
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }
                        `}
                      >
                        {coupon.active ? 'השבת' : 'הפעל'}
                      </button>
                      <button
                        onClick={() => editCoupon(coupon)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCoupon(coupon.id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

