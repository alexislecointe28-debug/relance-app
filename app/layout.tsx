import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TimerWrapper from '@/components/ui/TimerWrapper'
import BottomNav from '@/components/ui/BottomNav'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  themeColor: '#6366F1',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Relance',
  },
  formatDetection: { telephone: false },
  title: 'Relance — CRM Recouvrement',
  description: 'Gestion du recouvrement de créances pour TPE',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased pb-16 sm:pb-0">
        {children}
        <TimerWrapper />
        <BottomNav />
      </body>
    </html>
  )
}
