#!/bin/bash
# Script thème clair RelanceApp

echo "🎨 Application du thème clair..."

# 1. globals.css
cat > app/globals.css << 'ENDOFFILE'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-dm-sans: 'DM Sans', system-ui, sans-serif;
}

* { box-sizing: border-box; }

body {
  background-color: #F5F6FA;
  color: #0F1117;
  font-family: var(--font-dm-sans);
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

/* Focus */
:focus-visible { outline: 2px solid #3B82F6; outline-offset: 2px; }

button, a, select, input, textarea { transition: all 0.15s ease; }

@keyframes countUp {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.stat-value { animation: countUp 0.4s ease-out; }

@keyframes progressGrow { from { width: 0%; } }
.progress-bar { animation: progressGrow 0.8s ease-out; }

.card-hover { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
.card-hover:hover {
  border-color: #BFDBFE;
  box-shadow: 0 0 0 1px #DBEAFE, 0 4px 20px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.modal-backdrop { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }

.grid-bg {
  background-image:
    linear-gradient(rgba(209, 213, 219, 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(209, 213, 219, 0.4) 1px, transparent 1px);
  background-size: 40px 40px;
}

.timeline-line::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 24px;
  bottom: -8px;
  width: 1px;
  background: linear-gradient(to bottom, #E5E7EB, transparent);
}

.input-base {
  @apply bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 w-full;
  @apply focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100;
}

.select-base {
  @apply bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 w-full appearance-none cursor-pointer;
  @apply focus:outline-none focus:border-blue-400;
}

.badge {
  @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border;
}

.montant-display {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
ENDOFFILE
echo "✅ globals.css"

# 2. tailwind.config.js
cat > tailwind.config.js << 'ENDOFFILE'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#F5F6FA',
        surface: '#FFFFFF',
        panel: '#FFFFFF',
        border: '#E5E7EB',
        muted: '#F3F4F6',
      },
    },
  },
  plugins: [],
}
ENDOFFILE
echo "✅ tailwind.config.js"

# 3. Header
cat > components/ui/Header.tsx << 'ENDOFFILE'
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navLinks = [
  { href: '/agenda', label: 'Agenda' },
  { href: '/equipe', label: 'Équipe' },
  { href: '/qualifier', label: 'Qualifier' },
  { href: '/parametres', label: 'Paramètres' },
  { href: '/import', label: 'Importer' },
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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 mr-4 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h10M3 15h7" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-gray-900">Relance</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Déconnexion
        </button>
      </div>
    </header>
  )
}
ENDOFFILE
echo "✅ Header.tsx"

# 4. DashboardClient
cat > components/dashboard/DashboardClient.tsx << 'ENDOFFILE'
'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Dossier, Action, StatutDossier } from '@/types'
import { formatMontant, getStatutDossierLabel, getStatutDossierColor, getRappelColor, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  dossiers: (Dossier & { nb_factures: number })[]
  rappels: (Action & { dossier: Dossier })[]
  stats: { total_montant: number; dossiers_actifs: number; a_relancer: number; pct_qualifies: number }
}

const FILTRES = [
  { key: 'tous', label: 'Tous' },
  { key: 'a_relancer', label: 'À relancer' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'promesse', label: 'Promesse' },
  { key: 'resolu', label: 'Résolu' },
] as const

export default function DashboardClient({ dossiers, rappels, stats }: Props) {
  const [filtre, setFiltre] = useState<string>('tous')
  const [tri, setTri] = useState<'retard' | 'montant'>('retard')
  const [rappelsDismissed, setRappelsDismissed] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const dossiersFiltres = useMemo(() => {
    let list = filtre === 'tous' ? dossiers : dossiers.filter(d => d.statut === filtre)
    if (tri === 'retard') list = [...list].sort((a, b) => b.jours_retard - a.jours_retard)
    else list = [...list].sort((a, b) => b.montant_total - a.montant_total)
    return list
  }, [dossiers, filtre, tri])

  const rappelsVisible = rappels.filter(r => !rappelsDismissed.has(r.id))

  async function markRappelDone(actionId: string) {
    await supabase.from('actions').update({ rappel_fait: true }).eq('id', actionId)
    setRappelsDismissed(prev => new Set([...prev, actionId]))
    router.refresh()
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Total à recouvrer</div>
          <div className="text-2xl font-bold stat-value montant-display text-gray-900">{formatMontant(stats.total_montant)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Dossiers actifs</div>
          <div className="text-2xl font-bold stat-value text-gray-900">{stats.dossiers_actifs}</div>
        </div>
        <div className={`border rounded-xl p-5 shadow-sm ${stats.a_relancer > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">À relancer</div>
          <div className={`text-2xl font-bold stat-value ${stats.a_relancer > 0 ? 'text-red-600' : 'text-gray-900'}`}>{stats.a_relancer}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Contacts qualifiés</div>
          <div className="text-2xl font-bold montant-display mb-3 text-gray-900">{stats.pct_qualifies}%</div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full progress-bar" style={{ width: `${stats.pct_qualifies}%` }} />
          </div>
        </div>
      </div>

      {/* Rappels */}
      {rappelsVisible.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Rappels à traiter ({rappelsVisible.length})</h2>
          </div>
          <div className="grid gap-2">
            {rappelsVisible.map(rappel => (
              <div key={rappel.id} className="flex items-center gap-4 p-3 rounded-xl border border-orange-200 bg-orange-50 animate-slide-up">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-sm flex-shrink-0">
                  {rappel.type === 'appel' ? '📞' : '✉️'}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/dossiers/${rappel.dossier?.id}`} className="font-medium text-sm hover:underline text-gray-900 truncate block">
                    {rappel.dossier?.societe || '—'}
                  </Link>
                  <div className="text-xs text-gray-500 truncate">{rappel.notes || 'Pas de note'}</div>
                </div>
                <div className="text-xs font-mono text-gray-500 flex-shrink-0">{formatDate(rappel.rappel_le)}</div>
                <button onClick={() => markRappelDone(rappel.id)} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 flex-shrink-0">
                  ✓ Fait
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dossiers */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {FILTRES.map(f => (
              <button key={f.key} onClick={() => setFiltre(f.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filtre === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Trier par</span>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setTri('retard')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tri === 'retard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Retard</button>
              <button onClick={() => setTri('montant')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${tri === 'montant' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Montant</button>
            </div>
          </div>
        </div>

        {dossiersFiltres.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">📂</div>
            <p>Aucun dossier dans cette catégorie</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {dossiersFiltres.map(dossier => (
              <Link key={dossier.id} href={`/dossiers/${dossier.id}`}>
                <div className="card-hover bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${dossier.jours_retard > 60 ? 'bg-red-400' : dossier.jours_retard > 30 ? 'bg-orange-400' : 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{dossier.societe}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {dossier.nb_factures} facture{dossier.nb_factures > 1 ? 's' : ''}
                      {dossier.jours_retard > 0 && (
                        <span className={`ml-2 ${dossier.jours_retard > 60 ? 'text-red-500' : 'text-orange-500'}`}>
                          • {dossier.jours_retard}j de retard
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge flex-shrink-0 ${getStatutDossierColor(dossier.statut)}`}>
                    {getStatutDossierLabel(dossier.statut)}
                  </span>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm montant-display text-gray-900">{formatMontant(dossier.montant_total)}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 flex-shrink-0">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
ENDOFFILE
echo "✅ DashboardClient.tsx"

# 5. utils.ts - update colors for light theme
cat > lib/utils.ts << 'ENDOFFILE'
import { StatutDossier, StatutFacture, ResultatAppel, NiveauEmail } from '@/types'

export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(montant)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
}

export function getStatutDossierLabel(statut: StatutDossier): string {
  const labels: Record<StatutDossier, string> = {
    a_relancer: 'À relancer', en_attente: 'En attente', promesse: 'Promesse', resolu: 'Résolu',
  }
  return labels[statut]
}

export function getStatutDossierColor(statut: StatutDossier): string {
  const colors: Record<StatutDossier, string> = {
    a_relancer: 'text-red-600 bg-red-50 border-red-200',
    en_attente: 'text-amber-600 bg-amber-50 border-amber-200',
    promesse: 'text-blue-600 bg-blue-50 border-blue-200',
    resolu: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  }
  return colors[statut]
}

export function getStatutFactureLabel(statut: StatutFacture): string {
  const labels: Record<StatutFacture, string> = {
    impayee: 'Impayée', contestee: 'Contestée', partiellement_payee: 'Partielle', payee: 'Payée',
  }
  return labels[statut]
}

export function getStatutFactureColor(statut: StatutFacture): string {
  const colors: Record<StatutFacture, string> = {
    impayee: 'text-red-600 bg-red-50',
    contestee: 'text-orange-600 bg-orange-50',
    partiellement_payee: 'text-amber-600 bg-amber-50',
    payee: 'text-emerald-600 bg-emerald-50',
  }
  return colors[statut]
}

export function getResultatLabel(resultat: ResultatAppel | null): string {
  if (!resultat) return ''
  const labels: Record<ResultatAppel, string> = {
    pas_repondu: 'Pas répondu', promesse_paiement: 'Promesse de paiement',
    conteste: 'Contesté', en_cours_traitement: 'En cours de traitement',
  }
  return labels[resultat]
}

export function getNiveauEmailLabel(niveau: NiveauEmail): string {
  const labels: Record<NiveauEmail, string> = {
    cordial: 'Cordial', ferme: 'Ferme', mise_en_demeure: 'Mise en demeure',
  }
  return labels[niveau]
}

export function getRappelColor(date: string): string {
  const today = new Date()
  const rappelDate = new Date(date)
  const diff = Math.ceil((rappelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'text-red-700 border-red-200 bg-red-50'
  if (diff <= 2) return 'text-orange-700 border-orange-200 bg-orange-50'
  return 'text-amber-700 border-amber-200 bg-amber-50'
}

export function detectSeparator(csv: string): string {
  const firstLine = csv.split('\n')[0]
  const semicolons = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  const tabs = (firstLine.match(/\t/g) || []).length
  if (semicolons >= commas && semicolons >= tabs) return ';'
  if (tabs >= commas) return '\t'
  return ','
}

export function detectColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}
  const rules: Record<string, RegExp> = {
    numero: /num[eé]ro|n°|facture.*num|ref/i,
    montant_ttc: /montant|ttc|total|amount/i,
    date_facture: /date.*fact|fact.*date|émis/i,
    date_echeance: /[eé]ch[eé]ance|due|expir/i,
    societe: /soci[eé]t[eé]|client|company|nom/i,
    bon_commande: /bon.*cmd|commande|bc|po\b/i,
  }
  headers.forEach((h, i) => {
    for (const [key, re] of Object.entries(rules)) {
      if (re.test(h) && mapping[key] === undefined) mapping[key] = i
    }
  })
  return mapping
}

export function parseAmount(val: string): number {
  return parseFloat(val.replace(/[€\s]/g, '').replace(',', '.')) || 0
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
ENDOFFILE
echo "✅ lib/utils.ts"

# 6. Login page - light theme
cat > app/login/page.tsx << 'ENDOFFILE'
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Compte créé ! Vous pouvez vous connecter.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h10M3 15h7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">Relance</span>
          </div>
          <p className="text-gray-500 text-sm">CRM de recouvrement pour TPE</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm animate-fade-in">
          <h1 className="text-lg font-semibold mb-6 text-gray-900">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h1>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-base" placeholder="votre@email.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-base" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50">
              {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900 text-center">
            {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE
echo "✅ app/login/page.tsx"

echo ""
echo "✅ Thème clair appliqué partout !"
echo "🚀 Le navigateur va se recharger automatiquement."
