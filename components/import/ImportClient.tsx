'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { detectSeparator, detectColumns, parseAmount, formatMontant } from '@/lib/utils'

type Mode = 'excel' | 'pdf' | 'manual'

interface ParsedFacture {
  societe: string
  numero: string
  montant_ttc: number
  date_facture: string
  date_echeance: string
  bon_commande: string
  _selected?: boolean
}

export default function ImportClient() {
  const [mode, setMode] = useState<Mode>('excel')
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'success'>('upload')
  const [parsed, setParsed] = useState<ParsedFacture[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rawData, setRawData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [manual, setManual] = useState<ParsedFacture>({
    societe: '', numero: '', montant_ttc: 0,
    date_facture: '', date_echeance: '', bon_commande: ''
  })
  const router = useRouter()

  // Parse Excel
  function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' })
        const h = (rows[0] as string[]) || []
        const dataRows = rows.slice(1).filter((r: any) => r.some((c: any) => c)) as string[][]
        setHeaders(h)
        setRawData(dataRows)
        setMapping(detectColumns(h))
        setStep('map')
      } catch (err) {
        setError("Impossible de lire ce fichier Excel. Vérifiez qu'il est au format .xlsx")
      }
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }

  // Parse CSV
  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const sep = detectSeparator(text)
      const rows = text.split('\n').map(r => r.split(sep).map(c => c.trim().replace(/^"|"$/g, '')))
      const h = rows[0] || []
      setHeaders(h)
      setRawData(rows.slice(1).filter(r => r.some(c => c)))
      setMapping(detectColumns(h))
      setStep('map')
      setLoading(false)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function applyMapping() {
    const rows: ParsedFacture[] = rawData.map(row => ({
      societe: mapping.societe !== undefined ? row[mapping.societe] || '' : '',
      numero: mapping.numero !== undefined ? row[mapping.numero] || '' : '',
      montant_ttc: mapping.montant_ttc !== undefined ? parseAmount(row[mapping.montant_ttc] || '0') : 0,
      date_facture: mapping.date_facture !== undefined ? row[mapping.date_facture] || '' : '',
      date_echeance: mapping.date_echeance !== undefined ? row[mapping.date_echeance] || '' : '',
      bon_commande: mapping.bon_commande !== undefined ? row[mapping.bon_commande] || '' : '',
      _selected: true,
    }))
    setParsed(rows)
    setStep('preview')
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
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      setImportResult({ imported: result.imported, skipped: result.skipped })
      setStep('success')
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'import.")
    }
    setLoading(false)
  }

  const FIELDS = [
    { key: 'societe', label: 'Société' },
    { key: 'numero', label: 'N° Facture' },
    { key: 'montant_ttc', label: 'Montant TTC' },
    { key: 'date_facture', label: 'Date facture' },
    { key: 'date_echeance', label: 'Échéance' },
    { key: 'bon_commande', label: 'Bon de commande' },
  ] as const

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Importer des factures</h1>
        <p className="text-gray-500 text-sm">Excel recommandé — CSV et saisie manuelle aussi disponibles.</p>
      </div>

      {step === 'success' ? (
        <div className="bg-white border border-emerald-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import réussi !</h2>
          {importResult && (
            <div className="space-y-1 mb-6">
              <p className="text-gray-600">{importResult.imported} facture(s) importée(s)</p>
              {importResult.skipped > 0 && (
                <p className="text-amber-600 text-sm">{importResult.skipped} doublon(s) ignoré(s)</p>
              )}
            </div>
          )}
          <button onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
            Voir le tableau de bord
          </button>
        </div>
      ) : (
        <>
          {step === 'upload' && (
            <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
              {([
                { id: 'excel', label: '📊 Excel', desc: 'Recommandé' },
                { id: 'pdf', label: '📄 PDF', desc: '' },
                { id: 'manual', label: '✏️ Manuel', desc: '' },
              ] as { id: Mode; label: string; desc: string }[]).map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${mode === m.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                  {m.label}
                  {m.desc && <span className="ml-1 text-xs text-emerald-600 font-semibold">{m.desc}</span>}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          {step === 'upload' && mode === 'pdf' && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">📄</div>
              <div className="font-semibold text-gray-900 mb-2">Import PDF</div>
              <div className="text-sm text-gray-400 mb-4">Glissez votre facture PDF ici</div>
              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 inline-block">
                🚧 Fonctionnalité en cours de développement — disponible prochainement
              </div>
            </div>
          )}

          {step === 'upload' && mode === 'excel' && (
            <UploadZone
              loading={loading}
              accept=".xlsx,.xls"
              hint="Glissez votre fichier Excel ici · .xlsx ou .xls"
              icon="📊"
              onChange={handleExcelUpload}
            />
          )}

          {step === 'upload' && mode === 'pdf' && (
            <UploadZone
              loading={loading}
              accept=".csv,.tsv,.txt"
              hint="Glissez votre fichier CSV ici · séparateur auto-détecté"
              icon="📄"
              onChange={handleCsvUpload}
            />
          )}

          {step === 'upload' && mode === 'manual' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">Saisie manuelle</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">{f.label}</label>
                    <input
                      type={f.key.includes('date') ? 'date' : f.key === 'montant_ttc' ? 'number' : 'text'}
                      value={manual[f.key] as string}
                      onChange={e => setManual(prev => ({
                        ...prev,
                        [f.key]: f.key === 'montant_ttc' ? parseFloat(e.target.value) : e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setParsed([{ ...manual, _selected: true }]); setStep('preview') }}
                className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
                Continuer
              </button>
            </div>
          )}

          {step === 'map' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">Correspondance des colonnes</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-medium">{f.label}</label>
                    <select
                      value={mapping[f.key] !== undefined ? mapping[f.key] : ''}
                      onChange={e => setMapping(prev => ({
                        ...prev,
                        [f.key]: e.target.value !== '' ? parseInt(e.target.value) : undefined as any
                      }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">— Ignorer —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('upload')}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                  ← Retour
                </button>
                <button onClick={applyMapping}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
                  Prévisualiser ({rawData.length} lignes)
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  {parsed.filter(f => f._selected).length} facture(s) à importer
                </h2>
                <div className="flex gap-3">
                  <button onClick={() => setStep(mode === 'manual' ? 'upload' : 'map')}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                    ← Retour
                  </button>
                  <button onClick={handleImport}
                    disabled={loading || !parsed.some(f => f._selected)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    {loading ? 'Import en cours…' : 'Importer'}
                  </button>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left w-8">
                        <input type="checkbox"
                          checked={parsed.every(f => f._selected)}
                          onChange={e => setParsed(prev => prev.map(f => ({ ...f, _selected: e.target.checked })))}
                          className="accent-blue-600" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Société</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">N° Facture</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Montant TTC</th>
                      <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Échéance</th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.map((row, i) => (
                      <tr key={i} className={!row._selected ? 'opacity-40' : ''}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={row._selected}
                            onChange={e => setParsed(prev => prev.map((r, j) => j === i ? { ...r, _selected: e.target.checked } : r))}
                            className="accent-blue-600" />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.societe || <span className="text-red-500">⚠ manquant</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{row.numero}</td>
                        <td className="px-4 py-3 font-mono text-gray-900">{formatMontant(row.montant_ttc)}</td>
                        <td className="px-4 py-3 text-gray-500">{row.date_echeance}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setParsed(prev => prev.filter((_, j) => j !== i))}
                            className="text-xs text-red-400 hover:text-red-600">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}

function UploadZone({
  onChange, loading, accept, hint, icon
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  loading?: boolean
  accept: string
  hint: string
  icon: string
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
        dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onChange} />
      <div className="text-4xl mb-4">{loading ? '⏳' : icon}</div>
      <div className="font-medium text-gray-700">{loading ? 'Lecture du fichier…' : hint}</div>
      {!loading && (
        <div className="mt-3 inline-block px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg">
          Choisir un fichier
        </div>
      )}
    </div>
  )
}
