import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Fish, Settings, Home, BookOpen, Mail, Phone, MapPin } from 'lucide-react'
import type { CartItem } from '../App'

interface LayoutProps {
  children: ReactNode
  cart: CartItem[]
}

export default function Layout({ children, cart }: LayoutProps) {
  const location = useLocation()
  const cartItemsCount = cart.length

  return (
    <div className="min-h-screen bg-neutral-gradient">
      {/* Header מודרני עם Glass Morphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* לוגו ושם החנות */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover-lift group min-w-0 flex-shrink">
              <div className="bg-ocean-gradient p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-modern group-hover:scale-105 transition-transform flex-shrink-0">
                <Fish className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-lg sm:text-2xl font-bold heading-gradient block truncate">דגי בקעת אונו</span>
                <p className="text-xs sm:text-sm text-neutral-500 -mt-1 hidden sm:block">דגים טריים ואיכותיים</p>
              </div>
            </Link>

            {/* ניווט מרכזי */}
            <nav className="hidden md:flex items-center space-x-2 space-x-reverse bg-white/50 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
              <Link 
                to="/" 
                className={`nav-link flex items-center gap-2 ${
                  location.pathname === '/' ? 'active' : ''
                }`}
              >
                <Home className="w-4 h-4" />
                דף הבית
              </Link>
              
              <Link 
                to="/catalog" 
                className={`nav-link flex items-center gap-2 ${
                  location.pathname === '/catalog' ? 'active' : ''
                }`}
              >
                <BookOpen className="w-4 h-4" />
                קטלוג דגים
              </Link>
            </nav>

            {/* כפתורי פעולה */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* סל קניות מודרני */}
              <Link 
                to="/customer-details" 
                className="relative btn-primary flex items-center gap-1 sm:gap-2 group px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">סל קניות</span>
                <span className="sm:hidden">סל</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-accent-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-modern animate-pulse-soft">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ניווט מובייל */}
        <nav className="md:hidden bg-white/70 backdrop-blur-sm border-t border-white/20 px-4 py-3">
          <div className="flex justify-center items-center">
            <div className="flex gap-6">
              <Link 
                to="/" 
                className={`nav-link text-sm flex items-center gap-2 ${
                  location.pathname === '/' ? 'active' : ''
                }`}
              >
                <Home className="w-4 h-4" />
                דף הבית
              </Link>
              
              <Link 
                to="/catalog" 
                className={`nav-link text-sm flex items-center gap-2 ${
                  location.pathname === '/catalog' ? 'active' : ''
                }`}
              >
                <BookOpen className="w-4 h-4" />
                קטלוג דגים
              </Link>
            </div>


          </div>
        </nav>
      </header>

      {/* תוכן ראשי */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-x-hidden">
        <div className="max-w-screen">
          {children}
        </div>
      </main>

      {/* Footer מודרני */}
      <footer className="bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* מידע על החנות */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <Fish className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">דגי בקעת אונו</h3>
                  <p className="text-primary-200">דגים טריים ואיכותיים</p>
                </div>
              </div>
              <p className="text-primary-100 leading-relaxed">
                החנות המובילה לדגים טריים ואיכותיים. אנחנו מביאים לכם את הדגים הטובים ביותר 
                מהים התיכון ומהמקורות הטובים ביותר בישראל.
              </p>
            </div>

            {/* פרטי יצירת קשר */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-white">פרטי יצירת קשר</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-300" />
                  <span className="text-primary-100">03-1234567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-300" />
                  <span className="text-primary-100">info@fish-bakat-ono.co.il</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-300 mt-1 flex-shrink-0" />
                  <span className="text-primary-100">רחוב הדייגים 15, בקעת אונו</span>
                </div>
              </div>
            </div>

            {/* שעות פעילות */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-white">שעות פעילות</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-primary-200">ראשון - חמישי</span>
                  <span className="text-white font-medium">8:00-18:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-200">יום שישי</span>
                  <span className="text-white font-medium">8:00-14:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-200">יום שבת</span>
                  <span className="text-primary-300">סגור</span>
                </div>
              </div>
              
              {/* סטטוס פעילות */}
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="status-indicator online"></div>
                  <span className="text-white font-medium">פעיל כעת</span>
                </div>
                <p className="text-primary-200 text-sm">
                  אנחנו כאן כדי לעזור לכם עם ההזמנות
                </p>
              </div>
            </div>
          </div>

          {/* קו הפרדה */}
          <div className="border-t border-primary-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-primary-200 text-sm">
                © 2025 דגי בקעת אונו. כל הזכויות שמורות.
              </p>
              
              {/* לינקים נוספים */}
              <div className="flex items-center gap-6">
                <Link 
                  to="/admin" 
                  className="text-primary-300 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  כניסת אדמין
                </Link>
                <a 
                  href="mailto:info@fish-bakat-ono.co.il"
                  className="text-primary-300 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  צרו קשר
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 