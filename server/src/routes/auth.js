import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import nodemailer from 'nodemailer';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_stayjazzy';

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ user: { id: admin.id, email: admin.email }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ success: true }); // pretend it sent
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins

    await query('UPDATE admins SET reset_otp = $1, reset_otp_expires_at = $2 WHERE email = $3', [otp, expiresAt, email]);

    // Send email
    if (process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: `"Stay Jazzy" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}`
      });
    } else {
      console.log(`--- OTP MOCK EMAIL --- \nTo: ${email}\nOTP: ${otp}\n----------------------`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reset request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/reset-password-verify', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || admin.reset_otp !== otp || new Date() > new Date(admin.reset_otp_expires_at)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE admins SET password_hash = $1, reset_otp = NULL, reset_otp_expires_at = NULL WHERE email = $2', [hash, email]);

    res.json({ success: true });
  } catch (error) {
    console.error('Reset verify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
