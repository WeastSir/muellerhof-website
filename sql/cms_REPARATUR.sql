-- =====================================================================
-- Müllerhof CMS – REPARATUR: Doppelte Einträge entfernen
-- Im Supabase SQL Editor ausführen.
-- =====================================================================

-- ---- cms_cards: Duplikate löschen, niedrigste id behalten ----
DELETE FROM public.cms_cards a
USING public.cms_cards b
WHERE a.id > b.id
  AND a.list_key = b.list_key
  AND COALESCE(a.titel,'')      = COALESCE(b.titel,'')
  AND COALESCE(a.untertitel,'') = COALESCE(b.untertitel,'')
  AND COALESCE(a.kicker,'')     = COALESCE(b.kicker,'');

-- ---- cms_events: Duplikate löschen ----
DELETE FROM public.cms_events a
USING public.cms_events b
WHERE a.id > b.id
  AND a.datum = b.datum
  AND COALESCE(a.titel,'') = COALESCE(b.titel,'');

-- ---- cms_zimmer: Duplikate ----
DELETE FROM public.cms_zimmer a
USING public.cms_zimmer b
WHERE a.id > b.id
  AND a.name = b.name;

-- ---- cms_partner: Duplikate ----
DELETE FROM public.cms_partner a
USING public.cms_partner b
WHERE a.id > b.id
  AND a.name = b.name;

-- ---- cms_stellen: Duplikate ----
DELETE FROM public.cms_stellen a
USING public.cms_stellen b
WHERE a.id > b.id
  AND a.titel = b.titel
  AND COALESCE(a.bereich,'') = COALESCE(b.bereich,'');

-- ---- cms_oeffnungszeiten: Duplikate ----
DELETE FROM public.cms_oeffnungszeiten a
USING public.cms_oeffnungszeiten b
WHERE a.id > b.id
  AND a.bereich = b.bereich
  AND a.tag_label = b.tag_label;

-- Fertig. Prüfe im Admin → sollten jetzt einfache Einträge sein.
-- Wenn du das cms_FINAL.sql nochmal laufen lässt, kommt es zu erneuten Duplikaten
-- (Ausnahme: cms_sections hat ON CONFLICT, das ist sicher).
