'use client'
import { useState } from 'react'

interface Membre {
  email: string
  role: string
  user_id: string
  banned?: boolean
}

interface Connexion {
  ip: string
  user_agent: string
  email: string
  created_at: string
}

interface Props {
  orgId: string
  orgNom: string
  membres: Membre[]
  connexions: Connexion[]
}

export default function AdminOrgActions({ orgId, orgNom, membres, connexions }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function callAction(payload: object) {
    setLoading(JSON.stringify(payload))
    setMsg(null)
    const res = await fetch('/api/admin/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(null)
    if (data.ok) {
      setMsg({ type: 'ok', text: 'Action effectuée ✓' })
      setTimeout(() => window.location.reload(), 1000)
    } else {
      setMsg({ type: 'err', text: data.error || 'Erreur' })
    }
  }

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement l'organisation "${orgNom}" et tous ses membres ?`)) return
    await callAction({ action: 'delete_org', org_id: orgId })
  }

  async function handleBlock(user_id: string, blocked: boolean) {
    await callAction({ action: 'toggle_block', user_id, blocked })
  }

  async function handlePassword() {
    if (!newPassword || newPassword.length < 6) return setMsg({ type: 'err', text: 'Mot de passe trop court (6 min)' })
    await callAction({ action: 'update_password', user_id: selectedUserId, password: newPassword })
    setNewPassword('')
    setShowPwdForm(false)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-indigo-600 hover:underline font-medium"
      >
        {open ? '▲ Masquer actions' : '▼ Gérer'}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
          {msg && (
            <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}

          {/* Liste membres */}
          <div className="space-y-2">
            {membres.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-xl px-3 py-2">
                <div>
                  <span className="font-medium text-gray-800">{m.email}</span>
                  <span className="ml-2 text-gray-400">{m.role}</span>
                  {m.banned && <span className="ml-2 text-red-500 font-semibold">BLOQUÉ</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setSelectedUserId(m.user_id); setShowPwdForm(true) }}
                    className="text-indigo-600 hover:underline"
                  >
                    Changer mdp
                  </button>
                  <button
                    onClick={() => handleBlock(m.user_id, !!m.banned)}
                    disabled={loading !== null}
                    className={`px-2 py-0.5 rounded-lg font-semibold ${m.banned ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                  >
                    {m.banned ? 'Débloquer' : 'Bloquer'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire mot de passe */}
          {showPwdForm && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                onClick={handlePassword}
                disabled={loading !== null}
                className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-xl font-semibold hover:bg-indigo-700"
              >
                Valider
              </button>
              <button onClick={() => setShowPwdForm(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
            </div>
          )}

          {/* Supprimer org */}
          <button
            onClick={handleDelete}
            disabled={loading !== null}
            className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-100 rounded-xl px-3 py-1.5 hover:bg-red-50 transition-colors"
          >
            🗑 Supprimer l'organisation
          </button>

          {/* Historique connexions */}
          {connexions.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-semibold text-gray-500 mb-1.5">Connexions (7 derniers jours)</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {connexions.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-gray-600 flex-shrink-0">{c.ip}</span>
                      <span className="text-gray-400 truncate">{c.email}</span>
                    </div>
                    <span className="text-gray-300 flex-shrink-0">
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
