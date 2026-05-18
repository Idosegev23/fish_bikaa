import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'

// Components - eagerly loaded (customer-facing)
import Layout from './components/Layout'
import ToastContainer from './components/Toast'
import HomePage from './pages/HomePage'
import FishCatalog from './pages/FishCatalog'
import CatalogCategories from './pages/CatalogCategories'
import AdditionalProducts from './pages/AdditionalProducts'
import CustomerDetails from './pages/CustomerDetails'
import OrderSummary from './pages/OrderSummary'
import NotFound from './pages/NotFound'

// Admin pages - lazy loaded (only loaded when admin navigates to them)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminFishManagement = lazy(() => import('./pages/admin/AdminFishManagement'))
const AdminCutTypes = lazy(() => import('./pages/admin/AdminCutTypes'))
const AdminDailyReport = lazy(() => import('./pages/admin/AdminDailyReport'))
const AdminAdditionalProducts = lazy(() => import('./pages/admin/AdminAdditionalProducts'))
const AdminMealRecommendations = lazy(() => import('./pages/admin/AdminMealRecommendations'))
const AdminSupplierReport = lazy(() => import('./pages/admin/AdminSupplierReport'))
const AdminHolidaySupplierReport = lazy(() => import('./pages/admin/AdminHolidaySupplierReport'))
const AdminCombinedReport = lazy(() => import('./pages/admin/AdminCombinedReport'))
const AdminInventoryReport = lazy(() => import('./pages/admin/AdminInventoryReport'))
const AdminHolidayOrdersReport = lazy(() => import('./pages/admin/AdminHolidayOrdersReport'))
const AdminRevenueReport = lazy(() => import('./pages/admin/AdminRevenueReport'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminAvailability = lazy(() => import('./pages/admin/AdminAvailability'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminHolidays = lazy(() => import('./pages/admin/AdminHolidays'))
const AdminDailyOrders = lazy(() => import('./pages/admin/AdminDailyOrders'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminFishCuts = lazy(() => import('./pages/admin/AdminFishCuts'))

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

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#023859] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#023859] font-medium">טוען...</p>
      </div>
    </div>
  )
}

function App() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem('isAdmin') === 'true'
    } catch { return false }
  })

  // שמירת מצב אדמין ב-localStorage
  useEffect(() => {
    try {
      if (isAdmin) {
        localStorage.setItem('isAdmin', 'true')
      } else {
        localStorage.removeItem('isAdmin')
      }
    } catch { /* localStorage not available */ }
  }, [isAdmin])

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
        <ToastContainer />
        <Suspense fallback={<AdminLoadingFallback />}>
          <Routes>
            {/* נתיבי לקוח */}
            <Route path="/" element={
              <Layout cart={cart}>
                <HomePage />
              </Layout>
            } />

            <Route path="/categories" element={
              <Layout cart={cart}>
                <CatalogCategories />
              </Layout>
            } />

            <Route path="/additional-products" element={
              <Layout cart={cart}>
                <AdditionalProducts onAddToCart={addToCart} />
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
            <Route path="/admin/combined-report" element={
              isAdmin ? <AdminCombinedReport /> : <AdminLogin onLogin={setIsAdmin} />
            } />
            <Route path="/admin/inventory-report" element={
              isAdmin ? <AdminInventoryReport /> : <AdminLogin onLogin={setIsAdmin} />
            } />
            <Route path="/admin/holiday-orders-report" element={
              isAdmin ? <AdminHolidayOrdersReport /> : <AdminLogin onLogin={setIsAdmin} />
            } />
            <Route path="/admin/revenue-report" element={
              isAdmin ? <AdminRevenueReport /> : <AdminLogin onLogin={setIsAdmin} />
            } />
            <Route path="/admin/reports" element={
              isAdmin ? <AdminReports /> : <AdminLogin onLogin={setIsAdmin} />
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

            <Route path="/admin/coupons" element={
              isAdmin ? <AdminCoupons /> : <AdminLogin onLogin={setIsAdmin} />
            } />

            <Route path="/admin/fish-cuts" element={
              isAdmin ? <AdminFishCuts /> : <AdminLogin onLogin={setIsAdmin} />
            } />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App
