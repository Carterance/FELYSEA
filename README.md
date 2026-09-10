# Notre rituel — application privée de couple

Une application web pour créer un rendez-vous intime hebdomadaire : chacun répond
en privé à un court questionnaire (ambiance, énergie, intensité souhaitée), puis
l'application propose une soirée qui cherche le meilleur compromis entre les deux
réponses — jamais une addition, et toujours au bénéfice du partenaire le moins
partant sur l'intensité.

## Philosophie du produit

- **Le consentement prime sur la fonctionnalité.** L'intensité retenue est
  toujours la plus basse des deux réponses. Les limites personnelles
  (`hard_limit`) ne sont jamais lues par le moteur de matching ni montrées au
  partenaire. Rien dans l'app ne transforme une préférence passée en
  consentement futur.
- **La confidentialité est structurelle, pas juste une consigne UX.** Toute
  requête aux données d'un couple passe par un helper d'autorisation central
  (`src/server/authorization.ts`) qui vérifie l'appartenance au couple.
- **La gamification reste positive.** Pas de classement, pas de comparaison
  entre couples — uniquement le propre historique du couple.

## Stack technique

| Domaine | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript strict | SSR, server actions, écosystème mature |
| Base de données | PostgreSQL | Relationnel, adapté à un modèle avec beaucoup de relations (couple, sessions, réponses...) |
| ORM | Drizzle | Léger, SQL-first, migrations claires, bon typage |
| Auth | Auth.js v5 (credentials) | Pas de dépendance à un tiers pour des données aussi sensibles |
| Hash mot de passe | argon2id | Recommandation OWASP actuelle |
| Style | Tailwind CSS | Rapide à itérer, cohérent avec les tokens du design system |
| Emails | Resend | API simple, bon niveau gratuit pour démarrer |
| Tests | Vitest | Rapide, bonne intégration TypeScript |
| Déploiement | Vercel + Postgres managé (Neon) | Zéro-config avec Next.js, cron intégré |

## Installation locale

```bash
git clone <ce-repo>
cd couple-app
npm install
cp .env.example .env
```

Remplir `.env` :

```
DATABASE_URL=          # ex: base Neon gratuite (neon.tech)
AUTH_SECRET=            # générer avec `npx auth secret`
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=         # optionnel en dev — sans clé, les emails sont juste loggés en console
EMAIL_FROM=
CRON_SECRET=            # optionnel en dev
```

Appliquer le schéma à la base :

```bash
npx drizzle-kit push
```

(Utiliser `push` en développement pour itérer vite ; utiliser des migrations
versionnées `drizzle-kit generate` + `drizzle-kit migrate` pour la production,
voir plus bas.)

Lancer l'application :

```bash
npm run dev
```

Données de démonstration (optionnel) :

```bash
npm run seed
# Comptes créés : alice@demo.local / ben@demo.local, mot de passe : motdepasse-demo-123
```

## Tests

```bash
npm run test
```

18 tests unitaires (moteur de matching, rate limiter, hash de mot de passe,
calcul de semaine ISO). Deux tests d'intégration supplémentaires vérifient
l'isolation stricte entre couples au niveau de la base de données — ils sont
automatiquement ignorés sans `DATABASE_URL` pointant vers une base de test,
pour ne jamais risquer de toucher une base de production :

```bash
# Contre une base de test dédiée (jamais la production)
DATABASE_URL=postgres://... npm run test
```

## Modèle de données

Voir `src/db/schema.ts`. Points notables :

- `couple_members` est la table de jonction que **toute** requête doit
  traverser pour vérifier l'appartenance à un couple — jamais de requête
  directe sur `weekly_sessions` ou `partner_answers` à partir d'un id fourni
  par le client sans passer par `assertCoupleMembership`/`assertSessionAccess`.
- `boundaries.category = 'hard_limit'` est une catégorie à part : elle n'est
  jamais lue par `computeEveningPlan` (voir `src/lib/matching.ts`), et jamais
  exposée à l'API en dehors de son propriétaire.
- `users` utilise un soft delete (`deletedAt`) pour permettre la suppression
  de compte sans casser l'intégrité référentielle des sessions passées du
  couple.

