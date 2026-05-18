import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check, ChevronDown, ChevronUp, MessageSquare, Save, Tag, Fish as FishIcon, Package } from 'lucide-react'

type ItemType = 'fish' | 'product'

interface FishRow {
  id: number
  name: string
  water_type: 'saltwater' | 'freshwater' | 'other'
  price_per_kg: number
  sale_unit: string
  image_url: string | null
  description: string | null
  is_active: boolean
}

interface ProductRow {
  id: number
  name: string
  category: string
  price: number
  unit: string
  image_url: string | null
  description: string | null
  active: boolean
}

interface FeedbackEntry {
  new_price?: number | ''
  new_description?: string
  notes?: string
}

const WATER_LABEL: Record<string, string> = {
  saltwater: 'דגי ים',
  freshwater: 'דגי בריכה',
  other: 'פרימיום',
}

export default function CatalogReview() {
  const [fishes, setFishes] = useState<FishRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewerName, setReviewerName] = useState('')
  const [reviewerPhone, setReviewerPhone] = useState('')
  const [activeTab, setActiveTab] = useState<'fish' | 'product'>('fish')
  const [fishFeedback, setFishFeedback] = useState<Record<number, FeedbackEntry>>({})
  const [productFeedback, setProductFeedback] = useState<Record<number, FeedbackEntry>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    ;(async () => {
      try {
        const [{ data: fishData }, { data: productData }] = await Promise.all([
          supabase
            .from('fish_types')
            .select('id,name,water_type,price_per_kg,sale_unit,image_url,description,is_active')
            .eq('is_active', true)
            .order('water_type')
            .order('name'),
          supabase
            .from('additional_products')
            .select('id,name,category,price,unit,image_url,description,active')
            .eq('active', true)
            .order('category')
            .order('name'),
        ])
        setFishes((fishData as FishRow[]) || [])
        setProducts((productData as ProductRow[]) || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const productCategories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'all') return products
    return products.filter((p) => p.category === categoryFilter)
  }, [products, categoryFilter])

  const fishWithFeedback = Object.keys(fishFeedback).filter((k) => {
    const f = fishFeedback[Number(k)]
    return f && ((f.new_price !== undefined && f.new_price !== '') || f.new_description || f.notes)
  }).length
  const productWithFeedback = Object.keys(productFeedback).filter((k) => {
    const f = productFeedback[Number(k)]
    return f && ((f.new_price !== undefined && f.new_price !== '') || f.new_description || f.notes)
  }).length
  const totalFeedback = fishWithFeedback + productWithFeedback

  const updateFish = (id: number, patch: Partial<FeedbackEntry>) => {
    setFishFeedback((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }
  const updateProduct = (id: number, patch: Partial<FeedbackEntry>) => {
    setProductFeedback((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  const handleSubmit = async () => {
    if (totalFeedback === 0) {
      alert('לא הוזנו הערות. תפתח פריט ותכתוב הערה לפני שמירה.')
      return
    }
    setSubmitting(true)
    try {
      const items: any[] = []
      fishes.forEach((f) => {
        const fb = fishFeedback[f.id]
        if (!fb) return
        const hasContent = (fb.new_price !== undefined && fb.new_price !== '') || fb.new_description || fb.notes
        if (!hasContent) return
        items.push({
          item_type: 'fish',
          item_id: f.id,
          item_name: f.name,
          current_price: f.price_per_kg,
          new_price: fb.new_price !== '' && fb.new_price !== undefined ? Number(fb.new_price) : null,
          current_description: f.description,
          new_description: fb.new_description || null,
          notes: fb.notes || null,
        })
      })
      products.forEach((p) => {
        const fb = productFeedback[p.id]
        if (!fb) return
        const hasContent = (fb.new_price !== undefined && fb.new_price !== '') || fb.new_description || fb.notes
        if (!hasContent) return
        items.push({
          item_type: 'product',
          item_id: p.id,
          item_name: p.name,
          item_category: p.category,
          current_price: p.price,
          new_price: fb.new_price !== '' && fb.new_price !== undefined ? Number(fb.new_price) : null,
          current_description: p.description,
          new_description: fb.new_description || null,
          notes: fb.notes || null,
        })
      })

      const { error } = await supabase.from('catalog_feedback').insert([{
        reviewer_name: reviewerName || null,
        reviewer_phone: reviewerPhone || null,
        feedback_items: items,
      }])
      if (error) throw error
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: any) {
      alert('שגיאה בשמירה: ' + (e?.message || 'unknown'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9FA] flex items-center justify-center">
        <div className="text-[#023859]">טוען קטלוג...</div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F9FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-serif text-2xl text-[#023859] mb-2">תודה רבה!</h1>
          <p className="text-neutral-600">
            ההערות שלך נשמרו בהצלחה. הצוות יקבל את המידע ויחזור אליך בהקדם.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F9FA] pb-32" dir="rtl">
      {/* Hero */}
      <header className="bg-[#023859] text-white">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 text-center">
          <h1 className="font-serif text-2xl md:text-3xl mb-2">סקירת קטלוג</h1>
          <p className="text-[#B4D2D9] text-sm md:text-base leading-relaxed">
            לחץ על כל פריט כדי להציע מחיר חדש, לתקן תיאור או להוסיף הערה.
            <br />
            בסיום — לחץ <strong>שמור</strong> בתחתית.
          </p>
        </div>
      </header>

      {/* Reviewer details */}
      <section className="max-w-3xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[#B4D2D9]/40 p-4 md:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-600 mb-1">שמך (אופציונלי)</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="לדוגמה: אבי כהן"
                className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-[#023859] focus:border-[#026873] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">טלפון (אופציונלי)</label>
              <input
                type="tel"
                value={reviewerPhone}
                onChange={(e) => setReviewerPhone(e.target.value)}
                placeholder="0501234567"
                className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-[#023859] focus:border-[#026873] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 mt-4 sticky top-0 z-30 bg-[#F5F9FA] py-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('fish')}
            className={`flex-1 h-11 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'fish'
                ? 'bg-[#023859] text-white'
                : 'bg-white text-[#023859] border border-[#B4D2D9]'
            }`}
          >
            <FishIcon className="w-4 h-4" />
            דגים ({fishes.length}){fishWithFeedback > 0 && <span className="text-xs">• {fishWithFeedback} הערות</span>}
          </button>
          <button
            onClick={() => setActiveTab('product')}
            className={`flex-1 h-11 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
              activeTab === 'product'
                ? 'bg-[#023859] text-white'
                : 'bg-white text-[#023859] border border-[#B4D2D9]'
            }`}
          >
            <Package className="w-4 h-4" />
            מוצרים ({products.length}){productWithFeedback > 0 && <span className="text-xs">• {productWithFeedback} הערות</span>}
          </button>
        </div>

        {activeTab === 'product' && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {productCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`shrink-0 px-3 h-9 rounded-lg text-sm transition ${
                  categoryFilter === cat
                    ? 'bg-[#026873] text-white'
                    : 'bg-white text-[#023859] border border-[#B4D2D9]'
                }`}
              >
                {cat === 'all' ? 'הכל' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <section className="max-w-3xl mx-auto px-4 mt-4">
        <div className="space-y-3">
          {activeTab === 'fish'
            ? fishes.map((f) => {
                const key = `f-${f.id}`
                const isOpen = expanded[key]
                const fb = fishFeedback[f.id] || {}
                const hasContent =
                  (fb.new_price !== undefined && fb.new_price !== '') || fb.new_description || fb.notes
                return (
                  <ItemCard
                    key={key}
                    image={f.image_url}
                    title={f.name}
                    badge={WATER_LABEL[f.water_type] || f.water_type}
                    currentPrice={Number(f.price_per_kg)}
                    priceLabel="₪/ק״ג"
                    description={f.description}
                    isOpen={!!isOpen}
                    hasContent={!!hasContent}
                    onToggle={() => toggle(key)}
                    feedback={fb}
                    onChange={(patch) => updateFish(f.id, patch)}
                  />
                )
              })
            : filteredProducts.map((p) => {
                const key = `p-${p.id}`
                const isOpen = expanded[key]
                const fb = productFeedback[p.id] || {}
                const hasContent =
                  (fb.new_price !== undefined && fb.new_price !== '') || fb.new_description || fb.notes
                return (
                  <ItemCard
                    key={key}
                    image={p.image_url}
                    title={p.name}
                    badge={p.category}
                    currentPrice={Number(p.price)}
                    priceLabel="₪"
                    description={p.description}
                    isOpen={!!isOpen}
                    hasContent={!!hasContent}
                    onToggle={() => toggle(key)}
                    feedback={fb}
                    onChange={(patch) => updateProduct(p.id, patch)}
                  />
                )
              })}
        </div>
      </section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-[#B4D2D9] shadow-lg z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-[#023859]">
            <div className="font-semibold">{totalFeedback} פריטים עם הערות</div>
            <div className="text-xs text-neutral-500">דגים: {fishWithFeedback} • מוצרים: {productWithFeedback}</div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || totalFeedback === 0}
            className="flex items-center gap-2 px-5 h-11 bg-[#026873] text-white rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#023859] transition"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'שולח...' : 'שמור הערות'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ItemCardProps {
  image: string | null
  title: string
  badge?: string
  currentPrice: number
  priceLabel: string
  description: string | null
  isOpen: boolean
  hasContent: boolean
  onToggle: () => void
  feedback: FeedbackEntry
  onChange: (patch: Partial<FeedbackEntry>) => void
}

function ItemCard({
  image, title, badge, currentPrice, priceLabel, description,
  isOpen, hasContent, onToggle, feedback, onChange,
}: ItemCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition ${
        hasContent ? 'border-[#026873]' : 'border-[#B4D2D9]/40'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 text-right"
      >
        <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <FishIcon className="w-8 h-8 text-neutral-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#023859] truncate">{title}</span>
            {hasContent && (
              <span className="shrink-0 inline-flex items-center gap-1 text-xs text-[#026873]">
                <MessageSquare className="w-3 h-3" />
                יש הערה
              </span>
            )}
          </div>
          {badge && (
            <span className="inline-flex items-center gap-1 text-xs bg-[#B4D2D9]/30 text-[#023859] px-2 py-0.5 rounded">
              <Tag className="w-3 h-3" />
              {badge}
            </span>
          )}
          <div className="text-sm text-neutral-700 mt-1">
            מחיר נוכחי: <span className="font-medium">{currentPrice} {priceLabel}</span>
          </div>
        </div>
        <div className="shrink-0 text-[#6FA8BF]">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-[#B4D2D9]/40 p-3 space-y-3 bg-[#F5F9FA]/50">
          {description && (
            <div className="text-xs text-neutral-600 bg-white rounded-lg p-2 border border-neutral-200">
              <span className="font-medium">תיאור נוכחי:</span> {description}
            </div>
          )}
          <div>
            <label className="block text-xs text-neutral-700 mb-1">מחיר חדש (אופציונלי)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={feedback.new_price ?? ''}
              onChange={(e) => onChange({ new_price: e.target.value === '' ? '' : Number(e.target.value) })}
              placeholder={`${currentPrice}`}
              className="w-full h-11 px-3 border border-neutral-300 rounded-lg text-[#023859] focus:border-[#026873] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-700 mb-1">תיאור חדש (אופציונלי)</label>
            <textarea
              rows={2}
              value={feedback.new_description ?? ''}
              onChange={(e) => onChange({ new_description: e.target.value })}
              placeholder="לדוגמה: דג ים טרי, מתאים לסשימי..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-[#023859] focus:border-[#026873] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-700 mb-1">הערות חופשיות</label>
            <textarea
              rows={2}
              value={feedback.notes ?? ''}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="כל דבר שתרצה לציין על הפריט"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-[#023859] focus:border-[#026873] focus:outline-none text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
