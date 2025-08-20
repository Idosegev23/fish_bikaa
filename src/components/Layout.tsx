import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Settings, Mail, Phone, MapPin } from 'lucide-react'
import type { CartItem } from '../App'

interface LayoutProps {
  children: ReactNode
  cart: CartItem[]
}

export default function Layout({ children, cart }: LayoutProps) {
  const location = useLocation()
  const cartItemsCount = cart.length
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header מודרני עם Glass Morphism - קבוע וגלוי תמיד */}
      <header className={`fixed top-0 inset-x-0 z-50 backdrop-blur-lg border-b ${scrolled ? 'bg-white/90 border-white/30 shadow-md' : 'bg-white/80 border-white/20 shadow-soft'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* לוגו ושם החנות */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="דגי בקעת אונו" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-lg sm:text-2xl font-bold text-primary-900 block truncate">דגי בקעת אונו</span>
                <p className="text-xs sm:text-sm text-neutral-500 -mt-1 hidden sm:block">דגים טריים ואיכותיים</p>
              </div>
            </Link>

            {/* ניווט מרכזי - דסקטופ */}
            <nav className="hidden md:flex items-center space-x-2 space-x-reverse bg-white/50 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                דף הבית
              </Link>
              <Link 
                to="/catalog" 
                className={`nav-link ${location.pathname === '/catalog' ? 'active' : ''}`}
              >
                קטלוג דגים
              </Link>
            </nav>

            {/* כפתור קופה */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link 
                to="/order-summary" 
                className="relative btn-primary flex items-center gap-1 sm:gap-2 group px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">לקופה</span>
                <span className="sm:hidden">קופה</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-accent-600 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-medium">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* תוכן ראשי */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 overflow-x-hidden pb-0">
        <div className="max-w-screen">
          {children}
        </div>
      </main>

      {/* Footer מודרני */}
      <footer className="bg-white border-t border-neutral-200 text-neutral-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* מידע על החנות */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex-shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="דגי בקעת אונו" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <h3 className="text-2xl font-bold text-primary-900">דגי בקעת אונו</h3>
              </div>
              <p className="text-neutral-600 leading-relaxed">
                החנות המובילה לדגים טריים ואיכותיים. אנחנו מביאים לכם את הדגים הטובים ביותר 
                מהים התיכון ומהמקורות הטובים ביותר בישראל.
              </p>
            </div>

            {/* פרטי יצירת קשר */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-primary-900">פרטי יצירת קשר</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary-600" />
                  <span className="text-neutral-700">03-1234567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary-600" />
                  <span className="text-neutral-700">info@fish-bakat-ono.co.il</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
                  <span className="text-neutral-700">רחוב הדייגים 15, בקעת אונו</span>
                </div>
              </div>
            </div>

            {/* שעות פעילות */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-primary-900">שעות פעילות</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-neutral-700">
                  <span>ראשון - חמישי</span>
                  <span className="font-medium">8:00-18:00</span>
                </div>
                <div className="flex justify-between items-center text-neutral-700">
                  <span>יום שישי</span>
                  <span className="font-medium">8:00-14:00</span>
                </div>
                <div className="flex justify-between items-center text-neutral-700">
                  <span>יום שבת</span>
                  <span className="text-neutral-500">סגור</span>
                </div>
              </div>
              
              {/* הערה */}
              <p className="text-neutral-500 text-sm">מענה טלפוני בימי פעילות החנות.</p>
            </div>
          </div>

          {/* קו הפרדה */}
          <div className="border-t border-neutral-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-neutral-500 text-sm">
                © 2025 דגי בקעת אונו. כל הזכויות שמורות.
              </p>
              
              {/* לינקים נוספים */}
              <div className="flex items-center gap-6">
                <Link 
                  to="/admin" 
                  className="text-primary-700 hover:text-primary-900 text-sm transition-colors flex items-center gap-2"
                >
                  כניסת אדמין
                </Link>
                <a 
                  href="mailto:info@fish-bakat-ono.co.il"
                  className="text-primary-700 hover:text-primary-900 text-sm transition-colors flex items-center gap-2"
                >
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