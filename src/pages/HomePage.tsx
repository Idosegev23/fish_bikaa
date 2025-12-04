import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Waves, Clock, Truck, ShieldCheck, Scissors } from 'lucide-react'

interface Holiday {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
}

// פונקציה להפעלת חגים אוטומטית - עובדת 100% לבד
async function autoManageHolidays(): Promise<Holiday | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD
  
  // שלב 1: כבה את כל החגים שתאריך הסיום שלהם עבר
  await supabase
    .from('holidays')
    .update({ active: false })
    .lt('end_date', todayStr)
  
  // שלב 2: מצא את החג הקרוב הבא שטרם הסתיים
  const { data: upcomingHolidays } = await supabase
    .from('holidays')
    .select('*')
    .gte('end_date', todayStr) // החג עדיין לא נגמר
    .order('start_date', { ascending: true })
    .limit(1)
  
  if (!upcomingHolidays || upcomingHolidays.length === 0) {
    return null // אין חגים קרובים
  }
  
  const nextHoliday = upcomingHolidays[0]
  const startDate = new Date(nextHoliday.start_date)
  startDate.setHours(0, 0, 0, 0)
  
  // חישוב ימים עד החג
  const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  // שלב 3: הפעל את החג אם הוא מתחיל בעוד 10 ימים או פחות (או כבר התחיל)
  const shouldBeActive = daysUntilStart <= 10
  
  if (shouldBeActive && !nextHoliday.active) {
    // הפעל את החג
    await supabase
      .from('holidays')
      .update({ active: true })
      .eq('id', nextHoliday.id)
    nextHoliday.active = true
  } else if (!shouldBeActive && nextHoliday.active) {
    // כבה אם הופעל מוקדם מדי
    await supabase
      .from('holidays')
      .update({ active: false })
      .eq('id', nextHoliday.id)
    nextHoliday.active = false
  }
  
  // החזר את החג רק אם הוא אמור להיות פעיל
  return shouldBeActive ? nextHoliday : null
}

