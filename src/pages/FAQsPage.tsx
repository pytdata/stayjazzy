import { useEffect, useState } from 'react'
import { getFAQs, trackPageView } from '@/db/api'
import type { FAQ } from '@/types/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const DEFAULT_FAQS: FAQ[] = [
  { id: '1', question: 'How do I book a service?', answer: 'Visit our Offers page, select a service package, click "Book Appointment", and follow the OTP verification process.', display_order: 1, is_active: true, created_at: '' },
  { id: '2', question: 'What areas do you serve?', answer: 'We primarily serve Accra and surrounding regions in Ghana, but we are available for travel across Ghana and internationally for special projects.', display_order: 2, is_active: true, created_at: '' },
  { id: '3', question: 'What is the difference between Gold, Diamond, and Platinum packages?', answer: 'Each tier offers progressively more features and coverage. Gold is our standard package, Diamond adds more services and time, while Platinum is our all-inclusive premium package.', display_order: 3, is_active: true, created_at: '' },
  { id: '4', question: 'How long does it take to receive my photos/videos?', answer: 'Turnaround time depends on the project scope. Standard delivery is 7–14 business days. Rush delivery may be available for an additional fee.', display_order: 4, is_active: true, created_at: '' },
  { id: '5', question: 'Do you offer custom packages?', answer: 'Yes! Contact us to discuss custom packages tailored to your specific needs and budget.', display_order: 5, is_active: true, created_at: '' },
]

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>(DEFAULT_FAQS)

  useEffect(() => {
    trackPageView('/faqs')
    getFAQs().then(data => { if (data.length > 0) setFaqs(data as FAQ[]) })
  }, [])

  return (
    <div className="pt-16 md:pt-20">
      <section className="py-16 md:py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">Help Center</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Frequently Asked Questions</h1>
          <p className="text-white/80 text-lg">Got questions? We've got answers.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-14">
        {faqs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No FAQs available yet.</p>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map(faq => (
              <AccordionItem key={faq.id} value={faq.id} className="border border-border rounded-xl px-5 bg-card">
                <AccordionTrigger className="text-base font-semibold text-left py-4 hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 text-pretty">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}
