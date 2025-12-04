import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft } from 'lucide-react'

interface Holiday {
  id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
}

export default function HomePage() {
  const [activeHoliday, setActiveHoliday] = useState<Holiday | null>(null)
  const [daysUntilHoliday, setDaysUntilHoliday] = useState<number | null>(null)

  useEffect(() => {
    const loadHolidays = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tenDaysFromNow = new Date(today)
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10)
      
      const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .order('start_date')
      
      if (!holidays) return
      
      let foundActiveHoliday: Holiday | null = null
      let foundUpcomingHoliday: Holiday | null = null
      
      for (const holiday of holidays) {
        const startDate = new Date(holiday.start_date)
        startDate.setHours(0, 0, 0, 0)
        
        if (holiday.active) {
          foundActiveHoliday = holiday
          break
        }
        
        const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysUntil > 0 && daysUntil <= 10 && !foundUpcomingHoliday) {
          foundUpcomingHoliday = holiday
          setDaysUntilHoliday(daysUntil)
        }
      }
      
      if (foundActiveHoliday) {
        setActiveHoliday(foundActiveHoliday)
      } else if (foundUpcomingHoliday) {
        setActiveHoliday(foundUpcomingHoliday)
        await supabase
          .from('holidays')
          .update({ active: true })
          .eq('id', foundUpcomingHoliday.id)
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

  return (
    <div className="fade-in">
      {/* Hero Section - מינימליסטי */}
      <section className="relative bg-stone-100 min-h-[60vh] flex items-center">
        <div className="container-boutique w-full py-16 md:py-24">
          <div className="max-w-2xl">
            {/* לוגו גדול */}
            <img 
              src="/logo.png" 
              alt="דגי בקעת אונו" 
              className="h-24 md:h-32 w-auto mb-8"
            />
            
            <p className="text-stone-600 text-body md:text-h4 font-light mb-10 max-w-lg">
              דגים טריים מהים, חתוכים בדיוק כמו שאתם אוהבים. 
              הזמינו מראש ואספו ללא המתנה.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {activeHoliday ? (
                <>
                  <Link
                    to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    הזמנות ל{activeHoliday.name}
                    {daysUntilHoliday && (
                      <span className="text-tiny opacity-80">({daysUntilHoliday} ימים)</span>
                    )}
                  </Link>
                  <Link to="/catalog" className="btn-secondary inline-flex items-center justify-center">
                    הזמנה רגילה
                  </Link>
                </>
              ) : (
                <Link to="/catalog" className="btn-primary inline-flex items-center justify-center gap-2">
                  צפייה בקטלוג
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* באנר חג */}
      {activeHoliday && (
        <section className="bg-gold-600 text-white py-4">
          <div className="container-boutique">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-medium">{activeHoliday.name} מתקרב</span>
                <span className="mx-3 opacity-50">|</span>
                <span className="text-small opacity-80">
                  {new Date(activeHoliday.start_date).toLocaleDateString('he-IL')}
                </span>
              </div>
              <Link
                to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
                className="text-small font-medium underline underline-offset-4 hover:no-underline"
              >
                להזמנה מיוחדת לחג
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* קטגוריות */}
      <section className="section bg-white">
        <div className="container-boutique">
          <div className="text-center mb-12">
            <h2 className="font-serif text-h2 text-charcoal mb-3">הקטלוג שלנו</h2>
            <p className="text-stone-500">בחרו קטגוריה להתחיל</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* דגי ים */}
            <Link 
              to="/catalog?type=saltwater"
              className="group relative aspect-[4/5] overflow-hidden bg-stone-100"
              style={{ border: '1px solid #E7E5E4' }}
            >
              <div className="absolute inset-0 bg-navy-900/40 group-hover:bg-navy-900/50 transition-colors z-10" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                <h3 className="font-serif text-h3 text-white mb-1">דגי ים</h3>
                <p className="text-small text-white/70">דניס, לברק, מוסר ים</p>
                <span className="mt-4 text-tiny text-white/60 flex items-center gap-1 group-hover:gap-2 transition-all">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* דגי מים מתוקים */}
            <Link 
              to="/catalog?type=freshwater"
              className="group relative aspect-[4/5] overflow-hidden bg-stone-100"
              style={{ border: '1px solid #E7E5E4' }}
            >
              <div className="absolute inset-0 bg-emerald-900/40 group-hover:bg-emerald-900/50 transition-colors z-10" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                <h3 className="font-serif text-h3 text-white mb-1">מים מתוקים</h3>
                <p className="text-small text-white/70">קרפיון, אמנון, פורל</p>
                <span className="mt-4 text-tiny text-white/60 flex items-center gap-1 group-hover:gap-2 transition-all">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* פרימיום */}
            <Link 
              to="/catalog?type=other"
              className="group relative aspect-[4/5] overflow-hidden bg-stone-100"
              style={{ border: '1px solid #E7E5E4' }}
            >
              <div className="absolute inset-0 bg-gold-800/40 group-hover:bg-gold-800/50 transition-colors z-10" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                <h3 className="font-serif text-h3 text-white mb-1">פרימיום</h3>
                <p className="text-small text-white/70">סלמון, טונה, אינטיאס</p>
                <span className="mt-4 text-tiny text-white/60 flex items-center gap-1 group-hover:gap-2 transition-all">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* מוצרים נלווים */}
            <Link 
              to="/additional-products"
              className="group relative aspect-[4/5] overflow-hidden bg-stone-100"
              style={{ border: '1px solid #E7E5E4' }}
            >
              <div className="absolute inset-0 bg-stone-700/40 group-hover:bg-stone-700/50 transition-colors z-10" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                <h3 className="font-serif text-h3 text-white mb-1">מוצרים נלווים</h3>
                <p className="text-small text-white/70">תבלינים, קפואים, ציפויים</p>
                <span className="mt-4 text-tiny text-white/60 flex items-center gap-1 group-hover:gap-2 transition-all">
                  לצפייה <ArrowLeft className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* יתרונות */}
      <section className="section bg-stone-50">
        <div className="container-boutique">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl mb-4">🐟</div>
              <h3 className="font-serif text-h4 text-charcoal mb-2">טריות מובטחת</h3>
              <p className="text-small text-stone-500">דגים טריים כל יום, ישירות מהדייגים</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✂️</div>
              <h3 className="font-serif text-h4 text-charcoal mb-2">חיתוך מקצועי</h3>
              <p className="text-small text-stone-500">22 סוגי חיתוך לבחירתכם</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="font-serif text-h4 text-charcoal mb-2">ללא המתנה</h3>
              <p className="text-small text-stone-500">הזמינו מראש ואספו מוכן</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-charcoal text-white">
        <div className="container-boutique text-center">
          <h2 className="font-serif text-h2 mb-4">מוכנים להזמין?</h2>
          <p className="text-stone-400 mb-8 max-w-md mx-auto">
            בחרו את הדגים, סוג החיתוך והכמות - ואנחנו נכין לכם הכל מראש
          </p>
          <Link to="/catalog" className="btn-secondary inline-flex items-center gap-2 bg-white text-charcoal border-white hover:bg-stone-100">
            לקטלוג הדגים
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
