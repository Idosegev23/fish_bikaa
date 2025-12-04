import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Fish, Scissors, Check, X, Save, ArrowLeft, Search, AlertCircle } from 'lucide-react'

interface FishType {
  id: number
  name: string
  water_type: string
  price_per_kg: number
  is_active: boolean
}

interface CutType {
  id: number
  cut_name: string
  default_addition: number
  is_active: boolean
}

interface FishCutRelation {
  id: number
  fish_id: number
  cut_type_id: number
  price_addition: number | null
  is_active: boolean
}

export default function AdminFishCuts() {
  const [fish, setFish] = useState<FishType[]>([])
  const [cutTypes, setCutTypes] = useState<CutType[]>([])
  const [relations, setRelations] = useState<FishCutRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedFish, setSelectedFish] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [fishRes, cutsRes, relationsRes] = await Promise.all([
        supabase.from('fish_types').select('*').order('name'),
        supabase.from('cut_types').select('*').eq('is_active', true).order('cut_name'),
        supabase.from('fish_available_cuts').select('*')
      ])

      if (fishRes.data) setFish(fishRes.data)
      if (cutsRes.data) setCutTypes(cutsRes.data)
      if (relationsRes.data) setRelations(relationsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFishCuts = (fishId: number) => {
    return relations.filter(r => r.fish_id === fishId).map(r => r.cut_type_id)
  }

  const isCutEnabled = (fishId: number, cutId: number) => {
    return relations.some(r => r.fish_id === fishId && r.cut_type_id === cutId && r.is_active)
  }

  const toggleCut = async (fishId: number, cutId: number) => {
    setSaving(true)
    try {
      const existing = relations.find(r => r.fish_id === fishId && r.cut_type_id === cutId)
      
      if (existing) {
        // עדכון הקשר הקיים
        const { error } = await supabase
          .from('fish_available_cuts')
          .update({ is_active: !existing.is_active })
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // יצירת קשר חדש
        const { error } = await supabase
          .from('fish_available_cuts')
          .insert([{ fish_id: fishId, cut_type_id: cutId, is_active: true }])
        
        if (error) throw error
      }

      await loadData()
      setMessage({ type: 'success', text: 'השינויים נשמרו בהצלחה!' })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Error toggling cut:', error)
      setMessage({ type: 'error', text: 'שגיאה בשמירת השינויים' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const enableAllCuts = async (fishId: number) => {
    setSaving(true)
    try {
      // קבלת כל החיתוכים הקיימים לדג זה
      const existingCuts = relations.filter(r => r.fish_id === fishId).map(r => r.cut_type_id)
      
      // חיתוכים חדשים להוספה
      const newCuts = cutTypes.filter(ct => !existingCuts.includes(ct.id))
      
      // הוספת חיתוכים חדשים
      if (newCuts.length > 0) {
        const { error: insertError } = await supabase
          .from('fish_available_cuts')
          .insert(newCuts.map(ct => ({ fish_id: fishId, cut_type_id: ct.id, is_active: true })))
        
        if (insertError) throw insertError
      }

      // הפעלת כל החיתוכים הקיימים
      const { error: updateError } = await supabase
        .from('fish_available_cuts')
        .update({ is_active: true })
        .eq('fish_id', fishId)
      
      if (updateError) throw updateError

      await loadData()
      setMessage({ type: 'success', text: 'כל החיתוכים הופעלו!' })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Error enabling all cuts:', error)
      setMessage({ type: 'error', text: 'שגיאה בהפעלת החיתוכים' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const disableAllCuts = async (fishId: number) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('fish_available_cuts')
        .update({ is_active: false })
        .eq('fish_id', fishId)
      
      if (error) throw error

      await loadData()
      setMessage({ type: 'success', text: 'כל החיתוכים בוטלו!' })
      setTimeout(() => setMessage(null), 2000)
    } catch (error) {
      console.error('Error disabling all cuts:', error)
      setMessage({ type: 'error', text: 'שגיאה בביטול החיתוכים' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  const filteredFish = fish.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getActiveCutsCount = (fishId: number) => {
    return relations.filter(r => r.fish_id === fishId && r.is_active).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Link to="/admin/fish" className="text-primary-600 hover:text-primary-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ניהול חיתוכים לדגים</h1>
                <p className="text-sm text-gray-600">הגדר אילו חיתוכים זמינים לכל דג</p>
              </div>
            </div>
            <Link to="/admin/cut-types" className="btn-secondary text-sm">
              ניהול סוגי חיתוכים
            </Link>
          </div>
        </div>
      </header>

      {/* הודעה */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 slide-up ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* חיפוש */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="חפש דג..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pr-10"
            />
          </div>
        </div>

        {/* רשימת דגים */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFish.map(fishItem => {
            const isExpanded = selectedFish === fishItem.id
            const activeCuts = getActiveCutsCount(fishItem.id)
            
            return (
              <div 
                key={fishItem.id}
                className={`bg-white rounded-2xl shadow-lg border overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'
                }`}
              >
                {/* כותרת הדג */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedFish(isExpanded ? null : fishItem.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        fishItem.water_type === 'saltwater' 
                          ? 'bg-blue-100 text-blue-600' 
                          : fishItem.water_type === 'freshwater'
                            ? 'bg-cyan-100 text-cyan-600'
                            : 'bg-purple-100 text-purple-600'
                      }`}>
                        <Fish className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{fishItem.name}</h3>
                        <p className="text-sm text-gray-500">
                          {fishItem.water_type === 'saltwater' ? 'מים מלוחים' : 
                           fishItem.water_type === 'freshwater' ? 'מים מתוקים' : 'אחר'}
                          {' • '}₪{fishItem.price_per_kg}/ק"ג
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeCuts > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {activeCuts} חיתוכים
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* פאנל חיתוכים */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {/* כפתורי פעולה */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => enableAllCuts(fishItem.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        הפעל הכל
                      </button>
                      <button
                        onClick={() => disableAllCuts(fishItem.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        בטל הכל
                      </button>
                    </div>

                    {/* רשימת חיתוכים */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {cutTypes.map(cut => {
                        const isEnabled = isCutEnabled(fishItem.id, cut.id)
                        
                        return (
                          <button
                            key={cut.id}
                            onClick={() => toggleCut(fishItem.id, cut.id)}
                            disabled={saving}
                            className={`
                              p-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between
                              ${isEnabled 
                                ? 'bg-blue-500 text-white shadow-md' 
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                              }
                              ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}
                            `}
                          >
                            <span className="truncate">{cut.cut_name}</span>
                            {isEnabled ? (
                              <Check className="w-4 h-4 flex-shrink-0 mr-1" />
                            ) : (
                              {cut.default_addition > 0 && <span className="text-xs text-gray-400 flex-shrink-0 mr-1">+₪{cut.default_addition}</span>}
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {cutTypes.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        אין סוגי חיתוכים במערכת. 
                        <Link to="/admin/cut-types" className="text-blue-600 hover:underline mr-1">
                          הוסף חיתוכים
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredFish.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <Fish className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">לא נמצאו דגים</p>
          </div>
        )}

        {/* סיכום */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-4">סיכום</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{fish.length}</div>
              <div className="text-sm text-blue-700">סוגי דגים</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{cutTypes.length}</div>
              <div className="text-sm text-green-700">סוגי חיתוכים</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{relations.filter(r => r.is_active).length}</div>
              <div className="text-sm text-purple-700">קשרים פעילים</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-amber-600">
                {fish.filter(f => getActiveCutsCount(f.id) > 0).length}
              </div>
              <div className="text-sm text-amber-700">דגים עם חיתוכים</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

