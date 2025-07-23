import emailjs from 'emailjs-com'
import type { EmailTemplate } from './emailService'

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: 'service_fish_store',
  userId: 'user_fish_orders',
  templates: {
    customer: 'template_customer_order',
    admin: 'template_admin_notification',
    dailyReport: 'template_daily_report'
  }
}

export class EmailServiceReal {
  // Initialize EmailJS
  static init() {
    emailjs.init(EMAILJS_CONFIG.userId)
  }

  // Send real email using EmailJS
  static async sendRealEmail(to: string, template: EmailTemplate, type: 'customer' | 'admin' = 'customer'): Promise<boolean> {
    try {
      console.log(`📧 ===== SENDING REAL EMAIL =====`)
      console.log(`📧 To: ${to}`)
      console.log(`📧 Subject: ${template.subject}`)
      console.log(`📧 Type: ${type}`)

      // EmailJS template parameters
      const templateParams = {
        to_email: to,
        from_email: 'triroars@gmail.com',
        subject: template.subject,
        html_content: template.html,
        message: template.html.replace(/<[^>]*>/g, '').substring(0, 500) + '...' // Plain text version
      }

      // Send via EmailJS
      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        type === 'customer' ? EMAILJS_CONFIG.templates.customer : EMAILJS_CONFIG.templates.admin,
        templateParams
      )

      console.log('✅ EmailJS Response:', response)
      console.log(`✅ Real email sent successfully to ${to}`)
      return true

    } catch (error) {
      console.error('❌ EmailJS Error:', error)
      
      // Fallback to direct SMTP attempt
      return await this.sendViaDirectSMTP(to, template)
    }
  }

  // Direct SMTP attempt (fallback)
  static async sendViaDirectSMTP(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      console.log('🔄 Attempting direct SMTP send...')
      
      // Using a simple email API service
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'gmail',
          template_id: 'fish_order',
          user_id: 'triroars@gmail.com',
          template_params: {
            to_email: to,
            from_email: 'triroars@gmail.com',
            subject: template.subject,
            message_html: template.html,
            reply_to: 'triroars@gmail.com'
          },
          accessToken: 'gnjbjvanfjcydhve'
        })
      })

      if (response.ok) {
        console.log('✅ Direct SMTP email sent successfully')
        return true
      } else {
        throw new Error(`SMTP failed with status: ${response.status}`)
      }

    } catch (error) {
      console.error('❌ Direct SMTP failed:', error)
      
      // Final fallback - using mailto (opens email client)
      return this.sendViaMailto(to, template)
    }
  }

  // Mailto fallback (opens email client)
  static sendViaMailto(to: string, template: EmailTemplate): boolean {
    try {
      const subject = encodeURIComponent(template.subject)
      const body = encodeURIComponent(template.html.replace(/<[^>]*>/g, '').substring(0, 1000))
      const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`
      
      // Open email client
      window.open(mailtoUrl, '_blank')
      
      console.log('📧 Email client opened with pre-filled content')
      return true
    } catch (error) {
      console.error('❌ Mailto fallback failed:', error)
      return false
    }
  }

  // Send with CSV attachment (simplified)
  static async sendDailyReportEmail(to: string, template: EmailTemplate, csvData: string): Promise<boolean> {
    try {
      console.log('📧 Sending daily report with CSV data...')
      
      // For now, include CSV data in the email body
      const enhancedTemplate = {
        ...template,
        html: template.html + `
          <div style="margin-top: 30px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            <h3>נתוני CSV:</h3>
            <pre style="background-color: white; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">
${csvData}
            </pre>
          </div>
        `
      }

      return await this.sendRealEmail(to, enhancedTemplate, 'admin')
    } catch (error) {
      console.error('Error sending daily report:', error)
      return false
    }
  }

  // Alternative: Use Netlify Functions or Vercel API for real email sending
  static async sendViaServerlessFunction(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject: template.subject,
          html: template.html,
          emailConfig: {
            host: 'smtp.gmail.com',
            port: 587,
            user: 'triroars@gmail.com',
            pass: 'gnjbjvanfjcydhve'
          }
        })
      })

      if (response.ok) {
        console.log('✅ Serverless email sent successfully')
        return true
      } else {
        console.log('ℹ️ Serverless function not available, using fallback')
        return false
      }
         } catch (error) {
       console.log('ℹ️ Serverless function not available:', error instanceof Error ? error.message : error)
       return false
     }
  }
}

// Nodemailer backend example for reference
export const createBackendEmailService = `
// backend/api/send-email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'triroars@gmail.com',
    pass: 'gnjbjvanfjcydhve'
  }
});

module.exports = async (req, res) => {
  const { to, subject, html } = req.body;
  
  try {
    await transporter.sendMail({
      from: 'triroars@gmail.com',
      to: to,
      subject: subject,
      html: html
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
`

export default EmailServiceReal 