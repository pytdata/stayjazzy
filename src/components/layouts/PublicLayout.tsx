import type { ReactNode } from 'react'
import Navbar from '@/components/common/Navbar'
import Footer from '@/components/common/Footer'
import ClientLogosMarquee from '@/components/common/ClientLogosMarquee'
import ChatWidget from '@/components/chat/ChatWidget'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <ClientLogosMarquee />
      <Footer />
      <ChatWidget />
    </div>
  )
}
