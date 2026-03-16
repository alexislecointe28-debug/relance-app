import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TimerWrapper from '@/components/ui/TimerWrapper'
import BottomNav from '@/components/ui/BottomNav'
import UpdateBanner from '@/components/ui/UpdateBanner'
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const viewport = { themeColor: '#6366F1' }

const GA_ID = 'G-TP33SH88KW' // À remplacer par ton vrai ID Google Analytics

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Paynelope',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png' }],
  },
  metadataBase: new URL('https://paynelope.com'),
  title: {
    default: 'Paynelope — Recouvrez vos impayés facilement',
    template: '%s | Paynelope',
  },
  description: 'Paynelope est le CRM de recouvrement pensé pour les TPE. Relancez vos clients, récupérez votre argent. Simple, efficace, sans engagement.',
  keywords: ['recouvrement', 'impayés', 'relance client', 'CRM', 'TPE', 'facture impayée', 'gestion créances'],
  authors: [{ name: 'Paynelope' }],
  creator: 'Paynelope',
  publisher: 'Paynelope',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://paynelope.com',
    siteName: 'Paynelope',
    title: 'Paynelope — Recouvrez vos impayés facilement',
    description: 'Le CRM de recouvrement pour les TPE. Relancez vos clients, récupérez votre argent.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Paynelope' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paynelope — Recouvrez vos impayés facilement',
    description: 'Le CRM de recouvrement pour les TPE. Relancez vos clients, récupérez votre argent.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'hNhZo1qCLBoxai3vJISpFML4YEwuKG2JB--zguxDOBI',
  },
  alternates: {
    canonical: 'https://paynelope.com',
  },
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
        <UpdateBanner />
        {children}
        <TimerWrapper />
        <BottomNav />

        {/* Google Analytics */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        ` }} />

        {/* Tawk.to */}
        <script dangerouslySetInnerHTML={{ __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/69b7c9891a55ed1c3511a7bc/1jjqumh1v';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
          })();
        ` }} />
      </body>
    </html>
  )
}
