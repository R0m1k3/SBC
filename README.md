# Business Club SLUC Nancy

Application web complète du réseau d'affaires des partenaires du SLUC Nancy Basket :
site public (accueil, annuaire des membres, association), espace membre et
back-office d'administration.

## Architecture

Trois conteneurs orchestrés par Docker Compose :

| Service | Rôle | Exposition |
|---------|------|------------|
| `db`    | PostgreSQL 16 (schéma + données de démo au premier démarrage) | réseau interne uniquement, aucun port publié |
| `api`   | API REST Node.js 22 / Express (auth, membres, rencontres, inscriptions, catégories, contenu, uploads) | réseau interne uniquement |
| `web`   | nginx (non-root) : frontend React compilé, reverse-proxy `/api`, service des images `/uploads` | port `8080` |

```
Navigateur ──> web (nginx :8080) ──> api (Express :3000) ──> db (PostgreSQL :5432)
                    │  /uploads (volume partagé, lecture seule)
                    └─ fichiers statiques React
```

- **Frontend** : React 18 + Vite + React Router — reproduction fidèle de la maquette
  (`SLUC Business Club.dc.html`).
- **Backend** : Express, `pg` (requêtes paramétrées), `zod` (validation), `bcryptjs`
  (hachage), JWT en cookie httpOnly, `helmet`, `express-rate-limit`, `multer` (uploads).
- **Base** : PostgreSQL 16, initialisée par `db/init/` (rôle applicatif restreint,
  schéma, données de démonstration).

## Démarrage

```bash
cp .env.example .env
# Éditez .env : générez des secrets forts
#   openssl rand -hex 32   → JWT_SECRET
#   openssl rand -hex 24   → POSTGRES_PASSWORD et APP_DB_PASSWORD
# puis choisissez ADMIN_INITIAL_PASSWORD / MEMBER_INITIAL_PASSWORD

docker compose up -d --build
```

L'application est disponible sur <http://localhost:8080> (port configurable via `WEB_PORT`).

## Comptes

Les comptes de démonstration sont créés **verrouillés** (aucun mot de passe en dur
dans le dépôt). Au démarrage, l'API leur applique le mot de passe des variables
d'environnement — uniquement s'ils n'en ont pas déjà un :

| Rôle | Email | Mot de passe initial |
|------|-------|----------------------|
| Admin | `admin@sluc-businessclub.fr` | `ADMIN_INITIAL_PASSWORD` |
| Membre (×12) | email de contact de chaque entreprise de démo, ex. `contact@lorraine-assurances.fr` | `MEMBER_INITIAL_PASSWORD` |

Changez le mot de passe admin après la première connexion (Espace membre/admin →
formulaire « Mot de passe », endpoint `POST /api/auth/change-password`).

## Fonctionnalités

**Site public**
- Accueil : héro éditorial (citation et photo administrables), carrousel des membres,
  prochaines rencontres avec inscription en ligne (contrôle de capacité et de doublon),
  rencontres passées, formulaire de demande d'adhésion.
- Annuaire : recherche plein texte, filtres par catégorie, fiche détaillée par entreprise.
  Seuls les membres **validés pour la saison** apparaissent.
- L'association : mission, valeurs, mot du président, chronologie, chiffres clés.

**Espace membre** (connexion email + mot de passe)
- Édition de sa fiche annuaire avec aperçu en direct.
- Upload du logo et de la photo dirigeant·e (JPEG/PNG/WebP, 2 Mo max, vérification
  des octets magiques côté serveur).
- Bannière d'état d'adhésion (validée / à renouveler) et changement de mot de passe.

**Espace admin** (rôle `admin`)
- Tableau de bord : indicateurs temps réel, dernières inscriptions, prochaines rencontres.
- Membres : création, édition, validation/suspension par saison (1er sept. → 31 août).
- Rencontres : création, édition, suppression ; liste des inscrits avec impression
  et export Excel.
- Inscriptions : modification, confirmation, annulation avec confirmation.
- Catégories : ajout, renommage, suppression (les entreprises deviennent « Non classée »).
- Contenu du site : citation, signature et photo de la page d'accueil.

## Sécurité

- **Injection SQL** : 100 % de requêtes paramétrées (`pg`), aucun SQL concaténé.
- **Authentification** : bcrypt (coût 12), comparaison à temps constant même si
  l'email est inconnu, JWT HS256 signé (secret ≥ 32 caractères exigé au démarrage),
  session de 12 h.
- **Cookies** : `httpOnly`, `SameSite=Strict`, `Secure` activable (`COOKIE_SECURE=true`
  derrière HTTPS).
- **CSRF** : cookie SameSite=Strict + vérification de l'en-tête `Origin` sur toutes
  les mutations.
- **Autorisation** : middleware de rôles (`member` / `admin`) sur chaque route protégée ;
  un membre ne peut modifier que sa propre fiche.
- **Validation** : schémas `zod` sur toutes les entrées (types, longueurs, formats),
  contraintes `CHECK` en base en seconde ligne.
- **Rate limiting** : global (300/min), connexion (10 / 15 min), formulaires publics
  (20 / h).
- **Uploads** : taille ≤ 2 Mo, type vérifié par octets magiques (jamais le MIME client),
  nom de fichier aléatoire généré côté serveur (aucune traversée de chemin possible),
  servis par nginx avec `X-Content-Type-Options: nosniff` et types MIME forcés.
- **En-têtes** : CSP stricte, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, `helmet` côté API, `server_tokens off`.
- **Conteneurs** : API en utilisateur non-root avec système de fichiers en lecture
  seule (`read_only` + tmpfs), nginx non privilégié, `no-new-privileges`, PostgreSQL
  sans port publié sur un réseau interne (`internal: true`).
- **Base de données** : l'API se connecte avec un rôle dédié `sbc_app` limité au DML
  (pas de DDL, pas de superuser).
- **Secrets** : uniquement via `.env` (ignoré par git) ; `docker compose` refuse de
  démarrer sans eux ; aucun hash ni mot de passe committé.
- **Erreurs** : les détails restent dans les logs serveur, les clients reçoivent un
  message générique.

### Pour la production

- Placez l'application derrière HTTPS (reverse-proxy TLS) et passez `COOKIE_SECURE=true`.
- Changez immédiatement les mots de passe initiaux.
- Sauvegardez les volumes `db_data` (base) et `uploads` (images).

## Développement local (sans Docker)

```bash
# Terminal 1 — base de données PostgreSQL locale + variables d'env, puis :
cd server && npm install && npm start
# Terminal 2
cd web && npm install && npm run dev   # proxy /api → localhost:3000
```

## Structure

```
├── docker-compose.yml
├── .env.example
├── db/init/            # 01 rôle applicatif · 02 schéma · 03 données de démo
├── server/             # API Express (src/routes, src/middleware, uploads)
└── web/                # React + Vite, nginx.conf, Dockerfile multi-étages
```
