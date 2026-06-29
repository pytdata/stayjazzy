// ============================================================
// Express application (transport-agnostic)
// ------------------------------------------------------------
// Builds and exports the configured Express app WITHOUT binding a
// port, so it can be used both by the traditional Node server
// (src/index.js, which also wires up Socket.IO) and by the Vercel
// serverless function entry (api/index.js).
// ============================================================
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import { smsRouter } from './routes/sms.js'
import { paystackRouter } from './routes/paystack.js'
import dbRouter from './routes/crud.js'
import { emailRouter } from './routes/email.js'
import { authRouter } from './routes/auth.js'
import { uploadRouter } from './routes/upload.js'
import { ensureSchema, migrate } from './schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

const DEFAULT_ALLOWED_ORIGINS = [
  'https://stayjazzy.vercel.app',
  'https://stayjazzy-backend.vercel.app',
  'https://stajazzymultimedia.com',
  'https://www.stajazzymultimedia.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4000',
]

const configuredOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins])

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.has('*') || allowedOrigins.has(origin)) {
    callback(null, true)
    return
  }
  callback(new Error(`CORS origin not allowed: ${origin}`))
}

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use(express.json())

// Serve static assets if any (note: ephemeral on serverless)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Stay Jazzy API' }))

// Manual schema bootstrap — visit this URL once after deploy (or any time) to
// (re)create all tables and seed defaults. Idempotent and safe to re-run.
app.all('/api/migrate', async (_req, res) => {
  try {
    await migrate()
    res.json({ ok: true, message: 'Database tables created/verified.' })
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Bootstrap failed.', error: String(error) })
  }
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/sms', smsRouter)
app.use('/api/paystack', paystackRouter)
app.use('/api/v1/db', dbRouter)
app.use('/api/email', emailRouter)
app.use('/api/upload/file', uploadRouter)

export { app, ensureSchema }
export default app
