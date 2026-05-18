# Müllerhof – Website V3

## Was V3 ändert
- ✅ Logo transparent (kein weisses Rechteck mehr)
- ✅ Horizontales Scrollen verhindert
- ✅ Wochenmenü komplett raus
- ✅ **Speisekarte als eigene "Flyer-Seite"** (`speisekarte.html`) mit Blättern, Kapiteln und allen 7 Karten
- ✅ Restaurant-Seite zeigt nur **Karten-Auswahl** als Buttons (Speisekarte / Frühstück / Znüni / Weinkarte)
- ✅ **Bankett-PDF und Seminar-PDF** direkt im Browser anschaubar (`bankett.html`, `seminare.html`)
- ✅ Bestuhlungsvarianten mit echten **Icon-Grafiken** (wie im PDF)
- ✅ Bild-Platzhalter dezent in obere Ecke
- ✅ Erfundene Texte → klare Platzhalter
- ✅ Karte auf Kontaktseite (OpenStreetMap)
- ✅ Impressum + Datenschutz als Platzhalter

## Dateien
```
index.html, restaurant.html, hotel.html, events.html,
ueber-uns.html, galerie.html, kooperationen.html, kontakt.html,
impressum.html, datenschutz.html,
speisekarte.html  ← Speisekarte als digitaler Flyer
bankett.html      ← Bankettdokumentation (PDF im Browser)
seminare.html     ← Seminardokumentation (PDF im Browser)
Bankett.pdf       ← Original-PDF
Seminare.pdf      ← Original-PDF
css/style.css
js/main.js
images/logo.png
```

## Speisekarte-Flyer
- 7 Seiten zum Blättern: Hofklassiker, Vorspeisen, Hauptgänge, Dessert, Lounge, Frühstück, Znüni
- Kapitel-Navigation oben (Buttons)
- Pfeiltasten ← → funktionieren auch
- Direktlinks: `speisekarte.html#fruehstueck`, `speisekarte.html#znueni`

## Bestuhlungsvarianten
Mit echten SVG-Icons (Parlamentarisch, Theater, Blocktisch, U-Form, O-Form, Bankett) – wie im Seminar-PDF.

## GitHub Pages Deploy
1. Alle Dateien (inkl. PDFs!) in Repo
2. Settings → Pages → Branch `main`, `/ (root)` → Save

## Was noch fehlt
- Bilder
- Wein-/Getränkekarte
- Hotelzimmer-Details (7 Zimmer)
- Aleno-Widget einbinden
- Hotel-Buchungssystem
- Texte „Über uns"
- Kooperations-Partner
- Impressum & Datenschutz Inhalt
- Öffnungszeiten
- Konzept-Badge vor Go-Live entfernen
