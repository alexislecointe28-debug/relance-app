import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TimerWrapper from '@/components/ui/TimerWrapper'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Relance — CRM Recouvrement',
  description: 'Gestion du recouvrement de créances pour TPE',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <TimerWrapper />
      </body>
    </html>
  )
}
