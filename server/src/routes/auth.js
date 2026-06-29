import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { ensureSchema } from '../schema.js';
import { buildOtpEmail, sendEmail } from '../emailService.js';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev_only_jwt_secret_change_me');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await ensureSchema();
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: admin.id, id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ user: { id: admin.id, email: admin.email, role: admin.role }, token });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password-request', async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ success: true });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins

    await query('UPDATE admins SET reset_otp = $1, reset_otp_expires_at = $2 WHERE email = $3', [otp, expiresAt, email]);

    const message = buildOtpEmail({ otp, purpose: 'admin password reset', expiresInMinutes: 15 });
    await sendEmail({ to: email, ...message });

    res.json({ success: true });
  } catch (error) {
    if (error?.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Email service is not configured. Please contact support.' });
    }
    next(error);
  }
});

authRouter.post('/reset-password-verify', async (req, res, next) => {
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
    next(error);
  }
});
