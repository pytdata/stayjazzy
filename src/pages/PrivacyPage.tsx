import { useEffect } from 'react'
import { trackPageView } from '@/db/api'
export default function PrivacyPage() {
  useEffect(() => { trackPageView('/privacy') }, [])
  return (
    <div className="pt-16 md:pt-20">
      <section className="py-16 bg-primary text-white"><div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-balance">Privacy Policy</h1>
        <p className="text-white/80 mt-3">Last updated: January 2024</p>
      </div></section>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-14 space-y-8">
        {[
          ['1. Information We Collect', 'We collect information you provide when booking our services, including your name, email address, and phone number. We also collect information about how you use our website to improve our services.'],
          ['2. How We Use Your Information', 'Your information is used to process bookings, communicate with you about your services, send updates and confirmations, and improve our website and services. We will never sell your personal data.'],
          ['3. Data Storage & Security', 'All personal information is stored securely on encrypted servers. We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or destruction.'],
          ['4. Cookies', 'Our website uses cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings, though this may affect some website functionality.'],
          ['5. Third-Party Services', 'We may use trusted third-party services for payment processing and analytics. These services have their own privacy policies and we ensure they comply with data protection standards.'],
          ['6. Your Rights', 'You have the right to access, update, or delete your personal information at any time. To exercise these rights, please contact us at info@stayjazzy.com.'],
          ['7. Changes to This Policy', 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on our website.'],
          ['8. Contact Us', 'If you have any questions about this Privacy Policy, please contact us at info@stayjazzy.com or call +233 000 000 000.'],
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
