import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

interface ImportedFacture {
  societe: string
  numero?: string
  montant_ttc: number
  date_facture?: string
  date_echeance?: string
  bon_commande?: string
}

function parseISODate(raw: string | undefined): string | null {
  if (!raw) return null
  const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  return null
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { factures }: { factures: ImportedFacture[] } = await request.json()

  const { data: membre } = await supabase.from('membres').select('organisation_id, id').single()
  if (!membre) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const orgId = membre.organisation_id
  const bySociete = factures.reduce((acc, f) => {
    const key = f.societe.toLowerCase().trim()
    if (!acc[key]) acc[key] = { societe: f.societe, factures: [] }
    acc[key].factures.push(f)
    return acc
  }, {} as Record<string, { societe: string; factures: ImportedFacture[] }>)

  const results = []
  for (const { societe, factures: sfactures } of Object.values(bySociete)) {
    if (!societe) continue
    let dossierId: string
    const { data: existing } = await supabase
      .from('dossiers').select('id').eq('organisation_id', orgId).ilike('societe', societe).single()

    if (existing) {
      dossierId = existing.id
    } else {
      const { data: newDossier } = await supabase
        .from('dossiers').insert({ organisation_id: orgId, societe }).select('id').single()
      if (!newDossier) continue
      dossierId = newDossier.id
    }

    const rows = sfactures.map(f => ({
      dossier_id: dossierId,
      numero: f.numero || null,
      montant_ttc: f.montant_ttc || 0,
      date_facture: parseISODate(f.date_facture),
      date_echeance: parseISODate(f.date_echeance),
      bon_commande: f.bon_commande || null,
      statut: 'impayee' as const,
    }))

    await supabase.from('factures').insert(rows)
    await supabase.from('actions').insert({
      dossier_id: dossierId,
      type: 'import',
      notes: `${rows.length} facture(s) importée(s)`,
      membre_id: membre.id,
    })
    results.push({ dossierId, societe, count: rows.length })
  }

  return NextResponse.json({ success: true, results })
}
