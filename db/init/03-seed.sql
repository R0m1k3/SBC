-- SLUC Business Club — demo seed data (content from the design mock)
-- User passwords are NOT stored here: accounts are created with the
-- unusable placeholder hash '*seed*' and receive their real (bcrypt)
-- password from the API at startup, based on ADMIN_INITIAL_PASSWORD /
-- MEMBER_INITIAL_PASSWORD environment variables.

INSERT INTO categories (name) VALUES
  ('Conseil & Finance'),
  ('Industrie & BTP'),
  ('Communication & Digital'),
  ('Services'),
  ('Santé');

INSERT INTO members (nom, secteur, categorie_id, dirigeant, adhesion, email, tel, site, presentation, valide) VALUES
  ('Lorraine Assurances', 'Assurance & Prévoyance', 1, 'Sophie Marchand', 2014, 'contact@lorraine-assurances.fr', '+33 3 83 12 45 60', 'lorraine-assurances.fr', 'Cabinet de courtage indépendant accompagnant les entreprises et dirigeants du Grand Est sur l''ensemble de leurs besoins en assurance et prévoyance.', true),
  ('Groupe Batigest', 'BTP & Construction', 2, 'Philippe Aubry', 2009, 'contact@batigest.fr', '+33 3 83 22 18 04', 'groupe-batigest.fr', 'Entreprise générale de construction et de rénovation, acteur majeur du bâtiment en Lorraine depuis plus de trente ans.', true),
  ('Moselle Digital', 'Agence digitale', 3, 'Karim Benali', 2019, 'hello@moselle-digital.fr', '+33 3 83 55 71 22', 'moselle-digital.fr', 'Agence de communication digitale spécialisée dans la création de sites, le référencement et les stratégies social media pour les PME.', true),
  ('Renard & Associés', 'Cabinet d''avocats', 1, 'Me Claire Renard', 2012, 'contact@renard-avocats.fr', '+33 3 83 30 09 15', 'renard-avocats.fr', 'Cabinet d''avocats d''affaires conseillant dirigeants et entreprises en droit des sociétés, droit social et droit commercial.', true),
  ('NancyTech Solutions', 'Solutions informatiques', 3, 'Thomas Villeret', 2020, 'contact@nancytech.fr', '+33 3 83 41 88 90', 'nancytech.fr', 'Infogérance, cybersécurité et déploiement d''outils métiers pour accompagner la transformation numérique des entreprises régionales.', true),
  ('Est Immobilier', 'Immobilier d''entreprise', 4, 'Nathalie Perrin', 2016, 'contact@est-immobilier.fr', '+33 3 83 17 62 30', 'est-immobilier.fr', 'Conseil en immobilier d''entreprise : bureaux, locaux commerciaux et investissement sur l''agglomération nancéienne.', true),
  ('Vosges Logistique', 'Transport & Logistique', 4, 'Bruno Kieffer', 2011, 'contact@vosges-logistique.fr', '+33 3 29 34 12 78', 'vosges-logistique.fr', 'Solutions de transport, entreposage et distribution au service des industriels et distributeurs du Grand Est.', false),
  ('Meurthe Industries', 'Industrie & Métallurgie', 2, 'Laurent Schmitt', 2008, 'contact@meurthe-industries.fr', '+33 3 83 49 05 11', 'meurthe-industries.fr', 'Sous-traitance industrielle de précision et travail des métaux pour les secteurs de l''automobile et de l''énergie.', true),
  ('Grand Est Finance', 'Conseil financier', 1, 'Isabelle Fontaine', 2017, 'contact@grandest-finance.fr', '+33 3 83 25 44 90', 'grandest-finance.fr', 'Conseil en gestion de patrimoine et financement d''entreprise, aux côtés des dirigeants dans leurs projets de croissance.', true),
  ('Atelier Lumière', 'Communication & Design', 3, 'Julie Mercier', 2021, 'bonjour@atelier-lumiere.fr', '+33 3 83 60 77 08', 'atelier-lumiere.fr', 'Studio de création graphique et d''identité de marque, du logo à la signalétique, pour donner du sens à votre image.', true),
  ('Pharma Lorraine', 'Laboratoire pharmaceutique', 5, 'Dr Antoine Rousseau', 2013, 'contact@pharma-lorraine.fr', '+33 3 83 90 21 47', 'pharma-lorraine.fr', 'Laboratoire de production et de distribution de solutions de santé, engagé dans l''innovation et la qualité.', false),
  ('Cristal Événements', 'Événementiel', 4, 'Émilie Colin', 2018, 'contact@cristal-events.fr', '+33 3 83 38 66 12', 'cristal-events.fr', 'Agence événementielle imaginant séminaires, soirées d''entreprise et événements sur-mesure clés en main.', true);

