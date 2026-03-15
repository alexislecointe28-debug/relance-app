import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TimerWrapper from '@/components/ui/TimerWrapper'
import BottomNav from '@/components/ui/BottomNav'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const viewport = { themeColor: '#6366F1' }

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Paynelope',
  },
  formatDetection: { telephone: false },
  title: 'Paynelope',
  description: "Rends l’argent.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        ` }} />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased pb-24 sm:pb-0">
        {children}
        <TimerWrapper />
        <BottomNav />
      </body>
    </html>
  )
}
