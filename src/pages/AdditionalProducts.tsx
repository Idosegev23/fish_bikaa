import { useState, useEffect } from 'react'
import { Package, Plus, Minus, ShoppingCart, AlertCircle, ArrowRight, Search, Filter } from 'lucide-react'
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
}

interface AdditionalProductsProps {
  onAddToCart?: (item: CartItem) => void
}

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
        product.meal_tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // סינון לפי קטגוריה
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => 
        product.meal_tags.includes(selectedCategory)
      )
    }

    return filtered
  }

  // קטגוריות זמינות
  const getCategories = () => {
    const allTags = products.flatMap(p => p.meal_tags)
    return [...new Set(allTags)].sort()
  }

  const filteredProducts = getFilteredProducts()
  const categories = getCategories()

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
    <div className="space-y-8 sm:space-y-12 fade-in">
      {/* Hero Section */}
      <div className="text-center bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl border border-amber-100 shadow-xl p-8 sm:p-12">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
          מוצרים נוספים
        </h1>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          תוספות ועזרים לבישול המושלם שלכם - תבלינים, רטבים, שמנים ועוד
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* חיפוש */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="חפש מוצר..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-800"
            />
          </div>
          
          {/* סינון לפי קטגוריה */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-800 min-w-[160px]"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* תוצאות */}
        <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
          <span>נמצאו {filteredProducts.length} מוצרים</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-amber-600 hover:text-amber-700"
            >
              ניקוי חיפוש
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart}
              animationDelay={index * 0.1}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 text-xl font-medium">לא נמצאו מוצרים</p>
          <p className="text-gray-400 mt-2">נסו לשנות את החיפוש או הסינון</p>
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
  
  const isOutOfStock = product.available_units <= 0
  const isLowStock = product.available_units > 0 && product.available_units <= 5

  const handleAddToCart = () => {
    if (!onAddToCart || isOutOfStock || quantity <= 0) return

    // יצירת פריט סל לפי הפורמט הקיים
    const cartItem: CartItem = {
      fishId: product.id,
      fishName: product.name,
      waterType: 'additional', // סוג מיוחד למוצרים נוספים
      cutType: product.unit,
      cutTypeId: 999, // ID מיוחד למוצרים נוספים
      quantity,
      pricePerKg: product.price,
      totalPrice: product.price * quantity,
      unitsBased: true,
      unitPrice: product.price
    }

    onAddToCart(cartItem)

    // הודעת הצלחה
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg z-50 animate-bounce'
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${product.name} נוסף לסל!</span>
      </div>
    `
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  return (
    <div 
      className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 overflow-hidden slide-up"
      style={{animationDelay: `${animationDelay}s`}}
    >
      {/* מצב מלאי */}
      <div className="relative p-6 pb-4">
        <div className="absolute top-3 left-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
              אזל המלאי
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
              מלאי נמוך
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
              זמין
            </span>
          )}
        </div>

        {/* תגי ארוחות */}
        {product.meal_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 mt-8">
            {product.meal_tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* פרטי מוצר */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-amber-600">₪{product.price}</span>
          <span className="text-sm text-gray-500">ל{product.unit}</span>
        </div>

        {product.description && (
          <p className="text-gray-600 text-sm mb-4">{product.description}</p>
        )}

        {/* כמות ופעולות */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כמות:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={isOutOfStock || quantity <= 1}
                className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center"
                disabled={isOutOfStock}
              />
              
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.available_units, quantity + 1))}
                disabled={isOutOfStock || quantity >= product.available_units}
                className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              זמין: {product.available_units} {product.unit}
            </p>
          </div>

          {/* סיכום מחיר */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">סה"כ:</span>
              <span className="text-lg font-bold text-gray-800">₪{(product.price * quantity).toFixed(2)}</span>
            </div>
          </div>

          {/* כפתור הוספה לסל */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || !onAddToCart}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isOutOfStock ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>אזל המלאי</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>הוסף לסל</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
