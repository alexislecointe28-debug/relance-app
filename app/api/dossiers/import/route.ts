import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null
  // DD/MM/YYYY → YYYY-MM-DD
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy
    const year = y.length === 2 ? '20' + y : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return null
}

function calcJoursRetard(dateEcheance: string | null): number {
  if (!dateEcheance) return 0
  const today = new Date()
  const echeance = new Date(dateEcheance)
  const diff = Math.floor((today.getTime() - echeance.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: membre } = await supabase
    .from('membres')
    .select('organisation_id')
    .eq('user_id', user.id)
    .single()

  if (!membre) return NextResponse.json({ error: 'Organisation introuvable' }, { status: 400 })

  const { factures } = await request.json()
  if (!factures?.length) return NextResponse.json({ error: 'Aucune facture' }, { status: 400 })

  // Récupérer tous les numéros de factures existants pour cette org
  const { data: existingFactures } = await supabase
    .from('factures')
    .select('numero, dossier:dossiers(organisation_id)')

  const existingNumeros = new Set(
    (existingFactures || [])
      .filter((f: any) => f.dossier?.organisation_id === membre.organisation_id)
      .map((f: any) => f.numero?.trim().toLowerCase())
      .filter(Boolean)
  )

  // Grouper par société
  const grouped: Record<string, any[]> = {}
  let skipped = 0
  let imported = 0

  for (const f of factures) {
    const numero = f.numero?.trim()

    // Ignorer les doublons
    if (numero && existingNumeros.has(numero.toLowerCase())) {
      skipped++
      continue
    }

    const societe = (f.societe || 'Inconnu').trim()
    if (!grouped[societe]) grouped[societe] = []
    grouped[societe].push(f)
  }

  // Créer ou mettre à jour les dossiers
  for (const [societe, facturesList] of Object.entries(grouped)) {
    const montantTotal = facturesList.reduce((s, f) => s + (parseFloat(f.montant_ttc) || 0), 0)
    const dateEcheances = facturesList
      .map(f => normalizeDate(f.date_echeance))
      .filter(Boolean) as string[]
    const minEcheance = dateEcheances.length > 0
      ? dateEcheances.sort()[0]
      : null
    const joursRetard = calcJoursRetard(minEcheance)

    // Chercher un dossier existant pour cette société
    const { data: existingDossier } = await supabase
      .from('dossiers')
      .select('id, montant_total')
      .eq('societe', societe)
      .eq('organisation_id', membre.organisation_id)
      .single()

    let dossierId: string

    if (existingDossier) {
      // Mettre à jour le montant total
      const newMontant = existingDossier.montant_total + montantTotal
      await supabase
        .from('dossiers')
        .update({ montant_total: newMontant, jours_retard: joursRetard, updated_at: new Date().toISOString() })
        .eq('id', existingDossier.id)
      dossierId = existingDossier.id
    } else {
      // Créer un nouveau dossier
      const { data: newDossier } = await supabase
        .from('dossiers')
        .insert({
          societe,
          montant_total: montantTotal,
          jours_retard: joursRetard,
          statut: 'a_relancer',
          organisation_id: membre.organisation_id,
        })
        .select()
        .single()

      if (!newDossier) continue
      dossierId = newDossier.id
    }

    // Insérer les nouvelles factures
    const facturesToInsert = facturesList.map(f => ({
      dossier_id: dossierId,
      numero: f.numero || null,
      montant_ttc: parseFloat(f.montant_ttc) || 0,
      date_facture: normalizeDate(f.date_facture),
      date_echeance: normalizeDate(f.date_echeance),
      bon_commande: f.bon_commande || null,
      statut: 'impayee',
    }))

    await supabase.from('factures').insert(facturesToInsert)
    imported += facturesToInsert.length
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    message: `${imported} facture(s) importée(s), ${skipped} doublon(s) ignoré(s)`
  })
}
