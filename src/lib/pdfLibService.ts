import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { Order } from './supabase'

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
    totalRequired: number
    isUnits: boolean
    currentStock?: number
    deficit?: number
    suppliers?: string[]
  }>
  totalOrders: number
}

export class PDFLibService {
  private async loadLogo(): Promise<Uint8Array | null> {
    try {
      const response = await fetch('/logo.png')
      const arrayBuffer = await response.arrayBuffer()
      return new Uint8Array(arrayBuffer)
    } catch (error) {
      console.warn('לא ניתן לטעון את הלוגו:', error)
      return null
    }
  }

  private reverseHebrewText(text: string): string {
    // פונקציה לטיפול בטקסט עברי
    const hebrewRegex = /[\u0590-\u05FF]/
    if (hebrewRegex.test(text)) {
      // הפוך סדר מילים לעברית
      return text.split(' ').reverse().join(' ')
    }
    return text
  }

  async generateDailyReport(data: DailyReportData): Promise<Blob> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    // טעינת פונט
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // טעינת לוגו
    const logoBytes = await this.loadLogo()
    let logoImage = null
    if (logoBytes) {
      try {
        logoImage = await pdfDoc.embedPng(logoBytes)
      } catch (error) {
        try {
          logoImage = await pdfDoc.embedJpg(logoBytes)
        } catch (jpgError) {
          console.warn('לא ניתן להטמיע את הלוגו:', error, jpgError)
        }
      }
    }

    let yPosition = height - 50

    // לוגו
    if (logoImage) {
      page.drawImage(logoImage, {
        x: width - 100,
        y: yPosition - 40,
        width: 60,
        height: 60,
      })
    }

