import Link from 'next/link'

export default function LegalPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline mb-8 block">← Retour</Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions légales & CGU</h1>
      <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : mars 2026</p>

      <section className="space-y-8 text-sm text-gray-700 leading-relaxed">

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Éditeur</h2>
          <p>Paynelope est un service édité par un auto-entrepreneur basé en France — SIRET : 481 640 720 00027</p>
          <p className="mt-1">Contact : <a href="mailto:contact@paynelope.com" className="text-indigo-600 hover:underline">contact@paynelope.com</a></p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Objet du service</h2>
          <p>Paynelope est un logiciel SaaS de gestion et de suivi des créances clients (recouvrement amiable) à destination des TPE et PME. Il permet à ses utilisateurs de centraliser, suivre et relancer leurs factures impayées.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Accès au service</h2>
          <p>L&apos;accès au service est conditionné à la création d&apos;un compte et à l&apos;acceptation des présentes CGU. Le plan Démo est limité à 3 dossiers. Les plans payants (Solo, Agence) donnent accès à des fonctionnalités étendues selon le tarif en vigueur.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Données personnelles & RGPD</h2>
          <p>Les données saisies dans Paynelope (coordonnées de débiteurs, montants, historiques) restent la propriété exclusive de l&apos;utilisateur. Paynelope n&apos;exploite pas ces données à des fins commerciales.</p>
          <p className="mt-2">Données collectées : email, nom de l&apos;organisation, données de facturation (Stripe). Hébergement : Supabase (PostgreSQL, Union Européenne) et Vercel (CDN mondial). Paiement : Stripe (aucune donnée bancaire ne transite par nos serveurs).</p>
          <p className="mt-2">Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour exercer ces droits : <a href="mailto:contact@paynelope.com" className="text-indigo-600 hover:underline">contact@paynelope.com</a></p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Sous-traitants</h2>
          <p>Paynelope utilise les sous-traitants suivants, tous conformes au RGPD :</p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
            <li>Supabase Inc. — base de données (DPA disponible)</li>
            <li>Vercel Inc. — hébergement et CDN (DPA disponible)</li>
            <li>Stripe Inc. — traitement des paiements (PCI-DSS certifié)</li>
            <li>Resend Inc. — envoi d&apos;emails transactionnels</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Tarifs et facturation</h2>
          <p>Les abonnements sont facturés mensuellement via Stripe. L&apos;abonnement est résiliable à tout moment depuis les paramètres du compte, avec effet à la fin de la période en cours. Aucun remboursement prorata n&apos;est effectué sauf obligation légale. Plan Démo : gratuit, limité à 3 dossiers et 1 utilisateur. Plan Solo : 49€/mois, 300 dossiers maximum, 3 collaborateurs maximum. Plan Agence : 199€/mois, dossiers et collaborateurs illimités.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Responsabilité</h2>
          <p>Paynelope est un outil d&apos;aide au recouvrement amiable. Il ne constitue pas un conseil juridique. L&apos;utilisateur reste seul responsable des communications envoyées à ses débiteurs via la plateforme. Paynelope ne peut être tenu responsable des résultats obtenus dans le cadre d&apos;une procédure de recouvrement.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Disponibilité</h2>
          <p>Paynelope s&apos;engage à maintenir le service accessible 24h/24, 7j/7, sous réserve de maintenances planifiées communiquées à l&apos;avance. Aucune garantie de disponibilité n&apos;est accordée au-delà des engagements de nos hébergeurs (Vercel : 99.99%, Supabase : 99.9%).</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Droit applicable</h2>
          <p>Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence des tribunaux de Lyon.</p>
        </div>

        <div id="cookies">
          <h2 className="text-lg font-bold text-gray-900 mb-3">10. Cookies et mesure d&apos;audience</h2>
          <p>Paynelope utilise Google Analytics (GA4) pour mesurer l&apos;audience du site public (paynelope.com). Ce service dépose des cookies de mesure sur votre navigateur.</p>
          <p className="mt-2"><strong>Cookies utilisés :</strong></p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-gray-600">
            <li><code>_ga</code>, <code>_ga_*</code> — Google Analytics, durée 2 ans — mesure d&apos;audience anonymisée</li>
          </ul>
          <p className="mt-2">Ces cookies ne sont déposés qu&apos;avec votre consentement explicite. Vous pouvez retirer votre consentement à tout moment en vidant les données de votre navigateur ou en nous contactant à <a href="mailto:contact@paynelope.com" className="text-indigo-600 hover:underline">contact@paynelope.com</a>.</p>
          <p className="mt-2">Les pages connectées de l&apos;application (dashboard, dossiers, etc.) ne déposent aucun cookie de tracking.</p>
        </div>

      </section>
    </main>
  )
}
