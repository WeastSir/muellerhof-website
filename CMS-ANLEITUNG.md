# Müllerhof CMS – Setup & Anleitung

Das CMS (Content Management System) erlaubt dir, **alle Inhalte der Webseite** ohne Code-Kenntnisse zu bearbeiten: Events, Texte, Speisekarte, Öffnungszeiten und News.

---

## 🔧 EINMALIGES SETUP (15 Minuten)

### 1. Datenbank-Schema in Supabase einrichten

1. Öffne dein Supabase-Projekt: <https://supabase.com/dashboard>
2. Klick links auf **SQL Editor**
3. Klick auf **+ New Query**
4. Öffne im Editor die Datei `sql/cms_setup.sql` aus dem Webseiten-Ordner
5. Kopiere den **kompletten Inhalt** in das Supabase-SQL-Fenster
6. Klick unten rechts auf **RUN**
7. Du solltest sehen: "Success. No rows returned" und ein paar INSERT-Meldungen

Das hat alle Tabellen erstellt, die Sicherheits-Regeln aktiviert und Beispiel-Daten (Events 2027 + Öffnungszeiten + Beispiel-Texte) eingefügt.

### 2. Storage-Bucket für Bilder anlegen

1. In Supabase links auf **Storage**
2. Klick **New bucket**
3. Name: `cms-media` (genau so!)
4. **Public bucket** aktivieren ✅
5. Klick **Save**

### 3. Admin-Benutzer erstellen

1. In Supabase links auf **Authentication** → **Users**
2. Klick **Add user** → **Create new user**
3. E-Mail eingeben (z.B. `admin@muellerhof.ch` oder deine eigene)
4. Passwort vergeben (mindestens 6 Zeichen, merken!)
5. **Auto Confirm Email** ✅ aktivieren
6. Klick **Create user**

### 4. Webseite hochladen / pushen

Wenn deine Webseite bereits auf GitHub Pages läuft, einfach pushen:

```bash
./push.command
```

Oder manuell:
```bash
git add .
git commit -m "CMS hinzugefügt"
git push
```

---

## 🚀 NUTZUNG

### Admin öffnen

Im Browser: **`https://deine-webseite.ch/admin.html`** (z.B. `muellerhof.github.io/Webseite-Team-1/admin.html`)

- Mit E-Mail + Passwort einloggen
- Du landest auf der **Übersicht** mit Zähler-Karten

### Was kann ich bearbeiten?

| Bereich | Was | Wo zu sehen |
|---|---|---|
| **Events** | Eventkalender (Titel, Datum, Zeit, Beschreibung, Bild) | `events.html` |
| **Seitentexte** | Hero-Claims, Headlines, Fliesstexte aller Seiten | überall |
| **Speisekarte** | Speisen, Getränke, Weine inkl. Preise & Allergene | (nach Einbau in HTML) |
| **Öffnungszeiten** | Restaurant / Hotel / Bar Zeiten | `kontakt.html` (sobald eingebunden) |
| **News** | Aktuelle Meldungen, Tagesangebote, Saisonales | (nach Einbau in HTML) |
| **Medien** | Bild-Upload, URL kopieren für Events/News | überall |

### Änderungen sind sofort live

Sobald du im Admin auf **Speichern** klickst, lädt die Webseite den neuen Inhalt automatisch beim nächsten Aufruf. Kein Deployment nötig.

---

## 📝 SEITENTEXTE EDITIEREN – wie geht das?

Jeder Text auf der Webseite, der via CMS bearbeitbar sein soll, hat im HTML ein **`data-cms="seite:schluessel"`** Attribut. Bereits eingerichtet:

- `index:hero_claim` – "Das Wohnzimmer von Frick."
- `index:hero_tagline` – "Wo Begegnung zuhause ist."
- `index:intro_headline` – "Von Frick. Für Frick."
- `index:intro_lead` – Willkommens-Text
- `index:intro_usp` – Zitat-Box

Diese erscheinen automatisch im Admin unter **Seitentexte**.

### Neuen Text-Block anlegen (für Entwickler)

1. Im Admin **Seitentexte → + Neuer Text-Block**
2. Felder ausfüllen:
   - **Seite (slug)**: z.B. `restaurant`
   - **Schlüssel**: z.B. `hero_claim` (technisch, einmalig pro Seite)
   - **Beschreibung**: was ist das (für dich zum Wiederfinden)
   - **Typ**: Einfacher Text / HTML / Bild-URL
   - **Inhalt**: Der Text
3. Im HTML einbauen:
   ```html
   <h1 data-cms="restaurant:hero_claim">Fallback-Text falls Datenbank offline</h1>
   ```

---

## 🖼 BILDER HOCHLADEN

1. Admin → **Medien** → **+ Bild hochladen**
2. Datei auswählen → automatischer Upload
3. Klick auf **URL** beim Bild → URL ist in die Zwischenablage kopiert
4. Diese URL in einem Event/News/Text-Block einfügen

---

## 🔒 SICHERHEIT

- **Lesen** der Inhalte: ist öffentlich (sonst könnte die Webseite sie nicht zeigen)
- **Schreiben** (erstellen/bearbeiten/löschen): nur eingeloggte Admin-Benutzer
- Per **Row-Level-Security (RLS)** in Supabase geschützt – wer nicht eingeloggt ist, kann nichts ändern, auch nicht via Browser-Konsole.

### Weitere Admins hinzufügen

Einfach in Supabase → Authentication → Add user. Alle Authenticated User dürfen schreiben.

---

## 🆘 TROUBLESHOOTING

**"Login fehlgeschlagen"** → E-Mail/Passwort prüfen. Falls vergessen: Supabase → Authentication → User → Reset password.

**"Speichern" tut nichts** → Browser-Konsole öffnen (F12), nach Fehlern schauen. Häufig: SQL-Script wurde noch nicht ausgeführt.

**Frontend zeigt alte Inhalte** → Browser-Cache leeren (Cmd+Shift+R / Strg+F5).

**Bild-Upload klappt nicht** → Storage-Bucket `cms-media` existiert und ist PUBLIC?

**Events erscheinen nicht auf events.html** → Events haben `aktiv = true` und `datum >= heute` (Vergangenheit wird ausgeblendet).

---

## 📁 DATEIEN

| Datei | Zweck |
|---|---|
| `admin.html` | Admin-Interface |
| `css/admin.css` | Admin-Styling |
| `js/admin.js` | Admin-Logik (Auth + CRUD) |
| `js/cms-loader.js` | Lädt CMS-Inhalte ins Frontend |
| `sql/cms_setup.sql` | Datenbank-Setup-Script |

---

## ➕ ERWEITERUNGEN

### Speisekarte auf restaurant.html einbinden
Im HTML einfügen:
```html
<div data-cms-menu="speise"></div>
```

### Getränkekarte
```html
<div data-cms-menu="getraenk"></div>
```

### Weinkarte
```html
<div data-cms-menu="wein"></div>
```

### Öffnungszeiten anzeigen (z.B. auf kontakt.html)
```html
<div data-cms-oeffnung></div>
```

### News-Section
```html
<div data-cms-news></div>
```

In allen Fällen müssen die beiden Scripts (Supabase + cms-loader) am Seitenende geladen sein (siehe events.html als Beispiel).
