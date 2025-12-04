import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import type { FishType } from '../../lib/supabase'
import { ArrowLeft, Plus, Edit, Save, X, Upload, Image, Images, Check } from 'lucide-react'
import { isByWeight, computeMaxUnits, getAverageWeightKg, hasKnownAverageWeight } from '../../lib/fishConfig'

interface NewFishForm {
  name: string
  water_type: 'saltwater' | 'freshwater' | 'other'
  price_per_kg: number
  available_kg: number
  description: string
  image_file?: File
  image_url?: string
}

interface BucketImage {
  name: string
  url: string
}

export default function AdminFishManagement() {
  const [searchParams] = useSearchParams()
  const [fish, setFish] = useState<FishType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<FishType>>({})
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newFishForm, setNewFishForm] = useState<NewFishForm>({
    name: '',
    water_type: 'saltwater',
    price_per_kg: 0,
    available_kg: 0,
    description: '',
  })
  const [uploading, setUploading] = useState(false)
  
  // בורר תמונות מהבאקט
  const [bucketImages, setBucketImages] = useState<BucketImage[]>([])
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerMode, setImagePickerMode] = useState<'edit' | 'add'>('edit')
  const [loadingImages, setLoadingImages] = useState(false)

  useEffect(() => {
    fetchFish()
    
    // רענון אוטומטי כל 30 שניות לעדכון המלאי
    const interval = setInterval(fetchFish, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // פתיחת מודאל הוספת דג כאשר מגיעים עם פרמטר add=1
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setShowAddModal(true)
    }
  }, [searchParams])

  const fetchFish = async () => {
    try {
      const { data, error } = await supabase
        .from('fish_types')
        .select('*')
        .order('name')

      if (error) throw error
      setFish(data || [])
    } catch (error) {
      console.error('Error fetching fish:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `fish-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('fish-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('fish-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  // טעינת תמונות מהבאקט
  const fetchBucketImages = async () => {
    setLoadingImages(true)
    try {
      const { data, error } = await supabase.storage
        .from('fish-images')
        .list('fish-images', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        // אם התיקייה לא קיימת, ננסה את השורש
        const { data: rootData, error: rootError } = await supabase.storage
          .from('fish-images')
          .list('', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          })
        
        if (rootError) throw rootError
        
        const images = (rootData || [])
          .filter(file => file.name && !file.name.startsWith('.'))
          .map(file => ({
            name: file.name,
            url: supabase.storage.from('fish-images').getPublicUrl(file.name).data.publicUrl
          }))
        
        setBucketImages(images)
      } else {
        const images = (data || [])
          .filter(file => file.name && !file.name.startsWith('.'))
          .map(file => ({
            name: file.name,
            url: supabase.storage.from('fish-images').getPublicUrl(`fish-images/${file.name}`).data.publicUrl
          }))
        
        setBucketImages(images)
      }
    } catch (error) {
      console.error('Error fetching bucket images:', error)
    } finally {
      setLoadingImages(false)
    }
  }

  const openImagePicker = (mode: 'edit' | 'add') => {
    setImagePickerMode(mode)
    setShowImagePicker(true)
    if (bucketImages.length === 0) {
      fetchBucketImages()
    }
  }

  const selectBucketImage = (url: string) => {
    if (imagePickerMode === 'edit') {
      setEditForm({ ...editForm, image_url: url })
      setEditImageFile(null)
    } else {
      setNewFishForm({ ...newFishForm, image_url: url, image_file: undefined })
    }
    setShowImagePicker(false)
  }

  const handleAddFish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFishForm.name || newFishForm.price_per_kg <= 0) {
      alert('נא למלא את כל השדות הנדרשים')
      return
    }

    setUploading(true)
    try {
      let imageUrl = newFishForm.image_url || null // קודם בדוק אם נבחרה תמונה מהגלריה
      
      // אם יש קובץ חדש להעלאה, העלה אותו (יחליף את התמונה מהגלריה)
      if (newFishForm.image_file) {
        imageUrl = await uploadImage(newFishForm.image_file)
      }

      const { error } = await supabase
        .from('fish_types')
        .insert([
          {
            name: newFishForm.name,
            water_type: newFishForm.water_type,
            price_per_kg: newFishForm.price_per_kg,
            available_kg: newFishForm.available_kg,
            description: newFishForm.description || null,
            image_url: imageUrl,
            is_active: true
          }
        ])

      if (error) throw error

      await fetchFish()
      setShowAddModal(false)
      setNewFishForm({
        name: '',
        water_type: 'saltwater',
        price_per_kg: 0,
        available_kg: 0,
        description: '',
      })
      alert('הדג נוסף בהצלחה!')
    } catch (error) {
      console.error('Error adding fish:', error)
      alert('שגיאה בהוספת הדג')
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (fishItem: FishType) => {
    setEditingId(fishItem.id)
    setEditForm(fishItem)
    setEditImageFile(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setEditImageFile(null)
  }

  const saveEdit = async () => {
    if (!editingId || !editForm.name) return

    setUploading(true)
    try {
      let imageUrl = editForm.image_url

      // אם נבחרה תמונה חדשה, העלה אותה
      if (editImageFile) {
        const uploadedUrl = await uploadImage(editImageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const { error } = await supabase
        .from('fish_types')
        .update({
          name: editForm.name,
          water_type: editForm.water_type,
          price_per_kg: editForm.price_per_kg,
          available_kg: editForm.available_kg,
          description: editForm.description,
          image_url: imageUrl,
          is_active: editForm.is_active
        })
        .eq('id', editingId)

      if (error) throw error

      await fetchFish()
      setEditingId(null)
      setEditForm({})
      setEditImageFile(null)
      alert('הדג עודכן בהצלחה!')
    } catch (error) {
      console.error('Error updating fish:', error)
      alert('שגיאה בעדכון הדג')
    } finally {
      setUploading(false)
    }
  }

  const toggleActive = async (fishId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('fish_types')
        .update({ is_active: !currentStatus })
        .eq('id', fishId)

      if (error) throw error
      await fetchFish()
    } catch (error) {
      console.error('Error toggling fish status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                              <h1 className="text-3xl font-bold text-gray-900">ניהול דגים</h1>
              <p className="text-gray-600">עריכת מחירים, מלאי וזמינות דגים</p>
              <p className="text-xs text-gray-500">המלאי מתעדכן אוטומטיט עם הזמנות חדשות</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 md:gap-4 items-stretch">
              <button 
                onClick={fetchFish}
                className="btn-secondary flex items-center space-x-2 space-x-reverse w-full sm:w-auto"
                title="רענן נתונים"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>רענן</span>
              </button>
              <Link 
                to="/admin/fish-cuts" 
                className="btn-primary bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 flex items-center space-x-2 space-x-reverse w-full sm:w-auto"
              >
                <Edit className="w-4 h-4" />
                <span>חיתוכים לכל דג</span>
              </Link>
              <Link 
                to="/admin/cut-types" 
                className="btn-secondary flex items-center space-x-2 space-x-reverse w-full sm:w-auto"
              >
                <Edit className="w-4 h-4" />
                <span>סוגי חיתוכים</span>
              </Link>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center space-x-2 space-x-reverse w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>הוסף דג חדש</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Mobile first cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden mb-6">
          {fish.map((fishItem) => (
            <div key={fishItem.id} className={`card ${!fishItem.is_active ? 'opacity-75' : ''}`}>
              {editingId === fishItem.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">שם הדג</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">סוג מים</label>
                      <select
                        value={editForm.water_type || ''}
                        onChange={(e) => setEditForm({ ...editForm, water_type: e.target.value as 'saltwater' | 'freshwater' | 'other' })}
                        className="input-field text-sm"
                      >
                        <option value="saltwater">מים מלוחים</option>
                        <option value="freshwater">מים מתוקים</option>
                        <option value="other">אחר</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">מחיר לק"ג (₪)</label>
                      <input
                        type="number"
                        value={editForm.price_per_kg || 0}
                        onChange={(e) => setEditForm({ ...editForm, price_per_kg: Number(e.target.value) })}
                        className="input-field text-sm"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">מלאי זמין (משקל בק"ג)</label>
                      <div className="text-xs text-neutral-500 mb-2">
                        {isByWeight(editForm.name || '') 
                          ? 'דג נמכר לפי ק"ג' 
                          : `דג נמכר ביחידות - ${computeMaxUnits(editForm.available_kg || 0, editForm.name || '')} יחידות זמינות`
                        }
                      </div>
                      <input
                        type="number"
                        value={editForm.available_kg || 0}
                        onChange={(e) => setEditForm({ ...editForm, available_kg: Number(e.target.value) })}
                        className="input-field text-sm"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">סטטוס</label>
                      <select
                        value={editForm.is_active ? 'true' : 'false'}
                        onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                        className="input-field text-sm"
                      >
                        <option value="true">פעיל</option>
                        <option value="false">לא פעיל</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* תמונה - מובייל */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">תמונה</label>
                    <div className="flex items-center gap-3">
                      {editForm.image_url && (
                        <img src={editForm.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => openImagePicker('edit')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 text-sm"
                      >
                        <Images className="w-4 h-4" />
                        בחר מהגלריה
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button onClick={saveEdit} disabled={uploading} className="btn-primary text-sm disabled:opacity-50">שמור</button>
                    <button onClick={cancelEdit} disabled={uploading} className="btn-secondary text-sm disabled:opacity-50">ביטול</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {fishItem.image_url ? (
                        <img src={fishItem.image_url} alt={fishItem.name} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900 truncate">{fishItem.name}</div>
                      <div className="text-sm text-neutral-600 truncate">{fishItem.water_type === 'saltwater' ? 'מים מלוחים' : fishItem.water_type === 'freshwater' ? 'מים מתוקים' : 'אחר'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="text-neutral-500">מחיר/ק"ג</div>
                      <div className="font-semibold text-neutral-900">₪{fishItem.price_per_kg}</div>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="text-neutral-500">משקל ממוצע</div>
                      <div className="font-semibold">
                        {isByWeight(fishItem.name) ? (
                          <span className="text-amber-600">לפי משקל</span>
                        ) : hasKnownAverageWeight(fishItem.name) ? (
                          <span className="text-blue-600">~{getAverageWeightKg(fishItem.name)} ק"ג</span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="text-neutral-500">מלאי</div>
                      <div className="font-semibold text-neutral-900">
                        {isByWeight(fishItem.name) ? (
                          `${fishItem.available_kg} ק"ג`
                        ) : (
                          `${computeMaxUnits(fishItem.available_kg, fishItem.name)} יח׳`
                        )}
                      </div>
                    </div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="text-neutral-500">סטטוס</div>
                      <div className={`font-semibold ${fishItem.is_active ? 'text-emerald-700' : 'text-red-600'}`}>{fishItem.is_active ? 'פעיל' : 'לא פעיל'}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => startEdit(fishItem)} className="text-primary-600 hover:text-primary-700 p-1" title="עריכה">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תמונה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    שם הדג
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סוג מים
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מחיר/ק"ג
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    משקל ממוצע
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מלאי זמין
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fish.map((fishItem) => (
                  <tr key={fishItem.id} className={!fishItem.is_active ? 'bg-gray-50' : ''}>
                    {editingId === fishItem.id ? (
                      // Edit Mode
                      <>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {/* תמונה נוכחית */}
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                              {editForm.image_url ? (
                                <img 
                                  src={editForm.image_url} 
                                  alt={editForm.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Image className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            
                            {/* כפתורי בחירת תמונה */}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openImagePicker('edit')}
                                className="flex-1 text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors"
                                title="בחר מהגלריה"
                              >
                                <Images className="w-3 h-3 inline ml-1" />
                                גלריה
                              </button>
                              <label className="flex-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors cursor-pointer text-center">
                                <Upload className="w-3 h-3 inline ml-1" />
                                העלה
                                <input
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      setEditImageFile(file)
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            {editImageFile && (
                              <p className="text-xs text-green-600">
                                ✓ {editImageFile.name.substring(0, 15)}...
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="input-field text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.water_type || ''}
                            onChange={(e) => setEditForm({...editForm, water_type: e.target.value as 'saltwater' | 'freshwater' | 'other'})}
                            className="input-field text-sm"
                          >
                            <option value="saltwater">מים מלוחים</option>
                            <option value="freshwater">מים מתוקים</option>
                            <option value="other">אחר</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.price_per_kg || ''}
                            onChange={(e) => setEditForm({...editForm, price_per_kg: Number(e.target.value)})}
                            className="input-field text-sm"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-neutral-600">
                            {isByWeight(editForm.name || '') ? (
                              <span className="text-amber-600">לפי משקל</span>
                            ) : hasKnownAverageWeight(editForm.name || '') ? (
                              <span>~{getAverageWeightKg(editForm.name || '')} ק"ג</span>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.available_kg || ''}
                            onChange={(e) => setEditForm({...editForm, available_kg: Number(e.target.value)})}
                            className="input-field text-sm"
                            step="0.1"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editForm.is_active ? 'true' : 'false'}
                            onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'true'})}
                            className="input-field text-sm"
                          >
                            <option value="true">פעיל</option>
                            <option value="false">לא פעיל</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={saveEdit}
                              disabled={uploading}
                              className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="שמור"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={uploading}
                              className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
                              title="ביטול"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {uploading && (
                            <div className="text-xs text-blue-600 mt-1">מעדכן...</div>
                          )}
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="px-6 py-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            {fishItem.image_url ? (
                              <img 
                                src={fishItem.image_url} 
                                alt={fishItem.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Image className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{fishItem.name}</div>
                            {fishItem.description && (
                              <div className="text-xs text-gray-500">{fishItem.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fishItem.water_type === 'saltwater' && 'מים מלוחים'}
                          {fishItem.water_type === 'freshwater' && 'מים מתוקים'}
                          {fishItem.water_type === 'other' && 'אחר'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₪{fishItem.price_per_kg}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {isByWeight(fishItem.name) ? (
                            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs">לפי משקל</span>
                          ) : hasKnownAverageWeight(fishItem.name) ? (
                            <span className="text-blue-600">~{getAverageWeightKg(fishItem.name)} ק"ג</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {isByWeight(fishItem.name) ? (
                            `${fishItem.available_kg} ק"ג`
                          ) : (
                            `${computeMaxUnits(fishItem.available_kg, fishItem.name)} יח׳`
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleActive(fishItem.id, fishItem.is_active)}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              fishItem.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {fishItem.is_active ? 'פעיל' : 'לא פעיל'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => startEdit(fishItem)}
                              className="text-primary-600 hover:text-primary-700"
                              title="עריכה"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {fish.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">לא נמצאו דגים במערכת</p>
          </div>
        )}
      </main>

      <AdminBottomNav />

      {/* Add Fish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">הוספת דג חדש</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddFish} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם הדג *
                    </label>
                    <input
                      type="text"
                      value={newFishForm.name}
                      onChange={(e) => setNewFishForm({...newFishForm, name: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      סוג מים *
                    </label>
                    <select
                      value={newFishForm.water_type}
                      onChange={(e) => setNewFishForm({...newFishForm, water_type: e.target.value as 'saltwater' | 'freshwater' | 'other'})}
                      className="input-field"
                    >
                      <option value="saltwater">מים מלוחים</option>
                      <option value="freshwater">מים מתוקים</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      מחיר לק"ג (₪) *
                    </label>
                    <input
                      type="number"
                      value={newFishForm.price_per_kg}
                      onChange={(e) => setNewFishForm({...newFishForm, price_per_kg: Number(e.target.value)})}
                      className="input-field"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                מלאי זמין (משקל בק"ג)
              </label>
                    <input
                      type="number"
                      value={newFishForm.available_kg}
                      onChange={(e) => setNewFishForm({...newFishForm, available_kg: Number(e.target.value)})}
                      className="input-field"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תיאור
                  </label>
                  <textarea
                    value={newFishForm.description}
                    onChange={(e) => setNewFishForm({...newFishForm, description: e.target.value})}
                    className="input-field"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תמונת הדג
                  </label>
                  
                  {/* תצוגה מקדימה של תמונה שנבחרה */}
                  {(newFishForm.image_url || newFishForm.image_file) && (
                    <div className="mb-3 relative inline-block">
                      <img 
                        src={newFishForm.image_file ? URL.createObjectURL(newFishForm.image_file) : newFishForm.image_url} 
                        alt="תצוגה מקדימה" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-primary-200"
                      />
                      <button
                        type="button"
                        onClick={() => setNewFishForm({...newFishForm, image_url: undefined, image_file: undefined})}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    {/* כפתור בחירה מהגלריה */}
                    <button
                      type="button"
                      onClick={() => openImagePicker('add')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-300 border-dashed rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      <Images className="w-5 h-5 text-primary-600" />
                      <span className="text-primary-600 font-medium">בחר מהגלריה</span>
                    </button>
                    
                    {/* כפתור העלאה */}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-medium">העלה תמונה</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setNewFishForm({...newFishForm, image_file: file, image_url: undefined})
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP עד 10MB</p>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                    disabled={uploading}
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="btn-primary disabled:opacity-50"
                    disabled={uploading}
                  >
                    {uploading ? 'מוסיף...' : 'הוסף דג'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* מודאל בחירת תמונה מהגלריה */}
      {showImagePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Images className="w-6 h-6 text-primary-600" />
                בחר תמונה מהגלריה
              </h3>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingImages ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                </div>
              ) : bucketImages.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">לא נמצאו תמונות בגלריה</p>
                  <p className="text-sm text-gray-400 mt-2">העלה תמונות דרך כפתור "העלה תמונה"</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {bucketImages.map((img) => {
                    const isSelected = imagePickerMode === 'edit' 
                      ? editForm.image_url === img.url 
                      : newFishForm.image_url === img.url
                    
                    return (
                      <button
                        key={img.name}
                        onClick={() => selectBucketImage(img.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          isSelected 
                            ? 'border-primary-500 ring-2 ring-primary-300' 
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <img 
                          src={img.url} 
                          alt={img.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                            <div className="bg-primary-500 rounded-full p-1">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {bucketImages.length} תמונות בגלריה
              </span>
              <button
                onClick={fetchBucketImages}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                🔄 רענן גלריה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 