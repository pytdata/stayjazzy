import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X, Send, Bot, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { supabase } from '@/db/supabase'
import type { ChatConversation, ChatMessage, ChatDefaultResponse, ChatSettings } from '@/types/types'
import { getChatSettings, getDefaultResponses, createConversation, createMessage, updateConversation } from '@/db/api'
import { smsApi } from '@/lib/apiClient'

const VISITOR_ID_KEY = 'sj_visitor_id'
const CHAT_OPEN_KEY = 'sj_chat_open'

function generateVisitorId() {
  return 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getVisitorId() {
  let id = sessionStorage.getItem(VISITOR_ID_KEY)
  if (!id) { id = generateVisitorId(); sessionStorage.setItem(VISITOR_ID_KEY, id) }
  return id
}

function isWithinHours(settings: ChatSettings | null) {
  if (!settings) return true
  const now = new Date()
  const tz = settings.timezone || 'Africa/Accra'
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone: tz, hour12: false })
  const [h, m] = timeStr.split(':').map(Number)
  const current = h * 60 + m
  const [sh, sm] = settings.active_start.split(':').map(Number)
  const [eh, em] = settings.active_end.split(':').map(Number)
  const start = sh * 60 + sm
  const end = eh * 60 + em
  return current >= start && current <= end
}

function findBotResponse(text: string, responses: ChatDefaultResponse[]) {
  const lower = text.toLowerCase().trim()
  for (const r of responses) {
    if (!r.is_active) continue
    const patterns = r.question_pattern.toLowerCase().split(',').map(p => p.trim())
    for (const p of patterns) {
      if (lower.includes(p)) return r.response
    }
  }
  return null
}

