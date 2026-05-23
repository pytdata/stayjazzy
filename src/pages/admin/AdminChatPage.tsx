import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Users, Send, Clock, MapPin, Check, X, AlertTriangle,
  Trash2, Plus, Save, Bot, Phone, Mail, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/db/supabase'
import {
  getConversations, getConversationMessages, getChatLeads, getDefaultResponses,
  createMessage, updateConversation, updateChatLead,
  getChatSettings, createDefaultResponse, updateDefaultResponse, deleteDefaultResponse,
} from '@/db/api'
import type { ChatConversation, ChatMessage, ChatLead, ChatDefaultResponse, ChatSettings } from '@/types/types'
import { toast } from 'sonner'

export default function AdminChatPage() {
  const [activeTab, setActiveTab] = useState('conversations')
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [leads, setLeads] = useState<ChatLead[]>([])
  const [defaults, setDefaults] = useState<ChatDefaultResponse[]>([])
  const [settings, setSettings] = useState<ChatSettings | null>(null)
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [search, setSearch] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const loadAll = async () => {
    const [c, l, d, s] = await Promise.all([
      getConversations(), getChatLeads(), getDefaultResponses(), getChatSettings()
    ])
    setConversations(c)
    setLeads(l)
    setDefaults(d)
    setSettings(s)
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (!selectedConv) return
    loadMessages(selectedConv.id)
    // Subscribe to real-time messages via postgres_changes (DB-level)
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`admin_msgs_${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 80)
        }
      )
      .subscribe()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [selectedConv?.id])

  const loadMessages = async (convId: string) => {
    const msgs = await getConversationMessages(convId)
    setMessages(msgs)
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100)
  }

  const sendAdminMessage = async () => {
    if (!input.trim() || !selectedConv) return
    await createMessage({
      conversation_id: selectedConv.id,
      sender_type: 'admin',
      sender_name: 'Stay Jazzy Team',
      message: input.trim(),
    })
    setInput('')
    // No broadcast needed — postgres_changes realtime delivers to visitor automatically
  }

  const closeConversation = async (id: string) => {
    await updateConversation(id, { status: 'closed' })
    loadAll()
    if (selectedConv?.id === id) setSelectedConv(null)
  }

  const updateLeadStatus = async (id: string, status: string) => {
    await updateChatLead(id, { status: status as any })
    loadAll()
  }

  const addDefaultResponse = async () => {
    if (!newQ.trim() || !newA.trim()) return
    await createDefaultResponse({ question_pattern: newQ.trim(), response: newA.trim(), sort_order: defaults.length })
    setNewQ(''); setNewA('')
    loadAll()
    toast.success('Default response added')
  }

  const delDefault = async (id: string) => {
    await deleteDefaultResponse(id)
    loadAll()
    toast.success('Deleted')
  }

  const filteredConvs = conversations.filter(c =>
    c.visitor_id.toLowerCase().includes(search.toLowerCase()) ||
    (c.country || '').toLowerCase().includes(search.toLowerCase())
  )

  // Group conversations by country
  const countryGroups: Record<string, ChatConversation[]> = {}
  for (const c of conversations) {
    const key = c.country || 'Unknown'
    if (!countryGroups[key]) countryGroups[key] = []
    countryGroups[key].push(c)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" /> Live Chat
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="conversations">Conversations ({conversations.length})</TabsTrigger>
          <TabsTrigger value="leads">Offline Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="defaults">Bot Responses ({defaults.length})</TabsTrigger>
          <TabsTrigger value="countries">By Country</TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
            {/* List */}
            <Card className="lg:col-span-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-2">
                <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm" />
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2 p-3 pt-0">
                {filteredConvs.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedConv?.id === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">{c.visitor_id.slice(0, 12)}...</span>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-xs">{c.status}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" /> {c.country || 'Unknown'} {c.city ? `· ${c.city}` : ''}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : 'No messages'}
                    </div>
                  </button>
                ))}
                {filteredConvs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No conversations</p>}
              </CardContent>
            </Card>

            {/* Chat area */}
            <Card className="lg:col-span-2 flex flex-col overflow-hidden">
              {selectedConv ? (
                <>
                  <CardHeader className="pb-2 border-b shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {selectedConv.visitor_id.slice(0, 20)}...
                        <span className="text-xs font-normal text-muted-foreground">({selectedConv.country || 'Unknown'})</span>
                      </CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => closeConversation(selectedConv.id)}>
                        <X className="h-4 w-4 mr-1" /> Close
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      IP: {selectedConv.ip_address || 'N/A'} | UA: {selectedConv.user_agent?.slice(0, 60) || 'N/A'}...
                    </div>
                  </CardHeader>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                          m.sender_type === 'admin' ? 'bg-primary text-primary-foreground' :
                          m.sender_type === 'bot' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                          'bg-white border border-border shadow-sm'
                        }`}>
                          <p className="text-xs opacity-70 font-medium">{m.sender_type === 'admin' ? 'You' : m.sender_name || m.sender_type}</p>
                          <p>{m.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t bg-white flex gap-2 shrink-0">
                    <Input
                      placeholder="Type your reply..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendAdminMessage() }}
                      className="text-sm flex-1"
                    />
                    <Button size="icon" onClick={sendAdminMessage} disabled={!input.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a conversation to start chatting</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Offline Form Submissions</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b"><tr className="text-left"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Phone</th><th className="pb-2">Country</th><th className="pb-2">Message</th><th className="pb-2">Status</th><th className="pb-2">Date</th><th className="pb-2"></th></tr></thead>
                <tbody className="divide-y">
                  {leads.map(l => (
                    <tr key={l.id}>
                      <td className="py-2 font-medium">{l.full_name}</td>
                      <td className="py-2">{l.email}</td>
                      <td className="py-2">{l.phone || '-'}</td>
                      <td className="py-2">{l.country || '-'}</td>
                      <td className="py-2 max-w-[200px] truncate">{l.message}</td>
                      <td className="py-2"><Badge variant={l.status === 'new' ? 'default' : l.status === 'contacted' ? 'secondary' : 'outline'}>{l.status}</Badge></td>
                      <td className="py-2 text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="py-2 flex gap-1">
                        {l.status === 'new' && <Button size="sm" variant="ghost" onClick={() => updateLeadStatus(l.id, 'contacted')}><Check className="h-4 w-4" /></Button>}
                        {l.status !== 'resolved' && <Button size="sm" variant="ghost" onClick={() => updateLeadStatus(l.id, 'resolved')}><Check className="h-4 w-4 text-green-600" /></Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && <p className="text-muted-foreground text-center py-8">No offline leads yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Defaults Tab */}
        <TabsContent value="defaults" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Add Auto-Response</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Keywords (comma-separated)" value={newQ} onChange={e => setNewQ(e.target.value)} />
              <Textarea placeholder="Response message" value={newA} onChange={e => setNewA(e.target.value)} />
              <Button onClick={addDefaultResponse} disabled={!newQ.trim() || !newA.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add Response
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Existing Responses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {defaults.map(d => (
                <div key={d.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Keywords: {d.question_pattern}</p>
                    <p className="text-sm text-muted-foreground">{d.response}</p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => delDefault(d.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(countryGroups).map(([country, convs]) => (
              <Card key={country}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> {country}
                    <Badge>{convs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {convs.map(c => (
                    <div key={c.id} className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>{c.visitor_id.slice(0, 15)}...</span>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{c.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
