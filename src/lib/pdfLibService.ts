import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
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

export interface InventoryReportData {
  date: string
  fishInventory: Array<{
    fishName: string
    availableQuantity: number
    isUnits: boolean
    status: 'זמין' | 'מלאי נמוך' | 'אזל'
  }>
}

export interface HolidayOrdersReportData {
  holidayName: string
  startDate: string
  endDate: string
  totalOrders: number
  fishOrders: Array<{
    fishName: string
    totalQuantity: number
    isUnits: boolean
    orderCount: number
  }>
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

  private async loadOpenSansFont(): Promise<Uint8Array | null> {
    try {
      const response = await fetch('/fonts/OpenSans-VariableFont_wdth,wght.ttf')
      if (!response.ok) {
        throw new Error(`Failed to fetch font: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      console.log('✅ פונט OpenSans נטען בהצלחה')
      return new Uint8Array(arrayBuffer)
    } catch (error) {
      console.warn('לא ניתן לטעון את פונט OpenSans:', error)
      return null
    }
  }

  private reverseHebrewText(text: string): string {
    // החזרת הטקסט כמו שהוא - הפונט OpenSans יטפל ב-RTL כראוי
    return text
  }

  async generateDailyReport(data: DailyReportData): Promise<Blob> {
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    // טעינת פונט עברי
    const openSansFontBytes = await this.loadOpenSansFont()
    let font, boldFont
    
    if (openSansFontBytes) {
      try {
        font = await pdfDoc.embedFont(openSansFontBytes)
        boldFont = font // OpenSans supports bold through weight variations
      } catch (error) {
        console.warn('נכשל בטעינת פונט OpenSans, עובר לפונט ברירת מחדל:', error)
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      }
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    }
    
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

    // נתוני הזמנות (כל ההזמנות)
    const maxOrders = data.orders.length
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
    // תמיד מציג סיכום דגים
    {
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

      // נתוני דגים (כל הדגים)
      const maxFish = data.fishSummary.length
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
    pdfDoc.registerFontkit(fontkit)
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    // טעינת פונט עברי
    const openSansFontBytes = await this.loadOpenSansFont()
    let font, boldFont
    
    if (openSansFontBytes) {
      try {
        font = await pdfDoc.embedFont(openSansFontBytes)
        boldFont = font // OpenSans supports bold through weight variations
      } catch (error) {
        console.warn('נכשל בטעינת פונט OpenSans, עובר לפונט ברירת מחדל:', error)
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      }
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    }
    
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

    // לוגו - בצד שמאל
    if (logoImage) {
      page.drawImage(logoImage, {
        x: 50, // בצד שמאל
        y: yPosition - 40,
        width: 60,
        height: 60,
      })
    }

    // כותרת ראשית - מיושר ימינה
    const title = this.reverseHebrewText('דוח ספקים לחג - דגי בקעת אונו')
    const titleWidth = font.widthOfTextAtSize(title, 22)
    page.drawText(title, {
      x: width - titleWidth - 50,
      y: yPosition,
      size: 22,
      font: boldFont,
      color: rgb(0.15, 0.25, 0.85), // כחול
    })

    yPosition -= 30

    // תאריכי החג - מיושר ימינה
    const dateRange = this.reverseHebrewText(`${new Date(data.endDate).toLocaleDateString('he-IL')} - ${new Date(data.startDate).toLocaleDateString('he-IL')}`)
    const dateWidth = font.widthOfTextAtSize(dateRange, 14)
    page.drawText(dateRange, {
      x: width - dateWidth - 50,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 40

    // סה"כ הזמנות - מיושר ימינה
    const totalText = this.reverseHebrewText(`סה"כ הזמנות בתקופה: ${data.totalOrders}`)
    const totalWidth = font.widthOfTextAtSize(totalText, 14)
    page.drawText(totalText, {
      x: width - totalWidth - 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    yPosition -= 40

    // כותרת טבלה - מיושר ימינה
    const tableTitle = this.reverseHebrewText('כמויות נדרשות לחג vs מלאי נוכחי')
    const tableTitleWidth = font.widthOfTextAtSize(tableTitle, 18)
    page.drawText(tableTitle, {
      x: width - tableTitleWidth - 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    yPosition -= 30

    // כותרות טבלה - מיושר ימינה (הפוך סדר עבור RTL)
    const headers = ['יחידה', 'חסר במלאי', 'מלאי נוכחי', 'נדרש לחג', 'סוג דג']
    const headerXPositions = [width - 450, width - 350, width - 250, width - 150, width - 50] // מימין לשמאל

    // רקע כותרות
    page.drawRectangle({
      x: 50,
      y: yPosition - 5,
      width: width - 100,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    })

    // כותרות
    headers.forEach((header, index) => {
      const headerText = this.reverseHebrewText(header)
      page.drawText(headerText, {
        x: headerXPositions[index],
        y: yPosition + 5,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })
    })

    yPosition -= 30

    // שורות הטבלה
    data.fishRequirements.forEach((fish, index) => {
      // צבע רקע לשורות זוגיות
      if (index % 2 === 0) {
        page.drawRectangle({
          x: 50,
          y: yPosition - 5,
          width: width - 100,
          height: 20,
          color: rgb(0.98, 0.98, 0.98),
        })
      }

      // נתוני השורה (הפוך סדר עבור RTL)
      const unitText = this.reverseHebrewText(fish.isUnits ? 'יחידות' : 'ק"ג')
      const deficitText = (fish.deficit && fish.deficit > 0) ? 
        (fish.isUnits ? Math.ceil(fish.deficit).toString() : fish.deficit.toFixed(1)) : '0'
      const currentStockText = fish.currentStock ? 
        (fish.isUnits ? Math.floor(fish.currentStock).toString() : fish.currentStock.toFixed(1)) : '0'
      const requiredText = fish.isUnits ? 
        Math.ceil(fish.totalRequired).toString() : 
        fish.totalRequired.toFixed(1)
      const fishText = this.reverseHebrewText(fish.fishName)

      const rowData = [unitText, deficitText, currentStockText, requiredText, fishText]

      rowData.forEach((data, colIndex) => {
        // צבע אדום לחסר במלאי
        const textColor = colIndex === 1 && parseFloat(data) > 0 ? 
          rgb(0.8, 0.2, 0.2) : rgb(0.1, 0.1, 0.1)

        page.drawText(data, {
          x: headerXPositions[colIndex],
          y: yPosition,
          size: 10,
          font: font,
          color: textColor,
        })
      })

      yPosition -= 20

      // עצירה אם נגמר המקום
      if (yPosition < 150) {
        return
      }
    })

    // הערות חשובות - מיושר ימינה
    yPosition -= 30
    const notesTitle = this.reverseHebrewText('הערות חשובות:')
    const notesTitleWidth = font.widthOfTextAtSize(notesTitle, 14)
    page.drawText(notesTitle, {
      x: width - notesTitleWidth - 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    yPosition -= 20

    const notes = [
      'דוח מיועד לתכנון הזמנות מספקים',
      'כמויות מעוגלות כלפי מעלה לביטחון',
      'טונה וסלמון בק"ג, שאר הדגים ביחידות',
      'מומלץ להזמין לפי עמודת "חסר במלאי"'
    ]

    notes.forEach(note => {
      const noteText = this.reverseHebrewText(`• ${note}`)
      const noteWidth = font.widthOfTextAtSize(noteText, 10)
      page.drawText(noteText, {
        x: width - noteWidth - 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })
      yPosition -= 15
    })

    // הערות תחתונות - מיושר ימינה
    const footerText = this.reverseHebrewText('דוח ספקים אוטומטי ממערכת ההזמנות - דגי בקעת אונו')
    const footerWidth = font.widthOfTextAtSize(footerText, 10)
    page.drawText(footerText, {
      x: width - footerWidth - 50,
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    })

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  }

  async generateInventoryReport(data: InventoryReportData): Promise<Blob> {
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    // טעינת פונט עברי
    const openSansFontBytes = await this.loadOpenSansFont()
    let font, boldFont
    
    if (openSansFontBytes) {
      try {
        font = await pdfDoc.embedFont(openSansFontBytes)
        boldFont = font // OpenSans supports bold through weight variations
      } catch (error) {
        console.warn('נכשל בטעינת פונט OpenSans, עובר לפונט ברירת מחדל:', error)
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      }
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    }
    
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

    // לוגו - בצד שמאל
    if (logoImage) {
      page.drawImage(logoImage, {
        x: 50, // בצד שמאל
        y: yPosition - 40,
        width: 60,
        height: 60,
      })
    }

    // כותרת ראשית - מיושר ימינה
    const title = this.reverseHebrewText('דוח מלאי נוכחי - דגי בקעת אונו')
    const titleWidth = font.widthOfTextAtSize(title, 24)
    page.drawText(title, {
      x: width - titleWidth - 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0.15, 0.25, 0.85), // כחול
    })

    yPosition -= 30

    // תאריך - מיושר ימינה
    const dateText = this.reverseHebrewText(`תאריך: ${new Date(data.date).toLocaleDateString('he-IL')}`)
    const dateWidth = font.widthOfTextAtSize(dateText, 14)
    page.drawText(dateText, {
      x: width - dateWidth - 50,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 50

    // כותרת טבלה - מיושר ימינה
    const tableTitle = this.reverseHebrewText('מלאי זמין')
    const tableTitleWidth = font.widthOfTextAtSize(tableTitle, 18)
    page.drawText(tableTitle, {
      x: width - tableTitleWidth - 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    yPosition -= 30

    // כותרות טבלה - מיושר ימינה (הפוך סדר עבור RTL)
    const headers = ['סטטוס', 'יחידת מדידה', 'כמות זמינה', 'סוג דג']
    const headerXPositions = [width - 450, width - 350, width - 200, width - 50] // מימין לשמאל

    // רקע כותרות
    page.drawRectangle({
      x: 50,
      y: yPosition - 5,
      width: width - 100,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    })

    // כותרות
    headers.forEach((header, index) => {
      const headerText = this.reverseHebrewText(header)
      page.drawText(headerText, {
        x: headerXPositions[index],
        y: yPosition + 5,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })
    })

    yPosition -= 30

    // שורות הטבלה
    data.fishInventory.forEach((item, index) => {
      // צבע רקע לשורות זוגיות
      if (index % 2 === 0) {
        page.drawRectangle({
          x: 50,
          y: yPosition - 5,
          width: width - 100,
          height: 20,
          color: rgb(0.98, 0.98, 0.98),
        })
      }

      // נתוני השורה (הפוך סדר עבור RTL)
      const statusText = this.reverseHebrewText(item.status)
      const unitText = this.reverseHebrewText(item.isUnits ? 'יחידות' : 'ק"ג')
      const quantityText = item.isUnits ? 
        Math.floor(item.availableQuantity).toString() : 
        item.availableQuantity.toFixed(1)
      const fishText = this.reverseHebrewText(item.fishName)

      const rowData = [statusText, unitText, quantityText, fishText]

      rowData.forEach((data, colIndex) => {
        page.drawText(data, {
          x: headerXPositions[colIndex],
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        })
      })

      yPosition -= 20

      // עצירה אם נגמר המקום
      if (yPosition < 100) {
        // יש להוסיף לוגיקה לעמוד חדש כאן אם נדרש
        return
      }
    })

    // הערות תחתונות - מיושר ימינה
    const footerText = this.reverseHebrewText('דוח מלאי אוטומטי ממערכת ההזמנות - דגי בקעת אונו')
    const footerWidth = font.widthOfTextAtSize(footerText, 10)
    page.drawText(footerText, {
      x: width - footerWidth - 50,
      y: 50,
      size: 10,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    })

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
  }

  async generateHolidayOrdersReport(data: HolidayOrdersReportData): Promise<Blob> {
    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    
    // טעינת פונט עברי
    const openSansFontBytes = await this.loadOpenSansFont()
    let font, boldFont
    
    if (openSansFontBytes) {
      try {
        font = await pdfDoc.embedFont(openSansFontBytes)
        boldFont = font // OpenSans supports bold through weight variations
      } catch (error) {
        console.warn('נכשל בטעינת פונט OpenSans, עובר לפונט ברירת מחדל:', error)
        font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      }
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    }
    
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

    // לוגו - בצד שמאל
    if (logoImage) {
      page.drawImage(logoImage, {
        x: 50, // בצד שמאל
        y: yPosition - 40,
        width: 60,
        height: 60,
      })
    }

    // כותרת ראשית - מיושר ימינה
    const title = this.reverseHebrewText(`דוח הזמנות לחג ${data.holidayName} - דגי בקעת אונו`)
    const titleWidth = font.widthOfTextAtSize(title, 22)
    page.drawText(title, {
      x: width - titleWidth - 50,
      y: yPosition,
      size: 22,
      font: boldFont,
      color: rgb(0.15, 0.25, 0.85), // כחול
    })

    yPosition -= 30

    // תאריכי החג - מיושר ימינה
    const dateRange = this.reverseHebrewText(`${new Date(data.endDate).toLocaleDateString('he-IL')} - ${new Date(data.startDate).toLocaleDateString('he-IL')}`)
    const dateWidth = font.widthOfTextAtSize(dateRange, 14)
    page.drawText(dateRange, {
      x: width - dateWidth - 50,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    })

    yPosition -= 40

    // סה"כ הזמנות - מיושר ימינה
    const totalText = this.reverseHebrewText(`סה"כ הזמנות בתקופה: ${data.totalOrders}`)
    const totalWidth = font.widthOfTextAtSize(totalText, 14)
    page.drawText(totalText, {
      x: width - totalWidth - 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    yPosition -= 60

    // כותרת טבלה - מיושר ימינה
    const tableTitle = this.reverseHebrewText('כמויות שהוזמנו בפועל לחג')
    const tableTitleWidth = font.widthOfTextAtSize(tableTitle, 18)
    page.drawText(tableTitle, {
      x: width - tableTitleWidth - 50,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    yPosition -= 30

    // כותרות טבלה - מיושר ימינה (הפוך סדר עבור RTL)
    const headers = ['יחידת מדידה', 'כמות שהוזמנה', 'סוג דג']
    const headerXPositions = [width - 400, width - 250, width - 50] // מימין לשמאל עם רווח גדול יותר

    // רקע כותרות
    page.drawRectangle({
      x: 50,
      y: yPosition - 5,
      width: width - 100,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    })

    // כותרות
    headers.forEach((header, index) => {
      const headerText = this.reverseHebrewText(header)
      page.drawText(headerText, {
        x: headerXPositions[index],
        y: yPosition + 5,
        size: 12,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })
    })

    yPosition -= 30

    // שורות הטבלה (רק אם יש נתונים)
    if (data.fishOrders && data.fishOrders.length > 0) {
      data.fishOrders.forEach((item, index) => {
      // צבע רקע לשורות זוגיות
      if (index % 2 === 0) {
        page.drawRectangle({
          x: 50,
          y: yPosition - 5,
          width: width - 100,
          height: 20,
          color: rgb(0.98, 0.98, 0.98),
        })
      }

      // נתוני השורה (הפוך סדר עבור RTL)
      const unitText = this.reverseHebrewText(item.isUnits ? 'יחידות' : 'ק"ג')
      const quantityText = item.isUnits ? 
        Math.floor(item.totalQuantity).toString() : 
        item.totalQuantity.toFixed(1)
      const fishText = this.reverseHebrewText(item.fishName)

      const rowData = [unitText, quantityText, fishText]

      rowData.forEach((data, colIndex) => {
        page.drawText(data, {
          x: headerXPositions[colIndex],
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.1, 0.1, 0.1),
        })
      })

      yPosition -= 20

      // עצירה אם נגמר המקום
      if (yPosition < 150) {
        return
      }
    })
  } else {
    // אם אין נתונים - הצגת הודעה
    const noDataText = this.reverseHebrewText('אין נתוני הזמנות זמינים לחג זה')
    const noDataWidth = font.widthOfTextAtSize(noDataText, 12)
    page.drawText(noDataText, {
      x: width - noDataWidth - 50,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    })
    yPosition -= 30
  }

  // הערות חשובות - מיושר ימינה (רק אם יש מקום)
  if (yPosition > 200) {
    yPosition -= 30
    const notesTitle = this.reverseHebrewText('הערות חשובות:')
    const notesTitleWidth = font.widthOfTextAtSize(notesTitle, 14)
    page.drawText(notesTitle, {
      x: width - notesTitleWidth - 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    })

    yPosition -= 20

    const notes = [
      'אלה הכמויות שהלקוחות הזמינו בפועל לחג',
      'מומלץ להוסיף מרווח בטחון של 10%-15% לכמויות',
      'משקלים סופיים יתבצעו בקופה לפי משקל בפועל',
      'הדוח מתבסס על הזמנות שנקלטו במערכת'
    ]

    notes.forEach(note => {
      if (yPosition > 100) {
        const noteText = this.reverseHebrewText(`• ${note}`)
        const noteWidth = font.widthOfTextAtSize(noteText, 10)
        page.drawText(noteText, {
          x: width - noteWidth - 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        })
        yPosition -= 15
      }
    })
  }

  // הערות תחתונות - מיושר ימינה
  const footerText = this.reverseHebrewText('דוח הזמנות חג אוטומטי ממערכת ההזמנות - דגי בקעת אונו')
  const footerWidth = font.widthOfTextAtSize(footerText, 10)
  page.drawText(footerText, {
    x: width - footerWidth - 50,
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