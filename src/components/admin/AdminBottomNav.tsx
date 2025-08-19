import { Link, useLocation } from 'react-router-dom'

export default function AdminBottomNav() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  const base = 'py-3'
  const active = 'text-primary-700 font-semibold'
  const inactive = 'text-neutral-600'

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur border-t border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-5 text-center text-sm">
          <Link to="/admin/dashboard" className={`${base} ${isActive('/admin/dashboard') ? active : inactive}`}>דשבורד</Link>
          <Link to="/admin/orders" className={`${base} ${isActive('/admin/orders') ? active : inactive}`}>הזמנות</Link>
          <Link to="/admin/fish" className={`${base} ${isActive('/admin/fish') ? active : inactive}`}>דגים</Link>
          <Link to="/admin/daily-report" className={`${base} ${isActive('/admin/daily-report') ? active : inactive}`}>דוח יומי</Link>
          <Link to="/admin/holidays" className={`${base} ${isActive('/admin/holidays') ? active : inactive}`}>חגים</Link>
        </div>
      </div>
    </nav>
  )
}

