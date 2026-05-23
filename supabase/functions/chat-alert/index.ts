import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  try {
    const { conversation_id, visitor_message, visitor_id, phone, email } = await req.json()

    // Log alert
    console.log('Chat alert triggered:', { conversation_id, visitor_id, phone, email })

    // Send SMS via Twilio if phone is provided
    if (phone) {
      const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
      const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
      const TWILIO_FROM = Deno.env.get('TWILIO_PHONE_NUMBER')

      if (TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM) {
        const body = `New chat from Stay Jazzy visitor: "${visitor_message.slice(0, 80)}..."`
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: TWILIO_FROM, To: phone, Body: body }),
        })
      }
    }

    // Send email via Resend if email is provided
    if (email) {
      const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
      if (RESEND_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Stay Jazzy <alerts@stayjazzy.com>',
            to: email,
            subject: 'New chat message requires attention',
            text: `A visitor sent a message that the bot could not answer.\n\nMessage: ${visitor_message}\nVisitor ID: ${visitor_id}\nConversation: ${conversation_id}`,
          }),
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (e) {
    console.error('Chat alert error:', e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
