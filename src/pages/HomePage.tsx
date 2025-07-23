import { Link } from 'react-router-dom'
import { Fish, Waves, Droplets, Star, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-16 fade-in">
      {/* Hero Section מודרני */}
      <div className="relative text-center py-20 bg-gradient-to-br from-primary-50 via-white to-neutral-100 rounded-5xl overflow-hidden">
        {/* אפקט רקע */}
        <div className="absolute inset-0 bg-ocean-gradient opacity-10"></div>
        <div className="absolute top-10 right-10 floating-element">
          <Sparkles className="w-8 h-8 text-primary-500/30" />
        </div>
        <div className="absolute bottom-10 left-10 floating-element" style={{animationDelay: '1s'}}>
          <Fish className="w-12 h-12 text-accent-500/20" />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold heading-gradient mb-6 sm:mb-8 slide-up leading-tight">
            ברוכים הבאים לדגי בקעת אונו
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-600 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed slide-up px-4 sm:px-0" style={{animationDelay: '0.2s'}}>
            החנות המובילה לדגים טריים ואיכותיים. הזמינו מראש ואספו בזמן שנוח לכם
          </p>
                     <Link 
             to="/catalog" 
             className="btn-primary text-lg sm:text-xl px-6 sm:px-10 py-3 sm:py-5 inline-flex items-center gap-2 sm:gap-3 hover-lift slide-up"
             style={{animationDelay: '0.4s'}}
           >
             <Fish className="w-5 h-5 sm:w-7 sm:h-7" />
             <span>הזמן עכשיו</span>
           </Link>
        </div>
      </div>

      {/* Categories מודרניות */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link 
          to="/catalog?type=saltwater" 
          className="card-glass hover-lift interactive-card group slide-up"
        >
          <div className="text-center">
            <div className="bg-gradient-to-br from-ocean-100 to-ocean-200 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
              <Waves className="w-10 h-10 text-ocean-600" />
            </div>
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
            <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
              <Droplets className="w-10 h-10 text-emerald-600" />
            </div>
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
            <div className="bg-gradient-to-br from-accent-100 to-accent-200 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
              <Star className="w-10 h-10 text-accent-600" />
            </div>
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
        <h2 className="text-4xl font-bold text-center mb-12 heading-gradient">למה לבחור בנו?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center group">
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
              <Fish className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-primary-800">דגים טריים</h3>
            <p className="text-neutral-600 leading-relaxed">
              דגים טריים ואיכותיים שמגיעים יומית מהדייגים המקומיים
            </p>
          </div>

          <div className="text-center group">
            <div className="bg-gradient-to-br from-accent-100 to-accent-200 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
              <Star className="w-8 h-8 text-accent-600" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-accent-800">שירות מקצועי</h3>
            <p className="text-neutral-600 leading-relaxed">
              חיתוך מקצועי לפי בקשה - שלם, פילטים או מנות מדויקות
            </p>
          </div>

          <div className="text-center group">
            <div className="bg-gradient-to-br from-ocean-100 to-ocean-200 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-soft">
              <Waves className="w-8 h-8 text-ocean-600" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-ocean-800">הזמנה נוחה</h3>
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
            <Fish className="w-5 h-5" />
            רוצה לראות קטלוג
          </Link>
          <Link to="/admin" className="btn-outline hover-lift">
            <Star className="w-5 h-5" />
            כניסת מנהל
          </Link>
        </div>
      </div>
    </div>
  )
} 