import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Fish, Scissors, Package, Waves, Droplets, Star } from 'lucide-react'

export default function CatalogCategories() {
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
      .replace(/"|\'|"|"|׳|"/g, '')
      .replace(/[^\p{L}\p{N}-]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  return (
    <div className="space-y-8 sm:space-y-12 fade-in">
      {/* Hero Section */}
      <div className="text-center bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-3xl border border-blue-100 shadow-xl p-8 sm:p-12">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <Fish className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent mb-4">
          קטלוג מוצרים
        </h1>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          בחרו מהקטגוריות שלנו ומצאו בדיוק מה שאתם מחפשים
        </p>
      </div>

      {/* Holiday Banner */}
      {activeHoliday && (
        <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-3xl p-6 border-2 border-orange-200 shadow-lg slide-up text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white mb-4">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {activeHoliday.name} - הזמנות מיוחדות!
          </h3>
          <Link
            to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            <Star className="w-4 h-4" />
            הזמנות לחג
          </Link>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* דגי מים מלוחים */}
        <Link 
          to="/catalog?type=saltwater" 
          className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Waves className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800">דגי מים מלוחים</h3>
            <p className="text-sm text-gray-600 mb-4">
              דגים טריים מהים התיכון
            </p>
            <div className="text-xs text-blue-600 font-medium">
              דניס, לברק, מוסר ים ועוד →
            </div>
          </div>
        </Link>

        {/* דגי מים מתוקים */}
        <Link 
          to="/catalog?type=freshwater" 
          className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-emerald-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Droplets className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800">דגי מים מתוקים</h3>
            <p className="text-sm text-gray-600 mb-4">
              דגים ממקורות מים מתוקים
            </p>
            <div className="text-xs text-emerald-600 font-medium">
              בורי, מושט, קרפיון ועוד →
            </div>
          </div>
        </Link>

        {/* דגים מיוחדים */}
        <Link 
          to="/catalog?type=other" 
          className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-purple-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800">דגים מיוחדים</h3>
            <p className="text-sm text-gray-600 mb-4">
              דגים מובחרים ויוקרתיים
            </p>
            <div className="text-xs text-purple-600 font-medium">
              סלמון, פורל, טונה ועוד →
            </div>
          </div>
        </Link>

        {/* מוצרים נוספים */}
        <Link 
          to="/additional-products" 
          className="group bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-amber-100"
        >
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Package className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-800">מוצרים נוספים</h3>
            <p className="text-sm text-gray-600 mb-4">
              תוספות ועזרים למטבח
            </p>
            <div className="text-xs text-amber-600 font-medium">
              תבלינים, רטבים ועוד →
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-6 sm:p-8 text-center">
        <h3 className="text-xl font-bold mb-4 text-gray-800">רוצים לעבור ישר להזמנה?</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link 
            to="/catalog" 
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
          >
            <Fish className="w-5 h-5" />
            הזמנה רגילה
          </Link>
          {activeHoliday && (
            <Link
              to={`/catalog?holiday=${encodeURIComponent(slugify(activeHoliday.name))}`}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
            >
              <Star className="w-5 h-5" />
              הזמנה לחג
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
