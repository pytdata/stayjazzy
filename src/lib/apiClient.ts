/**
 * Shared API client for the Stay Jazzy Node.js backend.
 * All calls to /api/* are routed through here.
 */

// When empty, requests go through the Vite dev-server proxy to the Express backend
const BASE = (import.meta.env.VITE_API_BASE_URL as string)?.trim() || ''

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `API error ${res.status}`)
  return data as T
}

// ─── SMS ─────────────────────────────────────────────────────

export const smsApi = {
  /**
   * Send an SMS to one or more phone numbers.
   */
  send(phone: string | string[], message: string) {
    return request('/api/sms/send', {
      method: 'POST',
      body: JSON.stringify({ phone, message }),
    })
  },

  /**
   * Trigger the chat-alert SMS to the admin.
   */
  chatAlert(params: { visitor_message: string; visitor_id: string; conversation_id: string }) {
    return request('/api/sms/chat-alert', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  },
}

// ─── PAYSTACK ────────────────────────────────────────────────

export interface PaystackInitPayload {
  email: string
  amount: number        // in smallest currency unit (pesewas/kobo)
  reference?: string
  callback_url?: string
  metadata?: Record<string, unknown>
  currency?: string
}

export interface PaystackInitResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    reference: string
    status: string   // 'success' | 'failed' | 'abandoned'
    amount: number
    currency: string
    paid_at: string
    customer: { email: string; name?: string }
    metadata?: Record<string, unknown>
  }
}

export const paystackApi = {
  /** Initialize a new transaction. Returns the authorization_url to redirect the customer. */
  initialize(payload: PaystackInitPayload) {
    return request<PaystackInitResponse>('/api/paystack/initialize', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /** Verify a transaction by its reference after the customer has paid. */
  verify(reference: string) {
    return request<PaystackVerifyResponse>(`/api/paystack/verify/${encodeURIComponent(reference)}`)
  },

  /** Fetch a single transaction by Paystack ID. */
  getTransaction(id: string) {
    return request(`/api/paystack/transaction/${id}`)
  },

  /** List transactions (pass query params as object). */
  listTransactions(params: Record<string, string | number> = {}) {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request(`/api/paystack/transactions${qs ? `?${qs}` : ''}`)
  },
}

export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string
