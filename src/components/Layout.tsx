import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Phone, Mail, MapPin, ShoppingBag, MessageCircle, X, Menu, Award, ShieldCheck, Truck, Users, Clock, Fish } from 'lucide-react'
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
    <div className="min-h-screen bg-white">
      {/* Announcement Bar */}
      {announcementVisible && (
        <div className="bg-[#023859] text-white py-2.5 px-4 text-center relative">
          <p className="text-xs md:text-sm flex items-center justify-center gap-2">
            <Fish className="w-4 h-4 hidden sm:inline" />
            <span>משלוח חינם בהזמנה מעל ₪200</span>
            <span className="hidden sm:inline mx-2">|</span>
            <Clock className="w-4 h-4 hidden sm:inline" />
            <span className="hidden sm:inline">הזמנות עד 12:00 - איסוף באותו היום</span>
          </p>
          <button 
            onClick={() => setAnnouncementVisible(false)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            aria-label="סגור הודעה"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-soft' : 'bg-white'
      }`}>
        <div className="border-b border-[#B4D2D9]/30">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 -mr-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="תפריט"
              >
                <Menu className="w-5 h-5 text-[#023859]" />
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
                  className={`text-sm font-medium transition-colors relative py-2 ${
                    isActive('/') ? 'text-[#026873]' : 'text-[#023859]/70 hover:text-[#023859]'
                  }`}
                >
                  ראשי
                  {isActive('/') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#026873] rounded-full" />}
                </Link>
                <Link 
                  to="/catalog" 
                  className={`text-sm font-medium transition-colors relative py-2 ${
                    isActive('/catalog') ? 'text-[#026873]' : 'text-[#023859]/70 hover:text-[#023859]'
                  }`}
                >
                  קטלוג דגים
                  {isActive('/catalog') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#026873] rounded-full" />}
                </Link>
                <Link 
                  to="/additional-products" 
                  className={`text-sm font-medium transition-colors relative py-2 ${
                    isActive('/additional-products') ? 'text-[#026873]' : 'text-[#023859]/70 hover:text-[#023859]'
                  }`}
                >
                  מוצרים נלווים
                  {isActive('/additional-products') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#026873] rounded-full" />}
                </Link>
              </nav>

              {/* עגלת קניות */}
              <Link 
                to="/order-summary" 
                className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#023859] transition-all hover:bg-[#B4D2D9]/20 rounded-lg border border-[#B4D2D9]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">סל</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#026873] text-white text-xs w-5 h-5 flex items-center justify-center font-bold rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#B4D2D9]/30 animate-slide-down">
            <nav className="max-w-6xl mx-auto px-4 py-4 space-y-1">
              <Link 
                to="/" 
                className={`block py-3 px-4 text-base font-medium rounded-lg ${
                  isActive('/') ? 'bg-[#B4D2D9]/20 text-[#026873]' : 'text-[#023859]/70'
                }`}
              >
                ראשי
              </Link>
              <Link 
                to="/catalog" 
                className={`block py-3 px-4 text-base font-medium rounded-lg ${
                  isActive('/catalog') ? 'bg-[#B4D2D9]/20 text-[#026873]' : 'text-[#023859]/70'
                }`}
              >
                קטלוג דגים
              </Link>
              <Link 
                to="/additional-products" 
                className={`block py-3 px-4 text-base font-medium rounded-lg ${
                  isActive('/additional-products') ? 'bg-[#B4D2D9]/20 text-[#026873]' : 'text-[#023859]/70'
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
        className="fixed bottom-6 left-6 z-50 bg-[#026873] hover:bg-[#013440] text-white p-4 rounded-full shadow-ocean transition-all hover:scale-110"
        aria-label="צור קשר בוואטסאפ"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* Footer */}
      <footer className="bg-[#013440] text-white mt-20">
        {/* Trust Bar */}
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-[#026873]/30 rounded-lg flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-[#6FA8BF]" />
                </div>
                <div className="text-sm font-medium">ניסיון מוכח</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-[#026873]/30 rounded-lg flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5 text-[#6FA8BF]" />
                </div>
                <div className="text-sm font-medium">כשרות מהדרין</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-[#026873]/30 rounded-lg flex items-center justify-center mb-2">
                  <Truck className="w-5 h-5 text-[#6FA8BF]" />
                </div>
                <div className="text-sm font-medium">איסוף מהיר</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-[#026873]/30 rounded-lg flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-[#6FA8BF]" />
                </div>
                <div className="text-sm font-medium">לקוחות מרוצים</div>
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
              <p className="text-sm text-[#B4D2D9]/70 leading-relaxed mb-4">
                דגים טריים ואיכותיים מהים התיכון, חתוכים בדיוק כמו שאתם אוהבים.
              </p>
            </div>

            {/* ניווט */}
            <div>
              <h4 className="text-sm font-semibold mb-4 tracking-wide text-[#6FA8BF]">ניווט</h4>
              <div className="space-y-3">
                <Link to="/" className="block text-sm text-[#B4D2D9]/70 hover:text-white transition-colors">
                  דף הבית
                </Link>
                <Link to="/catalog" className="block text-sm text-[#B4D2D9]/70 hover:text-white transition-colors">
                  קטלוג דגים
                </Link>
                <Link to="/additional-products" className="block text-sm text-[#B4D2D9]/70 hover:text-white transition-colors">
                  מוצרים נלווים
                </Link>
              </div>
            </div>

            {/* יצירת קשר */}
            <div>
              <h4 className="text-sm font-semibold mb-4 tracking-wide text-[#6FA8BF]">יצירת קשר</h4>
              <div className="space-y-3">
                <a href="tel:03-1234567" className="flex items-center gap-3 text-sm text-[#B4D2D9]/70 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-[#6FA8BF]" />
                  <span>03-1234567</span>
                </a>
                <a href="mailto:info@fishbakat.co.il" className="flex items-center gap-3 text-sm text-[#B4D2D9]/70 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-[#6FA8BF]" />
                  <span>info@fishbakat.co.il</span>
                </a>
                <div className="flex items-start gap-3 text-sm text-[#B4D2D9]/70">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#6FA8BF]" />
                  <span>רחוב הדייגים 15, בקעת אונו</span>
                </div>
              </div>
            </div>

            {/* שעות */}
            <div>
              <h4 className="text-sm font-semibold mb-4 tracking-wide text-[#6FA8BF]">שעות פעילות</h4>
              <div className="space-y-2 text-sm text-[#B4D2D9]/70">
                <div className="flex justify-between">
                  <span>א׳ - ה׳</span>
                  <span className="text-white">8:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>ו׳</span>
                  <span className="text-white">8:00 - 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span>שבת</span>
                  <span className="text-[#B4D2D9]/50">סגור</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-[#B4D2D9]/50">
                © {new Date().getFullYear()} דגי בקעת אונו. כל הזכויות שמורות.
              </p>
              <Link 
                to="/admin" 
                className="text-xs text-[#B4D2D9]/50 hover:text-white transition-colors"
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
