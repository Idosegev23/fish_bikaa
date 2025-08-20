// API endpoint לשליחת הודעות WhatsApp באמצעות GreenAPI
// ניתן להפעיל עם הוספת GreenAPI credentials

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to, message } = req.body

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' })
    }

    // GreenAPI integration
    const instanceId = process.env.GREENAPI_INSTANCE_ID
    const apiToken = process.env.GREENAPI_TOKEN

    if (instanceId && apiToken) {
      try {
        const apiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`
        
        const payload = {
          chatId: `${to}@c.us`,
          message: message
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ GreenAPI message sent:', result)
          return res.status(200).json({ 
            success: true, 
            messageId: result.idMessage,
            provider: 'GreenAPI'
          })
        } else {
          const error = await response.text()
          console.error('❌ GreenAPI error:', error)
          throw new Error('GreenAPI request failed')
        }
      } catch (greenApiError) {
        console.error('GreenAPI failed:', greenApiError)
        // Fall through to backup options
      }
    }

    // Backup: Twilio WhatsApp API
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
    
    if (accountSid && authToken && twilioWhatsappNumber) {
      const client = require('twilio')(accountSid, authToken)
      
      const messageResponse = await client.messages.create({
        body: message,
        from: `whatsapp:${twilioWhatsappNumber}`,
        to: `whatsapp:${to}`
      })
      
      console.log('WhatsApp message sent via Twilio:', messageResponse.sid)
      return res.status(200).json({ success: true, messageId: messageResponse.sid, provider: 'Twilio' })
    }
    */

    // Demo mode - רק לוג
    console.log('📱 WhatsApp message to:', to)
    console.log('📱 Message:', message)
    
    return res.status(200).json({ 
      success: true, 
      message: 'WhatsApp message logged (demo mode)',
      provider: 'Demo'
    })

  } catch (error) {
    console.error('Error sending WhatsApp:', error)
    return res.status(500).json({ error: 'Failed to send WhatsApp message' })
  }
}