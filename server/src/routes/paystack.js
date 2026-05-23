import { Router } from 'express'

export const paystackRouter = Router()

const PAYSTACK_BASE = 'https://api.paystack.co'

/**
 * POST /api/paystack/initialize
 * Initializes a Paystack transaction.
 * Body: { email, amount (in kobo/pesewas), reference?, metadata?, callback_url? }
 */
paystackRouter.post('/initialize', async (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack not configured' })

  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })
    const data = await response.json()
    return res.status(response.ok ? 200 : 400).json(data)
  } catch (err) {
    console.error('Paystack init error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/paystack/verify/:reference
 * Verifies a Paystack transaction by reference.
 */
paystackRouter.get('/verify/:reference', async (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack not configured' })

  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(req.params.reference)}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })
    const data = await response.json()
    return res.status(response.ok ? 200 : 400).json(data)
  } catch (err) {
    console.error('Paystack verify error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/paystack/transaction/:id
 * Fetch a single transaction by its Paystack ID.
 */
paystackRouter.get('/transaction/:id', async (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack not configured' })

  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction/${req.params.id}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })
    const data = await response.json()
    return res.status(response.ok ? 200 : 400).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/paystack/transactions
 * List transactions. Query params forwarded to Paystack.
 */
paystackRouter.get('/transactions', async (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return res.status(500).json({ error: 'Paystack not configured' })

  const qs = new URLSearchParams(req.query).toString()
  try {
    const response = await fetch(`${PAYSTACK_BASE}/transaction${qs ? `?${qs}` : ''}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })
    const data = await response.json()
    return res.status(response.ok ? 200 : 400).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})
