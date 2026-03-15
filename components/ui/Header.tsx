'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dossiers', label: 'Dossiers' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/equipe', label: 'Équipe' },
  { href: '/import', label: 'Importer' },
  { href: '/entreprise', label: 'Entreprise' },
  { href: '/parrainage', label: '🎁 Parrainage' },
  { href: '/parametres', label: 'Paramètres' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-gray-50/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="Paynelope" style={{ height: "40px", width: "160px", objectFit: "contain" }} />
        </Link>

        {/* Nav desktop seulement */}
        <nav className="hidden sm:flex items-center gap-1 flex-1">
          {navLinks.map(link => {
            const isActive = link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-gray-900 border-gray-200 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white border-transparent'
                }`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1 sm:flex-none" />

        {/* Déconnexion */}
        <button onClick={handleLogout}
          className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          title="Déconnexion">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </header>
  )
}

export function DemoBanner({ plan }: { plan?: string }) {
  if (plan && plan !== 'demo') return null
  return (
    <div className="bg-indigo-600 text-white text-xs text-center py-2 px-4 flex items-center justify-center gap-3">
      <span>🎯 Plan Démo — limité à 3 dossiers</span>
      <a href="/pricing" className="bg-white text-indigo-600 font-semibold px-3 py-1 rounded-full hover:bg-indigo-50 transition-colors">
        Passer au Solo →
      </a>
    </div>
  )
}
