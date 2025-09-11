import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { supabase } from '../../lib/supabase'
import type { CutType } from '../../lib/supabase'
import { ArrowLeft, Plus, Edit, Save, X, Scissors, Power, PowerOff } from 'lucide-react'

interface NewCutForm {
  cut_name: string
  default_addition: number
  applicable_fish_ids: number[]
  meal_tags: string[]
}

// מטגי מנות זמינים
const AVAILABLE_MEAL_TAGS = [
  'מחבת', 'תנור', 'גריל', 'שיפודים', 'תבשיל', 
  'קציצות', 'המבורגר', 'סושי', 'סשימי', 'מרק', 'ציר'
]

export default function AdminCutTypes() {
  const [cutTypes, setCutTypes] = useState<CutType[]>([])
  const [allFish, setAllFish] = useState<{id: number, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<CutType>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCutForm, setNewCutForm] = useState<NewCutForm>({
    cut_name: '',
    default_addition: 0,
    applicable_fish_ids: [],
    meal_tags: [],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    await Promise.all([fetchCutTypes(), fetchFish()])
  }

  const fetchCutTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cut_types')
        .select(`
          *,
          meal_tags:cut_meal_tags(meal_tag)
        `)
        .order('id')

      if (error) throw error
      
      // עיבוד הנתונים לכלול את המטגים כמערך
      const processedData = (data || []).map(cutType => ({
        ...cutType,
        meal_tags_list: cutType.meal_tags?.map((mt: any) => mt.meal_tag) || []
      }))
      
      setCutTypes(processedData as any)
    } catch (error) {
      console.error('Error fetching cut types:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFish = async () => {
    try {
      const { data, error } = await supabase
        .from('fish_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAllFish(data || [])
    } catch (error) {
      console.error('Error fetching fish:', error)
    }
  }

  const handleAddCutType = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCutForm.cut_name) {
      alert('נא למלא את שם החיתוך')
      return
    }

    try {
      // הוספת החיתוך החדש
      const { data: newCutData, error: cutError } = await supabase
        .from('cut_types')
        .insert([
          {
            cut_name: newCutForm.cut_name,
            default_addition: newCutForm.default_addition,
          }
        ])
        .select()
        .single()

      if (cutError) throw cutError

      // יצירת קשרים בין החיתוך החדש לדגים שנבחרו
      if (newCutForm.applicable_fish_ids.length > 0 && newCutData) {
        const fishCutPrices = newCutForm.applicable_fish_ids.map(fishId => ({
          fish_id: fishId,
          cut_type_id: newCutData.id,
          override_price: null // משתמש במחיר הבסיסי + התוספת
        }))

        const { error: pricesError } = await supabase
          .from('fish_cut_prices')
          .insert(fishCutPrices)

        if (pricesError) {
          console.warn('חלק מהקשרים כבר קיימים:', pricesError)
        }
      }

      // יצירת קשרים בין החיתוך החדש למטגי מנות
      if (newCutForm.meal_tags.length > 0 && newCutData) {
        const cutMealTags = newCutForm.meal_tags.map(tag => ({
          cut_type_id: newCutData.id,
          meal_tag: tag
        }))

        const { error: tagsError } = await supabase
          .from('cut_meal_tags')
          .insert(cutMealTags)

        if (tagsError) {
          console.warn('חלק מהמטגים כבר קיימים:', tagsError)
        }
      }

      await fetchCutTypes()
      setShowAddModal(false)
      setNewCutForm({
        cut_name: '',
        default_addition: 0,
        applicable_fish_ids: [],
        meal_tags: [],
      })
      
      // הודעת הצלחה עם מידע על מה נוצר
      const fishCount = newCutForm.applicable_fish_ids.length
      alert(`סוג החיתוך "${newCutForm.cut_name}" נוסף בהצלחה וקושר ל-${fishCount} דגים!`)
    } catch (error) {
      console.error('Error adding cut type:', error)
      alert('שגיאה בהוספת סוג החיתוך')
    }
  }

  const startEdit = (cutType: CutType) => {
    setEditingId(cutType.id)
    setEditForm(cutType)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editingId || !editForm.cut_name) return

    try {
      const { error } = await supabase
        .from('cut_types')
        .update({
          cut_name: editForm.cut_name,
          default_addition: editForm.default_addition,
        })
        .eq('id', editingId)

      if (error) throw error

      await fetchCutTypes()
      setEditingId(null)
      setEditForm({})
      alert('סוג החיתוך עודכן בהצלחה!')
    } catch (error) {
      console.error('Error updating cut type:', error)
      alert('שגיאה בעדכון סוג החיתוך')
    }
  }

  const toggleCutTypeStatus = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cut_types')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      
      await fetchCutTypes()
      alert(`סוג החיתוך ${!currentStatus ? 'הופעל' : 'כובה'} בהצלחה!`)
    } catch (error) {
      console.error('Error:', error)
      alert('שגיאה בעדכון סטטוס סוג החיתוך')
    }
  }

  const deleteCutType = async (cutId: number) => {
    if (!confirm('האם אתה בטוח שרצה למחוק את סוג החיתוך? פעולה זו לא ניתנת לביטול.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('cut_types')
        .delete()
        .eq('id', cutId)

      if (error) throw error

      await fetchCutTypes()
      alert('סוג החיתוך נמחק בהצלחה!')
    } catch (error) {
      console.error('Error deleting cut type:', error)
      alert('שגיאה במחיקת סוג החיתוך. יתכן שהוא בשימוש במערכת.')
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/fish" className="text-primary-600 hover:text-primary-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ניהול סוגי חיתוך</h1>
                <p className="text-gray-600">הוספה ועריכה של סוגי חיתוך ותוספות מחיר</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2 space-x-reverse w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף סוג חיתוך</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* Mobile first cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden mb-6">
          {cutTypes.map((cutType) => (
            <div key={cutType.id} className="card">
              {editingId === cutType.id ? (
                <div className="space-y-4">
                  <div className="text-sm text-neutral-500">#{cutType.id}</div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">שם החיתוך</label>
                    <input
                      type="text"
                      value={editForm.cut_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, cut_name: e.target.value })}
                      className="input-field text-sm"
                      placeholder="שם החיתוך"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">תוספת מחיר (₪)</label>
                    <input
                      type="number"
                      value={editForm.default_addition || 0}
                      onChange={(e) => setEditForm({ ...editForm, default_addition: Number(e.target.value) })}
                      className="input-field text-sm"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={saveEdit} className="btn-primary text-sm">
                      שמור
                    </button>
                    <button onClick={cancelEdit} className="btn-secondary text-sm">
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-neutral-900">{cutType.cut_name}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cutType.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cutType.is_active ? 'פעיל' : 'כבוי'}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500">#{cutType.id}</div>
                  </div>
                  <div className="text-sm text-neutral-700">
                    תוספת: {cutType.default_addition === 0 ? 'ללא תוספת' : `+₪${cutType.default_addition}`}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => toggleCutTypeStatus(cutType.id, cutType.is_active)} 
                      className={`p-1 ${cutType.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`} 
                      title={cutType.is_active ? 'כבה' : 'הפעל'}
                    >
                      {cutType.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(cutType)} className="text-primary-600 hover:text-primary-700 p-1" title="עריכה">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCutType(cutType.id)} className="text-red-600 hover:text-red-700 p-1" title="מחיקה">
                      <X className="w-4 h-4" />
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
                    #
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    שם החיתוך
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תוספת מחיר (₪)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מטגי מנות
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cutTypes.map((cutType) => (
                  <tr key={cutType.id} className="hover:bg-gray-50">
                    {editingId === cutType.id ? (
                      // Edit Mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cutType.id}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.cut_name || ''}
                            onChange={(e) => setEditForm({...editForm, cut_name: e.target.value})}
                            className="input-field text-sm"
                            placeholder="שם החיתוך"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.default_addition || 0}
                            onChange={(e) => setEditForm({...editForm, default_addition: Number(e.target.value)})}
                            className="input-field text-sm"
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">לא ניתן לעריכה במצב עריכה</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">עריכה דרך מודל בלבד</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="שמור"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-700 p-1"
                              title="ביטול"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cutType.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Scissors className="w-4 h-4 text-gray-400 ml-2" />
                            <span className="text-sm font-medium text-gray-900">{cutType.cut_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {cutType.default_addition === 0 ? 'ללא תוספת' : `+₪${cutType.default_addition}`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            cutType.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {cutType.is_active ? 'פעיל' : 'כבוי'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(cutType as any).meal_tags_list?.length > 0 ? (
                              (cutType as any).meal_tags_list.map((tag: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">אין מטגים</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => toggleCutTypeStatus(cutType.id, cutType.is_active)}
                              className={`p-1 ${cutType.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                              title={cutType.is_active ? 'כבה' : 'הפעל'}
                            >
                              {cutType.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => startEdit(cutType)}
                              className="text-primary-600 hover:text-primary-700 p-1"
                              title="עריכה"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCutType(cutType.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="מחיקה"
                            >
                              <X className="w-4 h-4" />
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

        {cutTypes.length === 0 && (
          <div className="text-center py-12">
            <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">אין סוגי חיתוך במערכת</h3>
            <p className="text-gray-400 mb-6">התחילו על ידי הוספת סוג חיתוך ראשון</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              הוסף סוג חיתוך ראשון
            </button>
          </div>
        )}

        {/* Examples */}
        {cutTypes.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">דוגמאות לסוגי חיתוך:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <strong>שלם:</strong> דג שלם ללא חיתוך (₪0)
              </div>
              <div className="bg-white p-3 rounded border">
                <strong>פילטים:</strong> דג מחותך לפילטים (+₪8)
              </div>
              <div className="bg-white p-3 rounded border">
                <strong>מנות:</strong> דג מחותך למנות (+₪12)
              </div>
            </div>
          </div>
        )}
      </main>

      <AdminBottomNav />

      {/* Add Cut Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">הוספת סוג חיתוך חדש</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddCutType} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם החיתוך *
                  </label>
                  <input
                    type="text"
                    value={newCutForm.cut_name}
                    onChange={(e) => setNewCutForm({...newCutForm, cut_name: e.target.value})}
                    className="input-field"
                    placeholder="לדוגמה: פילטים, מנות, חצי דג..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תוספת מחיר (₪)
                  </label>
                  <input
                    type="number"
                    value={newCutForm.default_addition}
                    onChange={(e) => setNewCutForm({...newCutForm, default_addition: Number(e.target.value)})}
                    className="input-field"
                    step="0.01"
                    min="0"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    תוספת מחיר לק"ג עבור החיתוך (0 = ללא תוספת)
                  </p>
                </div>

                {/* בחירת דגים מתאימים */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      דגים מתאימים לחיתוך זה ({newCutForm.applicable_fish_ids.length} נבחרו)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCutForm({
                          ...newCutForm,
                          applicable_fish_ids: allFish.map(f => f.id)
                        })}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        בחר הכל
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCutForm({
                          ...newCutForm,
                          applicable_fish_ids: []
                        })}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        בטל הכל
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {allFish.map(fish => (
                      <label key={fish.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={newCutForm.applicable_fish_ids.includes(fish.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCutForm({
                                ...newCutForm,
                                applicable_fish_ids: [...newCutForm.applicable_fish_ids, fish.id]
                              })
                            } else {
                              setNewCutForm({
                                ...newCutForm,
                                applicable_fish_ids: newCutForm.applicable_fish_ids.filter(id => id !== fish.id)
                              })
                            }
                          }}
                          className="w-4 h-4 accent-primary-500"
                        />
                        <span className="text-sm text-gray-700">{fish.name}</span>
                      </label>
                    ))}
                  </div>
                  {allFish.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">טוען דגים...</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    בחר את הדגים שמתאימים לסוג החיתוך הזה. למשל: ברבוניה מתאימה רק ל"שלם"
                  </p>
                </div>

                {/* בחירת מטגי מנות */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      מטגי מנות לחיתוך זה ({newCutForm.meal_tags.length} נבחרו)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCutForm({
                          ...newCutForm,
                          meal_tags: [...AVAILABLE_MEAL_TAGS]
                        })}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        בחר הכל
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCutForm({
                          ...newCutForm,
                          meal_tags: []
                        })}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        בטל הכל
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-200 rounded-lg">
                    {AVAILABLE_MEAL_TAGS.map(tag => (
                      <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={newCutForm.meal_tags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCutForm({
                                ...newCutForm,
                                meal_tags: [...newCutForm.meal_tags, tag]
                              })
                            } else {
                              setNewCutForm({
                                ...newCutForm,
                                meal_tags: newCutForm.meal_tags.filter(t => t !== tag)
                              })
                            }
                          }}
                          className="w-4 h-4 accent-primary-500"
                        />
                        <span className="text-sm text-gray-700">{tag}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    בחר את סוגי המנות שמתאימים לחיתוך זה. זה יקבע איזה מוצרים משלימים יוצעו ללקוחות.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    הוסף סוג חיתוך
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