## Décisions architecturales importantes

- **Server actions plutôt que routes API REST** pour la plupart des
  mutations : moins de code de plomberie, validation Zod centralisée, et
  protection CSRF native (Next.js vérifie l'origine des requêtes de server
  actions).
- **Rate limiting en mémoire** (`src/lib/rate-limit.ts`) : suffisant pour un
  MVP sur une seule instance. ⚠️ Avant un vrai lancement public en
  environnement serverless multi-instance, remplacer par
  [`@upstash/ratelimit`](https://github.com/upstash/ratelimit) (interface
  quasi identique).
- **Matching déterministe, pas d'IA dans le MVP.** Le moteur de règles
  (`src/lib/matching.ts`) est testé, prévisible et ne dépend d'aucun service
  externe pour une fonctionnalité cœur. Une IA pourrait être ajoutée en v2
  uniquement pour *habiller* le texte du résultat (voir section Roadmap).
- **Emails plutôt que push** pour le MVP : zéro configuration PWA/service
  worker nécessaire, fonctionne partout immédiatement.

## Déploiement en production

### 1. Base de données

Créer une base PostgreSQL managée (ex: [Neon](https://neon.tech), plan
gratuit suffisant pour démarrer). Récupérer l'URL de connexion.

Générer et appliquer les migrations versionnées (préférable à `push` en
production) :

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 2. Vercel

```bash
npm install -g vercel
vercel
```

Renseigner dans les variables d'environnement du projet Vercel :
`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (l'URL finale du
déploiement), `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`.

Le fichier `vercel.json` déclenche automatiquement `/api/cron/notifications`
tous les jours à 8h — Vercel injecte l'en-tête `Authorization: Bearer
$CRON_SECRET` automatiquement si la variable est définie.

### 3. Emails

Créer un compte [Resend](https://resend.com), vérifier un domaine d'envoi,
récupérer la clé API.

## Sécurité — checklist

- [x] Mots de passe hashés (argon2id)
- [x] Sessions JWT signées (Auth.js)
- [x] HTTPS (géré par Vercel)
- [x] Validation serveur systématique (Zod) sur toutes les server actions
- [x] Isolation stricte des données entre couples
- [x] Rate limiting sur inscription/connexion
- [x] Suppression de compte et suppression des données du couple
- [x] Aucun secret dans le code frontend (tout en variables d'env serveur)
- [x] `.env` jamais committé (`.gitignore`)
- [ ] Rate limiter à migrer vers Upstash Redis avant un lancement public multi-instance
- [ ] Audit de sécurité externe recommandé avant tout lancement public réel

## Roadmap

### MUST HAVE (fait dans ce MVP)
Auth, couple, invitation, choix du jour, questionnaire privé, matching,
révélation, journal, badges, notifications email, suppression des données.

### SHOULD HAVE (v1.1)
- Système de cartes hebdomadaires (romance / surprise / découverte / douceur / jeu / spontanéité)
- Onboarding guidé multi-étapes plus soigné visuellement
- Statistiques positives (moods préférés, jours préférés) sur le dashboard
- PWA installable ("Ajouter à l'écran d'accueil")
- Passe d'accessibilité complète (navigation clavier exhaustive, tests lecteur d'écran)

### NICE TO HAVE (v2+)
- IA pour habiller le texte de la soirée générée (jamais pour décider des
  préférences elles-mêmes ; jamais envoyer les `hard_limit` à un service externe)
- Génération de messages romantiques personnalisés
- Historique/souvenirs avec photos privées
- Notifications push (nécessite la PWA)

## Structure du projet

```
src/
  app/                  # Routes (App Router) — une page par écran
  components/           # Composants UI réutilisables
  db/
    schema.ts           # Modèle de données Drizzle (source de vérité)
    migrations/          # Migrations SQL générées
  lib/                  # Logique pure : matching, dates, validation, sécurité
  server/
    actions/            # Server actions (mutations), organisées par domaine
    authorization.ts    # Garde-fou central d'isolation des couples
scripts/
  seed.ts               # Données de démonstration
```
