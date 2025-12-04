import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Package, Search, Filter, Image, X, Check, ChevronDown, Upload } from 'lucide-react'

type AdditionalProduct = {
  id: number
  name: string
  description?: string
  price: number
  unit: string
  available_units: number
  image_url?: string
  active: boolean
  suggest_tags: string[]
  meal_tags?: string[]
  category?: string
}

const CATEGORIES = ['תבלינים', 'קפואים', 'בסיסים למרק', 'תערובות ציפוי', 'קטניות', 'כללי']

// רשימת התמונות הזמינות בתיקיה
const AVAILABLE_IMAGES = [
  'WhatsApp Image 2025-12-04 at 19.38.04.jpeg',
  'WhatsApp Image 2025-12-04 at 19.38.19.jpeg',
  'WhatsApp Image 2025-12-04 at 19.38.30.jpeg',
  'WhatsApp Image 2025-12-04 at 19.38.37.jpeg',
  'WhatsApp Image 2025-12-04 at 19.39.06.jpeg',
  'WhatsApp Image 2025-12-04 at 19.39.27.jpeg',
  'WhatsApp Image 2025-12-04 at 19.47.13.jpeg',
  'WhatsApp Image 2025-12-04 at 19.47.33.jpeg',
  'WhatsApp Image 2025-12-04 at 19.47.50.jpeg',
  'WhatsApp Image 2025-12-04 at 19.48.18.jpeg',
  'WhatsApp Image 2025-12-04 at 19.49.01.jpeg',
  'WhatsApp Image 2025-12-04 at 19.49.17.jpeg',
  'WhatsApp Image 2025-12-04 at 19.49.31.jpeg',
  'WhatsApp Image 2025-12-04 at 19.49.36.jpeg',
  'WhatsApp Image 2025-12-04 at 19.52.04.jpeg',
  'WhatsApp Image 2025-12-04 at 19.55.51.jpeg',
  'WhatsApp Image 2025-12-04 at 19.56.01.jpeg',
  'WhatsApp Image 2025-12-04 at 19.57.54.jpeg',
  'WhatsApp Image 2025-12-04 at 19.58.03.jpeg',
  'WhatsApp Image 2025-12-04 at 19.58.13.jpeg',
  'WhatsApp Image 2025-12-04 at 19.58.37.jpeg',
  'WhatsApp Image 2025-12-04 at 19.58.48.jpeg',
  'WhatsApp Image 2025-12-04 at 19.59.13.jpeg',
  'WhatsApp Image 2025-12-04 at 19.59.21.jpeg',
  'WhatsApp Image 2025-12-04 at 19.59.29.jpeg',
  'WhatsApp Image 2025-12-04 at 19.59.53.jpeg',
  'WhatsApp Image 2025-12-04 at 20.00.05.jpeg',
  'WhatsApp Image 2025-12-04 at 20.00.17.jpeg',
  'WhatsApp Image 2025-12-04 at 20.00.44.jpeg',
  'WhatsApp Image 2025-12-04 at 20.00.55.jpeg',
  'WhatsApp Image 2025-12-04 at 20.01.04.jpeg',
  'WhatsApp Image 2025-12-04 at 20.03.46.jpeg',
  'WhatsApp Image 2025-12-04 at 20.03.58.jpeg',
  'WhatsApp Image 2025-12-04 at 20.04.07.jpeg',
  'WhatsApp Image 2025-12-04 at 20.04.12.jpeg',
  'WhatsApp Image 2025-12-04 at 20.05.46.jpeg',
  'WhatsApp Image 2025-12-04 at 20.05.54.jpeg',
  'WhatsApp Image 2025-12-04 at 20.06.19.jpeg',
  'WhatsApp Image 2025-12-04 at 20.08.43.jpeg',
  'WhatsApp Image 2025-12-04 at 20.08.52.jpeg',
  'WhatsApp Image 2025-12-04 at 20.09.00.jpeg',
  'WhatsApp Image 2025-12-04 at 20.09.08.jpeg',
  'WhatsApp Image 2025-12-04 at 20.10.22.jpeg',
  'WhatsApp Image 2025-12-04 at 20.11.03.jpeg',
  'WhatsApp Image 2025-12-04 at 20.11.13.jpeg',
  'WhatsApp Image 2025-12-04 at 20.11.18.jpeg',
  'WhatsApp Image 2025-12-04 at 20.13.05.jpeg',
  'WhatsApp Image 2025-12-04 at 20.13.15.jpeg',
  'WhatsApp Image 2025-12-04 at 20.13.23.jpeg',
  'WhatsApp Image 2025-12-04 at 20.13.31.jpeg',
  'WhatsApp Image 2025-12-04 at 20.13.40.jpeg',
  'WhatsApp Image 2025-12-04 at 20.13.48.jpeg',
  'WhatsApp Image 2025-12-04 at 20.13.55.jpeg',
  'WhatsApp Image 2025-12-04 at 20.14.43.jpeg',
  'WhatsApp Image 2025-12-04 at 20.14.54.jpeg',
  'WhatsApp Image 2025-12-04 at 20.15.01.jpeg',
  'WhatsApp Image 2025-12-04 at 20.15.08.jpeg',
  'WhatsApp Image 2025-12-04 at 20.15.12.jpeg',
  'WhatsApp Image 2025-12-04 at 20.15.54.jpeg',
  'WhatsApp Image 2025-12-04 at 20.16.06.jpeg',
  'WhatsApp Image 2025-12-04 at 20.16.17.jpeg',
  'WhatsApp Image 2025-12-04 at 20.16.25.jpeg',
  'WhatsApp Image 2025-12-04 at 20.18.04.jpeg',
  'WhatsApp Image 2025-12-04 at 20.18.10.jpeg',
  'WhatsApp Image 2025-12-04 at 20.18.33.jpeg',
  'WhatsApp Image 2025-12-04 at 20.18.44.jpeg',
  'WhatsApp Image 2025-12-04 at 20.18.52.jpeg',
  'WhatsApp Image 2025-12-04 at 20.18.56.jpeg',
  'WhatsApp Image 2025-12-04 at 20.19.23.jpeg',
  'WhatsApp Image 2025-12-04 at 20.19.30.jpeg',
  'WhatsApp Image 2025-12-04 at 20.19.36.jpeg',
  'WhatsApp Image 2025-12-04 at 20.20.12.jpeg',
  'WhatsApp Image 2025-12-04 at 20.20.23.jpeg',
  'WhatsApp Image 2025-12-04 at 20.20.35.jpeg',
  'WhatsApp Image 2025-12-04 at 20.21.06.jpeg',
  'WhatsApp Image 2025-12-04 at 20.21.25.jpeg',
  'WhatsApp Image 2025-12-04 at 20.21.46.jpeg',
  'WhatsApp Image 2025-12-04 at 20.23.36.jpeg',
  'WhatsApp Image 2025-12-04 at 20.23.50.jpeg',
  'WhatsApp Image 2025-12-04 at 20.24.10.jpeg',
  'WhatsApp Image 2025-12-04 at 20.24.58.jpeg',
  'WhatsApp Image 2025-12-04 at 20.25.08.jpeg',
  'WhatsApp Image 2025-12-04 at 20.25.30.jpeg',
  'WhatsApp Image 2025-12-04 at 20.25.38.jpeg',
  'WhatsApp Image 2025-12-04 at 20.25.50.jpeg',
  'WhatsApp Image 2025-12-04 at 20.27.05.jpeg',
  'WhatsApp Image 2025-12-04 at 20.27.17.jpeg',
  'WhatsApp Image 2025-12-04 at 20.27.27.jpeg',
  'WhatsApp Image 2025-12-04 at 20.27.38.jpeg',
  'WhatsApp Image 2025-12-04 at 20.28.05.jpeg',
]

