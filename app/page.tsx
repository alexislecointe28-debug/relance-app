import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Paynelope — Recouvrez vos impayés facilement',
  description: 'Le CRM de relance pour les TPE. Relancez vos clients en 1 clic, suivez vos impayés, récupérez votre argent. Essai gratuit, sans CB.',
}

const FEATURES = [
  { icon: '⚡', title: 'Relance en 1 clic', desc: "Email cordial, ferme ou mise en demeure. Le bon ton au bon moment, sans y passer des heures." },
  { icon: '📊', title: 'Vue 360° de vos impayés', desc: "Tous vos dossiers, montants, jours de retard et statuts en un coup d'œil. Rien ne passe à travers." },
  { icon: '💳', title: 'Lien de paiement CB', desc: "Envoyez un lien Stripe à votre client. Il paie en 30 secondes par carte, sans téléphone." },
  { icon: '📧', title: 'Suivi email en temps réel', desc: "Sachez si votre email a été ouvert, cliqué ou ignoré. Relancez au bon moment." },
  { icon: '📥', title: 'Import Excel en 30 secondes', desc: "Glissez votre export comptable. Paynelope détecte les colonnes et crée les dossiers automatiquement." },
  { icon: '🔥', title: 'Score de priorité', desc: "Les dossiers les plus urgents remontent en tête. Traitez d'abord ce qui rapporte le plus." },
]

