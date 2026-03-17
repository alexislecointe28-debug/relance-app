'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Org {
  id: string
  nom: string
  adresse?: string
  telephone?: string
  email_contact?: string
  siret?: string
  logo_url?: string
  signature_email?: string
}

export default function EntrepriseClient({ org }: { org: Org }) {
  const supabase = createClient()

  const [nom, setNom] = useState(org?.nom || '')
  const [adresse, setAdresse] = useState(org?.adresse || '')
  const [telephone, setTelephone] = useState(org?.telephone || '')
  const [email, setEmail] = useState(org?.email_contact || '')
  const [siret, setSiret] = useState(org?.siret || '')
  const [signature, setSignature] = useState(org?.signature_email || '')
  const [logoUrl, setLogoUrl] = useState(org?.logo_url || '')

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    await supabase.from('organisations').update({
      nom, adresse, telephone, email_contact: email, siret, signature_email: signature
    }).eq('id', org.id)
    setSaved(true)
    setLoading(false)
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoLoading(true)
    const ext = file.name.split('.').pop()
    const path = `logos/${org.id}.${ext}`
    const { error } = await supabase.storage.from('assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('assets').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
      await supabase.from('organisations').update({ logo_url: data.publicUrl }).eq('id', org.id)
    }
    setLogoLoading(false)
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mon entreprise</h1>
        <p className="text-sm text-gray-400">Ces informations apparaissent dans vos emails de relance.</p>
      </div>

      {/* Logo */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Logo</h2>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-gray-200" />
          ) : (
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs text-center">
              Aucun logo
            </div>
          )}
          <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
            {logoLoading ? 'Envoi...' : 'Choisir un fichier'}
            <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
          </label>
        </div>
      </div>

      {/* Infos */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Coordonnées</h2>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Nom de l&apos;entreprise</label>
          <input value={nom} onChange={e => setNom(e.target.value)}
            placeholder="Mon Entreprise"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Adresse</label>
          <input value={adresse} onChange={e => setAdresse(e.target.value)}
            placeholder="12 rue de la Paix, 75001 Paris"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Téléphone</label>
            <input value={telephone} onChange={e => setTelephone(e.target.value)}
              placeholder="04 XX XX XX XX"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Email de contact</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="contact@entreprise.fr"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">SIRET</label>
          <input value={siret} onChange={e => setSiret(e.target.value)}
            placeholder="XXX XXX XXX XXXXX"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Signature email</label>
          <p className="text-xs text-gray-400 mb-1.5">Ajoutée automatiquement en bas de chaque email de relance.</p>
          <textarea value={signature} onChange={e => setSignature(e.target.value)} rows={3}
            placeholder={"Cordialement,\nPrénom NOM\nMon Entreprise · 04 XX XX XX XX"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
            {loading ? '...' : 'Enregistrer'}
          </button>
          {saved && <span className="text-sm text-emerald-600">Informations mises à jour</span>}
        </div>
      </form>
    </main>
  )
}
