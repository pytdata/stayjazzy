import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CreditCard } from 'lucide-react'
import { paystackApi, PAYSTACK_PUBLIC_KEY } from '@/lib/apiClient'
import { createPaymentTransaction, createReceipt, updatePaymentTransactionByReference } from '@/db/api'
import { toast } from 'sonner'

interface PaystackButtonProps {
  email: string
  amountGHS: number        // in Ghana Cedis (we convert to pesewas ×100)
  bookingId?: string
  invoiceId?: string
  customerName?: string
  onSuccess?: (reference: string) => void | Promise<void>
  label?: string
  className?: string
}

/**
 * PaystackButton — initialises a Paystack transaction on the Node.js backend,
 * opens the Paystack checkout popup, then verifies on success and records the
 * transaction + receipt in Supabase.
 */
export default function PaystackButton({
  email,
  amountGHS,
  bookingId,
  invoiceId,
  customerName,
  onSuccess,
  label = 'Pay Now',
  className,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if (!email || !amountGHS) { toast.error('Missing payment details'); return }
    setLoading(true)

    try {
      // 1. Initialise transaction through the Node.js backend
      const reference = `SJ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      const initRes = await paystackApi.initialize({
        email,
        amount: Math.round(amountGHS * 100), // convert to pesewas
        reference,
        currency: 'GHS',
        metadata: {
          booking_id: bookingId,
          customer_name: customerName,
          invoice_id: invoiceId,
        },
      })

      if (!initRes.status) throw new Error(initRes.message || 'Failed to initialise payment')

      // 2. Store pending transaction in Supabase
      const txn = await createPaymentTransaction({
        booking_id: bookingId,
        reference,
        amount: amountGHS,
        currency: 'GHS',
        status: 'pending',
        gateway: 'paystack',
      })

      // 3. Open Paystack popup using their inline JS (loaded via CDN in index.html)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PaystackPop = (window as any).PaystackPop
      if (!PaystackPop || !PAYSTACK_PUBLIC_KEY) {
        // Fallback: redirect to authorization_url
        window.location.href = initRes.data.authorization_url
        return
      }

      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amountGHS * 100),
        currency: 'GHS',
        ref: reference,
        onClose: () => {
          toast.info('Payment cancelled')
          setLoading(false)
        },
        callback: async (response: { reference: string }) => {
          try {
            // 4. Verify on the Node.js backend
            const verify = await paystackApi.verify(response.reference)
            if (verify.data.status === 'success') {
              // 5. Update transaction record in Supabase
              await updatePaymentTransactionByReference(response.reference, {
                status: 'success',
                paid_at: verify.data.paid_at,
                gateway_response: verify.data,
              })

              // 6. Generate receipt. Payment status should still update if receipt creation fails.
              let receiptRecorded = true
              try {
                await createReceipt({
                  receipt_number: `RCP-${Date.now()}`,
                  transaction_id: txn.id,
                  invoice_id: invoiceId,
                  customer_name: customerName || email,
                  customer_email: email,
                  amount: amountGHS,
                  currency: 'GHS',
                  payment_method: 'Paystack',
                  paid_at: verify.data.paid_at || new Date().toISOString(),
                })
              } catch {
                receiptRecorded = false
                toast.warning('Payment succeeded, but the receipt could not be recorded automatically.')
              }

              toast.success(receiptRecorded ? 'Payment successful! Your receipt has been recorded.' : 'Payment successful!')
              await onSuccess?.(response.reference)
            } else {
              // Mark as failed
              await updatePaymentTransactionByReference(response.reference, { status: 'failed' })
              toast.error('Payment was not successful. Please try again.')
            }
          } catch (e: any) {
            toast.error(e.message || 'Payment verification failed')
          } finally {
            setLoading(false)
          }
        },
      })

      handler.openIframe()
    } catch (e: any) {
      toast.error(e.message || 'Payment initialisation failed')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      className={className}
    >
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing…</>
        : <><CreditCard className="h-4 w-4 mr-2" />{label}</>
      }
    </Button>
  )
}
