import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getAllSiteContent, getTeamMembers } from '@/db/api'
import type { TeamMember } from '@/types/types'
import { trackPageView } from '@/db/api'

const CORE_VALUES = ['Customer-focused', 'People-centered', 'Teamwork', 'Performance-driven', 'Leadership', 'Results-oriented', 'Tenacious', 'Maverick', 'Professionals', 'Ethical']

const DEFAULT_TEAM: TeamMember[] = [
  { id: '1', name: 'Emmanuel Asante', role: 'Founder & CEO', bio: 'Over 12 years of experience in multimedia production and brand development.', image_url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dde14cb7-c4ed-4ce3-bf0b-13220b0b042a.jpg', display_order: 1, created_at: '' },
]

export default function WhoWeArePage() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM)

  useEffect(() => {
    trackPageView('/who-we-are')
    getAllSiteContent().then(setContent)
    getTeamMembers().then(data => { if (data.length > 0) setTeam(data as TeamMember[]) })
  }, [])

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero */}
      <section className="parallax-section py-20 md:py-28 relative text-white" style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9b7b1ed5-bee2-4f60-90da-e9074131af83.jpg)` }}>
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Who We Are</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Our Story & Vision</h1>
          <p className="text-white/80 text-lg text-pretty">Established in 2012 — building brands, capturing moments, and driving business growth.</p>
        </div>
      </section>

      {/* About */}
      <section className="py-16 md:py-20 max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">About the Company</p>
          <h2 className="text-3xl font-bold mb-6 text-balance">Stay Jazzy Multimedia</h2>
          <p className="text-muted-foreground leading-relaxed mb-4 text-pretty">
            {content.about_description || 'Stay Jazzy Multimedia is a full-service multimedia company established in 2012. We specialize in business promotion, advertisement, blogging, graphic design, website development, TV and radio production, database management, photography, videography, branding, and digital marketing.'}
          </p>
          <p className="text-muted-foreground leading-relaxed text-pretty">
            Our passion is helping businesses grow. We work with schools, corporations, churches, and individuals to amplify their brand and reach their target audience effectively.
          </p>
        </div>
        <img
          src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_af4579f0-e67d-49d5-89f3-3b2026e4942a.jpg"
          alt="Our team"
          className="rounded-2xl w-full object-cover aspect-[4/3]"
        />
      </section>

      {/* Mission / Vision */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border h-full">
            <CardContent className="p-8 h-full flex flex-col">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Our Mission</h3>
              <p className="text-muted-foreground text-pretty flex-1">
                {content.mission || 'To provide world-class multimedia services that empower businesses to grow, attract customers, and achieve their goals through strategic communication and creative excellence.'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border h-full">
            <CardContent className="p-8 h-full flex flex-col">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Our Vision</h3>
              <p className="text-muted-foreground text-pretty flex-1">
                {content.vision || 'To become a world-class business brand and development consortium, recognized globally for innovation, quality, and transformative impact in multimedia and business development.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Core Values</p>
          <h2 className="text-3xl font-bold text-balance">What Drives Us</h2>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {CORE_VALUES.map(v => (
            <span key={v} className="flex items-center gap-2 bg-primary/10 text-primary font-semibold px-4 py-2 rounded-full text-sm">
              <CheckCircle className="h-4 w-4 shrink-0" /> {v}
            </span>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Our Team</p>
            <h2 className="text-3xl font-bold text-balance">Meet the People Behind the Brand</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map(member => (
              <Card key={member.id} className="h-full border-border overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={member.image_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dde14cb7-c4ed-4ce3-bf0b-13220b0b042a.jpg'}
                    alt={member.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg mb-0.5">{member.name}</h3>
                  <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-sm text-pretty">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
