import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'

export const dynamic = 'force-dynamic'

export default async function ParrainagePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase.from('organisations').select('id, nom').single()
  const codeParrainage = org?.id?.slice(0, 8).toUpperCase() || 'XXXXXXXX'
  const lienParrainage = `https://relance-app.vercel.app/signup?ref=${codeParrainage}`

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programme parrainage</h1>
          <p className="text-sm text-gray-400 mt-1">Invite un ami, gagnez tous les deux.</p>
        </div>

        {/* Hero */}
        <div className="bg-indigo-600 rounded-2xl p-8 text-center text-white">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="text-2xl font-bold mb-2">1 mois offert</h2>
          <p className="text-indigo-200 text-sm">Pour toi et pour chaque ami qui s'abonne via ton lien.</p>
        </div>

        {/* Comment ça marche */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Comment ça marche</h3>
          <div className="space-y-3">
            {[
              { n: '1', text: 'Partage ton lien unique à un ami dirigeant ou gérant de TPE' },
              { n: '2', text: 'Il s'inscrit et prend un abonnement Solo ou Agence' },
              { n: '3', text: 'Vous recevez tous les deux 1 mois gratuit crédité sur votre compte' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{s.n}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lien parrainage */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">Ton lien unique</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-gray-700 break-all mb-4">
            {lienParrainage}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(lienParrainage)}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              📋 Copier le lien
            </button>
            <a
              href={`mailto:?subject=Essaie Paynelope&body=Je te recommande Paynelope pour gérer tes impayés. Crée ton compte ici : ${lienParrainage}`}
              className="py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors text-center"
            >
              ✉️ Envoyer par email
            </a>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-400 text-center">
          Le mois offert est crédité automatiquement après la 1ère facture de ton filleul.
          Contacte-nous à <a href="mailto:contact@paynelope.fr" className="text-indigo-500 hover:underline">contact@paynelope.fr</a> pour toute question.
        </p>

      </main>
    </div>
  )
}