    // כותרת ראשית
    const title = this.reverseHebrewText('דוח יומי - דגי בקעת אונו')
    page.drawText(title, {
      x: width / 2 - (title.length * 6), // מרכוז משוער
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0.15, 0.25, 0.85), // כחול
    })

    yPosition -= 30

    // תאריך הדוח
    const dateText = this.reverseHebrewText(`תאריך הדוח: ${new Date(data.date).toLocaleDateString('he-IL')}`)
    page.drawText(dateText, {
      x: width / 2 - (dateText.length * 4),
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    })

    yPosition -= 40

    // סיכום כללי
    const summaryTitle = this.reverseHebrewText('סיכום כללי')
    page.drawText(summaryTitle, {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.15, 0.25, 0.85),
    })

    yPosition -= 25

    const stats = [
      `סה"כ הזמנות: ${data.totalOrders}`,
      `הזמנות שהושלמו: ${data.orders.filter(o => o.status === 'completed').length}`,
      `הזמנות בהכנה: ${data.orders.filter(o => o.status === 'pending' || o.status === 'weighing').length}`
    ]

    stats.forEach(stat => {
      const reversedStat = this.reverseHebrewText(stat)
      page.drawText(reversedStat, {
        x: 70,
        y: yPosition,
        size: 12,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      })
      yPosition -= 20
    })

    yPosition -= 20

    // פירוט הזמנות
    const ordersTitle = this.reverseHebrewText('פירוט הזמנות')
    page.drawText(ordersTitle, {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.15, 0.25, 0.85),
    })

    yPosition -= 30

    // כותרות טבלה
    const headers = ['מספר', 'לקוח', 'טלפון', 'תאריך', 'שעה', 'סטטוס']
    let xPositions = [50, 100, 200, 300, 400, 500]
    
    headers.forEach((header, index) => {
      const reversedHeader = this.reverseHebrewText(header)
      page.drawText(reversedHeader, {
        x: xPositions[index],
        y: yPosition,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
    })

    yPosition -= 15

    // קו הפרדה
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    yPosition -= 10

    // נתוני הזמנות (מוגבל לעמוד הראשון)
    const maxOrders = Math.min(data.orders.length, 15)
    for (let i = 0; i < maxOrders; i++) {
      const order = data.orders[i]
      const status = order.status === 'completed' ? 'הושלם' : 
                    order.status === 'ready' ? 'מוכן' :
                    order.status === 'weighing' ? 'בשקילה' : 'ממתין'

      const rowData = [
        order.id?.toString() || '',
        order.customer_name || '',
        order.phone || '',
        new Date(order.delivery_date).toLocaleDateString('he-IL'),
        order.delivery_time || '',
        this.reverseHebrewText(status)
      ]

      rowData.forEach((data, index) => {
        const displayText = index === 5 ? data : this.reverseHebrewText(data)
        page.drawText(displayText, {
          x: xPositions[index],
          y: yPosition,
          size: 8,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        })
      })

      yPosition -= 12
    }

    yPosition -= 20

    // סיכום דגים
    if (yPosition > 150) {
      const fishTitle = this.reverseHebrewText('סיכום דגים')
      page.drawText(fishTitle, {
        x: 50,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: rgb(0.15, 0.25, 0.85),
      })

      yPosition -= 30

      // כותרות טבלת דגים
      const fishHeaders = ['סוג דג', 'כמות', 'יחידה']
      const fishXPositions = [50, 200, 350]
      
      fishHeaders.forEach((header, index) => {
        const reversedHeader = this.reverseHebrewText(header)
        page.drawText(reversedHeader, {
          x: fishXPositions[index],
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        })
      })

      yPosition -= 15

      // קו הפרדה
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 450, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      })

      yPosition -= 10

      // נתוני דגים
      const maxFish = Math.min(data.fishSummary.length, 10)
      for (let i = 0; i < maxFish; i++) {
        const fish = data.fishSummary[i]
        const quantity = fish.isUnits ? `${fish.totalQuantity}` : `${fish.totalWeight.toFixed(1)}`
        const unit = fish.isUnits ? 'יחידות' : 'ק"ג'

        const fishRowData = [
          this.reverseHebrewText(fish.fishName),
          quantity,
          this.reverseHebrewText(unit)
        ]

        fishRowData.forEach((data, index) => {
          page.drawText(data, {
            x: fishXPositions[index],
            y: yPosition,
            size: 10,
            font: font,
            color: rgb(0.1, 0.1, 0.1),
          })
        })

        yPosition -= 15
      }
    }

    // הערות תחתונות
    const footerText = this.reverseHebrewText('דוח אוטומטי ממערכת ההזמנות - דגי בקעת אונו')
    page.drawText(footerText, {
      x: width / 2 - (footerText.length * 3),
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    })

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  }

  async generateSupplierReport(data: SupplierReportData): Promise<Blob> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    // טעינת לוגו
    const logoBytes = await this.loadLogo()
    let logoImage = null
    if (logoBytes) {
      try {
        logoImage = await pdfDoc.embedPng(logoBytes)
      } catch (error) {
        try {
          logoImage = await pdfDoc.embedJpg(logoBytes)
        } catch (jpgError) {
          console.warn('לא ניתן להטמיע את הלוגו:', error, jpgError)
        }
      }
    }

    let yPosition = height - 50

    // לוגו
    if (logoImage) {
      page.drawImage(logoImage, {
        x: width - 100,
        y: yPosition - 40,
        width: 60,
        height: 60,
      })
    }

    // כותרת ראשית
    const title = this.reverseHebrewText('דוח הזמנות לחג - דגי בקעת אונו')
    page.drawText(title, {
      x: width / 2 - (title.length * 6),
      y: yPosition,
      size: 22,
      font: boldFont,
      color: rgb(0.48, 0.23, 0.97), // סגול
    })

    yPosition -= 30

    // תאריכים
    const dateRange = this.reverseHebrewText(
      `${new Date(data.startDate).toLocaleDateString('he-IL')} - ${new Date(data.endDate).toLocaleDateString('he-IL')}`
    )
    page.drawText(dateRange, {
      x: width / 2 - (dateRange.length * 4),
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    })

    yPosition -= 40

    // סיכום הזמנות
    const summaryText = this.reverseHebrewText(`סה"כ הזמנות בתקופה: ${data.totalOrders}`)
    page.drawText(summaryText, {
      x: 50,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 40

    // כותרת טבלה
    const tableTitle = this.reverseHebrewText('כמויות שהוזמנו בפועל לחג')
    page.drawText(tableTitle, {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.48, 0.23, 0.97),
    })

    yPosition -= 30

    // כותרות טבלה
    const headers = ['סוג דג', 'כמות שהוזמנה', 'יחידת מדידה']
    const xPositions = [50, 250, 450]
    
    headers.forEach((header, index) => {
      const reversedHeader = this.reverseHebrewText(header)
      page.drawText(reversedHeader, {
        x: xPositions[index],
        y: yPosition,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      })
    })

    yPosition -= 15

    // קו הפרדה
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    yPosition -= 10

    // נתוני דרישות דגים
    data.fishRequirements.forEach(fish => {
      const quantity = fish.isUnits ? `${fish.totalRequired}` : `${fish.totalRequired.toFixed(1)}`
      const unit = fish.isUnits ? 'יחידות' : 'קילוגרם'

      const rowData = [
        this.reverseHebrewText(fish.fishName),
        quantity,
        this.reverseHebrewText(unit)
      ]

      rowData.forEach((data, index) => {
        page.drawText(data, {
          x: xPositions[index],
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        })
      })

      yPosition -= 15
    })

    yPosition -= 30

    // הערות
    const notes = [
      'הערות חשובות:',
      '• אלה הכמויות שהלקוחות הזמינו בפועל לחג',
      '• מומלץ להוסיף מרווח בטחון של 10-15% לכמויות',
      '• משקלים סופיים יתבצעו בקופה לפי משקל בפועל',
      '• הדוח מתבסס על הזמנות שנקלטו במערכת'
    ]

    notes.forEach((note, index) => {
      const reversedNote = this.reverseHebrewText(note)
      page.drawText(reversedNote, {
        x: 50,
        y: yPosition,
        size: index === 0 ? 14 : 11,
        font: index === 0 ? boldFont : font,
        color: index === 0 ? rgb(0.48, 0.23, 0.97) : rgb(0.3, 0.3, 0.3),
      })
      yPosition -= index === 0 ? 20 : 15
    })

    // הערת תחתית
    const footerText = this.reverseHebrewText('הודעה אוטומטית ממערכת ההזמנות - דגי בקעת אונו')
    page.drawText(footerText, {
      x: width / 2 - (footerText.length * 3),
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    })

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  }

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

export const pdfLibService = new PDFLibService()