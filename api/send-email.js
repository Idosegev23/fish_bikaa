// Vercel API endpoint for sending emails with Nodemailer
const nodemailer = require('nodemailer');
import { validateRequest } from './_middleware.js';

export default async function handler(req, res) {
  const blocked = validateRequest(req, res);
  if (blocked) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, html' 
      });
    }

    // Check if email credentials are configured
    if (!process.env.VITE_EMAIL_USER || !process.env.VITE_EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured - returning mock success');
      return res.status(200).json({ 
        success: true, 
        messageId: `mock-${Date.now()}`,
        message: 'Email sending is not configured (mock success)',
        mock: true
      });
    }

    console.log('📧 Vercel API: Sending email via Nodemailer...');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Email User:', process.env.VITE_EMAIL_USER);

    // Gmail SMTP configuration - עובד עם App Password של Gmail
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.VITE_EMAIL_USER,
        pass: process.env.VITE_EMAIL_PASS
      }
    });

    // Verify SMTP connection before sending
    try {
      await transporter.verify();
      console.log('✅ SMTP server connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      throw new Error('SMTP server connection failed');
    }

    // Send the email
    const info = await transporter.sendMail({
      from: `"דגי בקעת אונו" <${process.env.VITE_EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: process.env.VITE_EMAIL_USER
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);

    // Return success response
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully',
      response: info.response
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
    // Provide detailed error information
    let errorMessage = 'Failed to send email';
    let errorCode = error.code || 'UNKNOWN';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Check your App Password.';
      console.error('💡 Make sure you are using Gmail App Password, not your regular password');
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection to Gmail SMTP server failed';
    } else if (error.code === 'EDNS') {
      errorMessage = 'DNS resolution failed. Check your internet connection.';
    }
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: errorCode,
      details: error.message
    });
  }
} 