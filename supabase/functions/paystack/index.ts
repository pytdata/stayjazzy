import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')

serve(async (req) => {
  try {
    const { action, data } = await req.json()

    // Initialize transaction
    if (action === 'initialize') {
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      return new Response(JSON.stringify(result), { status: res.status, headers: { 'Content-Type': 'application/json' } })
    }

    // Verify transaction
    if (action === 'verify') {
      const { reference } = data
      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}` },
      })
      const result = await res.json()
      return new Response(JSON.stringify(result), { status: res.status, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