INSERT INTO rencontres (titre, date_renc, heure, lieu, description, places) VALUES
  ('Afterwork Business & Basket', '2026-09-17', '18h30', 'Palais des Sports J. Weille', 'Networking en tribune VIP autour d''un cocktail, suivi du match SLUC Nancy – Cholet. Le rendez-vous incontournable de la rentrée.', 40),
  ('Petit-déjeuner des Dirigeants', '2026-10-06', '08h00', 'Hôtel Mercure Nancy Centre', 'Échanges entre dirigeants autour d''un intervenant invité, dans un format intimiste propice aux affaires.', 25),
  ('Conférence — L''esprit d''équipe', '2026-11-19', '19h00', 'Grand Salon, Hôtel de Ville', 'Un coach de haut niveau partage les ressorts de la performance collective, du terrain à l''entreprise.', 80);

INSERT INTO inscriptions (rencontre_id, nom, entreprise, email, tel, statut) VALUES
  (1, 'Sophie Marchand', 'Lorraine Assurances', 's.marchand@lorraine-assurances.fr', '+33 3 83 12 45 60', 'confirmee'),
  (1, 'Karim Benali', 'Moselle Digital', 'k.benali@moselle-digital.fr', '+33 3 83 55 71 22', 'en_attente'),
  (2, 'Thomas Villeret', 'NancyTech Solutions', 't.villeret@nancytech.fr', '+33 3 83 41 88 90', 'confirmee'),
  (3, 'Nathalie Perrin', 'Est Immobilier', 'n.perrin@est-immobilier.fr', '+33 3 83 17 62 30', 'en_attente'),
  (2, 'Bruno Kieffer', 'Vosges Logistique', 'b.kieffer@vosges-logistique.fr', '+33 3 29 34 12 78', 'confirmee'),
  (1, 'Julie Mercier', 'Atelier Lumière', 'j.mercier@atelier-lumiere.fr', '+33 3 83 60 77 08', 'en_attente'),
  (1, 'Laurent Schmitt', 'Meurthe Industries', 'l.schmitt@meurthe-industries.fr', '+33 3 83 49 05 11', 'confirmee'),
  (3, 'Isabelle Fontaine', 'Grand Est Finance', 'i.fontaine@grandest-finance.fr', '+33 3 83 25 44 90', 'confirmee'),
  (2, 'Me Claire Renard', 'Renard & Associés', 'c.renard@renard-avocats.fr', '+33 3 83 30 09 15', 'en_attente'),
  (1, 'Émilie Colin', 'Cristal Événements', 'e.colin@cristal-events.fr', '+33 3 83 38 66 12', 'confirmee'),
  (3, 'Philippe Aubry', 'Groupe Batigest', 'p.aubry@batigest.fr', '+33 3 83 22 18 04', 'confirmee');

INSERT INTO rencontres_passees (date_label, lieu, titre, texte, participants, nb_photos) VALUES
  ('Juin 2026', 'Château de Rémicourt', 'Soirée de Gala annuelle', 'Plus de 200 convives réunis pour célébrer une saison d''exception. Une soirée d''élégance mêlant remise de trophées, dîner gastronomique et rencontres privilégiées entre membres du Club.', 210, 48),
  ('Avril 2026', 'Site industriel, Florange', 'Visite privée — Usine ArcelorMittal', 'Immersion industrielle exclusive pour nos membres au cœur d''un fleuron de la métallurgie lorraine, suivie d''un échange avec la direction du site.', 34, 22),
  ('Février 2026', 'La Filature, Nancy', 'Table ronde — Digitaliser sa PME', 'Retours d''expérience et bonnes pratiques : trois dirigeants membres ont partagé leur parcours de transformation numérique devant une salle comble.', 56, 15);

INSERT INTO demandes_adhesion (nom, fonction, entreprise, email) VALUES
  ('Marc Dubois', 'Directeur général', 'Dubois Traiteur', 'm.dubois@dubois-traiteur.fr'),
  ('Léa Hoffmann', 'Présidente', 'Hoffmann Conseil', 'l.hoffmann@hoffmann-conseil.fr'),
  ('Julien Weber', 'Gérant', 'Weber Menuiserie', 'j.weber@weber-menuiserie.fr');

INSERT INTO site_content (key, value) VALUES
  ('hero_quote_text', 'On ne réussit jamais seul.'),
  ('hero_quote_author', 'L''esprit du Club'),
  ('hero_photo', '');

-- Accounts: one admin + one portal account per member company.
-- '*seed*' is an intentionally unusable hash; real passwords are applied
-- by the API at startup from environment variables.
INSERT INTO users (email, password_hash, role, member_id)
SELECT email, '*seed*', 'member', id FROM members WHERE email IS NOT NULL;

INSERT INTO users (email, password_hash, role) VALUES
  ('admin@sluc-businessclub.fr', '*seed*', 'admin');
