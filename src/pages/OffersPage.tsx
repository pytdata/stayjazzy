import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ShoppingBag, Check, CalendarDays, Pencil, Send } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getServicePackages, getSubServices, getPricingTiers, getPricingFeatures } from '@/db/api'
import { useBooking } from '@/contexts/BookingContext'
import { useLanguage } from '@/contexts/LanguageContext'
import BookingModal from '@/components/common/BookingModal'
import type { ServicePackage, SubService, PricingTier, PricingFeature, TierType, SelectedService } from '@/types/types'
import { trackPageView } from '@/db/api'
import { supabase } from '@/db/supabase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TIER_CONFIG: Record<TierType, { label: string; cls: string; badgeCls: string }> = {
  gold:     { label: 'Gold',     cls: 'tier-gold',     badgeCls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  diamond:  { label: 'Diamond',  cls: 'tier-diamond',  badgeCls: 'bg-blue-100 text-blue-800 border-blue-200' },
  platinum: { label: 'Platinum', cls: 'tier-platinum', badgeCls: 'bg-gray-100 text-gray-800 border-gray-200' },
}

interface TierCardProps {
  tier: PricingTier
  subService: SubService
  packageName: string
  features: PricingFeature[]
  onBook: () => void
}

function TierCard({ tier, subService, packageName, features, onBook }: TierCardProps) {
  const { addService, removeService, selectedServices } = useBooking()
  const cfg = TIER_CONFIG[tier.tier_type]
  const isSelected = selectedServices.some(s => s.sub_service_id === subService.id && s.tier_type === tier.tier_type)

  const toggle = () => {
    if (isSelected) { removeService(subService.id, tier.tier_type); return }
    const svc: SelectedService = {
      sub_service_id: subService.id,
      sub_service_name: subService.name,
      package_name: packageName,
      tier_type: tier.tier_type,
      tier_name: `${cfg.label} ${subService.name}`,
      price: tier.price,
      currency: tier.currency,
    }
    addService(svc)
  }

  const included = features.filter(f => f.is_included)
  const excluded = features.filter(f => !f.is_included)

  return (
    <Card className={cn('h-full flex flex-col border-2 transition-all duration-200', cfg.cls, isSelected ? 'border-primary shadow-lg ring-2 ring-primary/30' : 'border-border')}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className={`text-xs font-semibold mb-2 ${cfg.badgeCls}`}>{cfg.label}</Badge>
            <CardTitle className="text-base font-bold text-balance">{cfg.label} {subService.name}</CardTitle>
          </div>
          {isSelected && <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-1" />}
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-primary">{tier.currency} {Number(tier.price).toLocaleString()}</span>
        </div>
        {tier.description && <p className="text-xs text-muted-foreground mt-1 text-pretty">{tier.description}</p>}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {included.length > 0 && (
          <div className="space-y-1.5">
            {included.map(f => (
              <div key={f.id} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>{f.feature_text}</span>
              </div>
            ))}
          </div>
        )}
        {excluded.length > 0 && (
          <div className="space-y-1.5">
            {excluded.map(f => (
              <div key={f.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{f.feature_text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 space-y-2">
          <Button
            onClick={toggle}
            variant={isSelected ? 'default' : 'outline'}
            className={cn('w-full text-sm', isSelected && 'bg-primary text-primary-foreground')}
          >
            {isSelected ? <><Check className="h-4 w-4 mr-1" /> Selected</> : 'Select Package'}
          </Button>
          <Button onClick={onBook} className="w-full bg-primary text-primary-foreground text-sm" size="sm">
            <ShoppingBag className="h-4 w-4 mr-1.5" /> Book Appointment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface SubServiceSection {
  subService: SubService
  tiers: Array<PricingTier & { features: PricingFeature[] }>
}

interface PackageData {
  pkg: ServicePackage
  sections: SubServiceSection[]
}

/** Inner tab panel: one tab per sub-service → 3 tier cards */
function SubServiceTabs({ sections, packageName, onBook }: {
  sections: SubServiceSection[]
  packageName: string
  onBook: () => void
}) {
  if (sections.length === 0) {
    return <p className="text-muted-foreground text-center py-12">No sub-services added yet.</p>
  }

  return (
    <Tabs defaultValue={sections[0].subService.id}>
      {/* Sub-service tab strip — scrollable on mobile */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <TabsList className="inline-flex h-auto gap-1 bg-background border border-border p-1 rounded-lg mb-6 min-w-max">
          {sections.map(({ subService }) => (
            <TabsTrigger
              key={subService.id}
              value={subService.id}
              className="whitespace-nowrap text-sm px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {subService.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {sections.map(({ subService, tiers }) => (
        <TabsContent key={subService.id} value={subService.id} className="mt-0">
          {subService.description && (
            <p className="text-muted-foreground text-sm mb-5 text-pretty">{subService.description}</p>
          )}
          {tiers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <CalendarDays className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">
                Pricing for <strong>{subService.name}</strong> coming soon.
              </p>
              <Button size="sm" onClick={onBook} className="mt-1">
                <ShoppingBag className="h-4 w-4 mr-1.5" /> Enquire Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tiers.map(tier => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  subService={subService}
                  packageName={packageName}
                  features={tier.features}
                  onBook={onBook}
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default function OffersPage() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingOpen, setBookingOpen] = useState(false)
  const { selectedServices } = useBooking()
  const { t } = useLanguage()

  // Custom service request state
  const [customRequest, setCustomRequest] = useState('')
  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [customSubmitted, setCustomSubmitted] = useState(false)
  const [customSubmitting, setCustomSubmitting] = useState(false)

  useEffect(() => {
    trackPageView('/offers')
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    const pkgs = await getServicePackages()
    const result: PackageData[] = await Promise.all(
      pkgs.map(async pkg => {
        const subs = await getSubServices(pkg.id)
        const sections: SubServiceSection[] = await Promise.all(
          subs.map(async sub => {
            const tiers = await getPricingTiers(sub.id)
            const tiersWithFeatures = await Promise.all(
              tiers.map(async tier => ({ ...tier, features: await getPricingFeatures(tier.id) }))
            )
            return { subService: sub, tiers: tiersWithFeatures }
          })
        )
        return { pkg, sections }
      })
    )
    setPackages(result)
    setLoading(false)
  }

  const handleBook = () => setBookingOpen(true)

  const submitCustomRequest = async () => {
    if (!customRequest.trim() || !customName.trim() || !customEmail.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    setCustomSubmitting(true)
    await supabase.from('chat_leads').insert({
      full_name: customName,
      email: customEmail,
      phone: customPhone || undefined,
      message: customRequest,
      status: 'new',
    })
    setCustomSubmitting(false)
    setCustomSubmitted(true)
    toast.success(t('requestSubmitted'))
  }

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="py-16 md:py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">Our Services</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Service Packages & Pricing</h1>
          <p className="text-white/80 text-lg text-pretty">
            Choose from our Gold, Diamond, or Platinum packages — crafted to fit every budget and vision.
          </p>
        </div>
      </section>

      {/* Cart indicator */}
      {selectedServices.length > 0 && (
        <div className="sticky top-16 md:top-20 z-30 bg-primary/95 backdrop-blur-sm text-white py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              <ShoppingBag className="inline h-4 w-4 mr-1.5" />
              {selectedServices.length} service(s) selected
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="border border-white/60 text-white hover:bg-white/10 font-semibold"
              onClick={handleBook}
            >
              Book Now
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading services…</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No services available yet.</div>
        ) : (
          /* Outer tabs: Events | Extra Services */
          <Tabs defaultValue={packages[0]?.pkg.id}>
            <TabsList className="flex h-auto mb-8 bg-muted p-1 rounded-xl">
              {packages.map(({ pkg }) => (
                <TabsTrigger
                  key={pkg.id}
                  value={pkg.id}
                  className="flex-1 text-sm md:text-base font-semibold py-2.5"
                >
                  {pkg.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {packages.map(({ pkg, sections }) => (
              <TabsContent key={pkg.id} value={pkg.id} className="mt-0">
                {pkg.description && (
                  <p className="text-muted-foreground mb-6 text-pretty">{pkg.description}</p>
                )}
                {/* Inner tabs: one per sub-service */}
                <SubServiceTabs
                  sections={sections}
                  packageName={pkg.name}
                  onBook={handleBook}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Custom Service Request */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Pencil className="h-5 w-5 text-primary" />
                {t('customizeService')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t('customizeServiceDesc')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {customSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-green-700">{t('requestSubmitted')}</p>
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder={t('typeServiceRequest')}
                    value={customRequest}
                    onChange={e => setCustomRequest(e.target.value)}
                    className="min-h-[120px] text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Full Name *</Label>
                      <Input value={customName} onChange={e => setCustomName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Email *</Label>
                      <Input type="email" value={customEmail} onChange={e => setCustomEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Phone (optional)</Label>
                    <Input value={customPhone} onChange={e => setCustomPhone(e.target.value)} />
                  </div>
                  <Button
                    onClick={submitCustomRequest}
                    disabled={customSubmitting || !customRequest.trim() || !customName.trim() || !customEmail.trim()}
                    className="w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {customSubmitting ? 'Sending...' : t('submitRequest')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  )
}
