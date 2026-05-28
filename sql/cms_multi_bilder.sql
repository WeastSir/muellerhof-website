-- =====================================================================
-- Müllerhof CMS – Mehrere Bilder pro Eintrag (überall)
-- Im Supabase SQL Editor einmalig ausführen.
-- =====================================================================

-- cms_cards: schon vorher hinzugefügt – falls noch nicht da:
ALTER TABLE public.cms_cards    ADD COLUMN IF NOT EXISTS bilder TEXT;

-- Events: Bildergalerie pro Event
ALTER TABLE public.cms_events   ADD COLUMN IF NOT EXISTS bilder TEXT;

-- Zimmer: Bildergalerie pro Zimmer
ALTER TABLE public.cms_zimmer   ADD COLUMN IF NOT EXISTS bilder TEXT;

-- Team: Bildergalerie pro Mitarbeitende (z.B. Aktion-Fotos)
ALTER TABLE public.cms_team     ADD COLUMN IF NOT EXISTS bilder TEXT;

-- Partner: mehrere Logos / Aktionsfotos
ALTER TABLE public.cms_partner  ADD COLUMN IF NOT EXISTS bilder TEXT;

-- News: Bildergalerie pro News-Eintrag
ALTER TABLE public.cms_news     ADD COLUMN IF NOT EXISTS bilder TEXT;

-- Stellen: ggf. Bilder vom Team / Arbeitsplatz
ALTER TABLE public.cms_stellen  ADD COLUMN IF NOT EXISTS bilder TEXT;

-- Hinweis: bilder = newline-getrennte URLs (mehrere Fotos)
-- bild_url bleibt für Rückwärtskompatibilität (= erstes Bild aus bilder)
