import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function getRappelStyle(date: string) {
  const today = new Date()
  const rappelDate = new Date(date)
  const diff = Math.ceil((rappelDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 0) return 'text-red-700 border-red-200 bg-red-50'
  if (diff <= 2) return 'text-orange-700 border-orange-200 bg-orange-50'
  return 'text-amber-700 border-amber-200 bg-amber-50'
}

function getDateLabel(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `En retard — ${formatDate(dateStr)}`
  if (diff === 0) return `Aujourd'hui — ${formatDate(dateStr)}`
  if (diff === 1) return `Demain — ${formatDate(dateStr)}`
  return formatDate(dateStr)
}

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Agenda des rappels</h1>
          <p className="text-gray-500 text-sm">{actions?.length || 0} rappel(s) en attente</p>
        </div>
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🗓️</div>
            <p className="font-medium text-gray-500">Aucun rappel programmé</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-sm font-semibold text-gray-700 capitalize">{getDateLabel(date)}</div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <div className="text-xs text-gray-400">{items.length} rappel(s)</div>
                </div>
                <div className="space-y-2">
                  {items.map((action: any) => (
                    <div key={action.id} className={`flex items-center gap-4 p-4 rounded-xl border ${getRappelStyle(action.rappel_le)}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-current/20">
                        {action.type === 'appel' ? '📞' : '✉️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/dossiers/${action.dossier?.id}`} className="font-medium text-sm hover:underline truncate block">
                          {action.dossier?.societe || '—'}
                        </Link>
                        {action.notes && <div className="text-xs opacity-70 truncate mt-0.5">{action.notes}</div>}
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
