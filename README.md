# Relance — CRM de recouvrement pour TPE

Application web de recouvrement de créances, construite avec Next.js 14, TypeScript, Tailwind CSS, et Supabase.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS
- **Base de données** : Supabase (PostgreSQL + Auth + RLS)
- **Déploiement** : Vercel

---

## Installation

### 1. Cloner le repo

```bash
git clone https://github.com/votre-repo/relance-app.git
cd relance-app
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Dans **SQL Editor**, exécuter le contenu de `supabase-schema.sql`
3. Dans **Authentication > Settings**, désactiver la confirmation email (optionnel pour le dev)
4. Récupérer l'URL et la clé anon depuis **Project Settings > API**

### 3. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Renseigner :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Déploiement sur Vercel

```bash
vercel deploy
```

Ajouter les variables d'environnement dans les settings Vercel.

Puis dans Supabase **Authentication > URL Configuration**, ajouter :
- Site URL : `https://votre-app.vercel.app`
- Redirect URLs : `https://votre-app.vercel.app/auth/callback`

---

## Structure du projet

```
relance-app/
├── app/
│   ├── dashboard/          # Vue principale
│   ├── dossiers/[id]/      # Fiche dossier
│   ├── import/             # Import CSV/PDF/Manuel
│   ├── qualifier/          # Mode qualification plein écran
│   ├── agenda/             # Liste des rappels
│   ├── equipe/             # Membres de l'organisation
│   ├── parametres/         # Config + export CSV
│   ├── login/              # Authentification
│   └── api/                # Routes API
│       ├── dossiers/       # CRUD dossiers
│       ├── dossiers/import # Import en masse
│       ├── actions/[id]    # PATCH rappels
│       └── factures/[id]   # PATCH statut facture
├── components/
│   ├── ui/Header.tsx       # Navigation principale
│   ├── dashboard/          # Composants dashboard
│   ├── dossiers/           # Fiche dossier + modals
│   ├── import/             # Wizard d'import
│   └── qualifier/          # Mode swipe
├── lib/
│   ├── supabase.ts         # Clients Supabase (browser + server)
│   └── utils.ts            # Fonctions utilitaires
├── types/index.ts          # Types TypeScript
└── supabase-schema.sql     # Schéma de base de données
```

---

## Fonctionnalités

### Dashboard (`/dashboard`)
- **4 KPIs** : total à recouvrer, dossiers actifs, à relancer (rouge), % contacts qualifiés
- **Encart rappels** : actions avec rappel_le ≤ J+7, code couleur rouge/orange/jaune, bouton "✓ Fait"
- **Liste dossiers** : filtrables par statut (tous/a_relancer/en_attente/promesse/resolu), triables par retard ou montant
- Chaque carte : société, nb factures, jours de retard, badge statut, montant

### Fiche dossier (`/dossiers/[id]`)
- Header avec statut inline modifiable et montant total
- **Modal appel** : résultat + notes + date de rappel (J+3 par défaut)
- **Modal email** : niveau cordial/ferme/mise en demeure
- **Modal contact** : prénom/nom/fonction/email/téléphone
- **Factures** : liste avec statut modifiable inline
- **Timeline** : historique des actions avec rappels cliquables

### Import (`/import`)
- **CSV** : détection auto séparateur, détection auto colonnes, mapping interactif, prévisualisation avec édition ligne par ligne
- **PDF** : extraction texte avec pdfjs-dist, badge confiance (high/medium/low), formulaire d'édition si low confidence
- **Manuel** : formulaire direct
- Regroupement automatique par société → création/mise à jour des dossiers

### Qualifier (`/qualifier`)
- Interface plein écran style carte
- Navigation clavier : Entrée = sauvegarder, Échap = passer, ←→ pour naviguer
- Dossiers sans contact affichés en premier
- Barre de progression + pastilles de navigation

### Agenda (`/agenda`)
- Tous les rappels groupés par date
- Code couleur : rouge = en retard, bleu = aujourd'hui, blanc = à venir

### Équipe (`/equipe`)
- Liste des membres de l'organisation avec rôles

### Paramètres (`/parametres`)
- Nom de l'organisation
- Export CSV complet du portefeuille

---

## Sécurité

- Row Level Security (RLS) sur toutes les tables
- Isolation par organisation (multi-tenant)
- Auth via Supabase (@supabase/ssr avec cookies)
- Middleware Next.js pour protéger toutes les routes

---

## Prochaines étapes suggérées

- [ ] Désactiver l'inscription publique en production
- [ ] Configurer Resend pour les emails
- [ ] Reporting hebdomadaire automatique
- [ ] Intégration comptable (import FEC)
- [ ] Notifications push pour les rappels
- [ ] Tableau de bord analytique avancé
