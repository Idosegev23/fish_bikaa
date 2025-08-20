import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const [activeHoliday, setActiveHoliday] = useState<{ name: string; start_date: string; end_date: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('holidays')
        .select('name, start_date, end_date')
        .eq('active', true)
        .limit(1)
        .maybeSingle()
      if (data) setActiveHoliday(data as any)
    }
    load()
  }, [])

  const slugify = (name: string) =>
    name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/"|\'|”|“|׳|"/g, '')
      .replace(/[^\p{L}\p{N}-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  return (
    <div className="space-y-16 fade-in">
      {/* Hero Section מודרני */}
      <div className="relative text-center py-16 sm:py-20 bg-white rounded-3xl border border-neutral-200">
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8 sm:mb-10 slide-up">
            <img 
              src="/logo.png" 
              alt="דגי בקעת אונו" 
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold heading-gradient mb-6 sm:mb-8 slide-up leading-tight" style={{animationDelay: '0.1s'}}>
            ברוכים הבאים לדגי בקעת אונו
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed slide-up px-4 sm:px-0" style={{animationDelay: '0.2s'}}>
            החנות המובילה לדגים טריים ואיכותיים. הזמינו מראש ואספו בזמן שנוח לכם
          </p>
         <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 slide-up" style={{animationDelay: '0.4s'}}>
           {activeHoliday ? (
             <>
               <Link
                 to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
                 className="btn-primary text-lg sm:text-xl px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center hover-lift"
                 aria-label={`הזמנות ל${activeHoliday.name}`}
               >
                 🎉 הזמנות ל{activeHoliday.name}
               </Link>
               <Link 
                 to="/catalog" 
                 className="btn-secondary text-lg sm:text-xl px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center hover-lift"
               >
                 הזמנה רגילה
               </Link>
             </>
           ) : (
             <Link 
               to="/catalog" 
               className="btn-primary text-lg sm:text-xl px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center hover-lift"
             >
               הזמן עכשיו
             </Link>
           )}
         </div>
        </div>
      </div>

      {activeHoliday && (
        <div className="card-glass slide-up">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">🎉 {activeHoliday.name} - זמן הזמנות!</h3>
            <p className="text-neutral-600 mb-4">
              תאריכי החג: {new Date(activeHoliday.start_date).toLocaleDateString('he-IL')} – {new Date(activeHoliday.end_date).toLocaleDateString('he-IL')}
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              💡 השתמשו בכפתור "הזמנות ל{activeHoliday.name}" למעלה לחוויית הזמנה מותאמת לחג
            </p>
          </div>
        </div>
      )}

      {/* Categories מודרניות */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link 
          to="/catalog?type=saltwater" 
          className="card-glass hover-lift interactive-card group slide-up"
        >
          <div className="text-center">
            <div className="w-20 h-1 bg-primary-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 heading-ocean">דגי מים מלוחים</h3>
            <p className="text-neutral-600 mb-6 leading-relaxed">
              דגים טריים מהים התיכון - דניס, לברק, מוסר ים ועוד
            </p>
            <span className="badge-ocean group-hover:scale-105 transition-transform">
              צפייה בקטלוג ←
            </span>
          </div>
        </Link>

        <Link 
          to="/catalog?type=freshwater" 
          className="card-glass hover-lift interactive-card group slide-up"
          style={{animationDelay: '0.2s'}}
        >
          <div className="text-center">
            <div className="w-20 h-1 bg-accent-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-emerald-700">דגי מים מתוקים</h3>
            <p className="text-neutral-600 mb-6 leading-relaxed">
              דגים ממקורות מים מתוקים - בורי, מושט, קרפיון ועוד
            </p>
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 group-hover:scale-105 transition-transform">
              צפייה בקטלוג ←
            </span>
          </div>
        </Link>

        <Link 
          to="/catalog?type=other" 
          className="card-glass hover-lift interactive-card group slide-up"
          style={{animationDelay: '0.4s'}}
        >
          <div className="text-center">
            <div className="w-20 h-1 bg-primary-400 rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold mb-4 text-accent-700">דגים מיוחדים</h3>
            <p className="text-neutral-600 mb-6 leading-relaxed">
              דגים מובחרים - סלמון נורווגי, פורל, טונה אדומה
            </p>
            <span className="badge-accent group-hover:scale-105 transition-transform">
              צפייה בקטלוג ←
            </span>
          </div>
        </Link>
      </div>

      {/* Features מעוצבות */}
      <div className="card-gradient slide-up">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 heading-gradient">למה לבחור בנו?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center group">
            <div className="w-16 h-1 bg-primary-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold mb-4 text-primary-800">דגים טריים</h3>
            <p className="text-neutral-600 leading-relaxed">
              דגים טריים ואיכותיים שמגיעים יומית מהדייגים המקומיים
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-1 bg-accent-600 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold mb-4 text-accent-800">שירות מקצועי</h3>
            <p className="text-neutral-600 leading-relaxed">
              חיתוך מקצועי לפי בקשה - שלם, פילטים או מנות מדויקות
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-1 bg-primary-400 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold mb-4 text-accent-700">הזמנה נוחה</h3>
            <p className="text-neutral-600 leading-relaxed">
              הזמינו מראש אונליין ואספו בזמן שנוח לכם - ללא המתנה
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action נוסף */}
      <div className="text-center card-glass slide-up">
        <h3 className="text-2xl font-bold mb-4 heading-gradient">מוכנים להתחיל?</h3>
        <p className="text-neutral-600 mb-8 max-w-2xl mx-auto">
          גלו את מגוון הדגים הטריים שלנו ובצעו הזמנה פשוטה ומהירה
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/catalog" className="btn-primary hover-lift">
            רוצה לראות קטלוג
          </Link>
          <Link to="/admin" className="btn-outline hover-lift">
            כניסת מנהל
          </Link>
        </div>
      </div>
    </div>
  )
} 