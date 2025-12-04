import { Link, useLocation } from 'react-router-dom'
import { Settings, ShoppingCart, Fish, FileText, Calendar, Package } from 'lucide-react'

export default function AdminBottomNav() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-t border-[#B4D2D9]/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-6 text-center text-xs">
          <Link 
            to="/admin/dashboard" 
            className={`py-3 flex flex-col items-center gap-1 ${isActive('/admin/dashboard') ? 'text-[#026873] font-semibold' : 'text-[#023859]/60'}`}
          >
            <Settings className="w-5 h-5" />
            <span>דשבורד</span>
          </Link>
          <Link 
            to="/admin/orders" 
            className={`py-3 flex flex-col items-center gap-1 ${isActive('/admin/orders') ? 'text-[#026873] font-semibold' : 'text-[#023859]/60'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>הזמנות</span>
          </Link>
          <Link 
            to="/admin/fish" 
            className={`py-3 flex flex-col items-center gap-1 ${isActive('/admin/fish') ? 'text-[#026873] font-semibold' : 'text-[#023859]/60'}`}
          >
            <Fish className="w-5 h-5" />
            <span>דגים</span>
          </Link>
          <Link 
            to="/admin/additional-products" 
            className={`py-3 flex flex-col items-center gap-1 ${isActive('/admin/additional-products') ? 'text-[#026873] font-semibold' : 'text-[#023859]/60'}`}
          >
            <Package className="w-5 h-5" />
            <span>מוצרים</span>
          </Link>
          <Link 
            to="/admin/reports" 
            className={`py-3 flex flex-col items-center gap-1 ${isActive('/admin/reports') ? 'text-[#026873] font-semibold' : 'text-[#023859]/60'}`}
          >
            <FileText className="w-5 h-5" />
            <span>דוחות</span>
          </Link>
          <Link 
            to="/admin/holidays" 
            className={`py-3 flex flex-col items-center gap-1 ${isActive('/admin/holidays') ? 'text-[#026873] font-semibold' : 'text-[#023859]/60'}`}
          >
            <Calendar className="w-5 h-5" />
            <span>חגים</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
