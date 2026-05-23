import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { smsRouter } from './routes/sms.js'
import { paystackRouter } from './routes/paystack.js'
import { uploadRouter } from './routes/upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')))

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Stay Jazzy API' }))

// Routes
app.use('/api/sms', smsRouter)
app.use('/api/paystack', paystackRouter)
app.use('/api/upload', uploadRouter)

app.listen(PORT, () => {
  console.log(`Stay Jazzy API server running on port ${PORT}`)
})
