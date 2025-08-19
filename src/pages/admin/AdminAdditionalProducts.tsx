import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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
}

export default function AdminAdditionalProducts() {
  const [items, setItems] = useState<AdditionalProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<AdditionalProduct>>({ unit: 'unit', active: true, suggest_tags: [], meal_tags: [] })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const mealTagOptions = ['סושי','סשימי','תנור','מחבת','טיגון','שיפודים','קציצות','מרק','דג חריף']

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('additional_products').select('*').order('name')
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
    if (imageFile) {
      const uploaded = await uploadImage(imageFile)
      if (uploaded) imageUrl = uploaded
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
      meal_tags: form.meal_tags || []
    }
    const { error } = await supabase.from('additional_products').insert([payload])
    if (!error) { setShowAdd(false); setForm({ unit: 'unit', active: true, suggest_tags: [], meal_tags: [] }); setImageFile(null); await load() }
    setLoading(false)
  }

  const updateItem = async (id: number, patch: Partial<AdditionalProduct>) => {
    const { error } = await supabase.from('additional_products').update(patch as any).eq('id', id)
    if (!error) await load()
  }

  const remove = async (id: number) => {
    const { error } = await supabase.from('additional_products').delete().eq('id', id)
    if (!error) await load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">מוצרים משלימים</h1>
              <p className="text-gray-600">ניהול מלאי והצעות מוצרים נלווים</p>
            </div>
            <Link to="/admin/dashboard" className="btn-secondary">חזרה לדשבורד</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input-field" placeholder="שם מוצר" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input-field" placeholder="מחיר" type="number" step="0.01" value={form.price as any || ''} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              {/* שדה יחידה מיותר – ברירת המחדל תמיד יחידה */}
              <input className="input-field" placeholder="כמות זמינה (יחידות)" type="number" value={form.available_units as any || ''} onChange={e => setForm({ ...form, available_units: Number(e.target.value) })} />
              <div>
                <label className="block text-sm text-neutral-700 mb-1">העלה תמונה / צילום מהנייד</label>
                <input type="file" accept="image/*" capture="environment" onChange={e => setImageFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
              </div>
              <div className="bg-white border rounded-xl p-3">
                <div className="text-sm text-neutral-700 mb-2">שיוך למנות (בחר בלחיצה):</div>
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
                        className={`${selected ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700'} px-3 py-1 rounded-full text-sm`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <button disabled={loading || !form.name} onClick={save} className="btn-primary w-full md:w-auto">הוסף מוצר</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(it => (
            <div key={it.id} className="border rounded-xl p-4 bg-white">
              <div className="flex items-center gap-4">
                {it.image_url ? (
                  <img src={it.image_url} alt={it.name} className="w-20 h-20 object-cover rounded-lg border" />
                ) : (
                  <div className="w-20 h-20 bg-neutral-100 rounded-lg border" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-neutral-900">{it.name}</div>
                  <div className="text-sm text-neutral-600">₪{it.price.toFixed(2)} / {it.unit}</div>
                  {it.description && <div className="text-sm text-neutral-600 mt-1">{it.description}</div>}
                  {(it.meal_tags?.length) ? (
                    <div className="mt-2">
                      <div className="text-xs text-neutral-500 mb-1">שיוך למנות:</div>
                      <div className="flex flex-wrap gap-2">
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
                              className={`${selected ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700'} px-2.5 py-1 rounded-full text-xs`}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 mt-1">אין שיוך למנות</div>
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => updateItem(it.id, { active: !it.active })} className={it.active ? 'btn-secondary' : 'btn-primary'}>
                  {it.active ? 'השבת' : 'הפעל'}
                </button>
                <button onClick={() => remove(it.id)} className="btn-secondary">מחק</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

