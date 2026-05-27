#!/bin/bash
# ============================================================
# push.command  –  Müllerhof Website
# Doppelklick auf diese Datei lädt alle Änderungen auf GitHub.
# ============================================================

# In den Ordner wechseln, in dem dieses Skript liegt
cd "$(dirname "$0")" || exit 1

echo ""
echo "=========================================="
echo "  Müllerhof Website  ->  GitHub Push"
echo "=========================================="
echo ""

# 1) Alle Änderungen für den Commit vormerken
echo "[1/4] Änderungen sammeln (git add)..."
git add -A
echo ""

# 2) Commit erstellen – mit Zeitstempel als Standard-Nachricht
echo "[2/4] Commit-Nachricht eingeben (Enter = automatischer Zeitstempel):"
read -r MSG
if [ -z "$MSG" ]; then
    MSG="Update $(date '+%d.%m.%Y %H:%M')"
fi

git commit -m "$MSG"
COMMIT_STATUS=$?
echo ""

# 3) Aktuellen Stand vom Server holen (nach Commit, damit nichts überschrieben wird)
echo "[3/4] Hole aktuellen Stand von GitHub (pull)..."
git pull origin main --rebase
if [ $? -ne 0 ]; then
    echo ""
    echo "FEHLER beim Pull. Bitte Konflikte zuerst lösen."
    read -p "Drücke Enter zum Schliessen..."
    exit 1
fi
echo ""

# 4) Push auf GitHub
echo "[4/4] Lade auf GitHub hoch (push)..."
git push origin main
PUSH_STATUS=$?
if [ $PUSH_STATUS -ne 0 ]; then
    echo ""
    echo "FEHLER beim Push. Bitte Login/Berechtigung prüfen."
    read -p "Drücke Enter zum Schliessen..."
    exit 1
fi

echo ""
echo "=========================================="
if [ $COMMIT_STATUS -eq 0 ]; then
    echo "  FERTIG! Änderungen sind auf GitHub."
    echo "  Commit: $MSG"
else
    echo "  Keine neuen Änderungen – aber Sync mit"
    echo "  GitHub ist aktuell."
fi
echo "=========================================="
echo ""
read -p "Drücke Enter zum Schliessen..."
