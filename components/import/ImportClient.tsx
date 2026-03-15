'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { detectColumns, parseAmount, formatMontant } from '@/lib/utils'

interface ParsedFacture {
  societe: string
  numero: string
  montant_ttc: number
  date_facture: string
  date_echeance: string
  bon_commande: string
  _selected?: boolean
}

const FIELDS = [
  { key: 'societe',       label: 'Société / Client',  required: true },
  { key: 'numero',        label: 'N° Pièce / Facture', required: true },
  { key: 'montant_ttc',   label: 'Montant TTC',        required: true },
  { key: 'date_facture',  label: 'Date facture',        required: false },
  { key: 'date_echeance', label: 'Date d\'échéance',   required: false },
] as const

type FieldKey = typeof FIELDS[number]['key']

export default function ImportClient() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawData, setRawData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [parsed, setParsed] = useState<ParsedFacture[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [mode, setMode] = useState<Mode>('excel')
  const [manual, setManual] = useState<ParsedFacture>({
    societe: '', numero: '', montant_ttc: 0,
    date_facture: '', date_echeance: '', bon_commande: ''
  })
  const router = useRouter()

  function processFile(rows: string[][], h: string[]) {
    setHeaders(h)
    setRawData(rows)
    const detected = detectColumns(h)
    setMapping(detected)
    // Si les 3 champs obligatoires sont détectés → aller direct en preview
    const hasRequired = detected.societe !== undefined && detected.numero !== undefined && detected.montant_ttc !== undefined
    if (hasRequired) {
      applyMappingDirect(rows, detected)
    } else {
      setStep('mapping')
    }
  }

  function applyMappingDirect(rows: string[][], m: Record<string, number>) {
    const result = rows.map(row => ({
      societe: m.societe !== undefined ? row[m.societe] || '' : '',
      numero: m.numero !== undefined ? row[m.numero] || '' : '',
      montant_ttc: m.montant_ttc !== undefined ? parseAmount(row[m.montant_ttc] || '0') : 0,
      date_facture: m.date_facture !== undefined ? row[m.date_facture] || '' : '',
      date_echeance: m.date_echeance !== undefined ? row[m.date_echeance] || '' : '',
      bon_commande: m.bon_commande !== undefined ? row[m.bon_commande] || '' : '',
      _selected: true,
    })).filter(r => r.societe || r.numero)
    setParsed(result)
    setStep('preview')
  }

  function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: true })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' })
        const h = (rows[0] as string[]) || []
        const dataRows = rows.slice(1).filter((r: any) => r.some((c: any) => c)) as string[][]
        processFile(dataRows, h)
      } catch {
        setError("Impossible de lire ce fichier. Vérifiez qu'il est au format .xlsx")
      }
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleImport() {
    const toImport = parsed.filter(f => f._selected)
    if (!toImport.length) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dossiers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factures: toImport })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erreur serveur' }))
        if (errorData.error === 'LIMITE_DEMO') {
          setError('🔒 Plan Démo limité à 3 dossiers. Passez au plan Solo sur /pricing pour continuer.')
          setLoading(false)
          return
        }
        throw new Error(errorData.message || 'Erreur serveur')
      }
      const result = await res.json()
      setImportResult({ imported: result.imported, skipped: result.skipped })
      setStep('success')
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'import.")
    }
    setLoading(false)
  }

  // ---- RENDER ----
  if (step === 'success') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Import réussi !</h2>
        {importResult && (
          <div className="space-y-1 mb-8 text-sm text-gray-500">
            <p>{importResult.imported} facture(s) importée(s)</p>
            {importResult.skipped > 0 && <p className="text-amber-600">{importResult.skipped} doublon(s) ignoré(s)</p>}
          </div>
        )}
        <button onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
          Voir le dashboard →
        </button>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importer des factures</h1>
        <p className="text-sm text-gray-400 mt-1">Excel recommandé — la détection des colonnes est automatique.</p>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      {/* STEP 1 — UPLOAD */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
            <button onClick={() => setMode('excel')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'excel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              📊 Excel <span className="ml-1 text-xs text-emerald-600 font-semibold">Recommandé</span>
            </button>
            <button onClick={() => setMode('pdf')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'pdf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              📄 PDF
            </button>
            <button onClick={() => setMode('manual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              ✏️ Manuel
            </button>
          </div>

          {mode === 'excel' && (
            <UploadZone loading={loading} onChange={handleExcelUpload} />
          )}

          {mode === 'pdf' && (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center bg-white">
              <div className="text-5xl mb-4">📄</div>
              <div className="font-semibold text-gray-700 mb-2">Import PDF</div>
              <div className="text-sm text-gray-400 mb-4">Glissez votre facture PDF ici</div>
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 inline-block">
                🚧 Fonctionnalité en cours de développement — disponible prochainement
              </div>
            </div>
          )}

          {mode === 'manual' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      {f.label} {f.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type={f.key.includes('date') ? 'date' : f.key === 'montant_ttc' ? 'number' : 'text'}
                      value={manual[f.key] as string}
                      onChange={e => setManual(prev => ({
                        ...prev,
                        [f.key]: f.key === 'montant_ttc' ? parseFloat(e.target.value) || 0 : e.target.value
                      }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                ))}
              </div>
              <button
                disabled={!manual.societe || !manual.numero}
                onClick={() => { setParsed([{ ...manual, bon_commande: '', _selected: true }]); setStep('preview') }}
                className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                Prévisualiser →
              </button>
            </div>
          )}

          {/* Champs attendus */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <p className="text-xs text-indigo-600 font-semibold mb-2">Colonnes reconnues automatiquement :</p>
            <div className="flex flex-wrap gap-2">
              {FIELDS.map(f => (
                <span key={f.key} className="text-xs bg-white border border-indigo-200 text-indigo-700 rounded-lg px-2 py-1">
                  {f.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — MAPPING (seulement si nécessaire) */}
      {step === 'mapping' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-bold text-gray-900">Correspondance des colonnes</h2>
            <p className="text-xs text-gray-400 mt-1">Certaines colonnes n'ont pas été reconnues. Assigne-les manuellement.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                  {mapping[f.key] !== undefined && <span className="ml-1 text-emerald-500">✓</span>}
                </label>
                <select
                  value={mapping[f.key] !== undefined ? mapping[f.key] : ''}
                  onChange={e => setMapping(prev => ({
                    ...prev,
                    [f.key]: e.target.value !== '' ? parseInt(e.target.value) : undefined as any
                  }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">— Non mappé —</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          {/* Aperçu 3 lignes */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {headers.map((h, i) => <th key={i} className="px-3 py-2 text-left text-gray-400 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rawData.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {row.map((cell, j) => <td key={j} className="px-3 py-2 text-gray-600">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('upload')}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              ← Retour
            </button>
            <button
              disabled={!mapping.societe || !mapping.numero || !mapping.montant_ttc}
              onClick={() => applyMappingDirect(rawData, mapping)}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
              Prévisualiser ({rawData.length} lignes) →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — PREVIEW */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">{parsed.filter(f => f._selected).length} facture(s) à importer</h2>
              <p className="text-xs text-gray-400 mt-0.5">Décoche celles à ignorer</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(mode === 'manual' ? 'upload' : headers.length ? 'mapping' : 'upload')}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                ← Retour
              </button>
              <button onClick={handleImport}
                disabled={loading || !parsed.some(f => f._selected)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {loading ? 'Import…' : `Importer ${parsed.filter(f => f._selected).length} facture(s)`}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox"
                      checked={parsed.every(f => f._selected)}
                      onChange={e => setParsed(prev => prev.map(f => ({ ...f, _selected: e.target.checked })))}
                      className="accent-indigo-600" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Société</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">N° Pièce</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Montant TTC</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Échéance</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parsed.map((row, i) => (
                  <tr key={i} className={!row._selected ? 'opacity-40' : ''}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={!!row._selected}
                        onChange={e => setParsed(prev => prev.map((r, j) => j === i ? { ...r, _selected: e.target.checked } : r))}
                        className="accent-indigo-600" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.societe || <span className="text-red-400 text-xs">⚠ manquant</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{row.numero}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatMontant(row.montant_ttc)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{row.date_echeance || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setParsed(prev => prev.filter((_, j) => j !== i))}
                        className="text-gray-300 hover:text-red-400 text-sm">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}

function UploadZone({ onChange, loading }: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  loading?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && inputRef.current) {
          const dt = new DataTransfer()
          dt.items.add(file)
          inputRef.current.files = dt.files
          onChange({ target: inputRef.current } as any)
        }
      }}
      className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
        dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40'
      }`}
    >
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onChange} />
      <div className="text-5xl mb-4">{loading ? '⏳' : '📊'}</div>
      <div className="font-semibold text-gray-700 mb-1">
        {loading ? 'Lecture du fichier…' : 'Glisse ton fichier Excel ici'}
      </div>
      {!loading && (
        <>
          <div className="text-sm text-gray-400 mb-4">.xlsx ou .xls · les colonnes sont détectées automatiquement</div>
          <div className="inline-block px-5 py-2 bg-indigo-600 text-white text-sm rounded-xl font-semibold">
            Choisir un fichier
          </div>
        </>
      )}
    </div>
  )
}
