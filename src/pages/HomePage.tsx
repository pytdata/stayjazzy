import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, Star, Award, Users, Zap, Target, Shield, CheckCircle, ArrowRight, Camera, Video, Globe, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import SocialSidebar from '@/components/common/SocialSidebar'
import { getHeroSlides } from '@/db/api'
import type { HeroSlide } from '@/types/types'
import { trackPageView } from '@/db/api'

const DEFAULT_SLIDES: Partial<HeroSlide>[] = [
  { id: '1', title: 'Capturing Moments,\nCreating Memories', subtitle: 'Professional Multimedia Services for Events, Branding & Beyond', image_url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0f631029-68b9-449f-9b3a-477672772737.jpg' },
  { id: '2', title: 'World-Class Event\nProduction', subtitle: 'Stage Lighting, LED Screens, Drone Piloting & 8K Livestreaming', image_url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e0c96d04-7630-464b-8689-5a6607210537.jpg' },
  { id: '3', title: 'Tell Your Story\nWith Impact', subtitle: 'Photography, Videography, Branding & Digital Marketing', image_url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b1491cfa-3e23-4625-840d-c050a93c1d6c.jpg' },
  { id: '4', title: 'Your Brand,\nAmplified', subtitle: 'Website Development, Mobile Apps & Digital Solutions', image_url: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9b7b1ed5-bee2-4f60-90da-e9074131af83.jpg' },
]

const WHY_CHOOSE = [
  { icon: Award, title: 'Est. 2012', desc: 'Over a decade of excellence in multimedia production and brand development.' },
  { icon: Users, title: 'Client-Centered', desc: 'We put your vision first, delivering results that exceed expectations.' },
  { icon: Zap, title: 'Fast Delivery', desc: 'Efficient workflows ensure your project is delivered on time, every time.' },
  { icon: Target, title: 'Results-Driven', desc: 'Strategic approach to maximize your brand reach and business growth.' },
  { icon: Shield, title: 'Professional', desc: 'Top-tier equipment, skilled team, and industry-leading standards.' },
  { icon: Star, title: 'Award-Worthy', desc: 'Quality work recognized by clients across Ghana and beyond.' },
]

const SERVICES_PREVIEW = [
  { icon: Camera, label: 'Photography', desc: 'Professional event and commercial photography', color: 'text-yellow-600' },
  { icon: Video, label: 'Videography', desc: '4K/8K production and drone filming', color: 'text-blue-600' },
  { icon: Globe, label: 'Digital Marketing', desc: 'Branding, web development & social media', color: 'text-green-600' },
  { icon: Music, label: 'Event Production', desc: 'Stage, lighting, LED screens & livestreaming', color: 'text-purple-600' },
]

export default function HomePage() {
  const [slides, setSlides] = useState<Partial<HeroSlide>[]>(DEFAULT_SLIDES)
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const aboutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    trackPageView('/')
    getHeroSlides().then(data => { if (data.length > 0) setSlides(data) })
  }, [])

  const goTo = useCallback((idx: number) => {
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 300)
  }, [])

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo])
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo])

  useEffect(() => {
    timerRef.current = setInterval(next, 5500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next])

  const slide = slides[current]

  return (
    <div className="w-full">
      {/* ── Hero Slider ── */}
      <section className="relative w-full h-screen min-h-[560px] overflow-hidden">
        <SocialSidebar />
        {/* Background */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundImage: `url(${slide?.image_url})` }}
        />
        <div className="hero-overlay absolute inset-0" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
          <div className={`transition-all duration-500 ${fading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-white/70 mb-4">Stay Jazzy Multimedia</p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-balance" style={{ whiteSpace: 'pre-line' }}>
              {slide?.title || 'Capturing Moments,\nCreating Memories'}
            </h1>
            <p className="text-base md:text-xl text-white/80 max-w-2xl mx-auto mb-8 text-pretty">
              {slide?.subtitle || 'Professional Multimedia Services'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/offers">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base font-semibold">
                  Book a Service
                </Button>
              </Link>
              <Link to="/works">
                <Button variant="ghost" className="border border-white/60 text-white hover:bg-white/10 px-8 py-3 text-base">
                  View Our Work
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all">
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`rounded-full transition-all ${i === current ? 'bg-white w-6 h-2' : 'bg-white/50 w-2 h-2'}`} />
          ))}
        </div>

        {/* Scroll arrow */}
        <button
          onClick={() => aboutRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="bounce-arrow z-20 text-white/80 hover:text-white transition-colors"
        >
          <ChevronDown className="h-8 w-8 drop-shadow-lg" />
        </button>
      </section>

      {/* ── About Company ── */}
      <section ref={aboutRef} id="about" className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">About Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-6">More Than a Multimedia Company</h2>
            <p className="text-muted-foreground leading-relaxed mb-4 text-pretty">
              Established in 2012, Stay Jazzy Multimedia is a full-service multimedia firm passionate about helping businesses grow and thrive. We specialize in business promotion, advertisement, graphic design, website development, TV and radio production, photography, videography, branding, and digital marketing.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6 text-pretty">
              Our vision is to become a world-class business brand and development consortium. We believe every business deserves exceptional representation, and we deliver exactly that.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Customer-Focused', 'Professional', 'Teamwork', 'Results-Driven'].map(v => (
                <span key={v} className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full px-3 py-1">
                  <CheckCircle className="h-3.5 w-3.5" /> {v}
                </span>
              ))}
            </div>
            <Link to="/who-we-are" className="inline-flex items-center gap-2 mt-6 text-primary font-semibold hover:underline">
              Learn More About Us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative">
            <img
              src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dde14cb7-c4ed-4ce3-bf0b-13220b0b042a.jpg"
              alt="Stay Jazzy Multimedia team"
              className="rounded-2xl w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-4 -left-4 bg-primary text-white p-4 rounded-xl shadow-xl">
              <p className="text-3xl font-bold">12+</p>
              <p className="text-sm text-white/80">Years of Excellence</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="parallax-section py-16 md:py-24 relative" style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0f631029-68b9-449f-9b3a-477672772737.jpg)` }}>
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white text-balance">The Stay Jazzy Difference</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-4 shrink-0">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-balance">{title}</h3>
                  <p className="text-white/70 text-sm text-pretty flex-1">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Preview ── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Our Services</p>
            <h2 className="text-3xl md:text-4xl font-bold text-balance">What We Offer</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-pretty">
              From weddings to corporate events, from website development to drone filming — we do it all with world-class quality.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES_PREVIEW.map(({ icon: Icon, label, desc, color }) => (
              <Card key={label} className="group hover:-translate-y-1 transition-transform duration-300 h-full cursor-pointer border-border hover:border-primary/40 hover:shadow-md">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base mb-2 text-balance">{label}</h3>
                  <p className="text-muted-foreground text-sm text-pretty flex-1">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/offers">
              <Button className="bg-primary text-primary-foreground px-8">View All Services <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Works Preview ── */}
      <section className="parallax-section py-16 md:py-24 relative" style={{ backgroundImage: `url(https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b1491cfa-3e23-4625-840d-c050a93c1d6c.jpg)` }}>
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Portfolio</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white text-balance mb-4">See Our Work</h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-10 text-pretty">
            Browse our portfolio of events, photography, videography, and brand work across Ghana and beyond.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[
              'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_e0c96d04-7630-464b-8689-5a6607210537.jpg',
              'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_9b7b1ed5-bee2-4f60-90da-e9074131af83.jpg',
              'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f71aaf22-25da-4676-ab92-e4921e09cfda.jpg',
            ].map((src, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden rounded-xl">
                <img src={src} alt={`Portfolio work ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
          <Link to="/works">
            <Button variant="ghost" className="border border-white/60 text-white hover:bg-white/10 px-8">
              View Full Portfolio <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