export default function HomePage() {
  const [activeHoliday, setActiveHoliday] = useState<Holiday | null>(null)
  const [daysUntilHoliday, setDaysUntilHoliday] = useState<number | null>(null)

  useEffect(() => {
    const loadHolidays = async () => {
      // מערכת אוטומטית לחלוטין - מנהלת את החגים לבד
      const holiday = await autoManageHolidays()
      
      if (holiday) {
        setActiveHoliday(holiday)
        
        // חישוב ימים עד החג
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startDate = new Date(holiday.start_date)
        startDate.setHours(0, 0, 0, 0)
        const days = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (days > 0) {
          setDaysUntilHoliday(days)
        } else {
          setDaysUntilHoliday(null) // החג כבר התחיל
        }
      }
    }
    
    loadHolidays()
  }, [])

  const slugify = (name: string) =>
    name.toString().trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/"|\'|"|"|׳|"/g, '')
      .replace(/[^\p{L}\p{N}-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  // טקסט דינמי לחג
  const getHolidayButtonText = () => {
    if (!activeHoliday) return ''
    
    if (daysUntilHoliday === null) {
      return `הזמנות ל${activeHoliday.name}` // החג כבר התחיל
    } else if (daysUntilHoliday === 1) {
      return `הזמנות ל${activeHoliday.name} (מחר!)`
    } else if (daysUntilHoliday <= 3) {
      return `הזמנות ל${activeHoliday.name} (בעוד ${daysUntilHoliday} ימים)`
    } else {
      return `הזמנות ל${activeHoliday.name}`
    }
  }

  return (
    <div className="bg-white">
      {/* Hero Section - Full Image Background */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Hero Background Image - Desktop */}
        <div className="absolute inset-0 hidden md:block">
          <img 
            src="/fish_img/hero.png" 
            alt="דגי בקעת אונו" 
            className="w-full h-full object-cover"
          />
          {/* Subtle Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        </div>
        {/* Hero Background Image - Mobile */}
        <div className="absolute inset-0 md:hidden">
          <img 
            src="/fish_img/heromobile.png" 
            alt="דגי בקעת אונו" 
            className="w-full h-full object-cover"
          />
          {/* Subtle Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 md:px-6 lg:px-8 pb-8 md:pb-16">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            {/* Holiday Badge */}
            {activeHoliday && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-5 py-2.5 rounded-full text-sm mb-6 animate-fade-in">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                הזמנות ל{activeHoliday.name} פתוחות
                {daysUntilHoliday && daysUntilHoliday <= 3 && (
                  <span className="bg-white text-[#023859] px-2.5 py-0.5 rounded-full text-xs font-bold mr-2">
                    {daysUntilHoliday === 1 ? 'מחר!' : `עוד ${daysUntilHoliday} ימים`}
                  </span>
                )}
            </div>
            )}
            
            {/* Subtitle - White Text */}
            <p className="text-white text-xl md:text-2xl font-light mb-8 max-w-xl leading-relaxed animate-slide-up drop-shadow-lg">
              דגים טריים מהים התיכון, חתוכים בדיוק כמו שאתם אוהבים. 
              <br />
              הזמינו מראש ואספו מוכן.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
           {activeHoliday ? (
             <>
               <Link
                 to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F5F9FA] text-[#023859] font-semibold px-8 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
               >
                    {getHolidayButtonText()}
               </Link>
               <Link 
                 to="/catalog" 
                    className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-[#023859] font-medium px-8 py-4 rounded-lg transition-all duration-300"
               >
                 הזמנה רגילה
               </Link>
             </>
           ) : (
             <Link 
               to="/catalog" 
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F5F9FA] text-[#023859] font-semibold px-10 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
             >
                  לקטלוג הדגים
                  <ArrowLeft className="w-5 h-5" />
             </Link>
           )}
         </div>
        </div>
      </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-[#023859] mb-4">הקטלוג שלנו</h2>
            <p className="text-[#013440]/60 max-w-md mx-auto">בחרו קטגוריה להתחיל את ההזמנה</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* דגי ים */}
            <Link 
              to="/catalog?type=saltwater"
              className="group relative aspect-[3/4] overflow-hidden rounded-xl shadow-soft hover:shadow-ocean transition-all duration-500"
            >
              <img 
                src="/seaWater.png" 
                alt="דגי ים" 
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#013440]/90 via-[#013440]/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <h3 className="font-serif text-xl md:text-2xl text-white mb-1">דגי ים</h3>
                <p className="text-sm text-white/70 mb-3">דניס, לברק, מוסר ים</p>
                <span className="text-sm text-[#B4D2D9] flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* מים מתוקים */}
            <Link 
              to="/catalog?type=freshwater"
              className="group relative aspect-[3/4] overflow-hidden rounded-xl shadow-soft hover:shadow-ocean transition-all duration-500"
            >
              <img 
                src="/freshWater.png" 
                alt="דגי מים מתוקים" 
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#013440]/90 via-[#013440]/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <h3 className="font-serif text-xl md:text-2xl text-white mb-1">מים מתוקים</h3>
                <p className="text-sm text-white/70 mb-3">קרפיון, אמנון, פורל</p>
                <span className="text-sm text-[#B4D2D9] flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* פרימיום */}
            <Link 
              to="/catalog?type=other"
              className="group relative aspect-[3/4] overflow-hidden rounded-xl shadow-soft hover:shadow-ocean transition-all duration-500"
            >
              <img 
                src="/premium.png" 
                alt="דגים פרימיום" 
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#013440]/90 via-[#013440]/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <h3 className="font-serif text-xl md:text-2xl text-white mb-1">פרימיום</h3>
                <p className="text-sm text-white/70 mb-3">סלמון, טונה, אינטיאס</p>
                <span className="text-sm text-[#B4D2D9] flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* מוצרים נלווים */}
            <Link 
              to="/additional-products"
              className="group relative aspect-[3/4] overflow-hidden rounded-xl shadow-soft hover:shadow-ocean transition-all duration-500"
            >
              <img 
                src="/poducts.png" 
                alt="מוצרים נלווים" 
                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#013440]/90 via-[#013440]/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <h3 className="font-serif text-xl md:text-2xl text-white mb-1">מוצרים נלווים</h3>
                <p className="text-sm text-white/70 mb-3">תבלינים, רטבים, ציפויים</p>
                <span className="text-sm text-[#B4D2D9] flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-4 h-4" />
                </span>
              </div>
            </Link>
            </div>
            </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#F5F9FA]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-[#023859] mb-4">למה לבחור בנו?</h2>
            <p className="text-[#013440]/60">המומחיות שלנו בשירותכם</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-soft transition-all duration-300 text-center group">
              <div className="w-14 h-14 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#026873] transition-colors duration-300">
                <ShieldCheck className="w-7 h-7 text-[#026873] group-hover:text-white transition-colors duration-300" />
        </div>
              <h3 className="font-semibold text-[#023859] mb-2">טריות מובטחת</h3>
              <p className="text-sm text-[#013440]/60">דגים טריים שמגיעים ישירות מהים כל יום</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-soft transition-all duration-300 text-center group">
              <div className="w-14 h-14 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#026873] transition-colors duration-300">
                <Scissors className="w-7 h-7 text-[#026873] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-[#023859] mb-2">חיתוך מקצועי</h3>
              <p className="text-sm text-[#013440]/60">מגוון סוגי חיתוך לפי בחירתכם</p>
          </div>

            <div className="bg-white p-6 rounded-xl border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-soft transition-all duration-300 text-center group">
              <div className="w-14 h-14 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#026873] transition-colors duration-300">
                <Clock className="w-7 h-7 text-[#026873] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-[#023859] mb-2">הזמנה נוחה</h3>
              <p className="text-sm text-[#013440]/60">הזמינו אונליין ואספו מוכן בזמן שנוח לכם</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#B4D2D9]/30 hover:border-[#6FA8BF] hover:shadow-soft transition-all duration-300 text-center group">
              <div className="w-14 h-14 bg-[#B4D2D9]/30 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#026873] transition-colors duration-300">
                <Truck className="w-7 h-7 text-[#026873] group-hover:text-white transition-colors duration-300" />
          </div>
              <h3 className="font-semibold text-[#023859] mb-2">מוכן לאיסוף</h3>
              <p className="text-sm text-[#013440]/60">ההזמנה שלכם תחכה ארוזה ומוכנה</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-[#023859] mb-4">איך זה עובד?</h2>
            <p className="text-[#013440]/60">תהליך פשוט ב-3 צעדים</p>
      </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-[#023859] text-white rounded-xl flex items-center justify-center text-2xl font-serif mx-auto mb-6 group-hover:bg-[#026873] transition-colors duration-300 shadow-soft">
                1
              </div>
              <h3 className="font-semibold text-lg text-[#023859] mb-3">בחרו את הדגים</h3>
              <p className="text-sm text-[#013440]/60 leading-relaxed">עיינו בקטלוג ובחרו את הדגים שאתם רוצים, עם סוג החיתוך המועדף</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-[#023859] text-white rounded-xl flex items-center justify-center text-2xl font-serif mx-auto mb-6 group-hover:bg-[#026873] transition-colors duration-300 shadow-soft">
                2
              </div>
              <h3 className="font-semibold text-lg text-[#023859] mb-3">קבעו זמן איסוף</h3>
              <p className="text-sm text-[#013440]/60 leading-relaxed">בחרו תאריך ושעה נוחים לאיסוף ההזמנה מהחנות</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-[#023859] text-white rounded-xl flex items-center justify-center text-2xl font-serif mx-auto mb-6 group-hover:bg-[#026873] transition-colors duration-300 shadow-soft">
                3
        </div>
              <h3 className="font-semibold text-lg text-[#023859] mb-3">אספו ותהנו</h3>
              <p className="text-sm text-[#013440]/60 leading-relaxed">הגיעו בזמן שקבעתם - ההזמנה תחכה לכם מוכנה וארוזה</p>
          </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#023859]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <Waves className="w-10 h-10 text-[#6FA8BF] mx-auto mb-6" />
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">מוכנים להזמין?</h2>
          <p className="text-[#B4D2D9] mb-10 max-w-md mx-auto">
            בחרו את הדגים, סוג החיתוך והכמות - ואנחנו נכין לכם הכל מראש
          </p>
          <Link 
            to="/catalog" 
            className="inline-flex items-center gap-3 bg-white hover:bg-[#F5F9FA] text-[#023859] font-semibold px-10 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            התחילו להזמין
            <ArrowLeft className="w-5 h-5" />
          </Link>
      </div>
      </section>
    </div>
  )
} 
