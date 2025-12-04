import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Phone, Mail, MapPin, ShoppingBag, MessageCircle, X, Menu } from 'lucide-react'
import type { CartItem } from '../App'

interface LayoutProps {
  children: ReactNode
  cart: CartItem[]
}

export default function Layout({ children, cart }: LayoutProps) {
  const location = useLocation()
  const cartItemsCount = cart.length
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [announcementVisible, setAnnouncementVisible] = useState(true)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // סגירת מובייל מנו כשעוברים עמוד
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Announcement Bar */}
      {announcementVisible && (
        <div className="bg-charcoal text-white py-2 px-4 text-center relative">
          <p className="text-tiny md:text-small">
            🐟 משלוח חינם בהזמנה מעל ₪200 | ⏰ הזמנות עד 12:00 - איסוף באותו היום
          </p>
          <button 
            onClick={() => setAnnouncementVisible(false)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            aria-label="סגור הודעה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-soft' : 'bg-white'
      }`}>
        <div className="border-b border-stone-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 -mr-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="תפריט"
              >
                <Menu className="w-5 h-5 text-charcoal" />
              </button>

              {/* לוגו */}
              <Link to="/" className="flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="דגי בקעת אונו" 
                  className="h-10 md:h-14 w-auto"
                />
              </Link>

              {/* ניווט Desktop */}
              <nav className="hidden md:flex items-center gap-8">
                <Link 
                  to="/" 
                  className={`text-small font-medium transition-colors relative py-2 ${
                    isActive('/') ? 'text-charcoal' : 'text-stone-500 hover:text-charcoal'
                  }`}
                >
                  ראשי
                  {isActive('/') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
                </Link>
                <Link 
                  to="/catalog" 
                  className={`text-small font-medium transition-colors relative py-2 ${
                    isActive('/catalog') ? 'text-charcoal' : 'text-stone-500 hover:text-charcoal'
                  }`}
                >
                  קטלוג דגים
                  {isActive('/catalog') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
                </Link>
                <Link 
                  to="/additional-products" 
                  className={`text-small font-medium transition-colors relative py-2 ${
                    isActive('/additional-products') ? 'text-charcoal' : 'text-stone-500 hover:text-charcoal'
                  }`}
                >
                  מוצרים נלווים
                  {isActive('/additional-products') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
                </Link>
              </nav>

              {/* עגלת קניות */}
              <Link 
                to="/order-summary" 
                className="relative flex items-center gap-2 px-4 py-2 text-small font-medium text-charcoal transition-all hover:bg-stone-100 border border-stone-300"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">סל</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gold-600 text-white text-tiny w-5 h-5 flex items-center justify-center font-bold rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 animate-slide-down">
            <nav className="max-w-6xl mx-auto px-4 py-4 space-y-1">
              <Link 
                to="/" 
                className={`block py-3 px-4 text-body font-medium rounded-lg ${
                  isActive('/') ? 'bg-stone-100 text-charcoal' : 'text-stone-600'
                }`}
              >
                ראשי
              </Link>
              <Link 
                to="/catalog" 
                className={`block py-3 px-4 text-body font-medium rounded-lg ${
                  isActive('/catalog') ? 'bg-stone-100 text-charcoal' : 'text-stone-600'
                }`}
              >
                קטלוג דגים
              </Link>
              <Link 
                to="/additional-products" 
                className={`block py-3 px-4 text-body font-medium rounded-lg ${
                  isActive('/additional-products') ? 'bg-stone-100 text-charcoal' : 'text-stone-600'
                }`}
              >
                מוצרים נלווים
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* תוכן ראשי */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/972501234567?text=שלום, אשמח לקבל פרטים"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="צור קשר בוואטסאפ"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Footer */}
      <footer className="bg-charcoal text-white mt-20">
        {/* Trust Bar */}
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-small font-medium">+15 שנות ניסיון</div>
              </div>
              <div>
                <div className="text-2xl mb-2">✡️</div>
                <div className="text-small font-medium">כשרות מהדרין</div>
              </div>
              <div>
                <div className="text-2xl mb-2">🚚</div>
                <div className="text-small font-medium">איסוף מהיר</div>
              </div>
              <div>
                <div className="text-2xl mb-2">⭐</div>
                <div className="text-small font-medium">+5,000 לקוחות מרוצים</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* לוגו ותיאור */}
            <div className="md:col-span-1">
              <img 
                src="/logo.png" 
                alt="דגי בקעת אונו" 
                className="h-14 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-small text-stone-400 leading-relaxed mb-4">
                דגים טריים ואיכותיים מהים התיכון, חתוכים בדיוק כמו שאתם אוהבים.
              </p>
            </div>

            {/* ניווט */}
            <div>
              <h4 className="text-small font-semibold mb-4 tracking-wide">ניווט</h4>
              <div className="space-y-3">
                <Link to="/" className="block text-small text-stone-400 hover:text-white transition-colors">
                  דף הבית
                </Link>
                <Link to="/catalog" className="block text-small text-stone-400 hover:text-white transition-colors">
                  קטלוג דגים
                </Link>
                <Link to="/additional-products" className="block text-small text-stone-400 hover:text-white transition-colors">
                  מוצרים נלווים
                </Link>
              </div>
            </div>

            {/* יצירת קשר */}
            <div>
              <h4 className="text-small font-semibold mb-4 tracking-wide">יצירת קשר</h4>
              <div className="space-y-3">
                <a href="tel:03-1234567" className="flex items-center gap-3 text-small text-stone-400 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>03-1234567</span>
                </a>
                <a href="mailto:info@fishbakat.co.il" className="flex items-center gap-3 text-small text-stone-400 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>info@fishbakat.co.il</span>
                </a>
                <div className="flex items-start gap-3 text-small text-stone-400">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>רחוב הדייגים 15, בקעת אונו</span>
                </div>
              </div>
            </div>

            {/* שעות */}
            <div>
              <h4 className="text-small font-semibold mb-4 tracking-wide">שעות פעילות</h4>
              <div className="space-y-2 text-small text-stone-400">
                <div className="flex justify-between">
                  <span>א׳ - ה׳</span>
                  <span>8:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>ו׳</span>
                  <span>8:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span>שבת</span>
                  <span className="text-stone-500">סגור</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-tiny text-stone-500">
                © {new Date().getFullYear()} דגי בקעת אונו. כל הזכויות שמורות.
              </p>
              <Link 
                to="/admin" 
                className="text-tiny text-stone-500 hover:text-white transition-colors"
              >
                כניסת מנהל
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
