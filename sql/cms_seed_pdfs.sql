-- =====================================================================
-- Müllerhof CMS – Bestehende PDFs registrieren
-- Diese PDFs liegen bereits unter /pdfs/ auf GitHub Pages.
-- Wir registrieren sie in cms_medien, damit sie im Admin auswählbar sind.
-- Und weisen die offensichtlichen Slots direkt zu.
-- Einmalig im Supabase SQL Editor ausführen.
-- =====================================================================

-- URL-Präfix anpassen falls die Domain ändert
-- (aktuell: https://weastsir.github.io/muellerhof-website/pdfs/)

INSERT INTO public.cms_medien (filename, url, alt, kategorie) VALUES
('Speisekarte_alteHoefli.pdf',   'https://weastsir.github.io/muellerhof-website/pdfs/Speisekarte_alteHoefli.pdf',   'Speisekarte alte Höfli',  'speisekarte'),
('Speisekarte_Wohnzimmer.pdf',   'https://weastsir.github.io/muellerhof-website/pdfs/Speisekarte_Wohnzimmer.pdf',   'Speisekarte Wohnzimmer',  'speisekarte'),
('Speisekarte_Stuebli.pdf',      'https://weastsir.github.io/muellerhof-website/pdfs/Speisekarte_Stuebli.pdf',      'Speisekarte Stübli',      'speisekarte'),
('Getraenkekarte_alteHoefli.pdf','https://weastsir.github.io/muellerhof-website/pdfs/Getraenkekarte_alteHoefli.pdf','Getränkekarte alte Höfli','getraenkekarte'),
('Getraenkekarte_Wohnzimmer.pdf','https://weastsir.github.io/muellerhof-website/pdfs/Getraenkekarte_Wohnzimmer.pdf','Getränkekarte Wohnzimmer','getraenkekarte'),
('Weinkarte_Stuebli.pdf',        'https://weastsir.github.io/muellerhof-website/pdfs/Weinkarte_Stuebli.pdf',        'Weinkarte Stübli',        'weinkarte'),
('Bankettdokumentation.pdf',     'https://weastsir.github.io/muellerhof-website/pdfs/Bankettdokumentation.pdf',     'Bankettdokumentation',    'dokumentation'),
('Seminardokumentation.pdf',     'https://weastsir.github.io/muellerhof-website/pdfs/Seminardokumentation.pdf',     'Seminardokumentation',    'dokumentation')
ON CONFLICT DO NOTHING;

-- Karten-Slots direkt zuweisen (kann nachher im Admin geändert werden)
INSERT INTO public.cms_sections (page_slug, section_key, kind, label, content) VALUES
('karten', 'speisekarte',           'pdf', 'Aktuelle Speisekarte',           'https://weastsir.github.io/muellerhof-website/pdfs/Speisekarte_alteHoefli.pdf'),
('karten', 'getraenkekarte',        'pdf', 'Getränkekarte',                  'https://weastsir.github.io/muellerhof-website/pdfs/Getraenkekarte_alteHoefli.pdf'),
('karten', 'weinkarte',             'pdf', 'Weinkarte',                      'https://weastsir.github.io/muellerhof-website/pdfs/Weinkarte_Stuebli.pdf'),
('karten', 'bankettdokumentation',  'pdf', 'Bankettdokumentation',           'https://weastsir.github.io/muellerhof-website/pdfs/Bankettdokumentation.pdf'),
('karten', 'seminardokumentation',  'pdf', 'Seminardokumentation',           'https://weastsir.github.io/muellerhof-website/pdfs/Seminardokumentation.pdf')
ON CONFLICT (page_slug, section_key) DO UPDATE SET content = EXCLUDED.content, label = EXCLUDED.label, kind = EXCLUDED.kind;

-- Fertig. Im Admin unter "Karten & PDFs" siehst du jetzt die Zuweisungen.
-- Im Admin unter "Medien" siehst du alle 8 PDFs.
