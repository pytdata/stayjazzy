import { useState } from 'react'
import { useEffect } from 'react'
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getCompanySettings, submitContactMessage, trackPageView } from '@/db/api'
import { toast } from 'sonner'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [company, setCompany] = useState({
    address: 'Accra, Ghana',
    phone: '+233 000 000 000',
    email: 'info@stayjazzy.com',
  })

  useEffect(() => {
    trackPageView('/contact')
    getCompanySettings().then(settings => {
      if (!settings) return
      setCompany(prev => ({
        address: settings.address || [settings.city, settings.country].filter(Boolean).join(', ') || prev.address,
        phone: settings.phone || prev.phone,
        email: settings.email || prev.email,
      }))
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await submitContactMessage({ name: form.name, email: form.email, phone: form.phone, subject: form.subject, message: form.message })
      setSent(true)
      toast.success('Message sent successfully!')
    } catch { toast.error('Failed to send message. Please try again.') }
    finally { setLoading(false) }
  }

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="pt-16 md:pt-20">
      <section className="py-16 md:py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">Get In Touch</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Contact Us</h1>
          <p className="text-white/80 text-lg">We'd love to hear from you. Let's discuss how we can help your business grow.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact form */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Send a Message</h2>
          {sent ? (
            <div className="bg-primary/10 rounded-xl p-8 text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Message Sent!</h3>
              <p className="text-muted-foreground">Thank you for reaching out. We'll get back to you within 24 hours.</p>
              <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}>Send Another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="ct-name">Full Name *</Label>
                  <Input id="ct-name" required value={form.name} onChange={update('name')} placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ct-email">Email *</Label>
                  <Input id="ct-email" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="ct-phone">Phone</Label>
                  <Input id="ct-phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+233 XXX XXX XXXX" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ct-subject">Subject</Label>
                  <Input id="ct-subject" value={form.subject} onChange={update('subject')} placeholder="How can we help?" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ct-message">Message *</Label>
                <Textarea id="ct-message" required value={form.message} onChange={update('message')} placeholder="Tell us about your project…" rows={5} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Get In Touch</h2>
          {[
            { icon: MapPin, title: 'Address', content: company.address },
            { icon: Phone, title: 'Phone', content: company.phone },
            { icon: Mail, title: 'Email', content: company.email },
            { icon: Clock, title: 'Business Hours', content: 'Mon – Sat: 8:00 AM – 6:00 PM' },
          ].map(({ icon: Icon, title, content }) => (
            <Card key={title} className="border-border">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-muted-foreground text-sm">{content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
