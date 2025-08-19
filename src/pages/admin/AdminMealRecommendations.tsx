import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminBottomNav from '../../components/admin/AdminBottomNav'

type Fish = { id: number; name: string }
type Cut = { id: number; cut_name: string }
type AdditionalProduct = { id: number; name: string; active: boolean }
type Rec = { id: number; fish_id: number; cut_type_id: number; meal_name: string; recommended_products: string[] }

export default function AdminMealRecommendations() {
  const [fish, setFish] = useState<Fish[]>([])
  const [cuts, setCuts] = useState<Cut[]>([])
  const [additionalProducts, setAdditionalProducts] = useState<AdditionalProduct[]>([])
  const [recs, setRecs] = useState<Rec[]>([])
  const [loading, setLoading] = useState(false)

  // form state
  const [fishId, setFishId] = useState<number | ''>('')
  const [cutId, setCutId] = useState<number | ''>('')
  const [mealName, setMealName] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [f, c, ap, r] = await Promise.all([
        supabase.from('fish_types').select('id, name').order('name'),
        supabase.from('cut_types').select('id, cut_name').order('id'),
        supabase.from('additional_products').select('id, name, active').eq('active', true).order('name'),
        supabase.from('meal_recommendations').select('*').order('id', { ascending: false }),
      ])
      setFish((f.data as any) || [])
      setCuts((c.data as any) || [])
      setAdditionalProducts((ap.data as any) || [])
      setRecs((r.data as any) || [])
      setLoading(false)
    }
    load()
  }, [])

  const createRec = async () => {
    console.log('createRec called with:', { fishId, cutId, mealName, selectedProducts })
    
    if (!fishId || !cutId || !mealName.trim() || selectedProducts.length === 0) {
      console.log('Validation failed:', { fishId, cutId, mealName: mealName.trim(), selectedProductsLength: selectedProducts.length })
      return
    }
    
    setLoading(true)
    
    try {
      // נסה insert רגיל במקום upsert
      const { data, error } = await supabase.from('meal_recommendations').insert({
        fish_id: Number(fishId),
        cut_type_id: Number(cutId),
        meal_name: mealName.trim(),
        recommended_products: selectedProducts,
      })
      
      console.log('Upsert result:', { data, error })
      
      if (error) {
        console.error('Error saving recommendation:', error)
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          alert('טבלת meal_recommendations לא קיימת במסד הנתונים. יש צורך ליצור אותה.')
        } else {
          alert(`שגיאה בשמירה: ${error.message}`)
        }
      } else {
        console.log('Success! Refreshing list...')
        const { data: refreshedData } = await supabase.from('meal_recommendations').select('*').order('id', { ascending: false })
        setRecs((refreshedData as any) || [])
        setFishId(''); setCutId(''); setMealName(''); setSelectedProducts([])
        
        // הודעת הצלחה
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-depth z-50'
        notification.innerHTML = `
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>המלצה נשמרה בהצלחה!</span>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('שגיאה לא צפויה')
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = (productName: string) => {
    setSelectedProducts(prev => 
      prev.includes(productName) 
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
    )
  }

  const removeRec = async (id: number) => {
    const { error } = await supabase.from('meal_recommendations').delete().eq('id', id)
    if (!error) setRecs(recs.filter(r => r.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">המלצות מנות</h1>
              <p className="text-gray-600">שיוך דג + סוג חיתוך למוצרים מומלצים</p>
            </div>
            <Link to="/admin/dashboard" className="btn-secondary">חזרה לדשבורד</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* התראה על מסד נתונים */}
        {recs.length === 0 && !loading && (
          <div className="card mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">טבלת המלצות מנות לא מוכנה</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  יש צורך ליצור את הטבלה במסד הנתונים. הקובץ SQL הנדרש:
                </p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS public.meal_recommendations (
    id BIGSERIAL PRIMARY KEY,
    fish_id BIGINT NOT NULL REFERENCES public.fish_types(id),
    cut_type_id BIGINT NOT NULL REFERENCES public.cut_types(id),
    meal_name TEXT NOT NULL,
    recommended_products TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fish_id, cut_type_id, meal_name)
);
ALTER TABLE public.meal_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.meal_recommendations FOR ALL USING (true);`}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* יצירה חכמה */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">יצירת המלצת מנה חדשה</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">דג</label>
              <select value={fishId} onChange={e => setFishId(e.target.value ? Number(e.target.value) : '')} className="input-field">
                <option value="">בחר דג</option>
                {fish.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סוג חיתוך</label>
              <select value={cutId} onChange={e => setCutId(e.target.value ? Number(e.target.value) : '')} className="input-field">
                <option value="">בחר חיתוך</option>
                {cuts.map(c => <option key={c.id} value={c.id}>{c.cut_name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם המנה</label>
              <input 
                value={mealName} 
                onChange={e => setMealName(e.target.value)} 
                placeholder="למשל: סשימי, טמפורה, גריל..."
                className="input-field" 
              />
            </div>
          </div>

          {/* בחירת מוצרים מהחנות */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              מוצרים מומלצים מהחנות ({selectedProducts.length} נבחרו)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {additionalProducts.map(product => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProduct(product.name)}
                  className={`p-3 text-sm border rounded-lg transition-colors text-right ${
                    selectedProducts.includes(product.name)
                      ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {selectedProducts.includes(product.name) && '✓ '}
                  {product.name}
                </button>
              ))}
            </div>
            {additionalProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>לא נמצאו מוצרים משלימים זמינים</p>
                <Link to="/admin/additional-products" className="text-primary-600 hover:text-primary-700 text-sm">
                  הוסף מוצרים משלימים →
                </Link>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              נבחרו: {selectedProducts.join(', ') || 'לא נבחרו מוצרים'}
            </div>
            <button 
              onClick={createRec} 
              disabled={loading || !fishId || !cutId || !mealName || selectedProducts.length === 0} 
              className="btn-primary"
            >
              {loading ? 'שומר...' : 'שמור המלצה'}
            </button>
          </div>
        </div>

        {/* רשימת המלצות קיימות */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">המלצות קיימות ({recs.length})</h2>
            {recs.length > 0 && (
              <div className="text-sm text-gray-500">
                סה"כ מוצרים מומלצים: {[...new Set(recs.flatMap(r => r.recommended_products))].length}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recs.map(r => {
              const fishName = fish.find(f => f.id === r.fish_id)?.name || 'לא ידוע'
              const cutName = cuts.find(c => c.id === r.cut_type_id)?.cut_name || 'לא ידוע'
              
              return (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{fishName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm bg-gray-200 px-2 py-1 rounded text-gray-700">{cutName}</span>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-primary-600">{r.meal_name}</span>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-500 mb-1">מוצרים מומלצים:</div>
                        <div className="flex flex-wrap gap-1">
                          {r.recommended_products.map((product, idx) => (
                            <span 
                              key={idx}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                            >
                              {product}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeRec(r.id)} 
                      className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      title="מחק המלצה"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {recs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🍽️</div>
              <p className="text-lg font-medium mb-2">אין המלצות מנות עדיין</p>
              <p className="text-sm">צור את ההמלצה הראשונה באמצעות הטופס למעלה</p>
            </div>
          )}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  )
}

