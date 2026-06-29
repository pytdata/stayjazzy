import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  ArrowDown,
  ArrowUp,
  Code2,
  Download,
  GripVertical,
  Image,
  Loader2,
  Mail,
  MousePointerClick,
  Plus,
  Search,
  Send,
  Trash2,
  Type,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getNewsletterSubscribers,
  importNewsletterRecipients,
  publishNewsletter,
} from '@/db/api'
import type { NewsletterRecipient, NewsletterSubscriber } from '@/types/types'

type SectionType = 'hero' | 'text' | 'image' | 'button' | 'divider'

interface NewsletterSection {
  id: string
  type: SectionType
  heading: string
  body: string
  url: string
  buttonLabel: string
}

const sectionLabels: Record<SectionType, string> = {
  hero: 'Hero',
  text: 'Text',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
}

const defaultSections: NewsletterSection[] = [
  {
    id: crypto.randomUUID(),
    type: 'hero',
    heading: 'Stay Jazzy Newsletter',
    body: 'Fresh updates, creative work, and offers from Stay Jazzy Multimedia.',
    url: '',
    buttonLabel: '',
  },
  {
    id: crypto.randomUUID(),
    type: 'text',
    heading: 'What is new',
    body: 'Write your campaign update here. Keep it short, useful, and easy to scan.',
    url: '',
    buttonLabel: '',
  },
]

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const sanitizeHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')

const plainText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const renderSections = (sections: NewsletterSection[]) => {
  const blocks = sections.map((section) => {
    const heading = escapeHtml(section.heading)
    const body = escapeHtml(section.body).replace(/\n/g, '<br />')
    const url = escapeHtml(section.url)
    const buttonLabel = escapeHtml(section.buttonLabel || 'Learn more')

    if (section.type === 'hero') {
      return `
        <section style="padding:32px;background:#111827;color:#ffffff;border-radius:12px">
          <h1 style="margin:0 0 12px;font:700 30px/1.2 Arial,sans-serif">${heading}</h1>
          <p style="margin:0;font:16px/1.6 Arial,sans-serif;color:#e5e7eb">${body}</p>
        </section>`
    }
    if (section.type === 'image') {
      return url
        ? `<img src="${url}" alt="${heading || 'Newsletter image'}" style="display:block;width:100%;max-width:640px;border-radius:10px;margin:22px 0" />`
        : ''
    }
    if (section.type === 'button') {
      return url
        ? `<p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font:700 14px Arial,sans-serif">${buttonLabel}</a></p>`
        : ''
    }
    if (section.type === 'divider') {
      return '<hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0" />'
    }
    return `
      <section style="margin:24px 0">
        ${heading ? `<h2 style="margin:0 0 10px;color:#111827;font:700 22px/1.3 Arial,sans-serif">${heading}</h2>` : ''}
        <p style="margin:0;color:#374151;font:15px/1.7 Arial,sans-serif">${body}</p>
      </section>`
  })

  return `
    <main style="max-width:680px;margin:0 auto;padding:24px;background:#ffffff;color:#111827;font-family:Arial,sans-serif">
      ${blocks.join('\n')}
    </main>`
}

