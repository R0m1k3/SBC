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
    adresse      TEXT CHECK (char_length(adresse) <= 300),
    billing_type TEXT NOT NULL DEFAULT 'non_partner' CHECK (billing_type IN ('sluc_partner', 'non_partner')),
    presentation TEXT NOT NULL DEFAULT '' CHECK (char_length(presentation) <= 2000),
    valide       BOOLEAN NOT NULL DEFAULT false,
    logo_path    TEXT,
    photo_path   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE members ADD COLUMN IF NOT EXISTS adresse TEXT CHECK (char_length(adresse) <= 300);
ALTER TABLE members ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'non_partner';
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_billing_type_check;
ALTER TABLE members ADD CONSTRAINT members_billing_type_check CHECK (billing_type IN ('sluc_partner', 'non_partner'));

-- Image-rights consent (droit à l'image) collected electronically from the
-- member. Append-only audit trail: the current consent is the latest row
-- for a member, and withdrawing/changing adds a new row. Each row is a
-- simple electronic signature (art. 7 RGPD proof of consent): who, what
-- (decision + scopes + text version), when (created_at), plus a drawn
-- signature, IP and user-agent.
CREATE TABLE IF NOT EXISTS image_consents (
    id              BIGSERIAL PRIMARY KEY,
    member_id       INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    decision        TEXT NOT NULL CHECK (decision IN ('accepted', 'refused')),
    scopes          TEXT NOT NULL DEFAULT '',
    signatory_name  TEXT NOT NULL CHECK (char_length(signatory_name) BETWEEN 1 AND 120),
    signature_png   TEXT,
    consent_version TEXT NOT NULL DEFAULT '',
    ip              TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_image_consents_member ON image_consents(member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS users (
    id                   SERIAL PRIMARY KEY,
    email                CITEXT NOT NULL UNIQUE CHECK (char_length(email) <= 254),
    password_hash        TEXT NOT NULL,
    role                 TEXT NOT NULL CHECK (role IN ('member', 'admin', 'moderator', 'treasurer')),
    member_id            INTEGER UNIQUE REFERENCES members(id) ON DELETE CASCADE,
    -- Display name for staff accounts (member accounts show their
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
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'admin', 'moderator', 'treasurer'));

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
-- Per-participant image-rights declaration collected at event registration:
-- an adult cannot consent for another adult (art. 9 Code civil), so each
-- accompanying person's own decision is recorded, the member attesting they
-- informed the person and obtained their agreement. NULL = not answered.
ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS image_consent BOOLEAN;
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
    tel        TEXT CHECK (char_length(tel) <= 30),
    statut     TEXT NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'contactee', 'validee')),
    contacted_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ,
    member_id  INTEGER REFERENCES members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE demandes_adhesion ADD COLUMN IF NOT EXISTS tel TEXT CHECK (char_length(tel) <= 30);
ALTER TABLE demandes_adhesion ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;
ALTER TABLE demandes_adhesion ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;
ALTER TABLE demandes_adhesion ADD COLUMN IF NOT EXISTS member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;
ALTER TABLE demandes_adhesion DROP CONSTRAINT IF EXISTS demandes_adhesion_statut_check;
UPDATE demandes_adhesion SET statut = 'contactee', contacted_at = COALESCE(contacted_at, created_at)
  WHERE statut = 'traitee';
ALTER TABLE demandes_adhesion ADD CONSTRAINT demandes_adhesion_statut_check
  CHECK (statut IN ('nouvelle', 'contactee', 'validee'));

CREATE TABLE IF NOT EXISTS site_content (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT ''
);

-- Seasonal membership billing settings and immutable invoice snapshots.
CREATE TABLE IF NOT EXISTS billing_season_settings (
    season                TEXT PRIMARY KEY CHECK (season ~ '^[0-9]{4}-[0-9]{4}$'),
    sluc_partner_amount_ht NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sluc_partner_amount_ht >= 0),
    non_partner_amount_ht  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (non_partner_amount_ht >= 0),
    vat_rate               NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (vat_rate = 0),
    payment_due_days       INTEGER NOT NULL DEFAULT 30 CHECK (payment_due_days BETWEEN 0 AND 365),
    iban                   TEXT NOT NULL DEFAULT '' CHECK (char_length(iban) <= 42),
    legal_mentions         TEXT NOT NULL DEFAULT '' CHECK (char_length(legal_mentions) <= 3000),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE billing_season_settings ALTER COLUMN vat_rate SET DEFAULT 0;
UPDATE billing_season_settings SET vat_rate = 0 WHERE vat_rate <> 0;
ALTER TABLE billing_season_settings DROP CONSTRAINT IF EXISTS billing_season_settings_vat_rate_check;
ALTER TABLE billing_season_settings ADD CONSTRAINT billing_season_settings_vat_rate_check CHECK (vat_rate = 0);

CREATE SEQUENCE IF NOT EXISTS billing_invoice_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS membership_invoices (
    id                BIGSERIAL PRIMARY KEY,
    season            TEXT NOT NULL REFERENCES billing_season_settings(season) ON DELETE RESTRICT,
    member_id         INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    invoice_number    TEXT NOT NULL UNIQUE,
    issued_at         DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date          DATE NOT NULL,
    member_name       TEXT NOT NULL,
    member_address    TEXT NOT NULL DEFAULT '',
    member_email      TEXT NOT NULL DEFAULT '',
    billing_type      TEXT NOT NULL CHECK (billing_type IN ('sluc_partner', 'non_partner')),
    amount_ht         NUMERIC(12,2) NOT NULL CHECK (amount_ht >= 0),
    vat_rate          NUMERIC(5,2) NOT NULL CHECK (vat_rate BETWEEN 0 AND 100),
    vat_amount        NUMERIC(12,2) NOT NULL CHECK (vat_amount >= 0),
    amount_ttc        NUMERIC(12,2) NOT NULL CHECK (amount_ttc >= 0),
    issuer_snapshot   JSONB NOT NULL DEFAULT '{}'::jsonb,
    status            TEXT NOT NULL DEFAULT 'emise' CHECK (status IN ('emise', 'payee', 'annulee')),
    payment_method    TEXT CHECK (payment_method IN ('carte', 'virement', 'cheque')),
    paid_at           DATE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((status = 'payee' AND payment_method IS NOT NULL AND paid_at IS NOT NULL) OR status <> 'payee')
);
CREATE INDEX IF NOT EXISTS idx_membership_invoices_season ON membership_invoices(season);
CREATE INDEX IF NOT EXISTS idx_membership_invoices_member ON membership_invoices(member_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_invoices_active_member_season
  ON membership_invoices(member_id, season) WHERE status <> 'annulee';
-- Correct unpaid invoices created before the association's VAT exemption was
-- reflected in the billing module. Paid invoices remain immutable history.
UPDATE membership_invoices
   SET vat_rate = 0, vat_amount = 0, amount_ttc = amount_ht, updated_at = now()
 WHERE status = 'emise' AND (vat_rate <> 0 OR vat_amount <> 0 OR amount_ttc <> amount_ht);
