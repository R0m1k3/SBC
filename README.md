# Business Club SLUC Nancy

Application web complète du réseau d'affaires des partenaires du SLUC Nancy Basket :
site public (accueil, annuaire des membres, association), espace membre et
back-office d'administration.

## Architecture

Deux conteneurs orchestrés par Docker Compose, sur des ports peu utilisés
(configurables dans `.env`) :

| Service | Rôle | Port hôte |
|---------|------|-----------|
| `app`   | Node.js 22 / Express : API REST **et** frontend React compilé **et** images `/uploads` | `8321` (`APP_PORT`) |
| `db`    | PostgreSQL 16 (schéma + données de démo au premier démarrage) | `127.0.0.1:56432` (`DB_PORT`) — loopback uniquement, pour l'administration locale |

```
Navigateur ──> app (Express :8321) ──> db (PostgreSQL, 127.0.0.1:56432)
                 ├─ /api/…      API REST
                 ├─ /uploads/…  images (volume persistant)
                 └─ /…          frontend React (fallback SPA)
```

Le mapping PostgreSQL est lié à `127.0.0.1` : la base reste inaccessible depuis
le réseau. Supprimez la section `ports:` du service `db` pour la fermer totalement.

- **Frontend** : React 18 + Vite + React Router — reproduction fidèle de la maquette
  (`SLUC Business Club.dc.html`).
- **Backend** : Express, `pg` (requêtes paramétrées), `zod` (validation), `bcryptjs`
  (hachage), JWT en cookie httpOnly, `helmet`, `express-rate-limit`, `multer` (uploads).
- **Base** : PostgreSQL 16, initialisée par `db/init/` (rôle applicatif restreint,
  schéma, données de démonstration).

## Démarrage

```bash
docker compose up -d --build
```

Aucune configuration n'est requise : des valeurs par défaut sont préréglées
(mots de passe de base de données, comptes initiaux) et le secret JWT est
généré aléatoirement au démarrage s'il n'est pas fourni. Compatible avec un
déploiement direct depuis Git dans Portainer.

Pour la production, surchargez ces valeurs via un fichier `.env`
(voir `.env.example`) ou les variables d'environnement de Portainer.

L'application est disponible sur <http://localhost:8321> (port configurable via `APP_PORT`).

## Comptes

Les comptes de démonstration sont créés **verrouillés** en base. Au démarrage,
l'API leur applique le mot de passe des variables d'environnement — uniquement
s'ils n'en ont pas déjà un :

| Rôle | Email | Mot de passe initial (défaut) |
|------|-------|-------------------------------|
| Admin | `admin@sluc-businessclub.fr` | `ADMIN_INITIAL_PASSWORD` (défaut : `SlucAdmin2026!`) |
| Membre (×12) | email de contact de chaque entreprise de démo, ex. `contact@lorraine-assurances.fr` | `MEMBER_INITIAL_PASSWORD` (défaut : `SlucMembre2026!`) |

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
  l'email est inconnu, JWT HS256 signé (secret fourni via `JWT_SECRET` ou généré
  aléatoirement au démarrage), session de 12 h.
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
  servis avec `X-Content-Type-Options: nosniff` et une CSP `default-src 'none'`.
- **En-têtes** : CSP stricte, `X-Frame-Options: DENY` et toute la panoplie `helmet`
  sur l'ensemble des réponses (API, frontend, uploads).
- **Conteneurs** : application en utilisateur non-root avec système de fichiers en
  lecture seule (`read_only` + tmpfs), `no-new-privileges`, PostgreSQL publié
  uniquement sur `127.0.0.1` (inaccessible depuis le réseau).
- **Base de données** : l'API se connecte avec un rôle dédié `sbc_app` limité au DML
  (pas de DDL, pas de superuser).
- **Secrets** : surchargeables via `.env` / variables d'environnement ; le secret
  JWT n'est jamais committé (généré aléatoirement si absent) ; les valeurs par
  défaut préréglées ne servent qu'au démarrage clé en main et doivent être
  remplacées en production.
- **Erreurs** : les détails restent dans les logs serveur, les clients reçoivent un
  message générique.

### Pour la production

- Placez l'application derrière HTTPS (reverse-proxy TLS) et passez `COOKIE_SECURE=true`
  et `TRUST_PROXY=true`.
- Surchargez les valeurs par défaut (`POSTGRES_PASSWORD`, `APP_DB_PASSWORD`,
  `JWT_SECRET`, mots de passe initiaux) et changez le mot de passe admin
  après la première connexion.
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
├── Dockerfile          # multi-étages : build React → dépendances API → image finale
├── .env.example
├── db/init/            # 01 rôle applicatif · 02 schéma · 03 données de démo
├── server/             # API Express (src/routes, src/middleware, uploads, statique)
└── web/                # sources React + Vite (compilées dans l'image)
```
