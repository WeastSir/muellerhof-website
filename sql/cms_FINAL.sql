-- =====================================================================
-- MÜLLERHOF CMS – ALLES IN EINEM SETUP
-- Im Supabase SQL Editor einfügen und RUN.
-- Enthält: cms_setup_v2 (Anfragen, Team, Stellen, Zimmer, Partner)
--        + cms_setup_v3 (Landingpages)
--        + cms_setup_v3b (Karten-Listen)
--        + 6 neue Karten-PDF-Slots
-- Sicher mehrfach ausführbar.
-- =====================================================================



-- ============= cms_setup_v2.sql =============

-- =====================================================================
-- Müllerhof CMS v2 – Erweiterungen
-- Anfragen, Team, Stellen, Zimmer, Partner
-- Im Supabase SQL Editor ausführen (einmalig nach cms_setup.sql)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ANFRAGEN (Reservierungen, Eventanfragen, Bewerbungen etc.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_anfragen (
  id            BIGSERIAL PRIMARY KEY,
  typ           TEXT        NOT NULL,  -- 'reservation' | 'event' | 'hotel' | 'seminar' | 'kontakt' | 'karriere' | 'bankett'
  name          TEXT        NOT NULL,
  email         TEXT,
  telefon       TEXT,
  betreff       TEXT,
  nachricht     TEXT,
  daten         JSONB,                 -- alle weiteren Felder (Personen, Datum, Uhrzeit, etc.)
  status        TEXT        DEFAULT 'neu',  -- 'neu' | 'gelesen' | 'bearbeitet' | 'erledigt'
  notiz         TEXT,                  -- interne Notiz vom Admin
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_anfragen_status ON public.cms_anfragen(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anfragen_typ    ON public.cms_anfragen(typ);

-- ---------------------------------------------------------------------
-- 2. TEAM / MITARBEITENDE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_team (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  position    TEXT,
  bereich     TEXT,                    -- z.B. "Service", "Küche", "Hotel"
  bio         TEXT,
  email       TEXT,
  bild_url    TEXT,
  sort_order  INT         DEFAULT 0,
  aktiv       BOOLEAN     DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 3. OFFENE STELLEN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_stellen (
  id              BIGSERIAL PRIMARY KEY,
  titel           TEXT        NOT NULL,
  pensum          TEXT,                -- "80–100%", "Aushilfe", etc.
  bereich         TEXT,                -- "Service", "Küche", "Hotel"
  beschreibung    TEXT,
  anforderungen   TEXT,
  ansprechperson  TEXT,
  ansprech_email  TEXT,
  pdf_url         TEXT,                -- Stelleninserat als PDF
  eintritt        TEXT,                -- "ab sofort", "August 2027"
  aktiv           BOOLEAN     DEFAULT TRUE,
  sort_order      INT         DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. HOTEL-ZIMMER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_zimmer (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  zimmertyp     TEXT,                  -- "Einzel", "Doppel", "Suite"
  beschreibung  TEXT,
  anzahl_personen INT       DEFAULT 2,
  groesse_qm    INT,
  ausstattung   TEXT,                  -- frei beschreibbar oder kommasepariert
  preis_ab      NUMERIC(8,2),
  bild_url      TEXT,
  buchbar       BOOLEAN     DEFAULT TRUE,
  sort_order    INT         DEFAULT 0,
  aktiv         BOOLEAN     DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 5. PARTNER / KOOPERATIONEN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_partner (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  beschreibung  TEXT,
  kategorie     TEXT,                  -- "Verein", "Lieferant", "Institution"
  logo_url      TEXT,
  bild_url      TEXT,
  website_url   TEXT,
  highlight     BOOLEAN     DEFAULT FALSE,  -- für hervorgehobene Partner
  aktiv         BOOLEAN     DEFAULT TRUE,
  sort_order    INT         DEFAULT 0
);

-- =====================================================================
-- RLS POLICIES
-- =====================================================================

-- ANFRAGEN: anonyme dürfen INSERTEN (Formular abschicken), nur Admin sieht/ändert
ALTER TABLE public.cms_anfragen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_anfragen_insert ON public.cms_anfragen;
DROP POLICY IF EXISTS cms_anfragen_select ON public.cms_anfragen;
DROP POLICY IF EXISTS cms_anfragen_update ON public.cms_anfragen;
DROP POLICY IF EXISTS cms_anfragen_delete ON public.cms_anfragen;
CREATE POLICY cms_anfragen_insert ON public.cms_anfragen FOR INSERT WITH CHECK (TRUE);
CREATE POLICY cms_anfragen_select ON public.cms_anfragen FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY cms_anfragen_update ON public.cms_anfragen FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_anfragen_delete ON public.cms_anfragen FOR DELETE TO authenticated USING (TRUE);

-- TEAM: alle lesen, nur Admin schreiben
ALTER TABLE public.cms_team ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_team_read   ON public.cms_team;
DROP POLICY IF EXISTS cms_team_insert ON public.cms_team;
DROP POLICY IF EXISTS cms_team_update ON public.cms_team;
DROP POLICY IF EXISTS cms_team_delete ON public.cms_team;
CREATE POLICY cms_team_read   ON public.cms_team FOR SELECT USING (TRUE);
CREATE POLICY cms_team_insert ON public.cms_team FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_team_update ON public.cms_team FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_team_delete ON public.cms_team FOR DELETE TO authenticated USING (TRUE);

-- STELLEN
ALTER TABLE public.cms_stellen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_stellen_read   ON public.cms_stellen;
DROP POLICY IF EXISTS cms_stellen_insert ON public.cms_stellen;
DROP POLICY IF EXISTS cms_stellen_update ON public.cms_stellen;
DROP POLICY IF EXISTS cms_stellen_delete ON public.cms_stellen;
CREATE POLICY cms_stellen_read   ON public.cms_stellen FOR SELECT USING (TRUE);
CREATE POLICY cms_stellen_insert ON public.cms_stellen FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_stellen_update ON public.cms_stellen FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_stellen_delete ON public.cms_stellen FOR DELETE TO authenticated USING (TRUE);

-- ZIMMER
ALTER TABLE public.cms_zimmer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_zimmer_read   ON public.cms_zimmer;
DROP POLICY IF EXISTS cms_zimmer_insert ON public.cms_zimmer;
DROP POLICY IF EXISTS cms_zimmer_update ON public.cms_zimmer;
DROP POLICY IF EXISTS cms_zimmer_delete ON public.cms_zimmer;
CREATE POLICY cms_zimmer_read   ON public.cms_zimmer FOR SELECT USING (TRUE);
CREATE POLICY cms_zimmer_insert ON public.cms_zimmer FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_zimmer_update ON public.cms_zimmer FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_zimmer_delete ON public.cms_zimmer FOR DELETE TO authenticated USING (TRUE);

-- PARTNER
ALTER TABLE public.cms_partner ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_partner_read   ON public.cms_partner;
DROP POLICY IF EXISTS cms_partner_insert ON public.cms_partner;
DROP POLICY IF EXISTS cms_partner_update ON public.cms_partner;
DROP POLICY IF EXISTS cms_partner_delete ON public.cms_partner;
CREATE POLICY cms_partner_read   ON public.cms_partner FOR SELECT USING (TRUE);
CREATE POLICY cms_partner_insert ON public.cms_partner FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_partner_update ON public.cms_partner FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_partner_delete ON public.cms_partner FOR DELETE TO authenticated USING (TRUE);

-- =====================================================================
-- SEED-DATEN
-- =====================================================================

-- Partner (aus kooperationen.html)
INSERT INTO public.cms_partner (name, beschreibung, kategorie, website_url, highlight, sort_order) VALUES
('Älterwerden im Fricktal',     'Regionale Plattform die ältere Menschen informiert, vernetzt und Angebote zugänglich macht.', 'Plattform',   'https://www.aelterwerden-fricktal.ch', TRUE,  1),
('Alterszentrum Bruggbach',     'Wichtige Institution im Fricktal – Bewohnerinnen und Bewohner sind regelmässig Teil unserer Gemeinschaft.', 'Institution', 'https://www.bruggbach.ch',           TRUE,  2),
('VAOF – Verein Älterwerden im Fricktal', 'Freiwilligenverein der sich für die Lebensqualität älterer Menschen in der Region engagiert.', 'Verein',      'https://www.vaof.ch',                 FALSE, 3)
ON CONFLICT DO NOTHING;

-- Zimmer (alle Doppelzimmer, 7 Stück)
INSERT INTO public.cms_zimmer (name, zimmertyp, anzahl_personen, beschreibung, ausstattung, preis_ab, sort_order) VALUES
('Zimmer 1', 'Doppelzimmer', 2, 'Gemütliches Doppelzimmer mit Blick auf den Garten.',     'Doppelbett, eigenes Bad, Dusche, WC, WLAN, Föhn', 180, 1),
('Zimmer 2', 'Doppelzimmer', 2, 'Helles Doppelzimmer mit modernem Komfort.',              'Doppelbett, eigenes Bad, Dusche, WC, WLAN, Föhn', 180, 2),
('Zimmer 3', 'Doppelzimmer', 2, 'Ruhiges Doppelzimmer für eine erholsame Nacht.',         'Doppelbett, eigenes Bad, Dusche, WC, WLAN, Föhn', 180, 3),
('Zimmer 4', 'Doppelzimmer', 2, 'Doppelzimmer mit charmantem Holzbalken-Ambiente.',       'Doppelbett, eigenes Bad, Dusche, WC, WLAN, Föhn', 180, 4),
('Zimmer 5', 'Doppelzimmer', 2, 'Geräumiges Doppelzimmer mit Sitzecke.',                  'Doppelbett, eigenes Bad, Dusche, WC, WLAN, Föhn', 180, 5),
('Zimmer 6', 'Doppelzimmer', 2, 'Doppelzimmer mit Blick auf die Terrasse.',                'Doppelbett, eigenes Bad, Dusche, WC, WLAN, Föhn', 180, 6),
('Zimmer 7', 'Doppelzimmer', 2, 'Komfort-Doppelzimmer im obersten Stock.',                 'Doppelbett, eigenes Bad, Dusche, WC, WLAN, Föhn', 180, 7)
ON CONFLICT DO NOTHING;

-- Beispiel-Stellen (kann der Müllerhof später anpassen/ergänzen)
INSERT INTO public.cms_stellen (titel, pensum, bereich, beschreibung, anforderungen, ansprechperson, ansprech_email, eintritt, sort_order) VALUES
('Mitarbeiter:in Service', '80–100%', 'Service',
 'Du betreust unsere Gäste im Restaurant – freundlich, aufmerksam, mit Herz und Verstand.',
 'Erfahrung im Service oder grosse Lernbereitschaft. Du arbeitest gerne im Team und magst den Kontakt mit Menschen.',
 'Torsten Stobbe', 'jobs@muellerhof.ch', 'ab sofort', 1),
('Koch / Köchin', '80–100%', 'Küche',
 'Du bist Teil unserer Küchenbrigade und kochst regionale, ehrliche Küche mit saisonalen Produkten.',
 'Abgeschlossene Berufslehre als Koch/Köchin, Freude an Qualität und Teamarbeit.',
 'Torsten Stobbe', 'jobs@muellerhof.ch', 'ab sofort', 2)
ON CONFLICT DO NOTHING;


-- ============= cms_setup_v3.sql =============

-- =====================================================================
-- Müllerhof CMS v3 – Specials/Landingpages
-- Eigene Aktions-Seiten die per Block-Editor zusammengeklickt werden
-- Im Supabase SQL Editor ausführen (einmalig nach cms_setup_v2.sql)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cms_landingpages (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT        UNIQUE NOT NULL,   -- z.B. "sommerfest-2027" → URL /landingpage.html?slug=sommerfest-2027
  titel         TEXT        NOT NULL,
  beschreibung  TEXT,                          -- für SEO und Vorschau
  hero_bild_url TEXT,
  bloecke       JSONB       DEFAULT '[]',     -- Array von Blocks { typ, ... }
  gueltig_ab    DATE,
  gueltig_bis   DATE,
  aktiv         BOOLEAN     DEFAULT TRUE,
  sort_order    INT         DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_landingpages_slug ON public.cms_landingpages(slug);

ALTER TABLE public.cms_landingpages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_lp_read   ON public.cms_landingpages;
DROP POLICY IF EXISTS cms_lp_insert ON public.cms_landingpages;
DROP POLICY IF EXISTS cms_lp_update ON public.cms_landingpages;
DROP POLICY IF EXISTS cms_lp_delete ON public.cms_landingpages;
CREATE POLICY cms_lp_read   ON public.cms_landingpages FOR SELECT USING (TRUE);
CREATE POLICY cms_lp_insert ON public.cms_landingpages FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_lp_update ON public.cms_landingpages FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_lp_delete ON public.cms_landingpages FOR DELETE TO authenticated USING (TRUE);

-- Beispiel-Landingpage zum Testen
INSERT INTO public.cms_landingpages (slug, titel, beschreibung, bloecke, sort_order) VALUES
('sommerfest-2027', 'Sommerfest 2027', 'Unser grosses Sommerfest mit Live-Musik, Apero und Grilladen.',
'[
  {"typ":"hero","titel":"Sommerfest 2027","untertitel":"Live-Musik, Apero, Grilladen","bild_url":"images/aula-anlass.png"},
  {"typ":"text","ueberschrift":"Was dich erwartet","text":"Am 15. August 2027 verwandeln wir den Müllerhof in eine sommerliche Festmeile. Live-Band, Apero auf der Terrasse, frische Grilladen vom Holzkohlegrill und kühle Getränke unter freiem Himmel."},
  {"typ":"bild_text","bild_url":"images/garten.png","ueberschrift":"Im Garten unter freiem Himmel","text":"Wir feiern auf unserer grossen Rasenfläche – mit Platz für die ganze Familie, einer Hüpfburg für Kids und gemütlichen Sitzgelegenheiten."},
  {"typ":"cta","ueberschrift":"Sei dabei!","text":"Eintritt frei. Reservation für Tische empfohlen.","button_text":"Tisch reservieren","button_url":"restaurant.html#reservieren"}
]'::jsonb, 1)
ON CONFLICT (slug) DO NOTHING;


-- ============= cms_setup_v3b.sql =============

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



-- =====================================================================
-- 6 NEUE KARTEN-SLOTS für restaurant.html (Speisekarten-Kacheln)
-- =====================================================================
INSERT INTO public.cms_sections (page_slug, section_key, kind, label, content) VALUES
('karten', 'speisekarte_alte_hoefli',    'pdf', 'Alte Höfli – Speisekarte',
 'https://weastsir.github.io/muellerhof-website/pdfs/Speisekarte_alteHoefli.pdf'),
('karten', 'getraenkekarte_alte_hoefli', 'pdf', 'Alte Höfli – Getränkekarte',
 'https://weastsir.github.io/muellerhof-website/pdfs/Getraenkekarte_alteHoefli.pdf'),
('karten', 'speisekarte_wohnzimmer',     'pdf', 'Wohnzimmer – Speisekarte',
 'https://weastsir.github.io/muellerhof-website/pdfs/Speisekarte_Wohnzimmer.pdf'),
('karten', 'getraenkekarte_wohnzimmer',  'pdf', 'Wohnzimmer – Getränkekarte',
 'https://weastsir.github.io/muellerhof-website/pdfs/Getraenkekarte_Wohnzimmer.pdf'),
('karten', 'speisekarte_stuebli',        'pdf', 'Stübli – Speisekarte',
 'https://weastsir.github.io/muellerhof-website/pdfs/Speisekarte_Stuebli.pdf'),
('karten', 'weinkarte_stuebli',          'pdf', 'Stübli – Weinkarte',
 'https://weastsir.github.io/muellerhof-website/pdfs/Weinkarte_Stuebli.pdf')
ON CONFLICT (page_slug, section_key) DO UPDATE SET
  content = EXCLUDED.content,
  label   = EXCLUDED.label,
  kind    = EXCLUDED.kind,
  updated_at = NOW();
