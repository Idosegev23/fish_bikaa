import { useState, useEffect } from 'react'
import { Package, Plus, Minus, ShoppingCart, AlertCircle, ArrowRight, Search, Sparkles } from 'lucide-react'
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
  { id: 'all', name: 'הכל', icon: '🛒', color: 'from-gray-500 to-slate-600' },
  { id: 'תבלינים', name: 'תבלינים', icon: '🌿', color: 'from-green-500 to-emerald-600' },
  { id: 'קפואים', name: 'קפואים', icon: '❄️', color: 'from-blue-500 to-cyan-600' },
  { id: 'בסיסים למרק', name: 'בסיסים למרק', icon: '🍲', color: 'from-orange-500 to-red-600' },
  { id: 'תערובות ציפוי', name: 'תערובות ציפוי', icon: '🍗', color: 'from-amber-500 to-yellow-600' },
  { id: 'קטניות', name: 'קטניות', icon: '🫘', color: 'from-purple-500 to-pink-600' },
  { id: 'כללי', name: 'כללי', icon: '📦', color: 'from-slate-500 to-gray-600' },
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

  // סינון מוצרים
  const getFilteredProducts = () => {
    let filtered = products

    // סינון לפי חיפוש
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.meal_tags?.some(tag => tag.toLowerCase().includes(query)) ||
        product.category?.toLowerCase().includes(query)
      )
    }

    // סינון לפי קטגוריה
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.category === selectedCategory
      )
    }

    return filtered
  }

  const filteredProducts = getFilteredProducts()

  // קיבוץ לפי קטגוריה
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.category || 'כללי'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(product)
    return acc
  }, {} as Record<string, AdditionalProduct[]>)

  // ספירת מוצרים לפי קטגוריה
  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return products.length
    return products.filter(p => p.category === categoryId).length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Hero Section */}
      <div className="relative text-center bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl border border-amber-100 shadow-xl p-8 sm:p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-amber-400 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-orange-400 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Package className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            מוצרים נוספים
          </h1>
          <p className="text-gray-600 mb-2 max-w-2xl mx-auto text-lg">
            תוספות ועזרים לבישול המושלם שלכם
          </p>
          <p className="text-gray-500 max-w-xl mx-auto">
            תבלינים איכותיים, מוצרים קפואים, בסיסים למרק ועוד
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {CATEGORIES.map((category, index) => {
            const isSelected = selectedCategory === category.id
            const count = getCategoryCount(category.id)
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap
                  ${isSelected 
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-105` 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-102'
                  }
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="חפש מוצר..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-gray-50 text-gray-800 transition-all focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-center text-sm text-gray-500 mt-3">
          <Sparkles className="w-4 h-4 ml-1 text-amber-500" />
          נמצאו {filteredProducts.length} מוצרים
        </div>
      </div>

      {/* Products by Category */}
      {selectedCategory === 'all' ? (
        // הצגה לפי קטגוריות
        Object.entries(groupedProducts).map(([category, categoryProducts], catIndex) => {
          const categoryInfo = CATEGORIES.find(c => c.id === category) || CATEGORIES[CATEGORIES.length - 1]
          
          return (
            <div key={category} className="slide-up" style={{ animationDelay: `${catIndex * 0.1}s` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-r ${categoryInfo.color} rounded-xl flex items-center justify-center text-lg`}>
                  {categoryInfo.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{category}</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {categoryProducts.length} מוצרים
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {categoryProducts.map((product, index) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={onAddToCart}
                    animationDelay={index * 0.05}
                  />
                ))}
              </div>
            </div>
          )
        })
      ) : (
        // הצגה של קטגוריה בודדת
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
              animationDelay={index * 0.05}
            />
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 text-xl font-medium">לא נמצאו מוצרים</p>
          <p className="text-gray-400 mt-2">נסו לשנות את החיפוש או הקטגוריה</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}
            className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
          >
            הצג את כל המוצרים
          </button>
        </div>
      )}

      {/* Back to Categories */}
      <div className="text-center bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-6">
        <Link 
          to="/categories"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <ArrowRight className="w-5 h-5" />
          חזרה לקטלוג
        </Link>
      </div>
    </div>
  )
}

interface ProductCardProps {
  product: AdditionalProduct
  onAddToCart?: (item: CartItem) => void
  animationDelay?: number
}

function ProductCard({ product, onAddToCart, animationDelay = 0 }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  
  const isOutOfStock = product.available_units <= 0
  const isLowStock = product.available_units > 0 && product.available_units <= 5

  const handleAddToCart = () => {
    if (!onAddToCart || isOutOfStock || quantity <= 0) return

    setIsAdding(true)

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

    // הודעת הצלחה מעוצבת
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 slide-up'
    notification.innerHTML = `
      <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div>
        <div class="font-bold">${product.name}</div>
        <div class="text-sm text-green-100">נוסף לסל בהצלחה!</div>
      </div>
    `
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      notification.style.transform = 'translateY(-20px)'
      notification.style.transition = 'all 0.3s ease'
      setTimeout(() => notification.remove(), 300)
    }, 2500)

    setTimeout(() => setIsAdding(false), 500)
  }

  return (
    <div 
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden slide-up"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* תמונה */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* מצב מלאי */}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow">
              אזל
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow">
              אחרונים
            </span>
          ) : null}
        </div>

        {/* קטגוריה */}
        {product.category && (
          <div className="absolute bottom-2 left-2">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full shadow">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* פרטים */}
      <div className="p-3">
        <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-amber-600">₪{product.price}</span>
          <span className="text-xs text-gray-400">ליחידה</span>
        </div>

        {/* כמות */}
        <div className="flex items-center gap-1 mb-2">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock || quantity <= 1}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <input
            type="number"
            min="1"
            max={product.available_units}
            value={quantity}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const value = e.target.value
              if (value === '') {
                setQuantity(1)
              } else {
                setQuantity(Math.max(1, Math.min(Number(value), product.available_units)))
              }
            }}
            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            disabled={isOutOfStock}
          />
          
          <button
            type="button"
            onClick={() => setQuantity(Math.min(product.available_units, quantity + 1))}
            disabled={isOutOfStock || quantity >= product.available_units}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* סה"כ */}
        <div className="text-center text-sm text-gray-600 mb-2">
          סה"כ: <span className="font-bold text-gray-800">₪{(product.price * quantity).toFixed(2)}</span>
        </div>

        {/* כפתור הוספה */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || !onAddToCart || isAdding}
          className={`
            w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
            ${isOutOfStock 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : isAdding
                ? 'bg-green-500 text-white scale-95'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transform hover:scale-102'
            }
          `}
        >
          {isOutOfStock ? (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>אזל המלאי</span>
            </>
          ) : isAdding ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>נוסף!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>הוסף לסל</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
