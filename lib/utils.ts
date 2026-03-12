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
    numero: /num[eé]ro|n°|facture.*num|ref|pi[eè]ce|piece/i,
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
