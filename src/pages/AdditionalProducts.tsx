import { useState, useEffect } from 'react'
import { Package, Plus, Minus, Search, X } from 'lucide-react'
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-stone-400">טוען...</div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <section className="bg-stone-100 py-12 md:py-16">
        <div className="container-boutique text-center">
          <h1 className="font-serif text-h1 text-charcoal mb-4">מוצרים נלווים</h1>
          <p className="text-stone-500 max-w-lg mx-auto">
            תבלינים, בסיסים למרק ומוצרים משלימים לבישול
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-stone-200 sticky top-20 z-40">
        <div className="container-boutique py-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* חיפוש */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
              <input
                type="text"
                placeholder="חיפוש מוצר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pr-10"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* קטגוריות */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 text-small font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-charcoal text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  style={{ border: selectedCategory === category.id ? '1px solid #1A1A1A' : '1px solid #E7E5E4' }}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* תוצאות */}
            <span className="text-small text-stone-500">
              {filteredProducts.length} מוצרים
            </span>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section bg-stone-50">
        <div className="container-boutique">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">לא נמצאו מוצרים</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-4 text-small text-charcoal underline"
              >
                איפוס סינונים
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-12">
        <div className="container-boutique text-center">
          <Link 
            to="/catalog"
            className="btn-secondary inline-flex items-center gap-2"
          >
            חזרה לקטלוג הדגים
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
    notification.className = 'fixed top-24 left-1/2 transform -translate-x-1/2 bg-charcoal text-white px-6 py-3 z-50 fade-in'
    notification.style.border = '1px solid #1A1A1A'
    notification.textContent = `${product.name} נוסף לסל`
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 2500)
  }

  return (
    <div className="card group">
      {/* תמונה */}
      <div className="aspect-square overflow-hidden bg-stone-100 mb-4">
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <span className="text-small text-stone-500">אזל המלאי</span>
          </div>
        )}
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-stone-300" />
          </div>
        )}
      </div>

      {/* פרטים */}
      <div>
        <h3 className="font-medium text-charcoal text-small mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {product.category && (
          <span className="text-tiny text-stone-400 mb-2 block">
            {product.category}
          </span>
        )}
        
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-serif text-h4 text-charcoal">₪{product.price}</span>
          <span className="text-tiny text-stone-400">{product.unit}</span>
        </div>

        {/* כמות */}
        <div className="quantity-selector mb-4">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={isOutOfStock || quantity <= 1}
            className="quantity-btn"
          >
            <Minus className="w-4 h-4" />
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
            className="quantity-input"
            disabled={isOutOfStock}
          />
          
          <button
            type="button"
            onClick={() => setQuantity(Math.min(product.available_units, quantity + 1))}
            disabled={isOutOfStock || quantity >= product.available_units}
            className="quantity-btn"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* סה"כ */}
        <div className="flex justify-between items-center mb-4 text-small">
          <span className="text-stone-500">סה״כ</span>
          <span className="font-medium text-charcoal">₪{(product.price * quantity).toFixed(0)}</span>
        </div>

        {/* כפתור */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || !onAddToCart}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-small py-2"
        >
          {isOutOfStock ? 'אזל המלאי' : 'הוסף לסל'}
        </button>
      </div>
    </div>
  )
}
