import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import type { FishType } from '../../lib/supabase'
import { ArrowLeft, Plus, Edit, Save, X, Upload, Image } from 'lucide-react'
import { isByWeight, computeMaxUnits } from '../../lib/fishConfig'

interface NewFishForm {
  name: string
  water_type: 'saltwater' | 'freshwater' | 'other'
  price_per_kg: number
  available_kg: number
  description: string
  image_file?: File
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

  const handleAddFish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFishForm.name || newFishForm.price_per_kg <= 0) {
      alert('נא למלא את כל השדות הנדרשים')
      return
    }

    setUploading(true)
    try {
      let imageUrl = null
      
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
                to="/admin/cut-types" 
                className="btn-secondary flex items-center space-x-2 space-x-reverse w-full sm:w-auto"
              >
                <Edit className="w-4 h-4" />
                <span>ניהול חיתוכים</span>
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
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      <div className="text-neutral-500">מחיר/ק"ג</div>
                      <div className="font-semibold text-neutral-900">₪{fishItem.price_per_kg}</div>
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
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              {editForm.image_url ? (
                                <img 
                                  src={editForm.image_url} 
                                  alt={editForm.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Image className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            
                            {/* העלאת תמונה חדשה */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">שנה תמונה:</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setEditImageFile(file)
                                  }
                                }}
                                className="text-xs w-full"
                              />
                              {editImageFile && (
                                <p className="text-xs text-green-600 mt-1">
                                  נבחרה תמונה חדשה: {editImageFile.name}
                                </p>
                              )}
                            </div>
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
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="fish-image" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                          <span>העלה תמונה</span>
                          <input
                            id="fish-image"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                setNewFishForm({...newFishForm, image_file: file})
                              }
                            }}
                          />
                        </label>
                        <p className="pr-1">או גרור ושחרר</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF עד 10MB</p>
                      {newFishForm.image_file && (
                        <p className="text-sm text-green-600">נבחר קובץ: {newFishForm.image_file.name}</p>
                      )}
                    </div>
                  </div>
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
    </div>
  )
} 