const mealTagOptions = ['סושי','סשימי','תנור','מחבת','טיגון','שיפודים','קציצות','מרק','דג חריף', 'גריל', 'סלט', 'ארוחה', 'קינוח']

export default function AdminAdditionalProducts() {
  const [items, setItems] = useState<AdditionalProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<AdditionalProduct>>({ 
    unit: 'unit', 
    active: true, 
    suggest_tags: [], 
    meal_tags: [],
    category: 'כללי'
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showImagePicker, setShowImagePicker] = useState<number | null>(null)
  const [selectedLocalImage, setSelectedLocalImage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('additional_products').select('*').order('category').order('name')
    if (!error) setItems((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `product-images/${fileName}`
      const { error: upErr } = await supabase.storage.from('fish-images').upload(path, file, { upsert: false })
      if (upErr) return null
      const { data } = supabase.storage.from('fish-images').getPublicUrl(path)
      return data.publicUrl
    } catch {
      return null
    }
  }

  const save = async () => {
    setLoading(true)
    let imageUrl: string | null = null
    
    // העלאת תמונה מהמכשיר
    if (imageFile) {
      const uploaded = await uploadImage(imageFile)
      if (uploaded) imageUrl = uploaded
    }
    // בחירת תמונה מקומית מהתיקיה
    else if (selectedLocalImage) {
      imageUrl = `/fish_pro_imgs/${selectedLocalImage}`
    }

    const payload = {
      name: form.name || '',
      description: form.description || '',
      price: Number(form.price || 0),
      unit: 'unit',
      available_units: Number(form.available_units || 0),
      image_url: imageUrl,
      active: Boolean(form.active),
      suggest_tags: [],
      meal_tags: form.meal_tags || [],
      category: form.category || 'כללי'
    }
    const { error } = await supabase.from('additional_products').insert([payload])
    if (!error) { 
      setForm({ unit: 'unit', active: true, suggest_tags: [], meal_tags: [], category: 'כללי' })
      setImageFile(null)
      setSelectedLocalImage(null)
      await load() 
    }
    setLoading(false)
  }

  const updateItem = async (id: number, patch: Partial<AdditionalProduct>) => {
    const { error } = await supabase.from('additional_products').update(patch as any).eq('id', id)
    if (!error) await load()
  }

  const updateItemImage = async (id: number, imageUrl: string) => {
    await updateItem(id, { image_url: imageUrl })
    setShowImagePicker(null)
  }

  const remove = async (id: number) => {
    if (!confirm('האם למחוק את המוצר?')) return
    const { error } = await supabase.from('additional_products').delete().eq('id', id)
    if (!error) await load()
  }

  // סינון מוצרים
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // קיבוץ לפי קטגוריה
  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'כללי'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {} as Record<string, AdditionalProduct[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">מוצרים משלימים</h1>
                <p className="text-sm text-gray-600">ניהול מלאי והצעות מוצרים נלווים</p>
              </div>
            </div>
            <Link to="/admin/dashboard" className="btn-secondary text-sm">חזרה לדשבורד</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        {/* טופס הוספה */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            הוסף מוצר חדש
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input 
              className="input-field" 
              placeholder="שם מוצר" 
              value={form.name || ''} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
            />
            <input 
              className="input-field" 
              placeholder="מחיר" 
              type="number" 
              step="0.01" 
              value={form.price as any || ''} 
              onChange={e => setForm({ ...form, price: Number(e.target.value) })} 
            />
            <input 
              className="input-field" 
              placeholder="כמות זמינה" 
              type="number" 
              value={form.available_units as any || ''} 
              onChange={e => setForm({ ...form, available_units: Number(e.target.value) })} 
            />
            <select 
              className="input-field"
              value={form.category || 'כללי'}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* העלאת תמונה */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                העלה תמונה מהמכשיר
              </label>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={e => {
                  setImageFile(e.target.files?.[0] || null)
                  setSelectedLocalImage(null)
                }} 
                className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" 
              />
            </div>

            {/* בחירת תמונה מקומית */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                או בחר תמונה מהגלריה
              </label>
              <select
                className="input-field"
                value={selectedLocalImage || ''}
                onChange={e => {
                  setSelectedLocalImage(e.target.value || null)
                  setImageFile(null)
                }}
              >
                <option value="">בחר תמונה...</option>
                {AVAILABLE_IMAGES.map(img => (
                  <option key={img} value={img}>{img.replace('WhatsApp Image 2025-12-04 at ', '').replace('.jpeg', '')}</option>
                ))}
              </select>
              {selectedLocalImage && (
                <div className="mt-2">
                  <img 
                    src={`/fish_pro_imgs/${selectedLocalImage}`} 
                    alt="תצוגה מקדימה" 
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
              </div>

          {/* שיוך למנות */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">שיוך למנות (בחר בלחיצה):</div>
                <div className="flex flex-wrap gap-2">
                  {mealTagOptions.map(tag => {
                    const selected = (form.meal_tags || []).includes(tag)
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          const current = new Set(form.meal_tags || [])
                          if (current.has(tag)) current.delete(tag); else current.add(tag)
                          setForm({ ...form, meal_tags: Array.from(current) })
                        }}
                    className={`${selected ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 border border-gray-200'} px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>

          <button 
            disabled={loading || !form.name} 
            onClick={save} 
            className="btn-primary w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            הוסף מוצר
          </button>
        </div>

        {/* חיפוש וסינון */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חפש מוצר..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pr-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="input-field min-w-[160px]"
              >
                <option value="all">כל הקטגוריות</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            מציג {filteredItems.length} מוצרים מתוך {items.length}
          </div>
        </div>

        {/* רשימת מוצרים לפי קטגוריות */}
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              {category}
              <span className="text-sm font-normal text-gray-500">({categoryItems.length})</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map(it => (
                <div key={it.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* תמונה */}
                      <div className="relative group">
                {it.image_url ? (
                          <img 
                            src={it.image_url} 
                            alt={it.name} 
                            className="w-24 h-24 object-cover rounded-xl border border-gray-200" 
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-200 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <button
                          onClick={() => setShowImagePicker(showImagePicker === it.id ? null : it.id)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center"
                        >
                          <Image className="w-6 h-6 text-white" />
                        </button>
                      </div>

                      {/* פרטים */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{it.name}</h4>
                        <div className="text-lg font-bold text-amber-600">₪{it.price.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">במלאי: {it.available_units}</div>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${it.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {it.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {it.active ? 'פעיל' : 'מושבת'}
                        </div>
                      </div>
                    </div>

                    {/* בורר תמונות */}
                    {showImagePicker === it.id && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">בחר תמונה:</div>
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                          {AVAILABLE_IMAGES.map(img => (
                            <button
                              key={img}
                              onClick={() => updateItemImage(it.id, `/fish_pro_imgs/${img}`)}
                              className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-amber-500 transition-all"
                            >
                              <img 
                                src={`/fish_pro_imgs/${img}`} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setShowImagePicker(null)}
                          className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                          סגור
                        </button>
                      </div>
                    )}

                    {/* תגיות */}
                    {(it.meal_tags?.length ?? 0) > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                        {mealTagOptions.map(tag => {
                          const selected = (it.meal_tags || []).includes(tag)
                          return (
                            <button
                              type="button"
                              key={`${it.id}-${tag}`}
                              onClick={async () => {
                                const set = new Set(it.meal_tags || [])
                                if (set.has(tag)) set.delete(tag); else set.add(tag)
                                await updateItem(it.id, { meal_tags: Array.from(set) } as any)
                              }}
                                className={`${selected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'} px-2 py-0.5 rounded-full text-xs transition-all hover:scale-105`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* פעולות */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <select
                        value={it.category || 'כללי'}
                        onChange={e => updateItem(it.id, { category: e.target.value })}
                        className="col-span-1 text-xs px-2 py-2 border border-gray-200 rounded-lg bg-white"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => updateItem(it.id, { active: !it.active })} 
                        className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${it.active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                  {it.active ? 'השבת' : 'הפעל'}
                </button>
                      <button 
                        onClick={() => remove(it.id)} 
                        className="text-xs px-3 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                      >
                        מחק
                      </button>
                    </div>
              </div>
            </div>
          ))}
        </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">לא נמצאו מוצרים</p>
          </div>
        )}
      </main>
    </div>
  )
}
