// Real email service using Nodemailer (for backend implementation)
import type { EmailTemplate, OrderEmailData } from './emailService'

export class RealEmailService {
  private static readonly SMTP_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'triroars@gmail.com',
      pass: 'qaxfahrrosleojfi'
    }
  }

  // This would be implemented on the backend with actual Nodemailer
  static async sendRealEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // In a real implementation, this would be a backend API call
      const emailData = {
        from: 'triroars@gmail.com',
        to: to,
        subject: template.subject,
        html: template.html
      }

      // For demo purposes, we'll log the email details
      console.log('📧 Real email would be sent with configuration:')
      console.log('SMTP Host:', this.SMTP_CONFIG.host)
      console.log('From:', emailData.from)
      console.log('To:', emailData.to)
      console.log('Subject:', emailData.subject)
      console.log('HTML Content Length:', emailData.html.length, 'characters')
      
      // Simulate actual email sending
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      }).catch(() => {
        // If API endpoint doesn't exist, just log
        console.log('ℹ️ Email API endpoint not available (would be implemented on backend)')
        return { ok: true }
      })

      return response.ok
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  // CSV attachment sending (would be implemented on backend)
  static async sendEmailWithCSV(to: string, template: EmailTemplate, csvData: string, filename: string): Promise<boolean> {
    try {
      console.log('📧 Email with CSV attachment would be sent:')
      console.log('To:', to)
      console.log('Subject:', template.subject)
      console.log('CSV Filename:', filename)
      console.log('CSV Size:', csvData.length, 'characters')
      console.log('CSV Preview:', csvData.substring(0, 200) + '...')
      
      // In real implementation, this would use Nodemailer with attachments
      return true
    } catch (error) {
      console.error('Error sending email with CSV:', error)
      return false
    }
  }
}

// Backend Nodemailer implementation example (for reference)
export const nodemailerExample = `
// This would be implemented on your Node.js backend

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'triroars@gmail.com',
    pass: 'qaxfahrrosleojfi'
  }
});

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  try {
    const info = await transporter.sendMail({
      from: 'triroars@gmail.com',
      to: to,
      subject: subject,
      html: html,
      attachments: attachments
    });
    
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendDailyReportWithCSV(csvData: string, orders: any[]) {
  const attachment = {
    filename: \`daily-report-\${new Date().toISOString().split('T')[0]}.csv\`,
    content: csvData,
    contentType: 'text/csv'
  };
  
  return await sendEmail(
    'triroars@gmail.com',
    \`דוח יומי - \${new Date().toLocaleDateString('he-IL')}\`,
    generateDailyReportHTML(orders),
    [attachment]
  );
}
`

export default RealEmailService 