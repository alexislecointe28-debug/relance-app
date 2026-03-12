import { createServerSupabaseClient } from '@/lib/supabase-server'
import Header from '@/components/ui/Header'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function EquipePage() {
  const supabase = createServerSupabaseClient()
  const { data: membres } = await supabase.from('membres').select('*').order('created_at', { ascending: true })
  const { data: org } = await supabase.from('organisations').select('nom').single()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Équipe</h1>
          <p className="text-gray-500 text-sm">{org?.nom} · {membres?.length || 0} membre(s)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Membre</th>
                <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Email</th>
                <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Rôle</th>
                <th className="px-5 py-4 text-left text-xs text-gray-500 uppercase tracking-wider font-medium">Depuis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {membres?.map(membre => (
                <tr key={membre.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                        {(membre.prenom?.[0] || membre.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {membre.prenom || membre.nom ? `${membre.prenom || ''} ${membre.nom || ''}`.trim() : '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{membre.email || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${membre.role === 'admin' ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                      {membre.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{formatDate(membre.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
