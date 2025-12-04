import { useState, useEffect } from 'react'
import { Package, Plus, Minus, Search, X, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { CartItem } from '../App'

interface AdditionalProduct {
  id: number
  name: string
  description?: string
  price: number
  unit: string
  available_units: number
  image_url?: string
  meal_tags: string[]
  suggest_tags: string[]
  category?: string
}

interface AdditionalProductsProps {
  onAddToCart?: (item: CartItem) => void
}

const CATEGORIES = [
  { id: 'all', name: 'הכל' },
  { id: 'תבלינים', name: 'תבלינים' },
  { id: 'קפואים', name: 'קפואים' },
  { id: 'בסיסים למרק', name: 'בסיסים למרק' },
  { id: 'תערובות ציפוי', name: 'תערובות ציפוי' },
  { id: 'קטניות', name: 'קטניות' },
]

export default function AdditionalProducts({ onAddToCart }: AdditionalProductsProps) {
  const [products, setProducts] = useState<AdditionalProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('additional_products')
        .select('*')
        .eq('active', true)
        .order('category')
        .order('name')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredProducts = () => {
    let filtered = products

    // סינון מוצרים ללא מלאי - מציג רק מה שיש
    filtered = filtered.filter(product => product.available_units > 0)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category === selectedCategory
      )
    }

    return filtered
  }

  const filteredProducts = getFilteredProducts()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-[#F5F9FA]">
        <div className="text-[#6FA8BF]">טוען...</div>
      </div>
    )
  }

  return (
    <div className="fade-in min-h-screen bg-[#F5F9FA]">
      {/* Header */}
      <section className="bg-[#023859] py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-3">מוצרים נלווים</h1>
          <p className="text-[#B4D2D9] max-w-lg mx-auto text-sm md:text-base">
            תבלינים, בסיסים למרק ומוצרים משלימים לבישול
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-[#B4D2D9]/50 sticky top-16 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* שורה ראשונה - חיפוש ותוצאות */}
            <div className="flex items-center gap-4">
              {/* חיפוש */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6FA8BF] w-5 h-5" />
                <input
                  type="text"
                  placeholder="חיפוש מוצר..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 border-2 border-[#B4D2D9] rounded-lg focus:border-[#026873] focus:outline-none transition-colors bg-white text-[#023859] text-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6FA8BF] hover:text-[#026873]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* תוצאות */}
              <span className="text-sm text-[#6FA8BF] font-medium bg-[#F5F9FA] px-3 py-1.5 rounded-lg whitespace-nowrap">
                {filteredProducts.length} מוצרים
              </span>
            </div>

            {/* שורה שנייה - קטגוריות */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 flex-shrink-0 ${
                    selectedCategory === category.id
                      ? 'bg-[#026873] text-white shadow-sm'
                      : 'bg-[#F5F9FA] text-[#023859] hover:bg-[#B4D2D9]/50 border border-[#B4D2D9]/50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="slide-up" 
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#B4D2D9]/30">
              <Package className="w-14 h-14 text-[#B4D2D9] mx-auto mb-4" />
              <p className="text-[#6FA8BF] text-lg mb-4">לא נמצאו מוצרים</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="text-[#026873] hover:text-[#023859] font-medium underline underline-offset-4"
              >
                איפוס סינונים
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-10 border-t border-[#B4D2D9]/30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <Link 
            to="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-[#023859] text-[#023859] hover:bg-[#023859] hover:text-white font-medium rounded-lg transition-all duration-300"
          >
            חזרה לקטלוג הדגים
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

interface ProductCardProps {
  product: AdditionalProduct
  onAddToCart?: (item: CartItem) => void
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  
  const isOutOfStock = product.available_units <= 0

  const handleAddToCart = () => {
    if (!onAddToCart || isOutOfStock || quantity <= 0) return

    const cartItem: CartItem = {
      fishId: product.id,
      fishName: product.name,
      waterType: 'additional',
      cutType: product.unit,
      cutTypeId: 999,
      quantity,
      pricePerKg: product.price,
      totalPrice: product.price * quantity,
      unitsBased: true,
      unitPrice: product.price
    }

    onAddToCart(cartItem)

    const notification = document.createElement('div')
    notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-[#023859] text-white px-5 py-3 rounded-lg z-50 fade-in shadow-lg text-sm'
    notification.textContent = `${product.name} נוסף לסל`
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2500)
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#B4D2D9]/40 hover:border-[#6FA8BF] hover:shadow-md transition-all duration-300 group flex flex-col h-full">
      {/* תמונה */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#F5F9FA] to-[#B4D2D9]/20">
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 backdrop-blur-sm">
            <span className="text-xs text-[#6FA8BF] font-medium bg-[#F5F9FA] px-3 py-1.5 rounded-full">אזל המלאי</span>
          </div>
        )}
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-[#B4D2D9]" />
          </div>
        )}
      </div>

      {/* פרטים */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-medium text-[#023859] text-sm md:text-base mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {product.category && (
          <span className="text-xs text-[#6FA8BF] mb-2 block">
            {product.category}
          </span>
        )}
        
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-lg md:text-xl font-bold text-[#026873]">₪{product.price}</span>
          <span className="text-xs text-[#6FA8BF]">{product.unit}</span>
        </div>

        <div className="mt-auto space-y-3">
          {/* כמות */}
          <div className="flex items-center border-2 border-[#B4D2D9] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isOutOfStock || quantity <= 1}
              className="w-9 h-9 flex items-center justify-center text-[#023859] hover:bg-[#F5F9FA] transition-colors disabled:opacity-40"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            
            <input
              type="number"
              min="1"
              max={product.available_units}
              value={quantity}
              onChange={(e) => {
                const val = Number(e.target.value)
                setQuantity(Math.max(1, Math.min(val, product.available_units)))
              }}
              className="flex-1 h-9 text-center border-0 focus:ring-0 focus:outline-none text-[#023859] font-medium bg-transparent text-sm"
              disabled={isOutOfStock}
            />
            
            <button
              type="button"
              onClick={() => setQuantity(Math.min(product.available_units, quantity + 1))}
              disabled={isOutOfStock || quantity >= product.available_units}
              className="w-9 h-9 flex items-center justify-center text-[#023859] hover:bg-[#F5F9FA] transition-colors disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* סה"כ */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#6FA8BF]">סה״כ</span>
            <span className="font-semibold text-[#023859]">₪{(product.price * quantity).toFixed(0)}</span>
          </div>

          {/* כפתור */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || !onAddToCart}
            className="w-full py-2.5 bg-[#026873] hover:bg-[#023859] text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isOutOfStock ? 'אזל המלאי' : 'הוסף לסל'}
          </button>
        </div>
      </div>
    </div>
  )
}
