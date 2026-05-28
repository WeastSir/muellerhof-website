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
