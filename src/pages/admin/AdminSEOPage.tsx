import { useState, useEffect } from 'react'
import { Globe, Save, Tag, FileCode2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { getSEOSettings, updateSEOSettings } from '@/db/api'
import type { SEOSettings } from '@/types/types'
import { toast } from 'sonner'
import MediaUpload from '@/components/ui/MediaUpload'

export default function AdminSEOPage() {
  const [settings, setSettings] = useState<SEOSettings | null>(null)
  const [form, setForm] = useState<Partial<SEOSettings>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSEOSettings().then(s => { setSettings(s); if (s) setForm(s) })
  }, [])

  const handleChange = (field: keyof SEOSettings, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const save = async () => {
    if (!settings) return
    setLoading(true)
    await updateSEOSettings(settings.id, form)
    setLoading(false)
    toast.success('SEO settings saved')
    const updated = await getSEOSettings()
    setSettings(updated); if (updated) setForm(updated)
  }

  const keywords = (form.keywords || []).join(', ')
  const setKeywords = (val: string) => {
    handleChange('keywords', val.split(',').map(k => k.trim()).filter(Boolean))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" /> SEO Settings
        </h1>
        <Button onClick={save} disabled={loading}>
          <Save className="h-4 w-4 mr-2" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Basic SEO</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Site Title</Label><Input value={form.site_title || ''} onChange={e => handleChange('site_title', e.target.value)} /></div>
            <div className="space-y-1"><Label>Site Description</Label><Textarea value={form.site_description || ''} onChange={e => handleChange('site_description', e.target.value)} /></div>
            <div className="space-y-1"><Label>Keywords (comma-separated)</Label>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="photography, events, multimedia..." />
              </div>
            </div>
            <div className="space-y-1"><Label>Canonical URL</Label><Input value={form.canonical_url || ''} onChange={e => handleChange('canonical_url', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social & Images</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <MediaUpload label="OG Image" value={form.og_image_url} onChange={url => handleChange('og_image_url', url)} accept="image" />
            </div>
            <div className="space-y-1"><Label>Twitter Handle</Label>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input value={form.twitter_handle || ''} onChange={e => handleChange('twitter_handle', e.target.value)} placeholder="@stayjazzy" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tracking</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Google Analytics ID</Label><Input value={form.google_analytics_id || ''} onChange={e => handleChange('google_analytics_id', e.target.value)} placeholder="G-XXXXXXXXXX" /></div>
            <div className="space-y-1"><Label>Facebook Pixel ID</Label><Input value={form.facebook_pixel_id || ''} onChange={e => handleChange('facebook_pixel_id', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Advanced</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Sitemap Enabled</Label>
                <p className="text-xs text-muted-foreground">Generate XML sitemap</p>
              </div>
              <Switch checked={form.sitemap_enabled ?? true} onCheckedChange={v => handleChange('sitemap_enabled', v)} />
            </div>
            <div className="space-y-1"><Label>robots.txt</Label>
              <div className="flex items-start gap-2">
                <FileCode2 className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                <Textarea value={form.robots_txt || ''} onChange={e => handleChange('robots_txt', e.target.value)} rows={6} className="font-mono text-xs" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
