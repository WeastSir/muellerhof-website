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
