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
    role                 TEXT NOT NULL CHECK (role IN ('member', 'admin')),
    member_id            INTEGER UNIQUE REFERENCES members(id) ON DELETE CASCADE,
    -- Temporary password shown to the admin (create / reset access), kept
    -- readable only until the user changes it — cleared automatically at
    -- that point. NULL once a real password has been chosen by the user.
    temp_password        TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ALTER ... IF NOT EXISTS heals databases that already had this table
-- before these columns were introduced.
ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS rencontres (
    id          SERIAL PRIMARY KEY,
    titre       TEXT NOT NULL CHECK (char_length(titre) BETWEEN 1 AND 200),
    date_renc   DATE NOT NULL,
    heure       TEXT NOT NULL DEFAULT '' CHECK (char_length(heure) <= 20),
    lieu        TEXT NOT NULL DEFAULT '' CHECK (char_length(lieu) <= 200),
    description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
    places      INTEGER NOT NULL CHECK (places >= 0 AND places <= 100000),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inscriptions (
    id           SERIAL PRIMARY KEY,
    rencontre_id INTEGER NOT NULL REFERENCES rencontres(id) ON DELETE CASCADE,
    nom          TEXT NOT NULL CHECK (char_length(nom) BETWEEN 1 AND 120),
    entreprise   TEXT NOT NULL CHECK (char_length(entreprise) BETWEEN 1 AND 120),
    email        CITEXT CHECK (char_length(email) <= 254),
    tel          TEXT CHECK (char_length(tel) <= 30),
    statut       TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('confirmee', 'en_attente')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inscriptions_rencontre ON inscriptions(rencontre_id);

CREATE TABLE IF NOT EXISTS rencontres_passees (
    id           SERIAL PRIMARY KEY,
    date_label   TEXT NOT NULL,
    lieu         TEXT NOT NULL,
    titre        TEXT NOT NULL,
    texte        TEXT NOT NULL,
    participants INTEGER NOT NULL DEFAULT 0,
    nb_photos    INTEGER NOT NULL DEFAULT 0
);

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
