import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Fish, Scissors, Clock, ShoppingCart, Sparkles, Calendar, Star, Award, Truck, ChevronLeft } from 'lucide-react'

interface Holiday {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
}

export default function HomePage() {
  const [activeHoliday, setActiveHoliday] = useState<Holiday | null>(null)
  const [upcomingHoliday, setUpcomingHoliday] = useState<Holiday | null>(null)
  const [daysUntilHoliday, setDaysUntilHoliday] = useState<number | null>(null)

  useEffect(() => {
    const loadHolidays = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // חישוב תאריך 10 ימים קדימה (שבוע וחצי)
      const tenDaysFromNow = new Date(today)
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10)
      
      // שליפת כל החגים
      const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .order('start_date')
      
      if (!holidays) return
      
      // מציאת חג פעיל (active=true) או חג שמתחיל בעוד עד 10 ימים
      let foundActiveHoliday: Holiday | null = null
      let foundUpcomingHoliday: Holiday | null = null
      
      for (const holiday of holidays) {
        const startDate = new Date(holiday.start_date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(holiday.end_date)
        endDate.setHours(23, 59, 59, 999)
        
        // אם החג מסומן כפעיל ידנית
        if (holiday.active) {
          foundActiveHoliday = holiday
          break
        }
        
        // אם החג מתחיל בעוד עד 10 ימים (אוטומטי)
        const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil > 0 && daysUntil <= 10 && !foundUpcomingHoliday) {
          foundUpcomingHoliday = holiday
          setDaysUntilHoliday(daysUntil)
        }
      }
      
      // עדיפות לחג פעיל ידני, אחרת חג קרוב
      if (foundActiveHoliday) {
        setActiveHoliday(foundActiveHoliday)
      } else if (foundUpcomingHoliday) {
        setActiveHoliday(foundUpcomingHoliday)
        
        // הפעלה אוטומטית של החג במסד הנתונים
        await supabase
          .from('holidays')
          .update({ active: true })
          .eq('id', foundUpcomingHoliday.id)
      }
      
      setUpcomingHoliday(foundUpcomingHoliday)
    }
    
    loadHolidays()
  }, [])

  const slugify = (name: string) =>
    name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/"|\'|"|"|׳|"/g, '')
      .replace(/[^\p{L}\p{N}-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  return (
    <div className="min-h-screen">
      {/* Hero Section - עיצוב דרמטי */}
      <div className="relative overflow-hidden">
        {/* רקע עם תמונה וגרדיאנט */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400 rounded-full filter blur-3xl"></div>
          </div>
          {/* אנימציית גלים */}
          <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30">
            <svg viewBox="0 0 1440 120" className="w-full h-full fill-white/20">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
            </svg>
          </div>
        </div>

        <div className="relative z-10 px-4 py-16 sm:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* לוגו */}
            <div className="mb-8 animate-fade-in">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl blur-xl opacity-50 scale-110 animate-pulse"></div>
                <img 
                  src="/logo.png" 
                  alt="דגי בקעת אונו" 
                  className="relative w-28 h-28 sm:w-36 sm:h-36 object-contain rounded-3xl shadow-2xl border-4 border-white/20 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* כותרת */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
              דגי בקעת אונו
            </h1>
            <p className="text-xl sm:text-2xl text-cyan-200 font-light mb-8 max-w-2xl mx-auto">
              הדגים הכי טריים, חתוכים בדיוק כמו שאתם אוהבים
            </p>

            {/* כפתורי פעולה */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {activeHoliday ? (
                <>
                  <Link
                    to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
                    className="group relative w-full sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                      <Sparkles className="w-6 h-6" />
                      <span className="text-lg">הזמנות ל{activeHoliday.name}</span>
                      {daysUntilHoliday && (
                        <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                          עוד {daysUntilHoliday} ימים
                        </span>
                      )}
                    </div>
                  </Link>
                  <Link 
                    to="/catalog" 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold py-4 px-8 rounded-2xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300"
                  >
                    הזמנה רגילה
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <Link 
                  to="/catalog" 
                  className="group relative w-full sm:w-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <ShoppingCart className="w-6 h-6" />
                    <span className="text-lg">התחילו להזמין</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* באנר חג */}
      {activeHoliday && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 py-4 px-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">{activeHoliday.name} מתקרב!</p>
                <p className="text-white/80 text-sm">
                  {new Date(activeHoliday.start_date).toLocaleDateString('he-IL')} - {new Date(activeHoliday.end_date).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>
            <Link
              to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
              className="flex items-center gap-2 bg-white text-orange-600 font-bold py-2 px-6 rounded-xl hover:bg-orange-50 transition-colors"
            >
              להזמנת חג
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* יתרונות */}
      <div className="py-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">למה דווקא אנחנו?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">חוויית קנייה מושלמת של דגים טריים</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Fish, title: 'טריות מקסימלית', desc: 'דגים טריים כל יום מהדייגים', color: 'from-blue-500 to-cyan-500' },
              { icon: Scissors, title: 'חיתוך מקצועי', desc: '22 סוגי חיתוך לבחירתכם', color: 'from-emerald-500 to-green-500' },
              { icon: Clock, title: 'הזמנה מראש', desc: 'בלי המתנה, מוכן לאיסוף', color: 'from-purple-500 to-pink-500' },
              { icon: Award, title: 'איכות מובטחת', desc: 'שירות אישי ומקצועי', color: 'from-amber-500 to-orange-500' },
            ].map((item, i) => (
              <div 
                key={i}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* קטגוריות מהירות */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">מה תרצו היום?</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Link 
              to="/catalog?type=saltwater"
              className="group relative overflow-hidden rounded-3xl h-40 sm:h-56"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-700"></div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                <span className="text-4xl sm:text-5xl mb-3">🌊</span>
                <h3 className="text-lg sm:text-xl font-bold mb-1">דגי ים</h3>
                <p className="text-white/80 text-center text-xs sm:text-sm">דניס, לברק, מוסר</p>
                <div className="mt-3 flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-sm group-hover:bg-white/30 transition-colors">
                  <span>לצפייה</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link 
              to="/catalog?type=freshwater"
              className="group relative overflow-hidden rounded-3xl h-40 sm:h-56"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700"></div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                <span className="text-4xl sm:text-5xl mb-3">💧</span>
                <h3 className="text-lg sm:text-xl font-bold mb-1">מים מתוקים</h3>
                <p className="text-white/80 text-center text-xs sm:text-sm">קרפיון, אמנון, פורל</p>
                <div className="mt-3 flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-sm group-hover:bg-white/30 transition-colors">
                  <span>לצפייה</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link 
              to="/catalog?type=other"
              className="group relative overflow-hidden rounded-3xl h-40 sm:h-56"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600"></div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                <span className="text-4xl sm:text-5xl mb-3">⭐</span>
                <h3 className="text-lg sm:text-xl font-bold mb-1">פרימיום</h3>
                <p className="text-white/80 text-center text-xs sm:text-sm">סלמון, טונה, אינטיאס</p>
                <div className="mt-3 flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-sm group-hover:bg-white/30 transition-colors">
                  <span>לצפייה</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link 
              to="/additional-products"
              className="group relative overflow-hidden rounded-3xl h-40 sm:h-56"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600"></div>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="relative h-full flex flex-col items-center justify-center text-white p-4">
                <span className="text-4xl sm:text-5xl mb-3">🛒</span>
                <h3 className="text-lg sm:text-xl font-bold mb-1">מוצרים נלווים</h3>
                <p className="text-white/80 text-center text-xs sm:text-sm">תבלינים, קפואים, ציפויים</p>
                <div className="mt-3 flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full text-sm group-hover:bg-white/30 transition-colors">
                  <span>לצפייה</span>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA סופי */}
      <div className="py-16 px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-cyan-300 mb-6">
            <Star className="w-5 h-5" />
            <span>הזמנה פשוטה ומהירה</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">מוכנים להזמין?</h2>
          <p className="text-cyan-200 mb-8 max-w-xl mx-auto">בחרו את הדגים, סוג החיתוך והכמות - ואנחנו נכין לכם הכל מראש</p>
          <Link 
            to="/catalog" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-lg">לקטלוג הדגים</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
