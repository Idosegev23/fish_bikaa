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
import AdminOrders from './pages/admin/AdminOrders'

export interface CartItem {
  fishId: number
  fishName: string
  waterType: string
  cutType: string
  quantity: number
  pricePerKg: number
  totalPrice: number
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
          
          <Route path="/admin/orders" element={
            isAdmin ? <AdminOrders /> : <AdminLogin onLogin={setIsAdmin} />
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
