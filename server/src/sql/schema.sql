-- SLUC Business Club — idempotent schema (applied at every app startup)
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS categories (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 80)
);

CREATE TABLE IF NOT EXISTS members (
    id           SERIAL PRIMARY KEY,
    nom          TEXT NOT NULL CHECK (char_length(nom) BETWEEN 1 AND 120),
    secteur      TEXT NOT NULL DEFAULT '' CHECK (char_length(secteur) <= 120),
    categorie_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    dirigeant    TEXT NOT NULL DEFAULT '' CHECK (char_length(dirigeant) <= 120),
    adhesion     SMALLINT,
    email        CITEXT CHECK (char_length(email) <= 254),
    tel          TEXT CHECK (char_length(tel) <= 30),
    site         TEXT CHECK (char_length(site) <= 200),
    presentation TEXT NOT NULL DEFAULT '' CHECK (char_length(presentation) <= 2000),
    valide       BOOLEAN NOT NULL DEFAULT false,
    logo_path    TEXT,
    photo_path   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id                   SERIAL PRIMARY KEY,
    email                CITEXT NOT NULL UNIQUE CHECK (char_length(email) <= 254),
    password_hash        TEXT NOT NULL,
    role                 TEXT NOT NULL CHECK (role IN ('member', 'admin', 'moderator')),
    member_id            INTEGER UNIQUE REFERENCES members(id) ON DELETE CASCADE,
    -- Display name for admin/moderator accounts (member accounts show their
    -- name via the linked members row instead, this stays NULL for them).
    full_name            TEXT,
    -- Temporary password shown to the admin (create / reset access), kept
    -- readable only until the user changes it — cleared automatically at
    -- that point. NULL once a real password has been chosen by the user.
    temp_password        TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ALTER ... IF NOT EXISTS / DROP+ADD CONSTRAINT heal databases that already
-- had this table before these columns/roles were introduced.
ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'admin', 'moderator'));

CREATE TABLE IF NOT EXISTS rencontres (
    id          SERIAL PRIMARY KEY,
    titre       TEXT NOT NULL CHECK (char_length(titre) BETWEEN 1 AND 200),
    date_renc   DATE NOT NULL,
    heure       TEXT NOT NULL DEFAULT '' CHECK (char_length(heure) <= 20),
    lieu        TEXT NOT NULL DEFAULT '' CHECK (char_length(lieu) <= 200),
    description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
    places      INTEGER NOT NULL CHECK (places >= 0 AND places <= 100000),
    participants_par_compte INTEGER NOT NULL DEFAULT 1 CHECK (participants_par_compte BETWEEN 1 AND 100),
    image_path  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE rencontres ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE rencontres ADD COLUMN IF NOT EXISTS participants_par_compte INTEGER NOT NULL DEFAULT 1;
ALTER TABLE rencontres DROP CONSTRAINT IF EXISTS rencontres_participants_par_compte_check;
ALTER TABLE rencontres ADD CONSTRAINT rencontres_participants_par_compte_check
  CHECK (participants_par_compte BETWEEN 1 AND 100);

CREATE TABLE IF NOT EXISTS inscriptions (
    id           SERIAL PRIMARY KEY,
    rencontre_id INTEGER NOT NULL REFERENCES rencontres(id) ON DELETE CASCADE,
    member_id    INTEGER REFERENCES members(id) ON DELETE SET NULL,
    nom          TEXT NOT NULL CHECK (char_length(nom) BETWEEN 1 AND 120),
    entreprise   TEXT NOT NULL CHECK (char_length(entreprise) BETWEEN 1 AND 120),
    email        CITEXT CHECK (char_length(email) <= 254),
    tel          TEXT CHECK (char_length(tel) <= 30),
    statut       TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('confirmee', 'en_attente')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inscriptions_rencontre ON inscriptions(rencontre_id);
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inscriptions_member_rencontre ON inscriptions(member_id, rencontre_id);
-- Attach legacy registrations when their email identifies a member account.
UPDATE inscriptions i SET member_id = m.id
  FROM members m
 WHERE i.member_id IS NULL AND i.email IS NOT NULL AND i.email = m.email;

CREATE TABLE IF NOT EXISTS rencontres_passees (
    id           SERIAL PRIMARY KEY,
    date_label   TEXT NOT NULL,
    lieu         TEXT NOT NULL,
    titre        TEXT NOT NULL,
    texte        TEXT NOT NULL,
    -- Fallback participant count, used only when this event is NOT linked to
    -- a rencontre. When rencontre_id is set, the count is derived live from
    -- that rencontre's inscriptions.
    participants INTEGER NOT NULL DEFAULT 0,
    -- Optional link to the rencontre this event came from (auto stats).
    rencontre_id INTEGER REFERENCES rencontres(id) ON DELETE SET NULL,
    -- Legacy inline photo columns, migrated into rencontre_passee_photos below.
    nb_photos    INTEGER NOT NULL DEFAULT 0,
    image_path   TEXT,
    image_path_2 TEXT,
    image_path_3 TEXT
);
ALTER TABLE rencontres_passees ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE rencontres_passees ADD COLUMN IF NOT EXISTS image_path_2 TEXT;
ALTER TABLE rencontres_passees ADD COLUMN IF NOT EXISTS image_path_3 TEXT;
ALTER TABLE rencontres_passees ADD COLUMN IF NOT EXISTS rencontre_id INTEGER REFERENCES rencontres(id) ON DELETE SET NULL;

-- Unlimited photos per past event (gallery / carousel).
CREATE TABLE IF NOT EXISTS rencontre_passee_photos (
    id                  SERIAL PRIMARY KEY,
    rencontre_passee_id INTEGER NOT NULL REFERENCES rencontres_passees(id) ON DELETE CASCADE,
    image_path          TEXT NOT NULL,
    position            INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rpp_event ON rencontre_passee_photos(rencontre_passee_id);

-- One-time migration of the legacy inline image columns into the photos
-- table. Idempotent: after the UPDATE nulls the columns, it becomes a no-op.
INSERT INTO rencontre_passee_photos (rencontre_passee_id, image_path, position)
  SELECT id, image_path, 0 FROM rencontres_passees WHERE image_path IS NOT NULL;
INSERT INTO rencontre_passee_photos (rencontre_passee_id, image_path, position)
  SELECT id, image_path_2, 1 FROM rencontres_passees WHERE image_path_2 IS NOT NULL;
INSERT INTO rencontre_passee_photos (rencontre_passee_id, image_path, position)
  SELECT id, image_path_3, 2 FROM rencontres_passees WHERE image_path_3 IS NOT NULL;
UPDATE rencontres_passees SET image_path = NULL, image_path_2 = NULL, image_path_3 = NULL
  WHERE image_path IS NOT NULL OR image_path_2 IS NOT NULL OR image_path_3 IS NOT NULL;

CREATE TABLE IF NOT EXISTS demandes_adhesion (
    id         SERIAL PRIMARY KEY,
    nom        TEXT NOT NULL CHECK (char_length(nom) BETWEEN 1 AND 120),
    fonction   TEXT NOT NULL DEFAULT '' CHECK (char_length(fonction) <= 120),
    entreprise TEXT NOT NULL CHECK (char_length(entreprise) BETWEEN 1 AND 120),
    email      CITEXT NOT NULL CHECK (char_length(email) <= 254),
    statut     TEXT NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'traitee')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_content (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);
