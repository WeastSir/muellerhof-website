# Terminal-Anleitung – Müllerhof Website

Diese Anleitung erklärt Schritt für Schritt, wie du mit Git/GitHub via Terminal arbeitest.

## 1. Einmalig: Identität setzen (falls noch nicht gemacht)

Öffne das Terminal (Cmd+Leertaste → "Terminal" → Enter) und führe einmalig aus:

```bash
git config --global user.name "Dein Name"
git config --global user.email "deine@email.ch"
```

Prüfen mit:

```bash
git config --global --list
```

## 2. In den Projekt-Ordner wechseln

Im Terminal:

```bash
cd ~/Documents/Claude/Projects/"Webseite Team 1"
```

Tipp: Du kannst auch `cd ` (mit Leerzeichen) tippen und dann den Ordner vom Finder ins Terminal ziehen.

## 3. Aktuellen Stand prüfen

```bash
git status
```

Zeigt dir, welche Dateien geändert wurden.

## 4. Änderungen hochladen – der schnelle Weg

**Doppelklick auf `push.command`** im Finder. Fertig.

Falls macOS meckert ("kann nicht geöffnet werden, weil von unbekanntem Entwickler"):
- Rechtsklick auf `push.command` → "Öffnen" → "Öffnen" bestätigen
- Oder im Terminal: `chmod +x push.command` (einmalig)

## 5. Änderungen hochladen – der manuelle Weg im Terminal

```bash
# 1. Aktuellsten Stand von GitHub holen
git pull origin main

# 2. Alle Änderungen vormerken
git add -A

# 3. Commit mit Beschreibung
git commit -m "Beschreibung was du geändert hast"

# 4. Auf GitHub hochladen
git push origin main
```

## 6. Wichtige Befehle – Spickzettel

| Befehl | Was es macht |
|---|---|
| `git status` | Welche Dateien wurden geändert? |
| `git pull origin main` | Neueste Version von GitHub holen |
| `git add -A` | Alle Änderungen für Commit vormerken |
| `git commit -m "..."` | Snapshot mit Beschreibung erstellen |
| `git push origin main` | Snapshot zu GitHub hochladen |
| `git log --oneline` | Verlauf aller Commits anzeigen |
| `git diff` | Zeigt was sich geändert hat |

## 7. Beim ersten Push: GitHub-Login

Beim ersten `git push` fragt macOS nach deinen GitHub-Zugangsdaten:
- **Username:** Dein GitHub-Benutzername (`WeastSir`)
- **Password:** **NICHT** dein normales Passwort! Du brauchst ein **Personal Access Token**:
  1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. "Generate new token (classic)"
  3. Scope: `repo` ankreuzen
  4. Token kopieren und als "Passwort" einfügen
  5. macOS speichert es im Schlüsselbund – musst es nur einmal eingeben

Alternative (empfohlen): **GitHub CLI** installieren mit `brew install gh` und dann `gh auth login`.

## 8. Repo-Adresse prüfen

```bash
git remote -v
```

Sollte zeigen:
```
origin  https://github.com/WeastSir/muellerhof-website (fetch)
origin  https://github.com/WeastSir/muellerhof-website (push)
```

## 9. Wenn etwas schief geht

**"Konflikt" beim Pull:**
- Jemand im Team hat die gleiche Stelle bearbeitet
- Datei öffnen → Konflikt-Markierungen (`<<<<<<<`, `=======`, `>>>>>>>`) ansehen → richtig bearbeiten → speichern
- Dann: `git add -A && git commit -m "Konflikt gelöst"` → `git push`

**Aus Versehen committed?**
- Letzten Commit rückgängig (Dateien bleiben erhalten):
  `git reset --soft HEAD~1`

**Hilfe zu einem Befehl:**
- `git help <befehl>` (z.B. `git help push`)
