import { useEffect } from 'react'
import { trackPageView } from '@/db/api'
export default function TermsPage() {
  useEffect(() => { trackPageView('/terms') }, [])
  return (
    <div className="pt-16 md:pt-20">
      <section className="py-16 bg-primary text-white"><div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-balance">Terms & Conditions</h1>
        <p className="text-white/80 mt-3">Last updated: January 2024</p>
      </div></section>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-14 space-y-8">
        {[
          ['1. Acceptance of Terms', 'By accessing and using Stay Jazzy Multimedia\'s services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.'],
          ['2. Services', 'Stay Jazzy Multimedia provides multimedia services including photography, videography, event production, branding, digital marketing, and web development. All services are subject to availability and our capacity at the time of booking.'],
          ['3. Bookings & Payments', 'All bookings require an initial deposit to secure your date. The balance is due as agreed in your service contract. Cancellations must be made at least 7 days in advance to receive a partial refund of the deposit.'],
          ['4. Intellectual Property', 'All creative work produced by Stay Jazzy Multimedia remains the intellectual property of the company until full payment is received. Upon full payment, the client receives usage rights as specified in their contract.'],
          ['5. Limitation of Liability', 'Stay Jazzy Multimedia shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our liability is limited to the amount paid for the specific service.'],
          ['6. Privacy', 'We are committed to protecting your privacy. Your personal information is collected and used solely for the purpose of providing our services. We do not sell or share your data with third parties without your consent.'],
          ['7. Governing Law', 'These terms are governed by the laws of the Republic of Ghana. Any disputes shall be resolved through arbitration in Accra, Ghana.'],
          ['8. Contact', 'For questions about these Terms and Conditions, please contact us at info@stayjazzy.com.'],
        ].map(([title, content]) => (
          <section key={title as string}>
            <h2 className="text-xl font-bold mb-3">{title}</h2>
            <p className="text-muted-foreground leading-relaxed text-pretty">{content}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
