import { Link } from 'react-router-dom'
import { Fish, Waves, Droplets, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-20 animate-fade-in">
      {/* Professional Hero Section */}
      <div className="relative text-center py-24 ocean-header rounded-3xl overflow-hidden">
        <div className="relative z-10">
          <h1 className="heading-responsive font-bold text-white mb-8 animate-slide-up leading-tight">
            דגי בקעת אונו
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
            החנות המובילה לדגים טריים ואיכותיים בישראל
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/catalog" 
              className="btn-primary bg-white text-ocean-600 hover:bg-gray-50 text-lg px-8 py-4"
            >
              <Fish className="w-6 h-6" />
              צפייה בקטלוג
            </Link>
            <Link 
              to="/catalog?type=saltwater" 
              className="btn-secondary border-white text-white hover:bg-white hover:text-ocean-600 text-lg px-8 py-4"
            >
              <Waves className="w-6 h-6" />
              דגי ים
            </Link>
          </div>
        </div>
      </div>

      {/* Professional Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Link 
          to="/catalog?type=saltwater" 
          className="professional-card group"
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 ocean-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
              <Waves className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-deep-900">דגי מים מלוחים</h3>
            <p className="text-deep-600 mb-6 leading-relaxed">
              דגים טריים מהים התיכון - דניס, לברק, מוסר ועוד
            </p>
            <span className="badge text-ocean-700 bg-ocean-100 border-ocean-200">
              צפייה בקטלוג
            </span>
          </div>
        </Link>

        <Link 
          to="/catalog?type=freshwater" 
          className="professional-card group"
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 wave-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
              <Droplets className="w-10 h-10 text-wave-800" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-deep-900">דגי מים מתוקים</h3>
            <p className="text-deep-600 mb-6 leading-relaxed">
              דגים ממקורות מים מתוקים - בורי, מושט, קרפיון ועוד
            </p>
            <span className="badge text-wave-700 bg-wave-100 border-wave-200">
              צפייה בקטלוג
            </span>
          </div>
        </Link>

        <Link 
          to="/catalog?type=other" 
          className="professional-card group"
        >
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-sand-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
              <Shield className="w-10 h-10 text-sand-800" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-deep-900">דגים מיוחדים</h3>
            <p className="text-deep-600 mb-6 leading-relaxed">
              דגים מובחרים - סלמון נורווגי, פורל, טונה אדומה
            </p>
            <span className="badge text-sand-700 bg-sand-100 border-sand-200">
              צפייה בקטלוג
            </span>
          </div>
        </Link>
      </div>

      {/* Professional Features */}
      <div className="card-glass p-12">
        <h2 className="text-4xl font-bold text-center mb-16 text-deep-900">למה לבחור בנו</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-20 h-20 ocean-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Fish className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-deep-900">איכות גבוהה</h3>
            <p className="text-deep-600 leading-relaxed">
              דגים טריים ואיכותיים שמגיעים יומית מהדייגים המקומיים והיבואנים המובילים
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 wave-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-wave-800" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-deep-900">שירות מקצועי</h3>
            <p className="text-deep-600 leading-relaxed">
              חיתוך מקצועי לפי בקשה והכנה מדויקת בהתאם לצרכים שלכם
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-deep-gradient rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Waves className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-deep-900">הזמנה נוחה</h3>
            <p className="text-deep-600 leading-relaxed">
              הזמינו מראש אונליין ואספו בזמן שנוח לכם - ללא המתנה בתור
            </p>
          </div>
        </div>
      </div>

      {/* Professional CTA */}
      <div className="text-center card-glass p-12">
        <h3 className="text-3xl font-bold mb-6 text-deep-900">התחילו לקנות עכשיו</h3>
        <p className="text-deep-600 mb-10 max-w-3xl mx-auto text-lg leading-relaxed">
          גלו את מגוון הדגים הטריים שלנו ובצעו הזמנה פשוטה ומהירה. 
          כל הדגים שלנו נבחרים בקפידה ומגיעים במצב הטוב ביותר.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link to="/catalog" className="btn-primary text-lg px-10 py-4">
            <Fish className="w-6 h-6" />
            צפייה בקטלוג המלא
          </Link>
          <Link to="/catalog?type=saltwater" className="btn-outline text-lg px-10 py-4">
            <Waves className="w-6 h-6" />
            דגי ים טריים
          </Link>
        </div>
      </div>
    </div>
  )
} 