import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F9FA] to-[#B4D2D9]/30 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-[#023859]/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-[#023859] mb-2">הדף לא נמצא</h1>
        <p className="text-[#013440]/60 mb-8">
          העמוד שחיפשת אינו קיים או שהועבר למקום אחר
        </p>
        <Link
          to="/"
          className="inline-block bg-[#026873] hover:bg-[#013440] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
}