const PLANS = [
  {
    name: 'Démo', price: 'Gratuit', period: '', desc: 'Pour tester sans engagement',
    features: ['3 dossiers', 'Toutes les fonctionnalités', 'Sans CB'],
    cta: 'Commencer gratuitement', href: '/signup', highlight: false,
  },
  {
    name: 'Solo', price: '49€', period: '/mois', desc: 'Pour les TPE sérieuses',
    features: ['300 dossiers', 'Emails illimités', '3 collaborateurs', 'Liens de paiement CB', 'Support prioritaire'],
    cta: 'Essayer Solo', href: '/signup', highlight: true,
  },
  {
    name: 'Agence', price: 'Sur devis', period: '', desc: 'Pour les cabinets de recouvrement',
    features: ['Dossiers illimités', 'Gestion multi-clients', 'Collaborateurs illimités', 'Support dédié'],
    cta: 'Nous contacter', href: 'mailto:contact@paynelope.com', highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#111' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700;900&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo.png" alt="Paynelope" style={{ height: 40, objectFit: 'contain' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#fonctionnalites" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>Fonctionnalités</a>
            <a href="#tarifs" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>Tarifs</a>
            <Link href="/login" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>Connexion</Link>
            <Link href="/signup" style={{ fontSize: 14, fontWeight: 700, color: '#fff', background: '#6366F1', padding: '8px 20px', borderRadius: 10, textDecoration: 'none' }}>
              Essai gratuit →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 100, padding: '6px 16px', marginBottom: 32 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ✓ Sans engagement · Essai gratuit
          </span>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 400, lineHeight: 1.1, margin: '0 auto 24px', maxWidth: 800 }}>
          Faites rentrer l&apos;argent<br />
          <em style={{ color: '#6366F1' }}>que vous avez déjà gagné.</em>
        </h1>
        <p style={{ fontSize: 20, color: '#555', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.6 }}>
          Paynelope est le CRM de recouvrement pensé pour les TPE. Relancez vos clients en 1 clic, suivez vos impayés, récupérez votre argent.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ fontSize: 16, fontWeight: 700, color: '#fff', background: '#6366F1', padding: '16px 36px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 24px rgba(99,102,241,0.3)' }}>
            Commencer gratuitement →
          </Link>
          <a href="#fonctionnalites" style={{ fontSize: 16, fontWeight: 600, color: '#333', background: '#F5F7FF', padding: '16px 36px', borderRadius: 14, textDecoration: 'none', border: '1px solid #E5E7EB' }}>
            Voir comment ça marche
          </a>
        </div>
        <p style={{ fontSize: 13, color: '#aaa', marginTop: 20 }}>3 dossiers gratuits · Sans carte bancaire · Prêt en 2 minutes</p>
      </section>

      {/* STAT BANNER */}
      <section style={{ background: '#6366F1', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, textAlign: 'center' }}>
          {[
            { value: '165 000 €', label: "d'impayés gérés dès le 1er mois client" },
            { value: '100 000 €', label: 'récupérés en 3 semaines (Groupe Servitel)' },
            { value: '< 2 min', label: 'pour importer vos factures et commencer' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: '#fff', marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section style={{ background: '#F5F7FF', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(22px, 3vw, 32px)', color: '#111', lineHeight: 1.4, marginBottom: 24 }}>
            &ldquo;On avait 165 000 € d&apos;impayés qui dormaient. En 3 semaines, on en a récupéré 100 000 €.&rdquo;
          </p>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#6366F1' }}>Groupe Servitel</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Services aux entreprises</div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="fonctionnalites" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 400, marginBottom: 16 }}>
            Tout ce qu&apos;il faut pour récupérer votre argent
          </h2>
          <p style={{ fontSize: 18, color: '#666', maxWidth: 500, margin: '0 auto' }}>Simple à prendre en main. Redoutablement efficace.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: '#F5F7FF', borderRadius: 20, padding: 32, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#111' }}>{f.title}</h3>
              <p style={{ fontSize: 15, color: '#666', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" style={{ background: '#F5F7FF', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 400, marginBottom: 16 }}>Simple. Transparent.</h2>
            <p style={{ fontSize: 18, color: '#666' }}>Sans engagement. Résiliable à tout moment.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {PLANS.map(p => (
              <div key={p.name} style={{ background: p.highlight ? '#6366F1' : '#fff', borderRadius: 24, padding: '40px 32px', border: p.highlight ? 'none' : '1px solid #E5E7EB', boxShadow: p.highlight ? '0 8px 40px rgba(99,102,241,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', position: 'relative' }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#6366F1', fontSize: 12, fontWeight: 800, padding: '4px 16px', borderRadius: 100, border: '2px solid #6366F1', whiteSpace: 'nowrap' }}>
                    ⚡ Le plus populaire
                  </div>
                )}
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: p.highlight ? 'rgba(255,255,255,0.6)' : '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: p.highlight ? '#fff' : '#111' }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 16, color: p.highlight ? 'rgba(255,255,255,0.6)' : '#888' }}>{p.period}</span>}
                </div>
                <p style={{ fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.7)' : '#888', marginBottom: 28 }}>{p.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 14, color: p.highlight ? '#fff' : '#444', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: p.highlight ? '#a5b4fc' : '#6366F1', fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} style={{ display: 'block', textAlign: 'center', padding: '14px 24px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', background: p.highlight ? '#fff' : '#6366F1', color: p.highlight ? '#6366F1' : '#fff' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ maxWidth: 700, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 24 }}>
          Votre argent n&apos;attend<br /><em style={{ color: '#6366F1' }}>que vous.</em>
        </h2>
        <p style={{ fontSize: 18, color: '#666', marginBottom: 40, lineHeight: 1.6 }}>
          Commencez gratuitement. 3 dossiers, toutes les fonctionnalités, sans carte bancaire.
        </p>
        <Link href="/signup" style={{ fontSize: 18, fontWeight: 700, color: '#fff', background: '#6366F1', padding: '18px 48px', borderRadius: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(99,102,241,0.35)', display: 'inline-block' }}>
          Créer mon compte gratuit →
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #F0F0F0', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <img src="/logo.png" alt="Paynelope" style={{ height: 32, objectFit: 'contain' }} />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/pricing" style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>Tarifs</Link>
            <Link href="/legal" style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>CGU & Mentions légales</Link>
            <a href="mailto:contact@paynelope.com" style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>contact@paynelope.com</a>
          </div>
          <div style={{ fontSize: 13, color: '#bbb' }}>© 2026 Paynelope</div>
        </div>
      </footer>
    </div>
  )
}
