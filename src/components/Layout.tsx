import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Phone, Mail, MapPin, ShoppingBag } from 'lucide-react'
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
      setScrolled(window.scrollY > 10)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header מינימליסטי */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-subtle' : 'bg-white/95'
      }`}>
        <div className="border-b border-stone-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* לוגו בלבד - כבר מכיל טקסט */}
              <Link to="/" className="flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="דגי בקעת אונו" 
                  className="h-14 w-auto"
                />
              </Link>

              {/* ניווט מרכזי */}
              <nav className="hidden md:flex items-center gap-8">
                <Link 
                  to="/" 
                  className={`nav-link text-small ${location.pathname === '/' ? 'text-charcoal' : ''}`}
                >
                  ראשי
                </Link>
                <Link 
                  to="/catalog" 
                  className={`nav-link text-small ${location.pathname === '/catalog' ? 'text-charcoal' : ''}`}
                >
                  קטלוג
                </Link>
                <Link 
                  to="/additional-products" 
                  className={`nav-link text-small ${location.pathname === '/additional-products' ? 'text-charcoal' : ''}`}
                >
                  מוצרים נלווים
                </Link>
              </nav>

              {/* עגלת קניות */}
              <Link 
                to="/order-summary" 
                className="relative flex items-center gap-2 px-5 py-2.5 text-small font-medium text-charcoal transition-colors hover:bg-stone-100"
                style={{ border: '1px solid #D6D3D1' }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">סל קניות</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-charcoal text-white text-tiny w-5 h-5 flex items-center justify-center font-medium">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* ניווט מובייל */}
        <div className="md:hidden border-b border-stone-100">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex items-center gap-6 py-3 overflow-x-auto">
              <Link 
                to="/" 
                className={`text-small whitespace-nowrap ${location.pathname === '/' ? 'text-charcoal font-medium' : 'text-stone-500'}`}
              >
                ראשי
              </Link>
              <Link 
                to="/catalog" 
                className={`text-small whitespace-nowrap ${location.pathname === '/catalog' ? 'text-charcoal font-medium' : 'text-stone-500'}`}
              >
                קטלוג
              </Link>
              <Link 
                to="/additional-products" 
                className={`text-small whitespace-nowrap ${location.pathname === '/additional-products' ? 'text-charcoal font-medium' : 'text-stone-500'}`}
              >
                מוצרים נלווים
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* תוכן ראשי */}
      <main className="pt-20 md:pt-20 min-h-screen">
        {children}
      </main>

      {/* Footer מינימליסטי */}
      <footer className="bg-white border-t border-stone-200 mt-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* לוגו */}
            <div className="md:col-span-1">
              <img 
                src="/logo.png" 
                alt="דגי בקעת אונו" 
                className="h-16 w-auto mb-4"
              />
              <p className="text-small text-stone-500 leading-relaxed">
                דגים טריים ואיכותיים, ישירות מהים לצלחת שלכם.
              </p>
            </div>

            {/* ניווט */}
            <div>
              <h4 className="text-small font-medium text-charcoal mb-4 tracking-wide uppercase">ניווט</h4>
              <div className="space-y-3">
                <Link to="/" className="block text-small text-stone-500 hover:text-charcoal transition-colors">
                  דף הבית
                </Link>
                <Link to="/catalog" className="block text-small text-stone-500 hover:text-charcoal transition-colors">
                  קטלוג דגים
                </Link>
                <Link to="/additional-products" className="block text-small text-stone-500 hover:text-charcoal transition-colors">
                  מוצרים נלווים
                </Link>
              </div>
            </div>

            {/* יצירת קשר */}
            <div>
              <h4 className="text-small font-medium text-charcoal mb-4 tracking-wide uppercase">יצירת קשר</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-small text-stone-500">
                  <Phone className="w-4 h-4" />
                  <span>03-1234567</span>
                </div>
                <div className="flex items-center gap-3 text-small text-stone-500">
                  <Mail className="w-4 h-4" />
                  <span>info@fishbakat.co.il</span>
                </div>
                <div className="flex items-start gap-3 text-small text-stone-500">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>רחוב הדייגים 15, בקעת אונו</span>
                </div>
              </div>
            </div>

            {/* שעות */}
            <div>
              <h4 className="text-small font-medium text-charcoal mb-4 tracking-wide uppercase">שעות פעילות</h4>
              <div className="space-y-2 text-small text-stone-500">
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
                  <span className="text-stone-400">סגור</span>
                </div>
              </div>
            </div>
          </div>

          {/* קו הפרדה */}
          <div className="border-t border-stone-200 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-tiny text-stone-400">
                © 2025 דגי בקעת אונו. כל הזכויות שמורות.
              </p>
              <Link 
                to="/admin" 
                className="text-tiny text-stone-400 hover:text-charcoal transition-colors"
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
