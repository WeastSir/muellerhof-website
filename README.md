# Müllerhof – Website Konzept

Statische Website für **Restaurant & Hotel Müllerhof**, Schulstrasse 11, 5070 Frick.

Dieses Paket ist ein **Konzept-Stand** – die Struktur, das Design und alle echten Inhalte (Räume, Pauschalen, Adressdaten, Wochenmenü-Struktur) sind angelegt. Bilder, definitive Texte, Speisekartendetails, Hotelzimmer-Infos und Buchungssystem-Integrationen folgen.

---

## Inhalt

```
muellerhof-final/
├── index.html              ← Startseite
├── restaurant.html         ← Wochenmenü, Speisekarte, Aleno-Reservierung
├── hotel.html              ← 7 Zimmer, Buchungssystem
├── events.html             ← Bankett, Seminare, 6 Räume, Anfrageformular
├── ueber-uns.html          ← Geschichte, Werte, Team
├── galerie.html            ← Bildwelt
├── kooperationen.html      ← Gemeinsam für Frick
├── kontakt.html            ← Kontaktdaten, Anreise, Karte
├── css/
│   └── style.css           ← Alle Styles (CI: Sand, Beige, Salbei, Grün, Braun)
├── js/
│   └── main.js             ← Nav-Verhalten, Mobile Menu
├── images/
│   ├── logo.png
│   └── farbpalette-referenz.png
└── README.md
```

---

## Lokal anschauen

Einfach `index.html` im Browser öffnen.
Oder einen kleinen lokalen Server starten:

```bash
# Mit Python
python3 -m http.server 8000

# Mit Node.js
npx serve
```

Dann: http://localhost:8000

---

## Auf GitHub Pages veröffentlichen

1. **Repository erstellen** auf GitHub (z.B. `muellerhof-website`)
2. **Alle Dateien hochladen** (per Web-Upload oder `git push`)
3. Im Repository: **Settings → Pages**
4. **Source:** `Deploy from a branch` → Branch `main`, Folder `/ (root)`
5. **Save** – nach ein paar Minuten ist die Seite live unter
   `https://[username].github.io/muellerhof-website/`

Für eine eigene Domain (z.B. `muellerhof.ch`):
- In Pages-Einstellungen Custom Domain eintragen
- Beim Domain-Hoster CNAME / A-Record setzen
  - CNAME: `[username].github.io`
  - oder A-Records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

---

## Inhalte aktualisieren

### Wochenmenü
Datei: `restaurant.html` und `index.html`
Suchen nach `<!-- Wochenmenü -->` bzw. nach `KW 21`.
Inhalt der `<li>`-Elemente austauschen.

### Speisekarte
Datei: `restaurant.html`
Suchen nach `<!-- Speisekarte -->` bzw. nach `Vorspeisen`.
Pro Gericht ein `<div class="dish">`-Block.

### Hotelzimmer
Datei: `hotel.html`
Suchen nach `Zimmer 1`, `Zimmer 2` etc.
Beschreibung, Belegung und Preis pro Zimmer eintragen.

### Bilder
Bilder ins Verzeichnis `images/` legen.
In HTML: Platzhalter-`<div>` ersetzen durch:
```html
<img src="images/dein-bild.jpg" alt="Beschreibung" style="width:100%; height:100%; object-fit:cover;">
```

---

## Externe Systeme einbinden

### Aleno – Tischreservierung
Datei: `restaurant.html`, Sektion `#reservieren`.
Aleno-Embed-Code aus dem Aleno-Dashboard kopieren und den Platzhalter-`<div>` ersetzen.

Typisches Aleno-Snippet (vom Anbieter generiert):
```html
<iframe src="https://mytools.aleno.me/reservations/v2.0/reservations.html?k=..."
        width="100%" height="700" frameborder="0"></iframe>
```

### Hotel-Buchung
Datei: `hotel.html`, Sektion `#buchen`.
Embed-Code des gewählten Anbieters (Beds24, MyBookings, Little Hotelier o.ä.) einfügen.

### Bankett-Anfrage-Formular
Datei: `events.html`, Sektion `#anfrage`.
Aktuell nur Demo (`onsubmit="alert(...)"`).
Für Live-Betrieb: Formular-Service wie **Formspree**, **Basin** oder **Netlify Forms** einbinden, oder Backend-Endpoint hinzufügen.

Beispiel mit Formspree:
```html
<form class="form" action="https://formspree.io/f/DEIN_CODE" method="POST">
```

---

## Design-System

### Farben (CI Müllerhof)
| Name        | HEX       | Verwendung                  |
|-------------|-----------|-----------------------------|
| Beige Light | `#F2EDE3` | Haupthintergrund            |
| Sand        | `#D8CBB5` | Sekundärflächen, Akzente    |
| Salbei      | `#6B7D5B` | Akzent (Community, Hover)   |
| Dunkelgrün  | `#2D4036` | Primärfarbe, dunkle Flächen |
| Braun       | `#674A2D` | Akzent, Hover, Preise       |

Alle Farben sind als CSS-Variablen in `css/style.css` definiert (`--c-beige-light` etc.).

### Schrift
**Century Gothic Pro Bold** als Display- und Body-Schrift.
Fallback-Kette: `Century Gothic` → `URW Gothic` → `Questrial` → `sans-serif`.

> Hinweis: Century Gothic Pro ist lizenzpflichtig (Adobe / Linotype). Für Web-Einsatz muss eine Lizenz erworben oder ein Webfont-Service (Adobe Fonts) konfiguriert werden. Aktuell greift bei den meisten Besuchern der Fallback „Century Gothic", was auf den meisten Systemen installiert ist.

### Logo
`images/logo.png` – wird in Nav und Footer eingebunden.
Im Hero ist das Logo per CSS-Filter weiss eingefärbt (`filter: brightness(0) invert(1)`).

---

## Konzept-Hinweise

Auf jeder Seite ist unten rechts ein „**Konzept · Vorschau**"-Badge sichtbar.
Vor dem Live-Schalten entfernen: In jeder HTML-Datei `<div class="concept-badge">…</div>` löschen.

Alle Platzhalter sind markiert mit `[ Bild: ... ]` oder mit dem `placeholder-note`-Element.

---

## Was noch fehlt

- [ ] Echte Bilder einpflegen (Hero, Räume, Zimmer, Speisen, Atmosphäre)
- [ ] Definitive Speisekarte aus `Menüs mit Preisen.docx`
- [ ] Frühstück- und Znüni-Karte aus `Frühstück Znüni.docx`
- [ ] Wein- und Getränkekarte (folgt noch)
- [ ] Beschreibungen der 7 Hotelzimmer + Preise
- [ ] Aleno-Account aktivieren und Widget einbinden
- [ ] Hotel-Buchungssystem definieren und einbinden
- [ ] Definitive Texte für „Über uns" (Geschichte, Konzept, Team)
- [ ] Liste der Kooperationspartner
- [ ] Impressum & Datenschutzerklärung
- [ ] Google Maps Embed auf Kontaktseite
- [ ] Formular-Endpoint für Bankett-Anfrage und Kontaktformular
- [ ] Konzept-Badge entfernen
- [ ] Favicon hinzufügen

---

## Kontakt Projekt

**Auftraggeber:** Müllerhof · Schulstrasse 11 · 5070 Frick · 062 865 53 80 · info@muellerhof.ch
