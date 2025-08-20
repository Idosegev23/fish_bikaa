import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Components
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import FishCatalog from './pages/FishCatalog'
import CustomerDetails from './pages/CustomerDetails'
import OrderSummary from './pages/OrderSummary'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminFishManagement from './pages/admin/AdminFishManagement'
import AdminCutTypes from './pages/admin/AdminCutTypes'
import AdminDailyReport from './pages/admin/AdminDailyReport'
import AdminAdditionalProducts from './pages/admin/AdminAdditionalProducts.tsx'
import AdminMealRecommendations from './pages/admin/AdminMealRecommendations.tsx'
import AdminSupplierReport from './pages/admin/AdminSupplierReport'
import AdminHolidaySupplierReport from './pages/admin/AdminHolidaySupplierReport'
import AdminAvailability from './pages/admin/AdminAvailability'
import AdminOrders from './pages/admin/AdminOrders'
import AdminHolidays from './pages/admin/AdminHolidays'
import AdminDailyOrders from './pages/admin/AdminDailyOrders'
import AdminKitchenWeighing from './pages/admin/AdminKitchenWeighing'
import KitchenDisplay from './pages/KitchenDisplay'

export interface CartItem {
  fishId: number
  fishName: string
  waterType: string
  cutType: string
  cutTypeId?: number
  quantity: number // יחידות לדגים לפי יחידה, ק"ג לדגים לפי משקל
  pricePerKg: number // לדגים לפי יחידה נשתמש במחיר ליחידה ב-field זה לצורך תאימות
  totalPrice: number
  // שדות אופציונליים לתמיכה ביחידות ומידות
  unitsBased?: boolean
  averageWeightKg?: number
  size?: 'S' | 'M' | 'L'
  unitPrice?: number
}

function App() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  // הגדרת עברית RTL
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'rtl')
    document.documentElement.setAttribute('lang', 'he')
  }, [])

  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item])
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <Router>
      <div className="min-h-screen bg-neutral-gradient" dir="rtl">
        <Routes>
          {/* נתיבי לקוח */}
          <Route path="/" element={
            <Layout cart={cart}>
              <HomePage />
            </Layout>
          } />
          
          <Route path="/catalog" element={
            <Layout cart={cart}>
              <FishCatalog onAddToCart={addToCart} />
            </Layout>
          } />
          
          <Route path="/customer-details" element={
            <Layout cart={cart}>
              <CustomerDetails cart={cart} onRemoveFromCart={removeFromCart} />
            </Layout>
          } />
          
          <Route path="/order-summary" element={
            <Layout cart={cart}>
              <OrderSummary cart={cart} onClearCart={clearCart} />
            </Layout>
          } />

          {/* נתיבי אדמין */}
          <Route path="/admin" element={<AdminLogin onLogin={setIsAdmin} />} />
          
          <Route path="/admin/dashboard" element={
            isAdmin ? <AdminDashboard /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          
          <Route path="/admin/fish" element={
            isAdmin ? <AdminFishManagement /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          
          <Route path="/admin/cut-types" element={
            isAdmin ? <AdminCutTypes /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          <Route path="/admin/daily-report" element={
            isAdmin ? <AdminDailyReport /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          <Route path="/admin/holidays" element={
            isAdmin ? <AdminHolidays /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          <Route path="/admin/additional-products" element={
            isAdmin ? <AdminAdditionalProducts /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          <Route path="/admin/meal-recommendations" element={
            isAdmin ? <AdminMealRecommendations /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          <Route path="/admin/supplier-report" element={
            isAdmin ? <AdminSupplierReport /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          <Route path="/admin/holiday-supplier-report" element={
            isAdmin ? <AdminHolidaySupplierReport /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          <Route path="/admin/availability" element={
            isAdmin ? <AdminAvailability /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          
          <Route path="/admin/orders" element={
            isAdmin ? <AdminOrders /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          
          <Route path="/admin/daily-orders" element={
            isAdmin ? <AdminDailyOrders /> : <AdminLogin onLogin={setIsAdmin} />
          } />
          
          {/* מסך מטבח מכובה זמנית - תכונה בתשלום */}
          <Route path="/admin/kitchen-weighing" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">תכונה בתשלום</h2>
                <p className="text-gray-600 mb-4">מסך המטבח יהיה זמין לאחר רכישת העדכון</p>
                <p className="text-sm text-gray-500">צרו קשר לפרטים נוספים</p>
              </div>
            </div>
          } />
          
          {/* נתיב ציבורי למסך מטבח - מכובה זמנית */}
          <Route path="/kitchen" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">מסך מטבח</h2>
                <p className="text-gray-600 mb-4">תכונה זו עדיין לא זמינה</p>
                <p className="text-sm text-gray-500">תהיה זמינה בקרוב</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
