import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TimerFloat from '@/components/ui/TimerFloat'

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
        <TimerFloat />
      </body>
    </html>
  )
}
