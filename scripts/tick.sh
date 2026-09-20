#!/usr/bin/env bash
# Un tour de boucle complet : construire, servir, juger.
#
# L'ordre compte. La boucle juge la page SERVIE, pas les sources : sans le
# redémarrage du service entre le build et la mesure, on juge la version
# précédente et on croit avoir corrigé quelque chose.
set -Eeuo pipefail
cd "$(dirname "$0")/.."

# Un seul tick à la fois. Deux passes concurrentes se partagent le même serveur
# et la même machine : chacune double sa durée, et l'ensemble ressemble à un gel
# sans qu'aucune ne soit en faute.
exec 9>/tmp/whiteapp-tick.lock
flock -n 9 || { echo "un tick tourne déjà — attendre, ou le voir avec : pgrep -af boucle.py"; exit 1; }

horo="${1:-$(date +%Y-%m-%d-%H%M)}"

echo "▸ Tokens"
pnpm tokens --check

echo "▸ Types et build"
pnpm build >/dev/null

echo "▸ react-doctor"
# `--yes ...@latest` retéléchargerait le paquet à chaque tick : une minute
# d'attente par tour, et on finit par sauter l'étape. `--no-install` réutilise
# le cache npx, et l'installe une seule fois s'il est vide.
# `src` en argument : sans lui, react-doctor lit aussi `moodboard/`, qui
# contient des pages HTML téléchargées en référence. Leurs défauts ne sont pas
# les nôtres, et le bruit finit par masquer les vrais.
npx --yes react-doctor@latest src 2>&1 | grep -E '^Score|^[0-9]+ issue' || true

echo "▸ Service"
# Le service sert `dist/`, donc il DOIT redémarrer après le build : sans ça la
# boucle juge la version précédente et on croit avoir corrigé quelque chose.
systemctl --user restart flowapp-whiteapp.service
for _ in $(seq 1 30); do
  # `2>/dev/null` : les premiers essais échouent forcément le temps que Vite
  # ouvre le port, et laisser passer leurs erreurs fait croire à une panne.
  curl -fsS -o /dev/null http://127.0.0.1:8797/ 2>/dev/null && break
  sleep 1
done
curl -fsS -o /dev/null http://127.0.0.1:8797/ \
  || { echo "le service ne répond pas sur 8797 — systemctl --user status flowapp-whiteapp"; exit 1; }

echo "▸ Boucle de jugement"
python3 scripts/boucle.py --horodatage "$horo"

echo
echo "Journal : ticks/$horo.md"
