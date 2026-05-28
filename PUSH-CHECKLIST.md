# 🚀 Müllerhof – Push & Go-Live Checkliste

So bringst du jetzt **alles** auf einmal live. Reihenfolge ist wichtig.

---

## 1️⃣ SQL in Supabase ausführen (1×, ca. 2 Min)

**Datei:** `sql/cms_FINAL.sql` – enthält ALLES auf einmal:

- Neue Tabellen: Anfragen, Team, Stellen, Zimmer, Partner, Landingpages, Karten-Listen
- RLS-Policies für alle
- Seed-Daten (Partner, Zimmer, Stellen-Beispiele, Räume, Bereich-Cards, Timeline, Footer, Quick-Bar)
- 6 neue Karten-Slots für die Speisekarte-Kacheln

**So:**
1. <https://supabase.com/dashboard> → Müllerhof-Projekt → **SQL Editor**
2. **+ New Query**
3. Im Finder: `Desktop/Webseite Team 1/sql/cms_FINAL.sql` öffnen → alles markieren (Cmd+A) → Cmd+C
4. In Supabase einfügen (Cmd+V) → **RUN** (Warnung wegen DROP POLICY mit "Run query" bestätigen)
5. Sollte mit "Success" enden

Falls noch nicht: **Auch** `sql/cms_seed_texte.sql` ausführen (166 Seitentexte) – falls noch nicht gemacht.

---

## 2️⃣ push.command doppelklicken

In `Desktop/Webseite Team 1/` Doppelklick auf **push.command**.
Terminal-Fenster zeigt "Bereits aktuell" oder "Done". Fertig.

GitHub Pages braucht 1–3 Min bis Live.

---

## 3️⃣ Browser-Cache leeren & testen

`muellerhof-Webseite öffnen` → **Cmd+Shift+R** (hard reload).

### Was du jetzt überall im CMS bearbeiten kannst (admin.html)

| Sidebar-Tab | Was |
|---|---|
| 📥 **Anfragen** | Eingegangene Reservierungen, Eventanfragen, Bewerbungen (Status setzen, Notizen) |
| **Events** | Eventkalender (Datum, Titel, Beschreibung, Bild) |
| **Seitentexte** | 166 Texte über alle Seiten (Hero, Intros, Section-Headlines, Splits) |
| **Speisekarte** | Strukturierte Menü-Einträge (Kategorien, Positionen, Preise) |
| **Öffnungszeiten** | Pro Bereich (Restaurant, Hotel-Rezeption…) |
| **News & Aktuelles** | Aktuelle Meldungen, Tagesangebote |
| **Karten & PDFs** | **13 Slots**: Speisekarte, Getränke, Wein, Bankett, Seminare, Hotelpauschalen + die 6 Bereich-spezifischen Kacheln (Höfli/Wohnzimmer/Stübli × Speise/Getränke/Wein) |
| **Hotel-Zimmer** | 7 Zimmer als Seed, beliebig erweiterbar (Name, Typ, Preis, Bild) |
| **Team** | Mitarbeitende mit Bild, Position, Bereich, Bio |
| **Offene Stellen** | Stellenanzeigen mit Beschreibung, Anforderungen, PDF |
| **Kooperationen / Partner** | Partner mit Logo, Beschreibung, Website-Link |
| **📋 Karten-Listen** | **NEU** – Räume, Bereich-Cards, Eventkategorien, Wochenanlässe, Quick-Bar, Timeline, alle Footer-Listen |
| **✨ Specials / Aktionen** | **NEU** – Aktions-Landingpages mit Block-Editor (Hero, Text, Bild+Text, CTA, Galerie, Video) |
| **💬 Community-Posts** | Posts der Besucher moderieren / löschen |
| **Medien** | Bilder + PDFs hochladen, Drag&Drop überall in den Bild-Feldern |

### Was komplett neu funktioniert

- **Drag&Drop Bilder/PDFs** in JEDEM Bild-URL-Feld → automatischer Upload → URL wird gesetzt
- **Drag&Drop Sortierung** in allen Listen → einfach Eintrag verschieben
- **Echte Formulare** – Reservation/Event/Hotel/Seminar/Kontakt/Karriere senden zu Supabase und tauchen im 📥 Anfragen-Tab auf (kein Demo-Modus mehr)
- **Specials/Aktions-Seiten** unter `landingpage.html?slug=DEINSLUG` – Block-Editor mit Hero, Text, Bild+Text, CTA, Galerie, Video
- **Footer/Quick-Bar/Timeline/Räume** alles im CMS bearbeitbar

---

## 4️⃣ Erster Smoke-Test (5 Min)

1. **Admin öffnen** → Login mit `admin@muellerhof.ch` + Passwort aus Zugangsdaten
2. **📥 Anfragen-Tab** sollte leer sein
3. Auf der Webseite **`kontakt.html`** → kurze Test-Nachricht abschicken
4. Zurück ins Admin → 📥 Anfragen-Tab refresh → die Test-Nachricht sollte erscheinen ✅
5. **Team-Tab** → "+ Neue Person" → Name eingeben, ein Foto vom Desktop in das Bild-Feld ziehen → Speichern → Auf `ueber-uns.html` sollte die Person erscheinen ✅
6. **Karten-Listen → "Startseite – Räume"** → einen Raum bearbeiten ("Aula" → "Aula Saal") → Speichern → Auf `index.html` ist die Änderung sichtbar ✅
7. **Specials/Aktionen** → "sommerfest-2027" → Blöcke bearbeiten → Vorschau ↗ klicken → die Landingpage öffnet sich

---

## ⚠ Wichtige Hinweise

- **Browser-Cache** ist der häufigste Grund für "Änderung nicht sichtbar" → immer Cmd+Shift+R
- Wenn du im Admin etwas im **Karten-Listen** Tab bearbeitest, ist es überall live wo der Container `data-cms-list="..."` steht
- **Frontend-Fallback**: Falls Supabase mal ausfällt, sieht der Besucher die hardcodierten Fallback-Texte aus dem HTML
- **Sicherheit**: nur eingeloggte Admins können schreiben (RLS-Policies), aber alle können lesen (sonst sieht die Webseite nichts)

---

## 📁 Wichtige Dateien (Übersicht)

- `admin.html` + `js/admin.js` + `css/admin.css` – komplettes Admin-UI
- `js/cms-loader.js` – lädt Inhalte ins Frontend
- `js/cms-forms.js` – schickt Formulare zu Supabase
- `landingpage.html` – Renderer für Specials/Aktions-Seiten
- `sql/cms_FINAL.sql` – ALLES Setup in einer Datei
- `sql/cms_seed_texte.sql` – 166 Seitentexte
- `sql/cms_seed_pdfs.sql` – 8 bestehende PDFs registrieren
- `CMS-ANLEITUNG.md` – ausführliche Doku

In `Desktop/Website Unterlagen für Gian Luca/`:
- `CMS-Zugangsdaten.md` – Login-Daten (NICHT teilen!)
- `CMS-Login-Karte.pdf` – druckbare Login-Karte mit QR-Code

---

## ✅ Du bist live

Wenn der Smoke-Test durch ist: der Müllerhof kann jetzt **alle Inhalte** der Webseite selbst pflegen ohne Code anzufassen.

Bei Problemen: Browser-Konsole öffnen (Cmd+Option+I → Console), Fehler suchen.
