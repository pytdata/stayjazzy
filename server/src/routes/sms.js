import { Router } from 'express'

export const smsRouter = Router()

const SMS_API_URL = 'https://app.mycsms.com/api/v3/sms/send'

/**
 * POST /api/sms/send
 * Body: { phone: string | string[], message: string }
 * Sends an SMS using the cSMS API.
 */
smsRouter.post('/send', async (req, res) => {
  const { phone, message } = req.body

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' })
  }

  const apiKey = process.env.SMS_API
  const senderId = process.env.SENDER_ID

  if (!apiKey || !senderId) {
    return res.status(500).json({ error: 'SMS credentials not configured' })
  }

  // Normalise phone: accept a string or array; ensure all numbers are in E.164-ish format
  const phones = (Array.isArray(phone) ? phone : [phone]).map(normalisePhone)

  const payload = {
    phone: phones,
    sender_id: senderId,
    message,
    message_type: 'text',
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return res.status(response.ok ? 200 : 400).json(data)
  } catch (err) {
    console.error('cSMS error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/sms/chat-alert
 * Sends an SMS alert to the admin when the bot has no answer.
 * Body: { visitor_message: string, visitor_id: string, conversation_id: string }
 */
smsRouter.post('/chat-alert', async (req, res) => {
  const { visitor_message, visitor_id, conversation_id } = req.body

  const adminPhone = process.env.ADMIN_ALERT_PHONE
  const apiKey = process.env.SMS_API
  const senderId = process.env.SENDER_ID

  if (!apiKey || !senderId || !adminPhone) {
    // Not configured — silently succeed so the chat still works
    return res.json({ success: true, skipped: true })
  }

  const message = `Stay Jazzy Chat Alert: Visitor ${visitor_id} sent a message the bot could not answer.\n\nMessage: "${visitor_message.slice(0, 120)}"\n\nConversation: ${conversation_id}`

  const payload = {
    phone: [normalisePhone(adminPhone)],
    sender_id: senderId,
    message,
    message_type: 'text',
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log('Chat alert SMS sent:', data)
    return res.json({ success: true, data })
  } catch (err) {
    console.error('Chat alert SMS error:', err)
    return res.status(500).json({ error: err.message })
  }
})

/**
 * Normalise a phone number to international format (Ghana-centric fallback).
 * Strips spaces/dashes, prepends 233 if it starts with 0.
 */
function normalisePhone(phone) {
  const cleaned = String(phone).replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('0')) return '233' + cleaned.slice(1)
  if (cleaned.startsWith('+')) return cleaned.slice(1)
  return cleaned
}
