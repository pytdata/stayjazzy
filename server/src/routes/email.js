import express from 'express';
import nodemailer from 'nodemailer';

export const emailRouter = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

emailRouter.post('/send', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;
    
    // In dev mode without SMTP creds, just log it
    if (!process.env.SMTP_USER) {
      console.log('--- EMAIL MOCK ---');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
      console.log('------------------');
      return res.json({ success: true, mock: true });
    }

    const info = await transporter.sendMail({
      from: `"Stay Jazzy" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});
