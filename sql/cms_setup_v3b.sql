-- =====================================================================
-- Müllerhof CMS v3b – Generische Karten-Listen
-- Eine Tabelle für alle "Listen-artigen" Inhalte:
-- Räume, Bereich-Cards, Eventkategorien, Regular Events, Quick-Bar,
-- Timeline, etc. - alle bearbeitbar im Admin.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cms_cards (
  id          BIGSERIAL PRIMARY KEY,
  list_key    TEXT        NOT NULL,   -- z.B. 'rooms_index', 'bereiche_index', 'regular_events'
  kicker      TEXT,                   -- kleines Label
  titel       TEXT,                   -- Haupttitel
  untertitel  TEXT,                   -- z.B. "bis 130 Personen", "Mittwoch"
  beschreibung TEXT,
  bild_url    TEXT,
  link_url    TEXT,
  link_text   TEXT,
  sort_order  INT         DEFAULT 0,
  aktiv       BOOLEAN     DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cards_list ON public.cms_cards(list_key, sort_order);

ALTER TABLE public.cms_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_cards_read   ON public.cms_cards;
DROP POLICY IF EXISTS cms_cards_insert ON public.cms_cards;
DROP POLICY IF EXISTS cms_cards_update ON public.cms_cards;
DROP POLICY IF EXISTS cms_cards_delete ON public.cms_cards;
CREATE POLICY cms_cards_read   ON public.cms_cards FOR SELECT USING (TRUE);
CREATE POLICY cms_cards_insert ON public.cms_cards FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_cards_update ON public.cms_cards FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_cards_delete ON public.cms_cards FOR DELETE TO authenticated USING (TRUE);

-- =====================================================================
-- SEED: bestehende hartcodierte Inhalte in DB übertragen
-- =====================================================================

-- 1. Räume (index.html: rooms-grid)
INSERT INTO public.cms_cards (list_key, titel, untertitel, sort_order) VALUES
('rooms_index', 'Alte Höfli',         'bis 130 Personen', 1),
('rooms_index', 'Stübli',             'bis 56 Personen',  2),
('rooms_index', 'Wohnzimmer',         'bis 40 Personen',  3),
('rooms_index', 'Gewölbekeller',      'bis 30 Personen',  4),
('rooms_index', 'Aula',               'bis 40 Personen',  5),
('rooms_index', 'Terrasse · Garten',  'bis 80 Personen',  6);

-- 2. Bereiche Startseite (index.html: bereiche-grid)
INSERT INTO public.cms_cards (list_key, kicker, titel, beschreibung, bild_url, link_url, link_text, sort_order) VALUES
('bereiche_index', 'Alte Höfli',    'Frühstück, Znüni, Mittag.',
 'Der traditionelle Hauptbereich – unkomplizierte, alltagsnahe Gastronomie mit Frühstücksbuffet, Znüni und Mittagstisch. Sonntags Brunch.',
 'images/alte-hoefli.png', 'restaurant.html#hoefli', 'Zum Höfli →', 1),
('bereiche_index', 'Das Wohnzimmer', 'Apéro, Austausch, Ankommen.',
 'Der gemütliche Begegnungsbereich – für entspannte Aufenthalte, gesellige Apéros und gemeinsame Momente mit hausgemachten Spezialitäten.',
 'images/wohnzimmer.png', 'restaurant.html#wohnzimmer', 'Zum Wohnzimmer →', 2),
('bereiche_index', 'Das Stübli',    'À la carte, klassisch, gepflegt.',
 'Der bediente Restaurantbereich mit gutbürgerlicher, regional verankerter Küche und sorgfältig zubereiteten Vor-, Haupt- und Dessertgängen.',
 'images/stuebli.png', 'restaurant.html#stuebli', 'Zum Stübli →', 3);

-- 3. Bereiche Restaurant (restaurant.html: bereiche-grid) – gleiche 3 aber für andere Seite
INSERT INTO public.cms_cards (list_key, kicker, titel, beschreibung, bild_url, link_url, link_text, sort_order) VALUES
('bereiche_restaurant', 'Alte Höfli',    'Frühstück, Znüni, Mittag.',
 'Hauptbereich für unkomplizierte Gastronomie: Frühstück, Mittagstisch, Znüni. Sonntags Brunch.',
 'images/alte-hoefli.png', '#hoefli', 'Mehr →', 1),
('bereiche_restaurant', 'Das Wohnzimmer', 'Apéro & Begegnung.',
 'Der gemütliche Begegnungsbereich für entspannte Aufenthalte und Apéros.',
 'images/wohnzimmer.png', '#wohnzimmer', 'Mehr →', 2),
('bereiche_restaurant', 'Das Stübli',    'À la carte.',
 'Bedienter Restaurantbereich mit gutbürgerlicher, regionaler Küche.',
 'images/stuebli.png', '#stuebli', 'Mehr →', 3);

-- 4. Eventkategorien (events.html: bereiche-grid)
INSERT INTO public.cms_cards (list_key, kicker, titel, beschreibung, bild_url, link_url, link_text, sort_order) VALUES
('eventkat_events', 'Private Anlässe', 'Hochzeiten, Geburtstage, Familienfeste.',
 'Vom Gewölbekeller über das Stübli bis zur Terrasse – wir haben den passenden Raum für deinen Anlass. Auch Feiern nach kirchlichen Zeremonien sind herzlich willkommen.',
 'images/aula-anlass.png', '#anfrage', 'Dein Event anfragen →', 1),
('eventkat_events', 'Regelmässig',   'Sonntagsbrunch, Jass, Workshops.',
 'Wöchentlicher Sonntagsbrunch, monatlicher Jass-Nachmittag und saisonale Angebote – für Familien, Freunde und alle Generationen.',
 'images/wohnzimmer.png', '#programm', 'Aktuelles Programm →', 2),
('eventkat_events', 'Saisonal',      'Specials & Workshops.',
 'Im Gewölbekeller spezielle Dining-Erlebnisse. Im alte Höfli Familien- und Kinderaktivitäten. Saisonale Kulinarik immer dabei.',
 'images/gewoelbekeller.png', '#programm', 'Specials ansehen →', 3);

-- 5. Regelmässige Wochenevents (events.html: regular-grid)
INSERT INTO public.cms_cards (list_key, untertitel, titel, beschreibung, sort_order) VALUES
('regular_events', 'Mittwoch',   'Jass Nachmittag',     '1× pro Monat · Restaurant', 1),
('regular_events', 'Donnerstag', 'Heisser Stein Abend', 'Stübli · Sommer: Pouletflügeli à Discretion', 2),
('regular_events', 'Sonntag',    'Sonntagsbrunch',      'Jeden Sonntag · Restaurant', 3);

-- 6. Quick-Bar Startseite (index.html)
INSERT INTO public.cms_cards (list_key, kicker, titel, link_url, sort_order) VALUES
('quickbar_index', 'Adresse',       'Schulstrasse 11 · 5070 Frick', NULL, 1),
('quickbar_index', 'Telefon',       '062 865 53 80',                 'tel:+41628655380', 2),
('quickbar_index', 'E-Mail',        'info@muellerhof.ch',            'mailto:info@muellerhof.ch', 3),
('quickbar_index', 'Öffnungszeiten','[ folgen ]',                    NULL, 4);

-- 7. Timeline Über uns (ueber-uns.html)
INSERT INTO public.cms_cards (list_key, untertitel, beschreibung, sort_order) VALUES
('timeline_ueber', 'Ursprung',       'Ursprünglich als Bauernhaus genutzt, wurde das Gebäude von der Jakob Müller AG übernommen.', 1),
('timeline_ueber', '1984',           'Eröffnung als Betriebskantine der Jakob Müller AG.', 2),
('timeline_ueber', 'Ende 2000er',    'Mit dem schrittweisen Rückgang der Belegschaft öffnet sich der Müllerhof auch für externe Gäste.', 3),
('timeline_ueber', '2019',           'Umfassende Sanierung: Küche, Essensausgabe und Hotelzimmer werden modernisiert. Die Zimmeranzahl wächst auf sieben.', 4),
('timeline_ueber', '2021–2022',      'Der Müllerhof wird an die Trinamo AG verpachtet. Aus wirtschaftlichen Gründen wird der Pachtvertrag aufgelöst.', 5),
('timeline_ueber', 'Seit 2023',      'Die Jakob Müller AG übernimmt den Betrieb wieder in Eigenregie. Der Müllerhof gewinnt neue Stammgäste, Hotelgäste und Veranstaltungen.', 6),
('timeline_ueber', 'Heute',          'Mit unserem traditionellen und familiären Gastronomiekonzept schaffen wir einen Treffpunkt für Familien, regionale Gäste, Hotelgäste und alle, die echte Gastfreundschaft schätzen.', 7);

-- 8. Footer-Sektionen
-- Footer: Kontakt
INSERT INTO public.cms_cards (list_key, titel, link_url, sort_order) VALUES
('footer_kontakt', 'Schulstrasse 11',     NULL, 1),
('footer_kontakt', '5070 Frick',          NULL, 2),
('footer_kontakt', '062 865 53 80',       'tel:+41628655380', 3),
('footer_kontakt', 'info@muellerhof.ch',  'mailto:info@muellerhof.ch', 4);

-- Footer: Entdecken
INSERT INTO public.cms_cards (list_key, titel, link_url, sort_order) VALUES
('footer_entdecken', 'Restaurant',   'restaurant.html',  1),
('footer_entdecken', 'Speisekarte',  'speisekarte.html', 2),
('footer_entdecken', 'Hotel',        'hotel.html',       3),
('footer_entdecken', 'Events',       'events.html',      4),
('footer_entdecken', 'Seminare',     'seminare.html',    5),
('footer_entdecken', 'Karriere',     'karriere.html',    6);

-- Footer: Reservation
INSERT INTO public.cms_cards (list_key, titel, link_url, sort_order) VALUES
('footer_reservation', 'Tisch reservieren', 'restaurant.html#reservieren', 1),
('footer_reservation', 'Zimmer buchen',     'hotel.html#buchen',           2),
('footer_reservation', 'Dein Event',        'events.html#anfrage',          3),
('footer_reservation', 'Kontakt',           'kontakt.html',                 4);
