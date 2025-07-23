import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Fish, Settings, Home, BookOpen, Mail, Phone, MapPin, Clock } from 'lucide-react'
import type { CartItem } from '../App'

interface LayoutProps {
  children: ReactNode
  cart: CartItem[]
}

export default function Layout({ children, cart }: LayoutProps) {
  const location = useLocation()
  const cartItemsCount = cart.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 ocean-nav">
        <div className="container">
          <div className="flex items-center justify-between h-20">
            {/* Professional Logo */}
            <Link to="/" className="flex items-center gap-4 group">
              <div className="ocean-gradient p-3 rounded-2xl shadow-ocean group-hover:shadow-ocean-lg transition-all duration-300 group-hover:scale-105">
                <Fish className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-deep-900">דגי בקעת אונו</h1>
                <p className="text-sm text-deep-600">דגים טריים ואיכותיים</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2 space-x-reverse">
              <Link 
                to="/" 
                className={`ocean-nav-link ${
                  location.pathname === '/' ? 'active' : ''
                }`}
              >
                <Home className="w-5 h-5" />
                דף הבית
              </Link>
              
              <Link 
                to="/catalog" 
                className={`ocean-nav-link ${
                  location.pathname === '/catalog' ? 'active' : ''
                }`}
              >
                <BookOpen className="w-5 h-5" />
                קטלוג דגים
              </Link>
            </nav>

            {/* Cart Button */}
            <div className="flex items-center">
              <Link 
                to="/customer-details" 
                className="btn-primary relative"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline mr-2">סל קניות</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-coral-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden bg-white/70 backdrop-blur-sm border-t border-deep-100 px-4 py-3">
          <div className="flex justify-center gap-8">
            <Link 
              to="/" 
              className={`ocean-nav-link text-sm ${
                location.pathname === '/' ? 'active' : ''
              }`}
            >
              <Home className="w-4 h-4" />
              דף הבית
            </Link>
            
            <Link 
              to="/catalog" 
              className={`ocean-nav-link text-sm ${
                location.pathname === '/catalog' ? 'active' : ''
              }`}
            >
              <BookOpen className="w-4 h-4" />
              קטלוג דגים
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container section-padding">
        {children}
      </main>

      {/* Professional Footer */}
      <footer className="deep-gradient text-white mt-20">
        <div className="container py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Company Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="surface-glass p-3 rounded-2xl">
                  <Fish className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">דגי בקעת אונו</h3>
                  <p className="text-deep-300">דגים טריים ואיכותיים</p>
                </div>
              </div>
              <p className="text-deep-200 leading-relaxed">
                החנות המובילה לדגים טריים ואיכותיים. אנחנו מביאים לכם את הדגים הטובים ביותר 
                מהים התיכון ומהמקורות הטובים ביותר בישראל.
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold">פרטי יצירת קשר</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-wave-400" />
                  <span className="text-deep-200">03-1234567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-wave-400" />
                  <span className="text-deep-200">info@fish-bakat-ono.co.il</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-wave-400 mt-1" />
                  <span className="text-deep-200">רחוב הדייגים 15, בקעת אונו</span>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold">שעות פעילות</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-deep-300">ראשון - חמישי</span>
                  <span className="text-white font-medium">8:00-18:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-deep-300">יום שישי</span>
                  <span className="text-white font-medium">8:00-14:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-deep-300">יום שבת</span>
                  <span className="text-deep-400">סגור</span>
                </div>
              </div>
              
              {/* Status Card */}
              <div className="surface-glass rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">פעיל כעת</span>
                </div>
                <p className="text-deep-300 text-sm">
                  אנחנו כאן כדי לעזור לכם עם ההזמנות
                </p>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-deep-600 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-deep-300 text-sm">
                © 2025 דגי בקעת אונו. כל הזכויות שמורות.
              </p>
              
              {/* Admin Link */}
              <div className="flex items-center gap-6">
                <Link 
                  to="/admin" 
                  className="text-deep-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  כניסת אדמין
                </Link>
                <a 
                  href="mailto:info@fish-bakat-ono.co.il"
                  className="text-deep-400 hover:text-white text-sm transition-colors flex items-center gap-2"
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