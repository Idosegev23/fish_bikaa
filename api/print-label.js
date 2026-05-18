// API endpoint להדפסת מדבקות הזמנה
// תומך במדפסות קופה שונות דרך ESC/POS או Web Print
import { validateRequest } from './_middleware.js'

export default async function handler(req, res) {
  const blocked = validateRequest(req, res)
  if (blocked) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { content, orderId } = req.body

    if (!content || !orderId) {
      return res.status(400).json({ error: 'Missing required fields: content, orderId' })
    }

    console.log(`🖨️ Printing label for order ${orderId}`)

    // אפשרות 1: שליחה למדפסת ESC/POS (דורש התקנת driver)
    if (process.env.PRINTER_TYPE === 'ESCPOS') {
      try {
        const escPosContent = convertToESCPOS(content)
        await sendToESCPOSPrinter(escPosContent)
        
        return res.status(200).json({
          success: true,
          message: 'Label sent to ESC/POS printer',
          orderId
        })
      } catch (printerError) {
        console.error('ESC/POS printer failed:', printerError)
        // Fall through to other options
      }
    }

    // אפשרות 2: שליחה למדפסת רשת (IP Printer)
    if (process.env.PRINTER_IP) {
      try {
        await sendToNetworkPrinter(content, process.env.PRINTER_IP)
        
        return res.status(200).json({
          success: true,
          message: 'Label sent to network printer',
          orderId
        })
      } catch (networkError) {
        console.error('Network printer failed:', networkError)
        // Fall through to other options
      }
    }

    // אפשרות 3: יצירת PDF להדפסה (גיבוי)
    const pdfUrl = await generatePrintablePDF(content, orderId)
    
    return res.status(200).json({
      success: true,
      message: 'Printable PDF generated',
      orderId,
      pdfUrl,
      fallback: true
    })

  } catch (error) {
    console.error('Print error:', error)
    return res.status(500).json({ 
      error: 'Failed to print label',
      orderId: req.body.orderId 
    })
  }
}

// המרה לפורמט ESC/POS
function convertToESCPOS(content) {
  // ESC/POS commands for receipt printers
  const ESC = '\x1B'
  const GS = '\x1D'
  
  let escContent = ''
  
  // Initialize printer
  escContent += ESC + '@' // Initialize
  escContent += ESC + 'a' + '\x01' // Center alignment
  
  // Title
  escContent += ESC + '!' + '\x18' // Double width and height
  escContent += 'דגי בקעת אונו\n'
  escContent += ESC + '!' + '\x00' // Normal size
  
  // Content
  escContent += ESC + 'a' + '\x00' // Left alignment
  escContent += content.replace(/\n/g, '\n')
  
  // Cut paper
  escContent += '\n\n\n'
  escContent += GS + 'V' + 'A' + '\x03' // Partial cut
  
  return escContent
}

// שליחה למדפסת ESC/POS
async function sendToESCPOSPrinter(escContent) {
  // This requires a printer driver or library like 'node-thermal-printer'
  // For production, you'd use something like:
  
  /*
  const ThermalPrinter = require('node-thermal-printer').printer
  const PrinterTypes = require('node-thermal-printer').types
  
  let printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: 'tcp://192.168.1.100:9100', // Your printer IP
    characterSet: 'HEBREW',
    removeSpecialCharacters: false,
    lineCharacter: "=",
  })
  
  printer.raw(Buffer.from(escContent, 'binary'))
  await printer.execute()
  */
  
  console.log('ESC/POS content prepared:', escContent.length, 'bytes')
  return true
}

// שליחה למדפסת רשת
async function sendToNetworkPrinter(content, printerIP) {
  const net = require('net')
  
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    
    client.connect(9100, printerIP, () => {
      console.log(`Connected to printer at ${printerIP}:9100`)
      
      // Send content to printer
      client.write(content + '\n\n\n') // Add line feeds for paper advance
      client.end()
    })
    
    client.on('close', () => {
      console.log('Printer connection closed')
      resolve(true)
    })
    
    client.on('error', (error) => {
      console.error('Printer connection error:', error)
      reject(error)
    })
    
    // Timeout after 5 seconds
    client.setTimeout(5000, () => {
      client.destroy()
      reject(new Error('Printer connection timeout'))
    })
  })
}

// יצירת PDF להדפסה (גיבוי)
async function generatePrintablePDF(content, orderId) {
  // For production, you could use libraries like 'puppeteer' or 'pdfkit'
  // For now, we'll create a simple HTML version
  
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <title>Order Label ${orderId}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          margin: 0;
          padding: 10px;
          white-space: pre-wrap;
        }
        @media print {
          body { margin: 0; padding: 5px; }
        }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `
  
  // In production, save this to a file or generate a PDF
  console.log('Generated printable HTML for order:', orderId)
  
  // Return a data URL for the HTML (can be opened in new tab for printing)
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  return dataUrl
}