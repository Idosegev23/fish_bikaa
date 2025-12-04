import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Star, Quote } from 'lucide-react'

interface Holiday {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
}

// ביקורות לקוחות (ניתן להעביר לDB בהמשך)
const TESTIMONIALS = [
  { name: 'יעל כ.', text: 'הדגים הכי טריים שאכלתי! השירות מעולה והחיתוך מקצועי.', rating: 5 },
  { name: 'משה ד.', text: 'מזמין כל שבוע לשבת. תמיד מקבל בדיוק מה שביקשתי.', rating: 5 },
  { name: 'רונית א.', text: 'גילוי מדהים! איכות מעולה במחירים הוגנים.', rating: 5 },
]

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
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

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

  // Testimonials rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(interval)
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
    <div>
      {/* Hero Section - Full Width with Background */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-charcoal">
          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-navy-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              {/* Badge */}
              {activeHoliday && (
                <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/30 text-gold-300 px-4 py-2 rounded-full text-small mb-6">
                  <span className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
                  הזמנות ל{activeHoliday.name} פתוחות
                  {daysUntilHoliday && daysUntilHoliday <= 3 && (
                    <span className="bg-gold-500 text-charcoal px-2 py-0.5 rounded-full text-tiny font-bold mr-2">
                      {daysUntilHoliday === 1 ? 'מחר!' : `עוד ${daysUntilHoliday} ימים`}
                    </span>
                  )}
                </div>
              )}

              {/* לוגו */}
              <img 
                src="/logo.png" 
                alt="דגי בקעת אונו" 
                className="h-20 md:h-28 w-auto mb-6 drop-shadow-2xl"
              />
              
              <p className="text-stone-300 text-body md:text-h4 font-light mb-8 max-w-md leading-relaxed">
                דגים טריים מהים התיכון, חתוכים בדיוק כמו שאתם אוהבים. 
                הזמינו מראש ואספו מוכן.
              </p>

              {/* Stats */}
              <div className="flex gap-8 mb-10">
                <div>
                  <div className="text-h2 font-serif text-white">+15</div>
                  <div className="text-tiny text-stone-400">שנות ניסיון</div>
                </div>
                <div>
                  <div className="text-h2 font-serif text-white">22</div>
                  <div className="text-tiny text-stone-400">סוגי חיתוך</div>
                </div>
                <div>
                  <div className="text-h2 font-serif text-white">5K+</div>
                  <div className="text-tiny text-stone-400">לקוחות מרוצים</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                {activeHoliday ? (
                  <>
                    <Link
                      to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
                      className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-charcoal font-semibold px-8 py-4 transition-all"
                    >
                      {getHolidayButtonText()}
                    </Link>
                    <Link to="/catalog" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white hover:bg-white/10 font-medium px-8 py-4 transition-all">
                      הזמנה רגילה
                    </Link>
                  </>
                ) : (
                  <Link to="/catalog" className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-charcoal font-semibold px-8 py-4 transition-all">
                    לקטלוג הדגים
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right side - Testimonial Card */}
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 rounded-lg">
                <Quote className="w-10 h-10 text-gold-400 mb-4 opacity-50" />
                <p className="text-white text-h4 font-light mb-6 leading-relaxed">
                  "{TESTIMONIALS[currentTestimonial].text}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{TESTIMONIALS[currentTestimonial].name}</div>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {TESTIMONIALS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentTestimonial(i)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === currentTestimonial ? 'bg-gold-400 w-6' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* קטגוריות */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-h1 text-charcoal mb-4">הקטלוג שלנו</h2>
            <p className="text-stone-500 max-w-md mx-auto">בחרו קטגוריה להתחיל את ההזמנה</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* דגי ים */}
            <Link 
              to="/catalog?type=saltwater"
              className="group relative aspect-[3/4] overflow-hidden bg-navy-900"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-navy-800 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-20">
                <span className="text-3xl md:text-4xl mb-2">🌊</span>
                <h3 className="font-serif text-h4 md:text-h3 text-white mb-1">דגי ים</h3>
                <p className="text-tiny md:text-small text-white/60 mb-3">דניס, לברק, מוסר ים</p>
                <span className="text-tiny text-gold-400 flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* מים מתוקים */}
            <Link 
              to="/catalog?type=freshwater"
              className="group relative aspect-[3/4] overflow-hidden bg-emerald-900"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-emerald-800 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-20">
                <span className="text-3xl md:text-4xl mb-2">💧</span>
                <h3 className="font-serif text-h4 md:text-h3 text-white mb-1">מים מתוקים</h3>
                <p className="text-tiny md:text-small text-white/60 mb-3">קרפיון, אמנון, פורל</p>
                <span className="text-tiny text-gold-400 flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* פרימיום */}
            <Link 
              to="/catalog?type=other"
              className="group relative aspect-[3/4] overflow-hidden bg-gold-900"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-gold-800 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-20">
                <span className="text-3xl md:text-4xl mb-2">⭐</span>
                <h3 className="font-serif text-h4 md:text-h3 text-white mb-1">פרימיום</h3>
                <p className="text-tiny md:text-small text-white/60 mb-3">סלמון, טונה, אינטיאס</p>
                <span className="text-tiny text-gold-400 flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* מוצרים נלווים */}
            <Link 
              to="/additional-products"
              className="group relative aspect-[3/4] overflow-hidden bg-stone-800"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-stone-700 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 z-20">
                <span className="text-3xl md:text-4xl mb-2">🌿</span>
                <h3 className="font-serif text-h4 md:text-h3 text-white mb-1">מוצרים נלווים</h3>
                <p className="text-tiny md:text-small text-white/60 mb-3">תבלינים, רטבים, ציפויים</p>
                <span className="text-tiny text-gold-400 flex items-center gap-1 group-hover:gap-2 transition-all font-medium">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-h1 text-charcoal mb-4">איך זה עובד?</h2>
            <p className="text-stone-500">תהליך פשוט ב-3 צעדים</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-charcoal text-white rounded-full flex items-center justify-center text-h3 font-serif mx-auto mb-6">1</div>
              <h3 className="font-serif text-h4 text-charcoal mb-3">בחרו את הדגים</h3>
              <p className="text-small text-stone-500">עיינו בקטלוג ובחרו את הדגים שאתם רוצים, עם סוג החיתוך המועדף</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-charcoal text-white rounded-full flex items-center justify-center text-h3 font-serif mx-auto mb-6">2</div>
              <h3 className="font-serif text-h4 text-charcoal mb-3">קבעו זמן איסוף</h3>
              <p className="text-small text-stone-500">בחרו תאריך ושעה נוחים לאיסוף ההזמנה מהחנות</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-charcoal text-white rounded-full flex items-center justify-center text-h3 font-serif mx-auto mb-6">3</div>
              <h3 className="font-serif text-h4 text-charcoal mb-3">אספו ותהנו</h3>
              <p className="text-small text-stone-500">הגיעו בזמן שקבעתם - ההזמנה תחכה לכם מוכנה וארוזה</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Mobile */}
      <section className="py-16 bg-white md:hidden">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-serif text-h2 text-charcoal text-center mb-8">מה הלקוחות אומרים</h2>
          <div className="bg-stone-50 p-6 rounded-lg">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-gold-500 fill-gold-500" />
              ))}
            </div>
            <p className="text-charcoal mb-4">"{TESTIMONIALS[currentTestimonial].text}"</p>
            <p className="text-small text-stone-500">{TESTIMONIALS[currentTestimonial].name}</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-charcoal text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-h1 mb-4">מוכנים להזמין?</h2>
          <p className="text-stone-400 mb-10 max-w-md mx-auto">
            בחרו את הדגים, סוג החיתוך והכמות - ואנחנו נכין לכם הכל מראש
          </p>
          <Link to="/catalog" className="inline-flex items-center gap-3 bg-gold-500 hover:bg-gold-600 text-charcoal font-semibold px-10 py-4 transition-all">
            התחילו להזמין
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
