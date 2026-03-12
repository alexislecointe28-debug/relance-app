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
