import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { smsRouter } from './routes/sms.js'
import { paystackRouter } from './routes/paystack.js'
import dbRouter from './routes/crud.js'
import { emailRouter } from './routes/email.js'
import { authRouter } from './routes/auth.js'
import { uploadRouter } from './routes/upload.js'
import { query } from './db.js'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

// Serve static assets if any
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Stay Jazzy API' }))

// Routes
app.use('/api/auth', authRouter)
app.use('/api/sms', smsRouter)
app.use('/api/paystack', paystackRouter)
app.use('/api/v1/db', dbRouter)
app.use('/api/email', emailRouter)
app.use('/api/upload/file', uploadRouter)

// Socket.IO
io.on('connection', (socket) => {
  socket.on('join', (topic) => {
    socket.join(topic)
  })
  socket.on('send_message', (data) => {
    if (data.topic) {
      io.to(data.topic).emit('new_message', data.payload)
    }
  })
  socket.on('update_conversation', (data) => {
    if (data.topic) {
      io.to(data.topic).emit('conversation_updated', data.payload)
    }
  })
  socket.on('disconnect', () => {})
})

// Auto-seed admin user
const seedAdmin = async () => {
  try {
    const checkTable = await query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admins');
    `);
    if (!checkTable.rows[0].exists) {
      await query(`
        CREATE TABLE admins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          reset_otp TEXT,
          reset_otp_expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('Created admins table');
    }

    const email = 'admin@stayjazzymultimedia.com';
    const password = 'admin@123';
    const hash = await bcrypt.hash(password, 10);
    const res = await query('SELECT * FROM admins WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      await query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [email, hash]);
      console.log('Inserted admin user admin@stayjazzymultimedia.com');
    }
  } catch (err) {
    console.error('Auto-seed admin failed. Ensure DATABASE_URL is correct.');
  }
}

httpServer.listen(PORT, async () => {
  await seedAdmin();
  console.log(`Stay Jazzy API & Socket.IO server running on port ${PORT}`)
})
