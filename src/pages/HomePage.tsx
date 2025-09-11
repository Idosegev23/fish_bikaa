import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Fish, Scissors, Smartphone, ShoppingCart, Rocket, Sparkles, Calendar } from 'lucide-react'

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
    <div className="space-y-8 sm:space-y-12 fade-in">
      {/* Hero Section מעוצב יפה */}
      <div className="relative text-center py-12 sm:py-16 bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-3xl border border-blue-100 shadow-xl overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-cyan-400 rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-blue-300 rounded-full"></div>
        </div>
        
        <div className="relative z-10 px-4">
          <div className="flex justify-center mb-6 slide-up">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-lg opacity-30 scale-110"></div>
              <img 
                src="/logo.png" 
                alt="דגי בקעת אונו" 
                className="relative w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-3xl shadow-2xl hover:scale-105 transition-all duration-500 border-2 border-white"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent mb-2 slide-up leading-tight" style={{animationDelay: '0.1s'}}>
              דגי בקעת אונו
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 slide-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-2 text-gray-600">
              <Fish className="w-5 h-5 text-blue-500" />
              <span className="text-base sm:text-lg font-medium">דגים טריים ואיכותיים</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Smartphone className="w-5 h-5 text-cyan-500" />
              <span className="text-base sm:text-lg font-medium">הזמינו מראש ואספו בזמן שנוח</span>
            </div>
          </div>
          
         <div className="flex flex-col sm:flex-row items-center justify-center gap-3 slide-up" style={{animationDelay: '0.4s'}}>
           {activeHoliday ? (
             <>
               <Link
                 to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
                 className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto inline-flex items-center justify-center gap-2"
                 aria-label={`הזמנות ל${activeHoliday.name}`}
               >
                 <Sparkles className="w-5 h-5" />
                 הזמנות ל{activeHoliday.name}
               </Link>
               <Link 
                 to="/catalog" 
                 className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-full border-2 border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 w-full sm:w-auto inline-flex items-center justify-center"
               >
                 הזמנה רגילה
               </Link>
             </>
           ) : (
             <Link 
               to="/catalog" 
               className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto max-w-xs inline-flex items-center justify-center text-lg gap-2"
             >
               <ShoppingCart className="w-5 h-5" />
               הזמן עכשיו
             </Link>
           )}
         </div>
        </div>
      </div>

      {activeHoliday && (
        <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-3xl p-6 border-2 border-orange-200 shadow-lg slide-up relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-red-100 opacity-30"></div>
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white mb-4 shadow-lg">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {activeHoliday.name} - זמן הזמנות!
            </h3>
            <p className="text-gray-700 mb-4 font-medium">
              תאריכי החג: {new Date(activeHoliday.start_date).toLocaleDateString('he-IL')} – {new Date(activeHoliday.end_date).toLocaleDateString('he-IL')}
            </p>
            <div className="bg-white rounded-2xl p-4 shadow-md border border-orange-200">
              <p className="text-sm text-orange-800 font-medium">
                💡 השתמשו בכפתור "הזמנות ל{activeHoliday.name}" למעלה לחוויית הזמנה מותאמת לחג
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Features יפות ומעוצבות */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-3xl p-6 sm:p-8 shadow-lg slide-up">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gray-700 to-blue-700 bg-clip-text text-transparent">למה לבחור בנו?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-center group">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Fish className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800">דגים טריים</h3>
            <p className="text-sm text-gray-600">
              איכות מעולה יומית מהדייגים
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-center group">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800">שירות מקצועי</h3>
            <p className="text-sm text-gray-600">
              חיתוך מקצועי לפי בקשה
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-center group">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-800">הזמנה נוחה</h3>
            <p className="text-sm text-gray-600">
              ללא המתנה בחנות
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action מעוצב */}
      <div className="text-center bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 shadow-xl slide-up relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Rocket className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">מוכנים להתחיל?</h3>
          </div>
          <p className="text-blue-100 mb-6 text-sm">גלו את מגוון הדגים הטריים שלנו</p>
          <div className="flex justify-center">
            <Link 
              to="/categories" 
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-blue-50 inline-flex items-center gap-2"
            >
              <Fish className="w-5 h-5" />
              צפייה בקטלוג
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 