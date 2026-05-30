-- =====================================================================
-- Müllerhof CMS – Add-on 30.05.2026
-- Fügt hinzu:
--   • Echte Stelle "Leitung Restauration, 100%" mit verlinktem PDF
--   • Footer-Link auf Bankettdokumentation
-- Idempotent – kann mehrfach laufen, fügt nichts doppelt ein.
-- Im Supabase SQL Editor einfügen und RUN.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Neue Stelle: Leitung Restauration, 100%
-- ---------------------------------------------------------------------
INSERT INTO public.cms_stellen
  (titel, pensum, bereich, beschreibung, anforderungen,
   ansprechperson, ansprech_email, eintritt, pdf_url, sort_order, aktiv)
SELECT
  'Leitung Restauration, 100%, w/m/d',
  '100%',
  'Service / Restauration',
  'Als Leitung Restauration übernimmst du die operative Leitung unseres Servicebereichs und sorgst gemeinsam mit deinem Team dafür, dass sich unsere Gäste vom ersten Moment an willkommen und wohl fühlen. Mit deiner herzlichen Art führst, motivierst und unterstützt du das Serviceteam im täglichen Betrieb und behältst auch in lebhaften Situationen den Überblick. Du arbeitest aktiv im Service mit, kümmerst dich um einen reibungslosen Ablauf in unserem Wohnzimmer sowie im Stübli und stehst unseren Gästen mit persönlicher Beratung und echter Gastfreundschaft zur Seite.',
  'Abgeschlossene Ausbildung in der Gastronomie oder Hotellerie, mehrere Jahre Berufserfahrung im Service, idealerweise erste Führungserfahrung. Offene, herzliche Gastgeberpersönlichkeit. Sehr gute Deutschkenntnisse.',
  'Torsten Stobbe',
  'jobs@muellerhof.ch',
  'September 2027',
  'pdfs/Stelleninserat_Leitung_Restauration.pdf',
  0,
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_stellen
  WHERE titel = 'Leitung Restauration, 100%, w/m/d'
);

-- ---------------------------------------------------------------------
-- 2. Footer "Entdecken" – Bankettdokumentation ergänzen
-- ---------------------------------------------------------------------
INSERT INTO public.cms_cards (list_key, titel, link_url, sort_order)
SELECT 'footer_entdecken', 'Bankett', 'bankett.html', 7
WHERE NOT EXISTS (
  SELECT 1 FROM public.cms_cards
  WHERE list_key = 'footer_entdecken' AND titel = 'Bankett'
);

-- Fertig.
SELECT 'OK – Stelle "Leitung Restauration" und Footer-Link "Bankett" sind aktiv.' AS status;
