import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Paynelope',
  robots: { index: false },
}

export default function ConfidentialitePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 block">← Retour</Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
      <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : mars 2026</p>

      <section className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
          <p>Alexis Lecointe — auto-entrepreneur, SIRET 481 640 720 00027, basé en France.</p>
          <p className="mt-1">Contact : <a href="mailto:contact@paynelope.com" className="text-indigo-600 hover:underline">contact@paynelope.com</a></p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Données collectées</h2>
          <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
          <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600">
            <li><strong>Données de compte</strong> : adresse email, nom de l&apos;organisation, mot de passe (haché)</li>
            <li><strong>Données de facturation</strong> : traitées directement par Stripe — nous n&apos;avons accès à aucune donnée bancaire</li>
            <li><strong>Données métier</strong> : coordonnées de débiteurs, montants, historique de relances — saisies par l&apos;utilisateur et lui appartenant exclusivement</li>
            <li><strong>Données de connexion</strong> : adresse IP, user-agent, horodatage — à des fins de sécurité</li>
            <li><strong>Données d&apos;audience</strong> : cookies Google Analytics sur le site public uniquement, avec consentement préalable</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Finalités et bases légales</h2>
          <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600">
            <li><strong>Exécution du contrat</strong> — fourniture du service Paynelope (art. 6.1.b RGPD)</li>
            <li><strong>Obligation légale</strong> — conservation des données de facturation (art. 6.1.c RGPD)</li>
            <li><strong>Intérêt légitime</strong> — sécurité, prévention des abus (art. 6.1.f RGPD)</li>
            <li><strong>Consentement</strong> — mesure d&apos;audience Google Analytics (art. 6.1.a RGPD)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Durée de conservation</h2>
          <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600">
            <li>Données de compte : durée de l&apos;abonnement + 3 ans</li>
            <li>Données de facturation : 10 ans (obligation comptable)</li>
            <li>Données de connexion (logs) : 7 jours glissants</li>
            <li>Cookies analytics : 2 ans</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Sous-traitants et transferts hors UE</h2>
          <p>Certains sous-traitants sont établis hors de l&apos;Union Européenne. Des garanties appropriées ont été mises en place (clauses contractuelles types UE) :</p>
          <ul className="mt-2 space-y-2 list-disc list-inside text-gray-600">
            <li><strong>Supabase Inc.</strong> (USA) — base de données hébergée en Europe (eu-west-1), DPA signé</li>
            <li><strong>Vercel Inc.</strong> (USA) — hébergement et CDN mondial, DPA signé — certaines données peuvent transiter par des serveurs aux États-Unis via le réseau CDN</li>
            <li><strong>Stripe Inc.</strong> (USA) — paiements, certifié PCI-DSS, DPA signé</li>
            <li><strong>Resend Inc.</strong> (USA) — emails transactionnels, DPA disponible</li>
            <li><strong>Google LLC</strong> (USA) — analytics avec consentement uniquement</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Vos droits</h2>
          <p>Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants :</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
            <li>Droit d&apos;accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;)</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité</li>
            <li>Droit d&apos;opposition</li>
            <li>Droit de retirer votre consentement à tout moment</li>
          </ul>
          <p className="mt-3">Pour exercer ces droits : <a href="mailto:contact@paynelope.com" className="text-indigo-600 hover:underline">contact@paynelope.com</a></p>
          <p className="mt-2">Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">CNIL</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Sécurité</h2>
          <p>Mesures mises en œuvre : chiffrement TLS en transit, mots de passe hachés, accès restreint aux données de production, authentification par session sécurisée, journalisation des connexions.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cookies</h2>
          <p>Voir notre <Link href="/legal#cookies" className="text-indigo-600 hover:underline">politique de cookies</Link> dans les mentions légales.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Modifications</h2>
          <p>En cas de modification substantielle, vous serez informé par email ou via l&apos;application. La date de dernière mise à jour figure en haut de ce document.</p>
        </div>

      </section>
    </main>
  )
}
