import { useState, useEffect } from 'react'
import { Building2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { getCompanySettings, updateCompanySettings } from '@/db/api'
import type { CompanySettings } from '@/types/types'
import { toast } from 'sonner'
import MediaUpload from '@/components/ui/MediaUpload'
import { getImageUrl } from '@/lib/mediaUrls'

export default function AdminCompanyPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [form, setForm] = useState<Partial<CompanySettings>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCompanySettings().then(s => { setSettings(s); if (s) setForm(s) })
  }, [])

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const save = async () => {
    if (!settings) return
    setLoading(true)
    await updateCompanySettings(settings.id, form)
    setLoading(false)
    toast.success('Company settings saved')
    const updated = await getCompanySettings()
    setSettings(updated); if (updated) setForm(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Company Settings
        </h1>
        <Button onClick={save} disabled={loading}>
          <Save className="h-4 w-4 mr-2" /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Business Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Company Name</Label><Input value={form.name || ''} onChange={e => handleChange('name', e.target.value)} /></div>
            <div className="space-y-1"><Label>Tagline</Label><Input value={form.tagline || ''} onChange={e => handleChange('tagline', e.target.value)} /></div>
            <div className="space-y-1"><Label>Address</Label><Textarea value={form.address || ''} onChange={e => handleChange('address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>City</Label><Input value={form.city || ''} onChange={e => handleChange('city', e.target.value)} /></div>
              <div className="space-y-1"><Label>Country</Label><Input value={form.country || ''} onChange={e => handleChange('country', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Phone</Label><Input value={form.phone || ''} onChange={e => handleChange('phone', e.target.value)} /></div>
              <div className="space-y-1"><Label>Email</Label><Input value={form.email || ''} onChange={e => handleChange('email', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Website</Label><Input value={form.website || ''} onChange={e => handleChange('website', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tax & Bank Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Registration #</Label><Input value={form.registration_number || ''} onChange={e => handleChange('registration_number', e.target.value)} /></div>
              <div className="space-y-1"><Label>Tax #</Label><Input value={form.tax_number || ''} onChange={e => handleChange('tax_number', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Bank Name</Label><Input value={form.bank_name || ''} onChange={e => handleChange('bank_name', e.target.value)} /></div>
            <div className="space-y-1"><Label>Account Name</Label><Input value={form.bank_account_name || ''} onChange={e => handleChange('bank_account_name', e.target.value)} /></div>
            <div className="space-y-1"><Label>Account Number</Label><Input value={form.bank_account_number || ''} onChange={e => handleChange('bank_account_number', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1"><Label>Primary Color</Label><div className="flex items-center gap-2">
              <Input type="color" value={form.primary_color || '#166534'} onChange={e => handleChange('primary_color', e.target.value)} className="w-16 h-10 p-1" />
              <span className="text-sm text-muted-foreground">{form.primary_color}</span>
            </div></div>
            <div className="space-y-1"><Label>Secondary Color</Label><div className="flex items-center gap-2">
              <Input type="color" value={form.secondary_color || '#f59e0b'} onChange={e => handleChange('secondary_color', e.target.value)} className="w-16 h-10 p-1" />
              <span className="text-sm text-muted-foreground">{form.secondary_color}</span>
            </div></div>
            <div className="space-y-1">
              <Label>Logo</Label>
              <MediaUpload value={form.logo_url} onChange={url => handleChange('logo_url', url)} accept="image" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Authorized Signatures</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(form.signature_urls || []).map((url, i) => (
                <div key={i} className="relative border rounded-lg p-2">
                  <img src={getImageUrl(url)} alt={`Signature ${i + 1}`} className="h-16 w-auto object-contain" />
                  <button
                    type="button"
                    onClick={() => handleChange('signature_urls', (form.signature_urls || []).filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                    aria-label="Remove signature"
                  >×</button>
                </div>
              ))}
            </div>
            <MediaUpload
              label="Upload Signature"
              value={null}
              onChange={url => { if (url) handleChange('signature_urls', [...(form.signature_urls || []), url]) }}
              accept="image"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
