#!/bin/bash
# Script de correction RelanceApp
# Usage: bash fix.sh (depuis le dossier Relance)

echo "🔧 Correction des fichiers RelanceApp..."

# 1. lib/supabase.ts
cat > lib/supabase.ts << 'ENDOFFILE'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
ENDOFFILE
echo "✅ lib/supabase.ts"

# 2. lib/supabase-server.ts
cat > lib/supabase-server.ts << 'ENDOFFILE'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
ENDOFFILE
echo "✅ lib/supabase-server.ts"

# 3. app/login/page.tsx
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
    <div className="min-h-screen bg-canvas grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h10M3 15h7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">Relance</span>
          </div>
          <p className="text-slate-400 text-sm">CRM de recouvrement pour TPE</p>
        </div>
        <div className="bg-panel border border-border rounded-2xl p-8 animate-fade-in">
          <h1 className="text-lg font-semibold mb-6">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </h1>
          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          {success && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-base" placeholder="votre@email.com" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-base" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm disabled:opacity-50">
              {loading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm text-slate-400 hover:text-white text-center">
            {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}
ENDOFFILE
echo "✅ app/login/page.tsx"

# 4. app/parametres/page.tsx
cat > app/parametres/page.tsx << 'ENDOFFILE'
'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/ui/Header'
import { createClient } from '@/lib/supabase'

export default function ParametresPage() {
  const [orgNom, setOrgNom] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('organisations').select('nom').single().then(({ data }) => {
      if (data) setOrgNom(data.nom)
    })
  }, [])

  async function saveOrg() {
    setSaving(true)
    await supabase.from('organisations').update({ nom: orgNom })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function exportCsv() {
    setExporting(true)
    const { data: dossiers } = await supabase
      .from('dossiers')
      .select('*, factures(*), contact:contacts(*)')
      .order('montant_total', { ascending: false })

    const rows: string[] = [
      ['Société','Statut','Montant Total','Jours Retard','Nb Factures','Contact Prénom','Contact Nom','Contact Email','Contact Tél'].join(';')
    ]
    for (const d of dossiers || []) {
      const c = Array.isArray(d.contact) ? d.contact[0] : d.contact
      rows.push([d.societe, d.statut, d.montant_total, d.jours_retard, (d.factures || []).length, c?.prenom || '', c?.nom || '', c?.email || '', c?.telephone || ''].join(';'))
    }
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relance-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Paramètres</h1>
          <p className="text-slate-400 text-sm">Configuration de votre organisation</p>
        </div>
        <div className="bg-panel border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Organisation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Nom de l'organisation</label>
              <input value={orgNom} onChange={e => setOrgNom(e.target.value)} className="input-base" placeholder="Mon entreprise" />
            </div>
            <button onClick={saveOrg} disabled={saving} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'}`}>
              {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
        <div className="bg-panel border border-border rounded-2xl p-6">
          <h2 className="font-semibold mb-2">Export des données</h2>
          <p className="text-sm text-slate-400 mb-4">Exportez l'ensemble du portefeuille en CSV.</p>
          <button onClick={exportCsv} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-panel border border-border hover:bg-muted rounded-xl text-sm font-medium disabled:opacity-50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            {exporting ? 'Export en cours…' : 'Exporter CSV'}
          </button>
        </div>
      </main>
    </div>
  )
}
ENDOFFILE
echo "✅ app/parametres/page.tsx"

# 5. app/dashboard/page.tsx
cat > app/dashboard/page.tsx << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()

  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('*, contact:contacts(id), factures(id)')
    .order('jours_retard', { ascending: false })

  const today = new Date()
  const j7 = new Date(today)
  j7.setDate(j7.getDate() + 7)

  const { data: rappels } = await supabase
    .from('actions')
    .select('*, dossier:dossiers(id, societe, montant_total, statut)')
    .eq('rappel_fait', false)
    .not('rappel_le', 'is', null)
    .lte('rappel_le', j7.toISOString().split('T')[0])
    .order('rappel_le', { ascending: true })
    .limit(20)

  const dossiersWithCount = (dossiers || []).map(d => ({
    ...d,
    nb_factures: (d.factures as any[])?.length || 0,
    factures: undefined,
    contact: undefined,
  }))

  const total_montant = dossiersWithCount.reduce((s, d) => s + (d.montant_total || 0), 0)
  const dossiers_actifs = dossiersWithCount.filter(d => d.statut !== 'resolu').length
  const a_relancer = dossiersWithCount.filter(d => d.statut === 'a_relancer').length
  const avec_contact = (dossiers || []).filter(d => d.contact && (d.contact as any[]).length > 0).length
  const pct_qualifies = dossiersWithCount.length > 0 ? Math.round((avec_contact / dossiersWithCount.length) * 100) : 0

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <DashboardClient
        dossiers={dossiersWithCount as any}
        rappels={(rappels || []) as any}
        stats={{ total_montant, dossiers_actifs, a_relancer, pct_qualifies }}
      />
    </div>
  )
}
ENDOFFILE
echo "✅ app/dashboard/page.tsx"

