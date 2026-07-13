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
| `db`    | PostgreSQL 16 (vierge : l'application l'initialise elle-même) | `127.0.0.1:58412` (`DB_PORT`) — loopback uniquement, pour l'administration locale |

```
Navigateur ──> app (Express :8321) ──> db (PostgreSQL, 127.0.0.1:58412)
                 ├─ /api/…      API REST
                 ├─ /uploads/…  images (volume persistant)
                 └─ /…          frontend React (fallback SPA)
```

Le mapping PostgreSQL est lié à `127.0.0.1` : la base reste inaccessible depuis
le réseau. Supprimez la section `ports:` du service `db` pour la fermer totalement.

### Reverse-proxy nginx existant

Le conteneur `app` est aussi rattaché au réseau externe `nginx_default`
(configurable via `PROXY_NETWORK`) avec l'alias **`sbc-app`**. Depuis votre
stack nginx, pointez simplement l'upstream vers :

```nginx
proxy_pass http://sbc-app:8321;
```

Ce réseau doit exister avant le déploiement (`docker network create nginx_default`
s'il manque). Derrière nginx en HTTPS, passez `TRUST_PROXY=true` et
`COOKIE_SECURE=true`, et transmettez les en-têtes `Host`/`X-Forwarded-*`
(`proxy_set_header Host $http_host;`). La base de données, elle, reste hors du
réseau du proxy.

- **Frontend** : React 18 + Vite + React Router — reproduction fidèle de la maquette
  (`SLUC Business Club.dc.html`).
- **Backend** : Express, `pg` (requêtes paramétrées), `zod` (validation), `bcryptjs`
  (hachage), JWT en cookie httpOnly, `helmet`, `express-rate-limit`, `multer` (uploads).
- **Base** : PostgreSQL 16. L'application l'initialise **elle-même à chaque
  démarrage**, de façon idempotente (base, rôle restreint `sbc_app`, schéma,
  données de démo) : aucun script monté, aucun état de volume requis.

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

D'autres comptes administrateur ou modérateur se créent depuis le back-office
(onglet « Administrateurs », réservé aux admins) — voir ci-dessous.

Changez le mot de passe admin après la première connexion (Espace membre/admin →
formulaire « Mot de passe », endpoint `POST /api/auth/change-password`).

### Mots de passe temporaires

Quand un admin crée un nouveau membre (avec email) ou réinitialise son accès, un mot de
passe temporaire aléatoire (~69 bits d'entropie, sans caractères ambigus) est généré et
haché avec bcrypt comme n'importe quel mot de passe. Une copie en clair est conservée
en base (colonne `users.temp_password`) **uniquement le temps que le membre ne l'ait pas
changé** — elle est automatiquement effacée dès son premier changement de mot de passe
(forcé ou volontaire), et n'est jamais exposée par une route publique ou membre, seulement
par les routes admin (`GET /api/admin/members`, `POST /api/admin/members`,
`POST /api/admin/members/:id/reset-access`). À la connexion avec un mot de passe temporaire,
l'utilisateur est bloqué sur un écran de changement obligatoire avant d'accéder à son espace.

## Fonctionnalités

**Site public**
- Accueil : héro éditorial (citation et photo administrables), carrousel des membres,
  prochaines rencontres avec inscription en ligne (contrôle de capacité et de doublon),
  rencontres passées, formulaire de demande d'adhésion.
- Annuaire : recherche plein texte, filtres par catégorie, fiche détaillée par entreprise.
  Seuls les membres **validés pour la saison** apparaissent.
- Rencontres passées : page dédiée listant toutes les rencontres passées ; un clic ouvre un
  carrousel plein écran de **toutes** les photos (flèches, clavier, miniatures). Le nombre de
  participants et de photos est calculé automatiquement (voir back-office).
- L'association : mission, valeurs, mot du président, chronologie, chiffres clés.

**Espace membre** (connexion email + mot de passe)
- Édition de sa fiche annuaire avec aperçu en direct.
- Upload du logo et de la photo dirigeant·e (JPEG/PNG/WebP, 2 Mo max, vérification
  des octets magiques côté serveur).
- Bannière d'état d'adhésion (validée / à renouveler) et changement de mot de passe.

**Rôles du back-office**
- **Administrateur** : accès complet — tableau de bord, membres, rencontres, inscriptions,
  catégories, contenu du site, et gestion des comptes administrateurs/modérateurs.
- **Modérateur** : accès aux membres, aux rencontres, aux rencontres passées et aux
  inscriptions (opérations du quotidien : créer, éditer) ; pas de tableau de bord, pas de
  catégories, pas de contenu du site, pas de gestion des comptes. Aucune action destructrice
  n'est autorisée à un modérateur : il ne peut ni valider/suspendre un membre, ni supprimer
  une rencontre, une rencontre passée ou une inscription — ces actions restent strictement
  réservées aux administrateurs, imposé côté serveur (pas seulement caché dans l'interface).
  Un modérateur peut être promu administrateur (et inversement) depuis l'onglet
  « Administrateurs ». Le système empêche de se supprimer ou de se rétrograder soi-même,
  et de supprimer le dernier compte administrateur restant.

**Espace admin** (rôle `admin`)
- Administrateurs : création de comptes administrateur ou modérateur (mot de passe
  temporaire généré, changement obligatoire à la première connexion — même mécanique
  que pour les membres), réinitialisation d'accès, promotion/rétrogradation, suppression.
- Tableau de bord : indicateurs temps réel, dernières inscriptions, prochaines rencontres.
- Membres : création, édition ; validation/suspension par saison réservée aux administrateurs
  (1er sept. → 31 août). La création d'un membre avec email génère automatiquement un mot de
  passe temporaire, affiché à l'admin et copiable ; il reste visible dans la liste tant que le
  membre ne l'a pas changé. L'admin peut aussi réinitialiser l'accès à tout moment.
- Rencontres : création, édition (avec photo affichée sur les cartes de la page d'accueil) ;
  suppression réservée aux administrateurs. Liste des inscrits avec impression et export Excel.
- Rencontres passées : gestion complète de la section « Ils y étaient » et de la page publique
  dédiée — titre, date, lieu, description, et **galerie de photos illimitée** par rencontre
  (ajout, suppression réservée aux admins, choix de la photo principale mise en avant). Le
  **nombre de photos affiché est celui réellement uploadé** (jamais saisi à la main), et le
  **nombre de participants est récupéré automatiquement** quand la rencontre passée est liée à
  une rencontre (comptage de ses inscriptions) ; sinon une valeur manuelle sert de repli.
  La suppression d'une rencontre passée ou d'une de ses photos est réservée aux administrateurs.
- Inscriptions : modification, confirmation ; annulation (suppression) réservée aux administrateurs.
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
- **Autorisation** : middleware de rôles (`member` / `moderator` / `admin`) sur chaque
  route protégée ; un membre ne peut modifier que sa propre fiche ; les routes
  administratives sensibles (catégories en écriture, contenu du site, demandes
  d'adhésion, gestion des comptes) restent strictement admin-only même si un
  modérateur est authentifié.
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

## Dépannage

- **`password authentication failed for user "sbc_app"`** : impossible dans la
  version courante tant que `PG_SUPERUSER_PASSWORD` correspond au mot de passe
  superuser du volume — l'application recrée/realigne le rôle et le schéma à
  chaque démarrage. Si le mot de passe **superuser** du volume diffère de
  `POSTGRES_PASSWORD`, remettez l'ancienne valeur ou supprimez le volume
  `db_data` pour repartir de zéro (les données de démo seront recréées).
- **Port déjà utilisé** : changez `APP_PORT` ou `DB_PORT` dans les variables
  d'environnement.

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
cd web && npm install && npm run dev   # proxy /api → localhost:8321
```

## Structure

```
├── docker-compose.yml
├── Dockerfile          # multi-étages : build React → dépendances API → image finale
├── .env.example
├── server/             # API Express (src/routes, src/sql = schéma + seed, uploads)
└── web/                # sources React + Vite (compilées dans l'image)
```
