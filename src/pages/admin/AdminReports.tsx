import React from 'react'
import { Link } from 'react-router-dom'
import AdminBottomNav from '../../components/admin/AdminBottomNav'
import { 
  FileText, 
  Package, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Users,
  ArrowLeft,
  Clock,
  Zap
} from 'lucide-react'

const AdminReports: React.FC = () => {
  const reports = [
    {
      id: 'daily-report',
      title: 'דוח יומי להזמנות',
      description: 'רשימת הזמנות לתאריך נבחר - לצורך היערכות יומית',
      icon: FileText,
      link: '/admin/daily-report',
      color: 'blue',
      timing: 'נשלח כל בוקר בשעה 08:00',
      features: ['רשימת הזמנות', 'פרטי לקוח', 'סימון חג', 'יחידות נכונות']
    },
    {
      id: 'inventory-report',
      title: 'דוח מלאי נוכחי',
      description: 'בדיקת כמויות זמינות עם התראות צבע למלאי נמוך',
      icon: Package,
      link: '/admin/inventory-report',
      color: 'green',
      timing: 'בלחיצה - בלייב',
      features: ['מלאי זמין', 'התראות צבע', 'סטטיסטיקות', 'רענון אוטומטי']
    },
    {
      id: 'holiday-orders-report',
      title: 'דוח הזמנות לחג',
      description: 'הזמנות שסומנו כהזמנות חג עם סיכומים מפורטים',
      icon: Calendar,
      link: '/admin/holiday-orders-report',
      color: 'purple',
      timing: 'נשלח 7-10 ימים לפני החג',
      features: ['הזמנות חג בלבד', 'סיכום דגים', 'רשימת לקוחות', 'ספירת ימים']
    },
    {
      id: 'supplier-report',
      title: 'דוח ספקים לחג',
      description: 'סכימה לפי סוג דג - כמויות נדרשות vs מלאי נוכחי',
      icon: TrendingUp,
      link: '/admin/supplier-report',
      color: 'orange',
      timing: 'נשלח לפי תאריך deadline',
      features: ['סכימה לפי דג', 'מלאי vs ביקוש', 'חסרים במלאי', 'הזמנה מספקים']
    },
    {
      id: 'revenue-report',
      title: 'דוח הכנסות חודשי',
      description: 'ניתוח עסקי מפורט - הכנסות, פילוחים וגרפים',
      icon: DollarSign,
      link: '/admin/revenue-report',
      color: 'emerald',
      timing: 'נשלח כל 1 לחודש',
      features: ['גרפי הכנסות', 'דגים פופולריים', 'ניתוח מגמות', 'ממוצע הזמנה']
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-500',
        text: 'text-blue-800',
        badge: 'bg-blue-100 text-blue-700'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-500',
        text: 'text-green-800',
        badge: 'bg-green-100 text-green-700'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'bg-purple-500',
        text: 'text-purple-800',
        badge: 'bg-purple-100 text-purple-700'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'bg-orange-500',
        text: 'text-orange-800',
        badge: 'bg-orange-100 text-orange-700'
      },
      emerald: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'bg-emerald-500',
        text: 'text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-700'
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Link to="/admin/dashboard" className="text-primary-600 hover:text-primary-700">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">דוחות המערכת</h1>
                <p className="text-gray-600">מרכז הדוחות - כל הדוחות במקום אחד</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                5 דוחות זמינים
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* הסבר כללי */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex items-start space-x-4 space-x-reverse">
            <div className="bg-blue-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">אודות הדוחות</h2>
              <p className="text-gray-600 mb-4">
                מערכת הדוחות מספקת מידע מפורט על פעילות העסק, מלאי, הזמנות וביצועים כספיים. 
                כל דוח ניתן להורדה כ-PDF או לשליחה בוואטסאפ.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 space-x-reverse text-green-700">
                  <Zap className="w-4 h-4" />
                  <span>תמיכה מלאה בעברית RTL</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span>דוחות אוטומטיים לפי לוח זמנים</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse text-purple-700">
                  <Users className="w-4 h-4" />
                  <span>שליחה בוואטסאפ ו-PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* רשת הדוחות */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {reports.map((report) => {
            const Icon = report.icon
            const colors = getColorClasses(report.color)
            
            return (
              <Link
                key={report.id}
                to={report.link}
                className={`block ${colors.bg} ${colors.border} border rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-start space-x-4 space-x-reverse">
                  <div className={`${colors.icon} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>
                      {report.title}
                    </h3>
                    <p className="text-gray-700 mb-3">
                      {report.description}
                    </p>
                    
                    {/* תזמון */}
                    <div className={`${colors.badge} px-3 py-1 rounded-full text-sm font-medium mb-3 inline-block`}>
                      ⏰ {report.timing}
                    </div>
                    
                    {/* תכונות */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-800">תכונות עיקריות:</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {report.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* חץ */}
                <div className="flex justify-end mt-4">
                  <div className={`${colors.icon} p-2 rounded-lg`}>
                    <ArrowLeft className="w-4 h-4 text-white rotate-180" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* סטטיסטיקות מהירות */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">סטטיסטיקות מהירות</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-500 p-4 rounded-lg mx-auto w-16 h-16 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">5</h3>
              <p className="text-gray-600 text-sm">סוגי דוחות</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500 p-4 rounded-lg mx-auto w-16 h-16 flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">2</h3>
              <p className="text-gray-600 text-sm">פורמטי יצוא</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500 p-4 rounded-lg mx-auto w-16 h-16 flex items-center justify-center mb-3">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">3</h3>
              <p className="text-gray-600 text-sm">דוחות אוטומטיים</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-500 p-4 rounded-lg mx-auto w-16 h-16 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">RTL</h3>
              <p className="text-gray-600 text-sm">תמיכה מלאה</p>
            </div>
          </div>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  )
}

export default AdminReports