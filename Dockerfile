# Le conteneur de gpa.flowmetrik.com : le build statique, et vingt lignes de
# serveur. Aucune dépendance npm — rien à mettre à jour, rien à auditer.
#
# Il vit à la RACINE, et pas dans `deploy/cloud-run/` où il serait mieux rangé :
# le `gcloud` de cette machine n'a pas l'option `--dockerfile`, et `--source .`
# ne cherche qu'ici. Le serveur, lui, reste dans `deploy/cloud-run/`.
FROM node:22-alpine

WORKDIR /app
COPY deploy/cloud-run/server.js ./server.js
COPY dist ./public

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "server.js"]