# 6. app/dossiers/[id]/page.tsx
cat > "app/dossiers/[id]/page.tsx" << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import DossierClient from '@/components/dossiers/DossierClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DossierPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: dossier } = await supabase
    .from('dossiers')
    .select('*, factures(*), contact:contacts(*), actions(*)')
    .eq('id', params.id)
    .single()
  if (!dossier) notFound()
  const contact = Array.isArray(dossier.contact) ? dossier.contact[0] : dossier.contact
  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <DossierClient dossier={{ ...dossier, contact: contact || null }} />
    </div>
  )
}
ENDOFFILE
echo "✅ app/dossiers/[id]/page.tsx"

# 7. app/qualifier/page.tsx
cat > app/qualifier/page.tsx << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import QualifierClient from '@/components/qualifier/QualifierClient'
import Header from '@/components/ui/Header'

export const dynamic = 'force-dynamic'

export default async function QualifierPage() {
  const supabase = createServerSupabaseClient()
  const { data: dossiers } = await supabase
    .from('dossiers')
    .select('id, societe, montant_total, jours_retard, statut, contact:contacts(id, prenom, nom, email, telephone, fonction)')
    .neq('statut', 'resolu')
    .order('montant_total', { ascending: false })

  const withoutContact = (dossiers || []).filter(d => !d.contact || (d.contact as any[]).length === 0)
  const withContact = (dossiers || []).filter(d => d.contact && (d.contact as any[]).length > 0)
  const sorted = [...withoutContact, ...withContact]

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header />
      <QualifierClient dossiers={sorted as any} />
    </div>
  )
}
ENDOFFILE
echo "✅ app/qualifier/page.tsx"

