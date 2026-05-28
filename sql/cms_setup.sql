-- =====================================================================
-- Müllerhof CMS – Komplettes Setup
-- In Supabase SQL Editor ausführen (einmalig)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. EVENTS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_events (
  id          BIGSERIAL PRIMARY KEY,
  datum       DATE        NOT NULL,
  zeit        TEXT,
  titel       TEXT        NOT NULL,
  kategorie   TEXT,
  ort         TEXT,
  beschreibung TEXT,
  bild_url    TEXT,
  link_url    TEXT,
  aktiv       BOOLEAN     DEFAULT TRUE,
  sort_order  INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. SEITEN-TEXTE (Hero, Intros, Sektionen)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_sections (
  id          BIGSERIAL PRIMARY KEY,
  page_slug   TEXT        NOT NULL,
  section_key TEXT        NOT NULL,
  kind        TEXT        DEFAULT 'text',  -- text | html | image
  label       TEXT,
  content     TEXT,
  sort_order  INT         DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_slug, section_key)
);

-- ---------------------------------------------------------------------
-- 3. SPEISEKARTE / GETRÄNKE / WEINE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_menu_kategorien (
  id          BIGSERIAL PRIMARY KEY,
  typ         TEXT        NOT NULL,  -- speise | getraenk | wein
  name        TEXT        NOT NULL,
  beschreibung TEXT,
  sort_order  INT         DEFAULT 0,
  aktiv       BOOLEAN     DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.cms_menu_items (
  id          BIGSERIAL PRIMARY KEY,
  kategorie_id BIGINT     REFERENCES public.cms_menu_kategorien(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  beschreibung TEXT,
  preis       NUMERIC(8,2),
  preis_dl    NUMERIC(8,2),   -- für Wein/Getränke offen
  preis_flasche NUMERIC(8,2),
  jahrgang    TEXT,             -- für Wein
  herkunft    TEXT,
  allergene   TEXT,
  sort_order  INT         DEFAULT 0,
  aktiv       BOOLEAN     DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 4. ÖFFNUNGSZEITEN
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_oeffnungszeiten (
  id          BIGSERIAL PRIMARY KEY,
  bereich     TEXT        NOT NULL,  -- "Restaurant", "Bar", "Rezeption"
  tag_label   TEXT        NOT NULL,  -- "Mo–Fr", "Sa", "So & Feiertage"
  von         TEXT,                  -- "08:00"
  bis         TEXT,                  -- "23:00"
  hinweis     TEXT,
  sort_order  INT         DEFAULT 0,
  aktiv       BOOLEAN     DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 5. NEWS / AKTUELLES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_news (
  id          BIGSERIAL PRIMARY KEY,
  titel       TEXT        NOT NULL,
  text        TEXT,
  kategorie   TEXT,                  -- "Aktuelles", "Tagesangebot", "Saisonal"
  gueltig_ab  DATE        DEFAULT CURRENT_DATE,
  gueltig_bis DATE,
  bild_url    TEXT,
  aktiv       BOOLEAN     DEFAULT TRUE,
  sort_order  INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. MEDIEN-BIBLIOTHEK (Verweis auf Storage-Bucket)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_medien (
  id          BIGSERIAL PRIMARY KEY,
  filename    TEXT        NOT NULL,
  url         TEXT        NOT NULL,
  alt         TEXT,
  kategorie   TEXT,
  uploaded_by UUID        REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- RLS POLICIES
-- Lesen: alle (öffentlich, anonym)
-- Schreiben: nur authentifizierte Benutzer
-- =====================================================================

ALTER TABLE public.cms_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_events_read   ON public.cms_events;
DROP POLICY IF EXISTS cms_events_insert ON public.cms_events;
DROP POLICY IF EXISTS cms_events_update ON public.cms_events;
DROP POLICY IF EXISTS cms_events_delete ON public.cms_events;
CREATE POLICY cms_events_read   ON public.cms_events FOR SELECT USING (TRUE);
CREATE POLICY cms_events_insert ON public.cms_events FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_events_update ON public.cms_events FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_events_delete ON public.cms_events FOR DELETE TO authenticated USING (TRUE);

ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_sections_read   ON public.cms_sections;
DROP POLICY IF EXISTS cms_sections_insert ON public.cms_sections;
DROP POLICY IF EXISTS cms_sections_update ON public.cms_sections;
DROP POLICY IF EXISTS cms_sections_delete ON public.cms_sections;
CREATE POLICY cms_sections_read   ON public.cms_sections FOR SELECT USING (TRUE);
CREATE POLICY cms_sections_insert ON public.cms_sections FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_sections_update ON public.cms_sections FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_sections_delete ON public.cms_sections FOR DELETE TO authenticated USING (TRUE);

ALTER TABLE public.cms_menu_kategorien ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_mk_read   ON public.cms_menu_kategorien;
DROP POLICY IF EXISTS cms_mk_insert ON public.cms_menu_kategorien;
DROP POLICY IF EXISTS cms_mk_update ON public.cms_menu_kategorien;
DROP POLICY IF EXISTS cms_mk_delete ON public.cms_menu_kategorien;
CREATE POLICY cms_mk_read   ON public.cms_menu_kategorien FOR SELECT USING (TRUE);
CREATE POLICY cms_mk_insert ON public.cms_menu_kategorien FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_mk_update ON public.cms_menu_kategorien FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_mk_delete ON public.cms_menu_kategorien FOR DELETE TO authenticated USING (TRUE);

ALTER TABLE public.cms_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_mi_read   ON public.cms_menu_items;
DROP POLICY IF EXISTS cms_mi_insert ON public.cms_menu_items;
DROP POLICY IF EXISTS cms_mi_update ON public.cms_menu_items;
DROP POLICY IF EXISTS cms_mi_delete ON public.cms_menu_items;
CREATE POLICY cms_mi_read   ON public.cms_menu_items FOR SELECT USING (TRUE);
CREATE POLICY cms_mi_insert ON public.cms_menu_items FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_mi_update ON public.cms_menu_items FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_mi_delete ON public.cms_menu_items FOR DELETE TO authenticated USING (TRUE);

ALTER TABLE public.cms_oeffnungszeiten ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_oz_read   ON public.cms_oeffnungszeiten;
DROP POLICY IF EXISTS cms_oz_insert ON public.cms_oeffnungszeiten;
DROP POLICY IF EXISTS cms_oz_update ON public.cms_oeffnungszeiten;
DROP POLICY IF EXISTS cms_oz_delete ON public.cms_oeffnungszeiten;
CREATE POLICY cms_oz_read   ON public.cms_oeffnungszeiten FOR SELECT USING (TRUE);
CREATE POLICY cms_oz_insert ON public.cms_oeffnungszeiten FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_oz_update ON public.cms_oeffnungszeiten FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_oz_delete ON public.cms_oeffnungszeiten FOR DELETE TO authenticated USING (TRUE);

ALTER TABLE public.cms_news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_news_read   ON public.cms_news;
DROP POLICY IF EXISTS cms_news_insert ON public.cms_news;
DROP POLICY IF EXISTS cms_news_update ON public.cms_news;
DROP POLICY IF EXISTS cms_news_delete ON public.cms_news;
CREATE POLICY cms_news_read   ON public.cms_news FOR SELECT USING (TRUE);
CREATE POLICY cms_news_insert ON public.cms_news FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_news_update ON public.cms_news FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_news_delete ON public.cms_news FOR DELETE TO authenticated USING (TRUE);

ALTER TABLE public.cms_medien ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_medien_read   ON public.cms_medien;
DROP POLICY IF EXISTS cms_medien_insert ON public.cms_medien;
DROP POLICY IF EXISTS cms_medien_update ON public.cms_medien;
DROP POLICY IF EXISTS cms_medien_delete ON public.cms_medien;
CREATE POLICY cms_medien_read   ON public.cms_medien FOR SELECT USING (TRUE);
CREATE POLICY cms_medien_insert ON public.cms_medien FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY cms_medien_update ON public.cms_medien FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY cms_medien_delete ON public.cms_medien FOR DELETE TO authenticated USING (TRUE);

-- =====================================================================
-- STORAGE-BUCKET für Bilder
-- (manuell in Supabase Dashboard: Storage → New Bucket "cms-media", PUBLIC)
-- Falls bereits existiert: nichts tun.
-- =====================================================================

-- =====================================================================
-- SEED-DATEN: Events aus events.html (Saison 2027)
-- =====================================================================
INSERT INTO public.cms_events (datum, zeit, titel, kategorie, ort, beschreibung, sort_order) VALUES
('2027-08-01', '10:00', '1. August Brunch · Eröffnung',  'Brunch',     'Restaurant',     'Festliche Eröffnung am Nationalfeiertag mit grossem Brunch.', 1),
('2027-08-13', '18:00', 'Grill & Chill',                  'Sommer',     'Terrasse',       'Lockerer Grillabend auf der Terrasse mit Sommer-Vibes.', 2),
('2027-08-27', '18:00', 'Grill & Chill',                  'Sommer',     'Terrasse',       'Lockerer Grillabend auf der Terrasse mit Sommer-Vibes.', 3),
('2027-09-15', NULL,    'Wildsaison startet · Wildkarte', 'Saisonal',   'Restaurant',     'Saisonale Wildkarte verfügbar von September bis Oktober.', 4),
('2027-10-27', '14:00', 'Kürbisschnitzen für Kids',       'Familie',    'Restaurant',     'Familiennachmittag mit Kürbisschnitzen für die Kleinen.', 5),
('2027-11-06', '19:00', 'Candle Light Dinner',            'Romantik',   'Gewölbekeller',  'Stimmungsvolles Candle-Light-Dinner im Gewölbekeller.', 6),
('2027-11-17', '14:00', 'Kerzenziehen',                   'Tradition',  'Gewölbekeller',  'Traditionelles Kerzenziehen für die ganze Familie.', 7),
('2027-11-24', '18:00', 'Metzgete',                       'Saisonal',   'Aula',           'Traditionelle Metzgete mit allem, was dazugehört.', 8),
('2027-12-06', '14:00', 'Samichlaus zu Besuch',           'Familie',    'Restaurant',     'Der Samichlaus besucht den Müllerhof – mit Geschichten und Nüssen.', 9),
('2027-12-08', '14:00', 'Lebkuchenhaus basteln',          'Familie',    'Restaurant',     'Lebkuchenhaus basteln für Kinder und Familien.', 10),
('2027-12-24', '18:00', 'Weihnachtsmenu',                 'Festlich',   'Stübli',         'Festliches Weihnachtsmenu am Heiligabend.', 11),
('2027-12-25', '12:00', 'Weihnachtsmenu',                 'Festlich',   'Stübli',         'Festliches Weihnachtsmenu am ersten Weihnachtstag.', 12),
('2027-12-31', '19:00', 'New Year Dinner',                'Festlich',   'Stübli',         'Stilvolles Silvester-Dinner zum Jahreswechsel.', 13)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SEED: Beispiel-Texte für Startseite (zum Bearbeiten via Admin)
-- =====================================================================
INSERT INTO public.cms_sections (page_slug, section_key, kind, label, content, sort_order) VALUES
('index', 'hero_claim',    'text', 'Hero – Hauptclaim',      'Das Wohnzimmer<br>von Frick.', 1),
('index', 'hero_tagline',  'text', 'Hero – Tagline',         'Wo Begegnung zuhause ist.', 2),
('index', 'intro_headline','text', 'Willkommen – Headline',  'Von Frick. Für Frick.', 3),
('index', 'intro_lead',    'html', 'Willkommen – Fliesstext','Der Müllerhof verbindet Gastronomie, Gemeinschaft und modernes Dorfleben zu einem Ort, an dem Menschen verschiedener Generationen zusammenkommen.', 4),
('index', 'intro_usp',     'text', 'Willkommen – Zitat',     'Der Müllerhof bringt Generationen zusammen und macht Gemeinschaft in Frick erlebbar.', 5)
ON CONFLICT (page_slug, section_key) DO NOTHING;

-- =====================================================================
-- SEED: Beispiel-Öffnungszeiten
-- =====================================================================
INSERT INTO public.cms_oeffnungszeiten (bereich, tag_label, von, bis, hinweis, sort_order) VALUES
('Restaurant', 'Montag – Freitag',   '07:00', '23:00', NULL, 1),
('Restaurant', 'Samstag',            '08:00', '23:00', NULL, 2),
('Restaurant', 'Sonntag',            '08:00', '18:00', 'Brunch von 10:00 bis 14:00', 3),
('Hotel-Rezeption', 'Täglich',       '07:00', '22:00', 'Spätere Anreise auf Anfrage', 4)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- FERTIG. Schritte danach:
-- 1. Storage-Bucket "cms-media" als PUBLIC anlegen (für Bild-Upload)
-- 2. In Authentication → Users: Admin-Benutzer anlegen (Email + Passwort)
-- 3. admin.html aufrufen → Login → loslegen
-- =====================================================================
