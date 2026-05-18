import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowRight, Check, MessageSquare, Phone, User, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface FeedbackItem {
  item_type: 'fish' | 'product'
  item_id: number
  item_name: string
  item_category?: string
  current_price?: number
  new_price?: number | null
  current_description?: string | null
  new_description?: string | null
  notes?: string | null
}

interface FeedbackRow {
  id: number
  reviewer_name: string | null
  reviewer_phone: string | null
  feedback_items: FeedbackItem[]
  reviewed: boolean
  created_at: string
}

export default function AdminCatalogFeedback() {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('catalog_feedback')
      .select('*')
      .order('created_at', { ascending: false })
    setRows((data as FeedbackRow[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleReviewed = async (id: number, reviewed: boolean) => {
    await supabase.from('catalog_feedback').update({ reviewed: !reviewed }).eq('id', id)
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, reviewed: !reviewed } : r)))
  }

  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <div className="min-h-screen bg-[#F5F9FA] py-4" dir="rtl">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/admin/dashboard" className="text-[#023859] flex items-center gap-1">
            <ArrowRight className="w-4 h-4" /> חזרה
          </Link>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-[#023859] mb-1">הערות סקירת קטלוג</h1>
        <p className="text-sm text-neutral-600 mb-6">
          הערות שהתקבלו דרך הדף הציבורי <code className="bg-neutral-100 px-1 rounded">/catalog-review</code>
        </p>

        {loading ? (
          <div className="text-[#023859]">טוען...</div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-neutral-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
            עדיין לא התקבלו הערות
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const isOpen = expanded[r.id]
              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border shadow-sm ${
                    r.reviewed ? 'border-green-200 opacity-70' : 'border-[#B4D2D9]/40'
                  }`}
                >
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [r.id]: !isOpen }))}
                    className="w-full p-4 text-right"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 font-semibold text-[#023859]">
                            <User className="w-4 h-4" />
                            {r.reviewer_name || 'אנונימי'}
                          </span>
                          {r.reviewer_phone && (
                            <span className="flex items-center gap-1 text-neutral-600">
                              <Phone className="w-4 h-4" />
                              {r.reviewer_phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-neutral-500 text-xs">
                            <Clock className="w-3 h-3" />
                            {fmtDate(r.created_at)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-neutral-700">
                          {r.feedback_items.length} הערות
                          {' '}({r.feedback_items.filter((i) => i.item_type === 'fish').length} דגים,
                          {' '}{r.feedback_items.filter((i) => i.item_type === 'product').length} מוצרים)
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {r.reviewed && (
                          <span className="text-green-600 text-xs flex items-center gap-1">
                            <Check className="w-3 h-3" /> טופל
                          </span>
                        )}
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-neutral-200 p-4 space-y-3 bg-[#F5F9FA]/40">
                      <div className="flex justify-end">
                        <button
                          onClick={() => toggleReviewed(r.id, r.reviewed)}
                          className={`text-xs px-3 py-1.5 rounded-lg ${
                            r.reviewed
                              ? 'bg-neutral-200 text-neutral-700'
                              : 'bg-green-600 text-white'
                          }`}
                        >
                          {r.reviewed ? 'בטל סימון "טופל"' : 'סמן כטופל'}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {r.feedback_items.map((item, idx) => (
                          <div key={idx} className="bg-white border border-neutral-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded text-xs bg-[#B4D2D9]/30 text-[#023859]">
                                {item.item_type === 'fish' ? 'דג' : 'מוצר'}
                                {item.item_category ? ` • ${item.item_category}` : ''}
                              </span>
                              <span className="font-semibold text-[#023859]">{item.item_name}</span>
                            </div>
                            {(item.new_price !== null && item.new_price !== undefined) && (
                              <div className="text-sm">
                                <span className="text-neutral-500">מחיר:</span>{' '}
                                <s className="text-neutral-400">{item.current_price}</s>
                                {' → '}
                                <span className="font-semibold text-[#026873]">{item.new_price}</span>
                              </div>
                            )}
                            {item.new_description && (
                              <div className="text-sm mt-1">
                                <span className="text-neutral-500">תיאור חדש:</span>{' '}
                                <span className="text-[#023859]">{item.new_description}</span>
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-sm mt-1 italic">
                                <span className="text-neutral-500">הערה:</span> {item.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
