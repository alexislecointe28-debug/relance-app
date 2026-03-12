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
