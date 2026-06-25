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
import { ensureSchema } from './schema.js'

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

httpServer.listen(PORT, async () => {
  try {
    await ensureSchema();
  } catch {
    console.error('Schema bootstrap failed on startup. Ensure DATABASE_URL is correct.');
  }
  console.log(`Stay Jazzy API & Socket.IO server running on port ${PORT}`)
})

// Export the app so serverless platforms (e.g. Vercel) can mount it as a handler
export default app