export default function ChatWidget() {
  const [open, setOpen] = useState(() => sessionStorage.getItem(CHAT_OPEN_KEY) === 'true')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [settings, setSettings] = useState<ChatSettings | null>(null)
  const [defaults, setDefaults] = useState<ChatDefaultResponse[]>([])
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [visitorMessage, setVisitorMessage] = useState('')
  const [offlineSent, setOfflineSent] = useState(false)
  const [ip, setIp] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Fetch IP/country once
  useEffect(() => {
    fetch('https://ipapi.co/json/').then(r => r.json()).then(d => {
      setIp(d.ip || '')
      setCountry(d.country_name || '')
      setCity(d.city || '')
    }).catch(() => {})
  }, [])

  // Load settings and defaults
  useEffect(() => {
    getChatSettings().then(setSettings)
    getDefaultResponses().then(setDefaults)
  }, [])

  // Load or create conversation when chat opens
  useEffect(() => {
    if (!open) return
    const vid = getVisitorId()
    supabase.from('chat_conversations')
      .select('*')
      .eq('visitor_id', vid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()   // ← was .single() which throws on no row
      .then(({ data }) => {
        if (data) {
          setConversation(data)
          loadMessages(data.id)
        }
      })
  }, [open])

  // Subscribe to new messages via postgres_changes (DB-level realtime)
  useEffect(() => {
    if (!conversation) return

    // Remove any previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase
      .channel(`visitor_msgs_${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          // Avoid duplicates: visitor messages are already added optimistically
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 80)
        }
      )
      .subscribe()

    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [conversation?.id])

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)

    let conv = conversation
    if (!conv) {
      conv = await createConversation({
        visitor_id: getVisitorId(),
        ip_address: ip,
        user_agent: navigator.userAgent,
        country: country || undefined,
        city: city || undefined,
        status: 'active',
      })
      setConversation(conv)
    }

    // Insert visitor message — realtime subscription will pick it up
    await createMessage({
      conversation_id: conv.id,
      sender_type: 'visitor',
      sender_name: visitorName || undefined,
      message: text,
    })

    // Bot auto-response
    const botReply = findBotResponse(text, defaults)
    if (botReply) {
      await new Promise(r => setTimeout(r, 700))
      await createMessage({
        conversation_id: conv.id,
        sender_type: 'bot',
        message: botReply,
      })
    } else if (settings?.sms_enabled) {
      // No bot answer – alert admin via Node.js SMS API
      smsApi.chatAlert({
        conversation_id: conv.id,
        visitor_message: text,
        visitor_id: conv.visitor_id,
      }).catch(() => {})
    }

    await updateConversation(conv.id, { last_message_at: new Date().toISOString() })
    setLoading(false)
    inputRef.current?.focus()
  }, [input, loading, conversation, defaults, settings, ip, country, city, visitorName])

  const submitOfflineForm = async () => {
    if (!visitorName || !visitorEmail || !visitorMessage) return
    await supabase.from('chat_leads').insert({
      full_name: visitorName,
      email: visitorEmail,
      phone: visitorPhone || undefined,
      message: visitorMessage,
      ip_address: ip,
      user_agent: navigator.userAgent,
      country: country || undefined,
    })
    setOfflineSent(true)
  }

  const inHours = isWithinHours(settings)
  const showForm = !inHours && messages.length === 0

  useEffect(() => {
    sessionStorage.setItem(CHAT_OPEN_KEY, String(open))
    if (open) setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100)
  }, [open, messages])

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        className={cn(
          'fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110',
          open ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-5 z-50 w-[360px] max-w-[calc(100vw-2.5rem)] bg-white border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: '520px', maxHeight: 'calc(100vh - 7rem)' }}
        >
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Stay Jazzy Support</p>
                <p className="text-xs text-white/70 flex items-center gap-1">
                  {inHours
                    ? <><Clock className="h-3 w-3" /> Online — we reply fast</>
                    : <><AlertCircle className="h-3 w-3" /> Offline — leave a message</>}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-muted/30">
            {messages.length === 0 && !showForm && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Hi there! How can we help you today?</p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={cn('flex', msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                  msg.sender_type === 'visitor'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : msg.sender_type === 'bot'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-bl-sm'
                    : 'bg-white border border-border text-foreground rounded-bl-sm shadow-sm'
                )}>
                  <p className="text-xs font-semibold opacity-70 mb-0.5">
                    {msg.sender_type === 'visitor' ? 'You'
                      : msg.sender_type === 'bot' ? '🤖 Bot'
                      : msg.sender_name || 'Stay Jazzy Team'}
                  </p>
                  <p>{msg.message}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Offline form */}
          {showForm && (
            <div className="p-3 bg-white border-t border-border space-y-2 shrink-0">
              {offlineSent ? (
                <div className="text-center py-4 text-sm text-green-600">
                  <p className="font-semibold">Message sent!</p>
                  <p className="text-muted-foreground">We'll get back to you soon.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Our team is offline. Leave a message and we'll respond during business hours (6AM–10PM GMT).
                  </p>
                  <Input placeholder="Full Name *" value={visitorName} onChange={e => setVisitorName(e.target.value)} className="text-sm" />
                  <div className="flex gap-2">
                    <Input type="email" placeholder="Email *" value={visitorEmail} onChange={e => setVisitorEmail(e.target.value)} className="text-sm flex-1" />
                    <Input placeholder="Phone" value={visitorPhone} onChange={e => setVisitorPhone(e.target.value)} className="text-sm flex-1" />
                  </div>
                  <Textarea
                    placeholder="Your message... *"
                    value={visitorMessage}
                    onChange={e => setVisitorMessage(e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                  <Button
                    onClick={submitOfflineForm}
                    disabled={!visitorName || !visitorEmail || !visitorMessage}
                    className="w-full text-sm"
                  >
                    <Send className="h-4 w-4 mr-1" /> Send Message
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Live input area */}
          {!showForm && (
            <div className="p-3 bg-white border-t border-border flex items-center gap-2 shrink-0">
              <Input
                ref={inputRef}
                placeholder="Type a message…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
                }}
                className="text-sm flex-1"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

