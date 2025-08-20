import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { Order } from './supabase'

// הגדרת AutoTable עבור TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

// יבוא נוסף כדי לוודא שautoTable נטען
// @ts-ignore
import autoTable from 'jspdf-autotable'

export interface DailyReportData {
  date: string
  orders: Order[]
  totalRevenue: number
  totalOrders: number
  fishSummary: Array<{
    fishName: string
    totalQuantity: number
    totalWeight: number
    isUnits: boolean
  }>
}

export interface SupplierReportData {
  startDate: string
  endDate: string
  fishRequirements: Array<{
    fishName: string
    totalRequired: number // כמות שהוזמנה בפועל
    isUnits: boolean
    currentStock?: number // מלאי נוכחי
    deficit?: number // חסר במלאי
    suppliers?: string[]
  }>
  totalOrders: number
}

export class PDFService {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    // וידוא שautoTable נטען כראוי
    if (typeof this.doc.autoTable !== 'function') {
      // נסה לטעון שוב אם לא עבד
      try {
        require('jspdf-autotable')
      } catch (e) {
        console.warn('Failed to load jspdf-autotable:', e)
      }
    }
  }

  private async addLogo() {
    try {
      // טעינת הלוגו כ-Base64
      const logoResponse = await fetch('/logo.png')
      const logoBlob = await logoResponse.blob()
      const logoBase64 = await this.blobToBase64(logoBlob)
      
      // הוספת הלוגו לPDF
      this.doc.addImage(logoBase64, 'PNG', 15, 15, 25, 25)
    } catch (error) {
      console.warn('לא ניתן לטעון את הלוגו:', error)
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private addHeader(title: string, subtitle?: string) {
    // כותרת ראשית
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, 105, 25, { align: 'center' })

    // כותרת משנה
    if (subtitle) {
      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, 105, 35, { align: 'center' })
    }

    // שם העסק
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('דגי בקעת אונו', 50, 25)
    
    // תאריך הדוח
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`תאריך הדוח: ${new Date().toLocaleDateString('he-IL')}`, 50, 35)
  }

  async generateDailyReport(data: DailyReportData): Promise<Blob> {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // וידוא שautoTable זמין
    if (typeof this.doc.autoTable !== 'function') {
      throw new Error('autoTable is not available. Please check jspdf-autotable installation.')
    }

    await this.addLogo()
    this.addHeader('דוח יומי', `תאריך: ${new Date(data.date).toLocaleDateString('he-IL')}`)

    let yPosition = 55

    // סיכום כללי
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('סיכום כללי', 15, yPosition)
    yPosition += 10

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`סה"כ הזמנות: ${data.totalOrders}`, 15, yPosition)
    yPosition += 7
    this.doc.text(`הזמנות שהושלמו: ${data.orders.filter(o => o.status === 'completed').length}`, 15, yPosition)
    yPosition += 7
    this.doc.text(`הזמנות בהכנה: ${data.orders.filter(o => o.status === 'pending' || o.status === 'weighing').length}`, 15, yPosition)
    yPosition += 15

    // טבלת הזמנות
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('פירוט הזמנות', 15, yPosition)
    yPosition += 10

    const ordersTableData = data.orders.map(order => {
      const items = order.order_items || []
      const itemsList = items.map((item: any) => {
        const fishName = item.fish_name || 'לא ידוע'
        const quantity = item.quantity_kg || item.quantity || 0
        const isUnits = item.unit_based || false
        const quantityText = isUnits ? `${quantity} יח׳` : `${quantity} ק"ג`
        return `${fishName} (${quantityText})`
      }).join(', ')

      return [
        order.id?.toString() || '',
        order.customer_name || '',
        order.phone || '',
        new Date(order.delivery_date).toLocaleDateString('he-IL'),
        order.delivery_time || '',
        itemsList,
        order.status === 'completed' ? 'הושלם' : 
        order.status === 'ready' ? 'מוכן' :
        order.status === 'weighing' ? 'בשקילה' : 'ממתין'
      ]
    })

    this.doc.autoTable({
      startY: yPosition,
      head: [['מספר הזמנה', 'שם לקוח', 'טלפון', 'תאריך איסוף', 'שעת איסוף', 'פריטים', 'סטטוס']],
      body: ordersTableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        halign: 'center'
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 50 },
        6: { cellWidth: 20 }
      }
    })

    // בדיקה אם צריך עמוד חדש
    const finalY = (this.doc as any).lastAutoTable.finalY
    if (finalY > 250) {
      this.doc.addPage()
      yPosition = 20
    } else {
      yPosition = finalY + 20
    }

    // סיכום דגים
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('סיכום דגים', 15, yPosition)
    yPosition += 10

    const fishTableData = data.fishSummary.map(fish => [
      fish.fishName,
      fish.isUnits ? `${fish.totalQuantity} יחידות` : `${fish.totalWeight.toFixed(1)} ק"ג`,
      fish.isUnits ? 'יחידות' : 'קילוגרם'
    ])

    this.doc.autoTable({
      startY: yPosition,
      head: [['סוג דג', 'כמות כוללת', 'יחידת מדידה']],
      body: fishTableData,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: 'center'
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold'
      }
    })

    return new Blob([this.doc.output('blob')], { type: 'application/pdf' })
  }

  async generateSupplierReport(data: SupplierReportData): Promise<Blob> {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // וידוא שautoTable זמין
    if (typeof this.doc.autoTable !== 'function') {
      throw new Error('autoTable is not available. Please check jspdf-autotable installation.')
    }

    await this.addLogo()
    this.addHeader(
      'דוח הזמנות לחג', 
      `${new Date(data.startDate).toLocaleDateString('he-IL')} - ${new Date(data.endDate).toLocaleDateString('he-IL')}`
    )

    let yPosition = 55

    // סיכום כללי
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('סיכום הזמנות', 15, yPosition)
    yPosition += 10

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`סה"כ הזמנות בתקופה: ${data.totalOrders}`, 15, yPosition)
    yPosition += 15

    // טבלת דרישות דגים
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('כמויות שהוזמנו בפועל לחג', 15, yPosition)
    yPosition += 10

    const supplierTableData = data.fishRequirements.map(fish => [
      fish.fishName,
      fish.isUnits ? `${fish.totalRequired} יחידות` : `${fish.totalRequired.toFixed(1)} ק"ג`,
      fish.isUnits ? 'יחידות' : 'קילוגרם',
      fish.suppliers?.join(', ') || 'לא צוין'
    ])

    this.doc.autoTable({
      startY: yPosition,
      head: [['סוג דג', 'כמות שהוזמנה', 'יחידת מדידה']],
      body: supplierTableData.map(row => [row[0], row[1], row[2]]), // רק 3 עמודות ראשונות
      styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: 'center'
      },
      headStyles: {
        fillColor: [168, 85, 247],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 }
      }
    })

    // הוספת הערות
    const finalY = (this.doc as any).lastAutoTable.finalY
    yPosition = finalY + 20

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('הערות חשובות:', 15, yPosition)
    yPosition += 7
    this.doc.text('• אלה הכמויות שהלקוחות הזמינו בפועל לחג', 15, yPosition)
    yPosition += 5
    this.doc.text('• מומלץ להוסיף מרווח בטחון של 10-15% לכמויות', 15, yPosition)
    yPosition += 5
    this.doc.text('• משקלים סופיים יתבצעו בקופה לפי משקל בפועל', 15, yPosition)
    yPosition += 5
    this.doc.text('• הדוח מתבסס על הזמנות שנקלטו במערכת', 15, yPosition)

    return new Blob([this.doc.output('blob')], { type: 'application/pdf' })
  }

  // פונקציה להורדת PDF
  downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const pdfService = new PDFService()