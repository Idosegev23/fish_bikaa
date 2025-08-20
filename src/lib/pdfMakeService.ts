import * as pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Order } from './supabase'

// הגדרת הפונטים
;(pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs

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

export class PDFMakeService {
  private async loadLogo(): Promise<string> {
    try {
      const response = await fetch('/logo.png')
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.warn('לא ניתן לטעון את הלוגו:', error)
      return ''
    }
  }

  async generateDailyReport(data: DailyReportData): Promise<void> {
    const logoBase64 = await this.loadLogo()
    
    const documentDefinition = {
      info: {
        title: `דוח יומי - ${new Date(data.date).toLocaleDateString('he-IL')}`,
        author: 'דגי בקעת אונו',
        creator: 'מערכת ההזמנות',
        producer: 'דגי בקעת אונו'
      },
      
      header: {
        columns: [
          logoBase64 ? { image: logoBase64, width: 60, height: 60, margin: [20, 10] } : '',
          { 
            text: 'דגי בקעת אונו', 
            style: 'companyName',
            alignment: 'center',
            margin: [0, 20, 0, 0]
          },
          { 
            text: `תאריך: ${new Date().toLocaleDateString('he-IL')}`, 
            style: 'date',
            alignment: 'right',
            margin: [0, 20, 20, 0]
          }
        ]
      },

      content: [
        { text: 'דוח יומי', style: 'title', alignment: 'center', margin: [0, 20, 0, 20] },
        { text: `תאריך הדוח: ${new Date(data.date).toLocaleDateString('he-IL')}`, style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 30] },

        { text: 'סיכום כללי', style: 'header', margin: [0, 0, 0, 10] },
        {
          columns: [
            [
              { text: `סה"כ הזמנות: ${data.totalOrders}`, style: 'info' },
              { text: `הזמנות שהושלמו: ${data.orders.filter(o => o.status === 'completed').length}`, style: 'info' },
              { text: `הזמנות בהכנה: ${data.orders.filter(o => o.status === 'pending' || o.status === 'weighing').length}`, style: 'info' }
            ]
          ],
          margin: [0, 0, 0, 20]
        },

        { text: 'פירוט הזמנות', style: 'header', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', '*', 'auto'],
            body: [
              [
                { text: 'מספר הזמנה', style: 'tableHeader' },
                { text: 'שם לקוח', style: 'tableHeader' },
                { text: 'טלפון', style: 'tableHeader' },
                { text: 'תאריך איסוף', style: 'tableHeader' },
                { text: 'שעת איסוף', style: 'tableHeader' },
                { text: 'פריטים', style: 'tableHeader' },
                { text: 'סטטוס', style: 'tableHeader' }
              ],
              ...data.orders.map(order => {
                const items = order.order_items || []
                const itemsList = items.map((item: any) => {
                  const fishName = item.fish_name || 'לא ידוע'
                  const quantity = item.quantity_kg || item.quantity || 0
                  const isUnits = item.unit_based || false
                  const quantityText = isUnits ? `${quantity} יח׳` : `${quantity} ק"ג`
                  return `${fishName} (${quantityText})`
                }).join(', ')

                const status = order.status === 'completed' ? 'הושלם' : 
                             order.status === 'ready' ? 'מוכן' :
                             order.status === 'weighing' ? 'בשקילה' : 'ממתין'

                return [
                  { text: order.id?.toString() || '', style: 'tableCell' },
                  { text: order.customer_name || '', style: 'tableCell' },
                  { text: order.phone || '', style: 'tableCell' },
                  { text: new Date(order.delivery_date).toLocaleDateString('he-IL'), style: 'tableCell' },
                  { text: order.delivery_time || '', style: 'tableCell' },
                  { text: itemsList, style: 'tableCell' },
                  { text: status, style: 'tableCell' }
                ]
              })
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        { text: 'סיכום דגים', style: 'header', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              [
                { text: 'סוג דג', style: 'tableHeader' },
                { text: 'כמות כוללת', style: 'tableHeader' },
                { text: 'יחידת מדידה', style: 'tableHeader' }
              ],
              ...data.fishSummary.map(fish => [
                { text: fish.fishName, style: 'tableCell' },
                { text: fish.isUnits ? `${fish.totalQuantity}` : `${fish.totalWeight.toFixed(1)}`, style: 'tableCell' },
                { text: fish.isUnits ? 'יחידות' : 'קילוגרם', style: 'tableCell' }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],

      styles: {
        title: {
          fontSize: 24,
          bold: true,
          color: '#2563eb'
        },
        subtitle: {
          fontSize: 16,
          color: '#64748b'
        },
        companyName: {
          fontSize: 18,
          bold: true,
          color: '#1e40af'
        },
        date: {
          fontSize: 12,
          color: '#64748b'
        },
        header: {
          fontSize: 16,
          bold: true,
          color: '#1e40af',
          margin: [0, 10, 0, 5]
        },
        info: {
          fontSize: 12,
          margin: [0, 2, 0, 2]
        },
        tableHeader: {
          fontSize: 12,
          bold: true,
          fillColor: '#e2e8f0',
          alignment: 'center'
        },
        tableCell: {
          fontSize: 10,
          alignment: 'center'
        }
      },

      defaultStyle: {
        font: 'Roboto',
        direction: 'rtl'  // זה יעזור עם העברית
      }
    }

    ;(pdfMake as any).createPdf(documentDefinition).download(`דוח-יומי-${new Date(data.date).toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`)
  }

  async generateSupplierReport(data: SupplierReportData): Promise<void> {
    const logoBase64 = await this.loadLogo()
    
    const documentDefinition = {
      info: {
        title: `דוח הזמנות לחג`,
        author: 'דגי בקעת אונו',
        creator: 'מערכת ההזמנות',
        producer: 'דגי בקעת אונו'
      },
      
      header: {
        columns: [
          logoBase64 ? { image: logoBase64, width: 60, height: 60, margin: [20, 10] } : '',
          { 
            text: 'דגי בקעת אונו', 
            style: 'companyName',
            alignment: 'center',
            margin: [0, 20, 0, 0]
          },
          { 
            text: `תאריך: ${new Date().toLocaleDateString('he-IL')}`, 
            style: 'date',
            alignment: 'right',
            margin: [0, 20, 20, 0]
          }
        ]
      },

      content: [
        { text: 'דוח הזמנות לחג', style: 'title', alignment: 'center', margin: [0, 20, 0, 20] },
        { 
          text: `${new Date(data.startDate).toLocaleDateString('he-IL')} - ${new Date(data.endDate).toLocaleDateString('he-IL')}`, 
          style: 'subtitle', 
          alignment: 'center', 
          margin: [0, 0, 0, 30] 
        },

        { text: 'סיכום הזמנות', style: 'header', margin: [0, 0, 0, 10] },
        { text: `סה"כ הזמנות בתקופה: ${data.totalOrders}`, style: 'info', margin: [0, 0, 0, 20] },

        { text: 'כמויות שהוזמנו בפועל לחג', style: 'header', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              [
                { text: 'סוג דג', style: 'tableHeader' },
                { text: 'כמות שהוזמנה', style: 'tableHeader' },
                { text: 'יחידת מדידה', style: 'tableHeader' }
              ],
              ...data.fishRequirements.map(fish => [
                { text: fish.fishName, style: 'tableCell' },
                { text: fish.isUnits ? `${fish.totalRequired}` : `${fish.totalRequired.toFixed(1)}`, style: 'tableCell' },
                { text: fish.isUnits ? 'יחידות' : 'קילוגרם', style: 'tableCell' }
              ])
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20]
        },

        { text: 'הערות חשובות:', style: 'header', margin: [0, 20, 0, 10] },
        {
          ul: [
            'אלה הכמויות שהלקוחות הזמינו בפועל לחג',
            'מומלץ להוסיף מרווח בטחון של 10-15% לכמויות',
            'משקלים סופיים יתבצעו בקופה לפי משקל בפועל',
            'הדוח מתבסס על הזמנות שנקלטו במערכת'
          ],
          style: 'notes'
        },

        { text: '\nהודעה אוטומטית ממערכת ההזמנות', style: 'footer', alignment: 'center', margin: [0, 30, 0, 0] }
      ],

      styles: {
        title: {
          fontSize: 24,
          bold: true,
          color: '#7c3aed'
        },
        subtitle: {
          fontSize: 16,
          color: '#64748b'
        },
        companyName: {
          fontSize: 18,
          bold: true,
          color: '#1e40af'
        },
        date: {
          fontSize: 12,
          color: '#64748b'
        },
        header: {
          fontSize: 16,
          bold: true,
          color: '#7c3aed',
          margin: [0, 10, 0, 5]
        },
        info: {
          fontSize: 12,
          margin: [0, 2, 0, 2]
        },
        notes: {
          fontSize: 11,
          margin: [0, 5, 0, 5]
        },
        footer: {
          fontSize: 10,
          color: '#64748b',
          italics: true
        },
        tableHeader: {
          fontSize: 12,
          bold: true,
          fillColor: '#e2e8f0',
          alignment: 'center'
        },
        tableCell: {
          fontSize: 10,
          alignment: 'center'
        }
      },

      defaultStyle: {
        font: 'Roboto',
        direction: 'rtl'  // זה יעזור עם העברית
      }
    }

    ;(pdfMake as any).createPdf(documentDefinition).download(`דוח-ספקים-${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.pdf`)
  }
}

export const pdfMakeService = new PDFMakeService()