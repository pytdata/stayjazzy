import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { booking_id } = await req.json()
    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'booking_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .maybeSingle()

    if (error || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send confirmation email to client
    const clientEmailRes = await supabase.functions.invoke('send-email', {
      body: {
        type: 'booking_confirmation',
        data: {
          user_name: booking.user_name,
          user_email: booking.user_email,
          booking_id: booking.id,
          selected_services: booking.selected_services || [],
        },
      },
    })

    // Send notification email to admin
    const adminEmailRes = await supabase.functions.invoke('send-email', {
      body: {
        type: 'new_booking_admin',
        data: {
          user_name: booking.user_name,
          user_email: booking.user_email,
          user_phone: booking.user_phone,
          booking_id: booking.id,
          selected_services: booking.selected_services || [],
        },
      },
    })

    console.log('[send-booking-notification] client email:', clientEmailRes.error || 'ok')
    console.log('[send-booking-notification] admin email:', adminEmailRes.error || 'ok')

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-booking-notification] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
