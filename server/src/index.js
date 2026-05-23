import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { smsRouter } from './routes/sms.js'
import { paystackRouter } from './routes/paystack.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Stay Jazzy API' }))

// Routes
app.use('/api/sms', smsRouter)
app.use('/api/paystack', paystackRouter)

app.listen(PORT, () => {
  console.log(`Stay Jazzy API server running on port ${PORT}`)
})
