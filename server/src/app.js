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
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
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
app.disable('x-powered-by')

const DEFAULT_ALLOWED_ORIGINS = [
  'https://stayjazzy.vercel.app',
  'https://stayjazzy-backend.vercel.app',
  'https://stayjazzymultimedia.com',
  'https://www.stayjazzymultimedia.com',
  'https://stajazzymultimedia.com',
  'https://www.stajazzymultimedia.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4000',
]

const configuredOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(/[\s,;]+/)
  .map(origin => origin.trim())
  .filter(Boolean)

const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins])
const ALLOWED_HOST_SUFFIXES = [
  'stayjazzymultimedia.com',
  'stajazzymultimedia.com',
]

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  if (allowedOrigins.has(origin)) return true
  try {
    const url = new URL(origin)
    return url.protocol === 'https:' && ALLOWED_HOST_SUFFIXES.some(host => (
      url.hostname === host || url.hostname.endsWith(`.${host}`)
    ))
  } catch {
    return false
  }
}

const corsOrigin = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true)
    return
  }
  const error = new Error('CORS origin not allowed')
  error.status = 403
  callback(error)
}

app.use(helmet())
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }))
app.use(express.urlencoded({
  extended: true,
  limit: process.env.FORM_BODY_LIMIT || '100kb',
  parameterLimit: 100,
}))

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
})

const emailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

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
app.use('/api/auth', authRateLimiter, authRouter)
app.use('/api/sms', smsRouter)
app.use('/api/paystack', paystackRouter)
app.use('/api/v1/db', dbRouter)
app.use('/api/email', emailRateLimiter, emailRouter)
app.use('/api/upload/file', uploadRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err?.status) ? err.status : 500
  const safeStatus = status >= 400 && status < 600 ? status : 500
  const message = safeStatus >= 500 ? 'Server error' : (err?.message || 'Request failed')

  if (safeStatus >= 500) {
    console.error('Unhandled request error:', err?.message || 'Unknown error')
  }

  res.status(safeStatus).json({ error: message })
})

export { app, ensureSchema }
export default app