# 8. app/agenda/page.tsx
cat > app/agenda/page.tsx << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import Link from 'next/link'
import { formatDate, getRappelColor, getResultatLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const supabase = createServerSupabaseClient()
  const { data: actions } = await supabase
    .from('actions')
    .select('id, type, resultat, notes, rappel_le, rappel_fait, created_at, dossier:dossiers(id, societe, montant_total, statut)')
    .eq('rappel_fait', false)
    .not('rappel_le', 'is', null)
    .order('rappel_le', { ascending: true })

  const grouped = (actions || []).reduce((acc, action) => {
    const date = action.rappel_le!
    if (!acc[date]) acc[date] = []
    acc[date].push(action)
    return acc
  }, {} as Record<string, any[]>)

  function getDateLabel(dateStr: string) {
    const date = new Date(dateStr + 'T12:00:00')
    const today = new Date()
    today.setHours(0,0,0,0)
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000*60*60*24))
    if (diff < 0) return `En retard — ${formatDate(dateStr)}`
    if (diff === 0) return `Aujourd'hui — ${formatDate(dateStr)}`
    if (diff === 1) return `Demain — ${formatDate(dateStr)}`
    return formatDate(dateStr)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Agenda des rappels</h1>
          <p className="text-slate-400 text-sm">{actions?.length || 0} rappel(s) en attente</p>
        </div>
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">🗓️</div>
            <p className="font-medium">Aucun rappel programmé</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-sm font-semibold text-slate-300 capitalize">{getDateLabel(date)}</div>
                  <div className="flex-1 h-px bg-border"/>
                  <div className="text-xs text-slate-500">{items.length} rappel(s)</div>
                </div>
                <div className="space-y-2">
                  {items.map((action: any) => (
                    <div key={action.id} className={`flex items-center gap-4 p-4 rounded-xl border ${getRappelColor(action.rappel_le)}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5">
                        {action.type === 'appel' ? '📞' : '✉️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/dossiers/${action.dossier?.id}`} className="font-medium text-sm hover:underline">
                          {action.dossier?.societe || '—'}
                        </Link>
                        {action.notes && <div className="text-xs opacity-60 truncate mt-0.5">{action.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
ENDOFFILE
echo "✅ app/agenda/page.tsx"

# 9. app/equipe/page.tsx
cat > app/equipe/page.tsx << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EquipePage() {
  const supabase = createServerSupabaseClient()
  const { data: membres } = await supabase.from('membres').select('*').order('created_at', { ascending: true })
  const { data: org } = await supabase.from('organisations').select('nom').single()

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Équipe</h1>
          <p className="text-slate-400 text-sm">{org?.nom} · {membres?.length || 0} membre(s)</p>
        </div>
        <div className="bg-panel border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-4 text-left text-xs text-slate-400 uppercase tracking-wider font-medium">Membre</th>
                <th className="px-5 py-4 text-left text-xs text-slate-400 uppercase tracking-wider font-medium">Email</th>
                <th className="px-5 py-4 text-left text-xs text-slate-400 uppercase tracking-wider font-medium">Rôle</th>
                <th className="px-5 py-4 text-left text-xs text-slate-400 uppercase tracking-wider font-medium">Depuis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {membres?.map(membre => (
                <tr key={membre.id} className="hover:bg-white/2">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold">
                        {(membre.prenom?.[0] || membre.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="text-sm font-medium">{membre.prenom || membre.nom ? `${membre.prenom || ''} ${membre.nom || ''}`.trim() : '—'}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{membre.email || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${membre.role === 'admin' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' : 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>{membre.role}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-400">{formatDate(membre.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
ENDOFFILE
echo "✅ app/equipe/page.tsx"

# 10. API routes
cat > app/api/dossiers/route.ts << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('dossiers').select('*, factures(id), contact:contacts(id)').order('jours_retard', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
ENDOFFILE
echo "✅ app/api/dossiers/route.ts"

cat > "app/api/dossiers/[id]/route.ts" << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const body = await request.json()
  const { data, error } = await supabase.from('dossiers').update({ ...body, updated_at: new Date().toISOString() }).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('dossiers').select('*, factures(*), contact:contacts(*), actions(*)').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
ENDOFFILE
echo "✅ app/api/dossiers/[id]/route.ts"

cat > "app/api/actions/[id]/route.ts" << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const body = await request.json()
  const { data, error } = await supabase.from('actions').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
ENDOFFILE
echo "✅ app/api/actions/[id]/route.ts"

cat > "app/api/factures/[id]/route.ts" << 'ENDOFFILE'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const body = await request.json()
  const { data, error } = await supabase.from('factures').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
ENDOFFILE
echo "✅ app/api/factures/[id]/route.ts"

cat > app/auth/callback/route.ts << 'ENDOFFILE'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
ENDOFFILE
echo "✅ app/auth/callback/route.ts"

echo ""
echo "✅ Tous les fichiers sont corrigés !"
echo "🚀 L'app devrait recompiler automatiquement dans le navigateur."