const previewDoc = (html: string) => `
  <!doctype html>
  <html>
    <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
    <body style="margin:0;background:#f3f4f6;padding:18px">${sanitizeHtml(html)}</body>
  </html>`

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [imported, setImported] = useState<NewsletterRecipient[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [search, setSearch] = useState('')
  const [driveUrl, setDriveUrl] = useState('')
  const [subject, setSubject] = useState('')
  const [mode, setMode] = useState<'builder' | 'source'>('builder')
  const [sections, setSections] = useState<NewsletterSection[]>(defaultSections)
  const [sourceHtml, setSourceHtml] = useState(renderSections(defaultSections))
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    getNewsletterSubscribers()
      .then((data) => {
        setSubscribers(data)
        setSelected(new Set(data.map((sub) => sub.email)))
      })
      .catch(() => toast.error('Failed to load subscribers'))
      .finally(() => setLoading(false))
  }, [])

  const subscriberRecipients = useMemo<NewsletterRecipient[]>(
    () => subscribers.map((sub) => ({ id: sub.id, email: sub.email, source: 'subscriber' })),
    [subscribers]
  )

  const recipients = useMemo(() => {
    const map = new Map<string, NewsletterRecipient>()
    for (const recipient of subscriberRecipients) map.set(recipient.email, recipient)
    for (const recipient of imported) {
      const email = normalizeEmail(recipient.email)
      if (!map.has(email)) map.set(email, { ...recipient, email })
    }
    return Array.from(map.values())
  }, [subscriberRecipients, imported])

  const filteredRecipients = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return recipients
    return recipients.filter((recipient) => recipient.email.includes(term) || recipient.source.includes(term))
  }, [recipients, search])

  const selectedRecipients = useMemo(
    () => recipients.filter((recipient) => selected.has(recipient.email)),
    [recipients, selected]
  )

  const html = mode === 'builder' ? renderSections(sections) : sourceHtml
  const safeHtml = sanitizeHtml(html)

  const exportCSV = () => {
    const csv = ['Email,Subscribed At', ...subscribers.map((sub) => `${sub.email},${sub.subscribed_at}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter_subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importRecipients = async () => {
    if (!driveUrl.trim()) {
      toast.error('Paste a Google Drive, CSV, or Excel file URL')
      return
    }
    setImporting(true)
    try {
      const result = await importNewsletterRecipients(driveUrl.trim())
      setImported(result.recipients)
      setSelected((prev) => {
        const next = new Set(prev)
        for (const recipient of result.recipients) next.add(recipient.email)
        return next
      })
      toast.success(`Imported ${result.count} recipient${result.count === 1 ? '' : 's'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const addSection = (type: SectionType) => {
    const next: NewsletterSection = {
      id: crypto.randomUUID(),
      type,
      heading: type === 'divider' ? '' : sectionLabels[type],
      body: type === 'text' || type === 'hero' ? 'Write your content here.' : '',
      url: '',
      buttonLabel: type === 'button' ? 'Learn more' : '',
    }
    setSections((current) => [...current, next])
  }

  const updateSection = (id: string, update: Partial<NewsletterSection>) => {
    setSections((current) => current.map((section) => (section.id === id ? { ...section, ...update } : section)))
  }

  const removeSection = (id: string) => {
    setSections((current) => current.filter((section) => section.id !== id))
  }

  const moveSection = (id: string, direction: -1 | 1) => {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      const [section] = next.splice(index, 1)
      next.splice(nextIndex, 0, section)
      return next
    })
  }

  const dropSection = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return
    setSections((current) => {
      const from = current.findIndex((section) => section.id === draggedId)
      const to = current.findIndex((section) => section.id === targetId)
      if (from < 0 || to < 0) return current
      const next = [...current]
      const [section] = next.splice(from, 1)
      next.splice(to, 0, section)
      return next
    })
    setDraggedId(null)
  }

  const toggleRecipient = (email: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  const selectVisible = () => {
    setSelected((current) => {
      const next = new Set(current)
      for (const recipient of filteredRecipients) next.add(recipient.email)
      return next
    })
  }

  const clearVisible = () => {
    setSelected((current) => {
      const next = new Set(current)
      for (const recipient of filteredRecipients) next.delete(recipient.email)
      return next
    })
  }

  const publish = async () => {
    if (!subject.trim()) return toast.error('Subject is required')
    if (selectedRecipients.length === 0) return toast.error('Select at least one recipient')
    if (!plainText(safeHtml)) return toast.error('Newsletter content is required')

    setPublishing(true)
    try {
      const result = await publishNewsletter({
        subject: subject.trim(),
        html: safeHtml,
        text: plainText(safeHtml),
        recipients: selectedRecipients,
      })
      if (result.failedCount > 0) {
        toast.warning(`Sent ${result.sentCount}, failed ${result.failedCount}`)
      } else {
        toast.success(`Newsletter sent to ${result.sentCount} recipient${result.sentCount === 1 ? '' : 's'}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter Publisher</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {subscribers.length} subscribed contact{subscribers.length === 1 ? '' : 's'} · {selectedRecipients.length} selected
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {subscribers.length > 0 && (
            <Button variant="outline" onClick={exportCSV} className="gap-1.5">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          )}
          <Button onClick={publish} disabled={publishing || loading} className="gap-1.5">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="newsletter-subject">Subject</label>
                <Input
                  id="newsletter-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="June creative updates from Stay Jazzy"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant={mode === 'builder' ? 'default' : 'outline'}
                  onClick={() => setMode('builder')}
                  className="gap-1.5"
                >
                  <Type className="h-4 w-4" /> Builder
                </Button>
                <Button
                  type="button"
                  variant={mode === 'source' ? 'default' : 'outline'}
                  onClick={() => {
                    setSourceHtml(html)
                    setMode('source')
                  }}
                  className="gap-1.5"
                >
                  <Code2 className="h-4 w-4" /> Source
                </Button>
              </div>
            </div>

            {mode === 'builder' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(['hero', 'text', 'image', 'button', 'divider'] as SectionType[]).map((type) => (
                    <Button key={type} type="button" variant="outline" size="sm" onClick={() => addSection(type)} className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> {sectionLabels[type]}
                    </Button>
                  ))}
                </div>

                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => setDraggedId(section.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropSection(section.id)}
                      className="rounded-md border border-border bg-background p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                          <Badge variant="secondary">{sectionLabels[section.type]}</Badge>
                          <span className="text-xs text-muted-foreground">Section {index + 1}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveSection(section.id, -1)} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveSection(section.id, 1)} disabled={index === sections.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(section.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {section.type !== 'divider' && section.type !== 'button' && (
                        <Input
                          className="mb-2"
                          value={section.heading}
                          onChange={(event) => updateSection(section.id, { heading: event.target.value })}
                          placeholder={section.type === 'image' ? 'Image alt text' : 'Heading'}
                        />
                      )}
                      {(section.type === 'hero' || section.type === 'text') && (
                        <Textarea
                          value={section.body}
                          onChange={(event) => updateSection(section.id, { body: event.target.value })}
                          placeholder="Body copy"
                          className="min-h-28"
                        />
                      )}
                      {(section.type === 'image' || section.type === 'button') && (
                        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
                          <Input
                            value={section.url}
                            onChange={(event) => updateSection(section.id, { url: event.target.value })}
                            placeholder={section.type === 'image' ? 'https://example.com/image.jpg' : 'https://example.com'}
                          />
                          {section.type === 'button' && (
                            <Input
                              value={section.buttonLabel}
                              onChange={(event) => updateSection(section.id, { buttonLabel: event.target.value })}
                              placeholder="Button label"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Textarea
                value={sourceHtml}
                onChange={(event) => setSourceHtml(event.target.value)}
                className="min-h-[520px] font-mono text-xs"
                spellCheck={false}
                placeholder="<main>Write or paste sanitized email HTML here</main>"
              />
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Sandbox Preview</h2>
            </div>
            <iframe
              title="Newsletter preview"
              sandbox=""
              srcDoc={previewDoc(safeHtml)}
              className="h-[520px] w-full rounded-md border border-border bg-white"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4 p-4">
            <div>
              <h2 className="font-semibold">Import Recipients</h2>
              <p className="mt-1 text-sm text-muted-foreground">Paste a public Google Drive link to a CSV or XLSX file.</p>
            </div>
            <div className="space-y-2">
              <Input value={driveUrl} onChange={(event) => setDriveUrl(event.target.value)} placeholder="https://drive.google.com/..." />
              <Button onClick={importRecipients} disabled={importing} className="w-full gap-1.5">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                Import from URL
              </Button>
            </div>
            {imported.length > 0 && (
              <p className="text-sm text-muted-foreground">{imported.length} imported contact{imported.length === 1 ? '' : 's'} added to this send.</p>
            )}
          </Card>

          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Recipients</h2>
                <p className="text-sm text-muted-foreground">{selectedRecipients.length} of {recipients.length} selected</p>
              </div>
              <Badge variant="outline">{subscribers.length} DB</Badge>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipients" className="pl-9" />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectVisible} className="flex-1 gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" /> Select
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearVisible} className="flex-1">
                Clear
              </Button>
            </div>

            {loading ? (
              <div className="py-10 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRecipients.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Mail className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>No recipients found.</p>
              </div>
            ) : (
              <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {filteredRecipients.map((recipient) => (
                  <label
                    key={`${recipient.source}-${recipient.email}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(recipient.email)}
                      onChange={() => toggleRecipient(recipient.email)}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{recipient.email}</span>
                      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={recipient.source === 'subscriber' ? 'secondary' : 'outline'}>{recipient.source}</Badge>
                        {recipient.source === 'subscriber' && subscribers.find((sub) => sub.email === recipient.email)?.subscribed_at && (
                          <span>{format(new Date(subscribers.find((sub) => sub.email === recipient.email)?.subscribed_at || ''), 'PP')}</span>
                        )}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
