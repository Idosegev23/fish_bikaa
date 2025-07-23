// Development email server using Nodemailer
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, html' 
      });
    }

    console.log('📧 Development Server: Sending email via Nodemailer...');
    console.log('To:', to);
    console.log('Subject:', subject);

    // Get email credentials from environment variables
    const emailUser = process.env.VITE_EMAIL_USER;
    const emailPass = process.env.VITE_EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error('❌ Email credentials not found in environment variables');
      return res.status(500).json({ 
        error: 'Email configuration missing' 
      });
    }

    // Gmail SMTP configuration
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: emailUser,
        pass: emailPass
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
      from: `"דגי בקעת אונו" <${emailUser}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: emailUser
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);

    // Return success response
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully',
      response: info.response
    });

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    
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
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Development email server is running' });
});

app.listen(PORT, () => {
  console.log(`📧 Development email server running on http://localhost:${PORT}`);
  console.log(`Email User: ${process.env.VITE_EMAIL_USER || 'Not configured'}`);
  console.log(`Email Pass: ${process.env.VITE_EMAIL_PASS ? 'Configured' : 'Not configured'}`);
});