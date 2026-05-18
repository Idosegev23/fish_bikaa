import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { FishType } from '../../lib/supabase'
import { pdfLibService } from '../../lib/pdfLibService'
import type { InventoryReportData } from '../../lib/pdfLibService'
import { sendWhatsAppMessage } from '../../lib/whatsappService'
import { Package, FileText, MessageCircle, RefreshCw, ArrowLeft } from 'lucide-react'

const AdminInventoryReport: React.FC = () => {
  const [fishTypes, setFishTypes] = useState<FishType[]>([])
  const [loading, setLoading] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('fish_types')
        .select('*')
        .eq('is_active', true)
        .order('name')
      setFishTypes(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    setGeneratingPDF(true)
    try {
      // יצירת נתוני דוח מלאי
      const reportData: InventoryReportData = {
        date: new Date().toISOString(),
        fishInventory: fishTypes.map(fish => {
          const isUnits = !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(fish.name)
          const stock = fish.available_kg
          const isLowStock = stock < (isUnits ? 5 : 2)
          const isOutOfStock = stock <= 0
          
          let status: 'זמין' | 'מלאי נמוך' | 'אזל'
          if (isOutOfStock) status = 'אזל'
          else if (isLowStock) status = 'מלאי נמוך'
          else status = 'זמין'
          
          return {
            fishName: fish.name,
            availableQuantity: fish.available_kg,
            isUnits,
            status
          }
        })
      }

      const pdfBlob = await pdfLibService.generateInventoryReport(reportData)
      const filename = `דוח-מלאי-${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`
      
      pdfLibService.downloadPDF(pdfBlob, filename)
      alert('דוח הורד בהצלחה')

    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('❌ שגיאה ביצירת הדוח')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const sendReportViaWhatsApp = async () => {
    setSendingWhatsApp(true)
    try {
      let message = `📦 *דוח מלאי - דגי בקעת אונו*\n`
      message += `📅 תאריך: ${new Date().toLocaleDateString('he-IL')}\n\n`
      
      message += `🐟 *מלאי נוכחי:*\n`
      fishTypes.forEach(fish => {
        const isUnits = !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(fish.name)
        const stock = isUnits ? 
          `${Math.floor(fish.available_kg)} יחידות` : 
          `${fish.available_kg.toFixed(1)} ק"ג`
        message += `• ${fish.name}: ${stock}\n`
      })

      message += `\n🐟 דגי בקעת אונו`

      const adminPhone = import.meta.env.VITE_ADMIN_PHONE
      if (!adminPhone) { alert('מספר טלפון מנהל לא הוגדר (VITE_ADMIN_PHONE)'); return }
      await sendWhatsAppMessage(adminPhone, message)
      alert('דוח נשלח בוואטסאפ בהצלחה')

    } catch (error) {
      console.error('Error sending WhatsApp:', error)
      alert('❌ שגיאה בשליחת הדוח')
    } finally {
      setSendingWhatsApp(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-4 space-x-reverse mb-4">
          <Link to="/admin/reports" className="text-primary-600 hover:text-primary-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">דוח מלאי נוכחי</h1>
            <p className="text-gray-600">בדיקת כמויות זמינות עם התראות צבע למלאי נמוך - לצפייה בלייב</p>
          </div>
        </div>
      </div>

      {/* כפתורי פעולה */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2 space-x-reverse w-full md:w-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'מעדכן...' : 'עדכן מלאי'}</span>
          </button>
          
          <button
            onClick={downloadPDF}
            disabled={generatingPDF || loading}
            className="btn-primary flex items-center space-x-2 space-x-reverse w-full md:w-auto disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{generatingPDF ? 'יוצר PDF...' : 'הורד דוח PDF'}</span>
          </button>
          
          <button
            onClick={sendReportViaWhatsApp}
            disabled={sendingWhatsApp || loading}
            className="btn-secondary flex items-center space-x-2 space-x-reverse disabled:opacity-50 w-full md:w-auto"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{sendingWhatsApp ? 'שולח...' : 'שלח בוואטסאפ'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני מלאי...</p>
        </div>
      )}

      {/* תצוגת מלאי */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center mb-4">
          <Package className="w-5 h-5 text-blue-600 ml-2" />
          <h2 className="text-xl font-semibold">מלאי נוכחי</h2>
          <span className="mr-4 text-sm text-gray-500">
            ({fishTypes.length} סוגי דגים)
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right py-3 px-4 font-semibold">דג</th>
                <th className="text-right py-3 px-4 font-semibold">מלאי זמין</th>
                <th className="text-right py-3 px-4 font-semibold">יחידת מדידה</th>
                <th className="text-right py-3 px-4 font-semibold">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {fishTypes.map((fish, index) => {
                const isUnits = !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(fish.name)
                const stock = fish.available_kg
                const isLowStock = stock < (isUnits ? 5 : 2) // דג ביחידות: מתחת ל-5, בק"ג: מתחת ל-2
                const isOutOfStock = stock <= 0
                
                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{fish.name}</td>
                    <td className="py-3 px-4">
                      {isUnits ? Math.floor(stock) : stock.toFixed(1)}
                    </td>
                    <td className="py-3 px-4">
                      {isUnits ? 'יחידות' : 'ק"ג'}
                    </td>
                    <td className="py-3 px-4">
                      {isOutOfStock ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                          ❌ אזל
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                          ⚠️ מלאי נמוך
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                          ✅ במלאי
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* סיכום מלאי */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 text-sm font-medium">סה"כ דגים</div>
            <div className="text-2xl font-bold text-blue-900">{fishTypes.length}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm font-medium">במלאי</div>
            <div className="text-2xl font-bold text-green-900">
              {fishTypes.filter(f => f.available_kg > (
                !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(f.name) ? 5 : 2
              )).length}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 text-sm font-medium">מלאי נמוך</div>
            <div className="text-2xl font-bold text-yellow-900">
              {fishTypes.filter(f => {
                const isUnits = !['סלמון', 'טונה', 'טונה אדומה', 'טונה כחולה'].includes(f.name)
                const threshold = isUnits ? 5 : 2
                return f.available_kg > 0 && f.available_kg <= threshold
              }).length}
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 text-sm font-medium">אזל מהמלאי</div>
            <div className="text-2xl font-bold text-red-900">
              {fishTypes.filter(f => f.available_kg <= 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminInventoryReport