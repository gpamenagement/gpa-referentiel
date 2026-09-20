# `gpa.flowmetrik.com` — la mise en ligne

Service Cloud Run **`gpa-referentiel`**, projet `flowmetrik-website`, région
`europe-west1`. Le rail est celui de `legal.` et `rh.` : un service par
sous-domaine, un mappage de domaine, un CNAME dans la zone `flowmetrik-com`
du projet `flowmetrik-all` — la zone DNS **n'est pas** dans le projet du site.

```bash
export CLOUDSDK_CONFIG=$(mktemp -d)          # jamais la configuration par défaut :
gcloud auth activate-service-account \
  --key-file=/home/mbakkali/projects/credentials/flowmetrik-all.json

pnpm build                                    # dist/ est le contenu servi

gcloud run deploy gpa-referentiel --source . \
  --project=flowmetrik-website --region=europe-west1 \
  --port=8080 --cpu=1 --memory=512Mi --min-instances=0 --max-instances=4

# L'org policy refuse allUsers : le service se rend joignable autrement.
gcloud run services update gpa-referentiel --region=europe-west1 \
  --project=flowmetrik-website --no-invoker-iam-check

# Une seule fois, à la création du sous-domaine :
gcloud beta run domain-mappings create --service=gpa-referentiel \
  --domain=gpa.flowmetrik.com --region=europe-west1 --project=flowmetrik-website
gcloud dns record-sets create gpa.flowmetrik.com. --project=flowmetrik-all \
  --zone=flowmetrik-com --type=CNAME --ttl=300 --rrdatas=ghs.googlehosted.com.
```

## Quatre choses qui coûtent une heure si on les ignore

1. **`--allow-unauthenticated` ne suffit pas** sur les projets de l'organisation :
   la liaison `allUsers` est refusée par une org policy, le déploiement se
   termine par « Setting IAM policy failed » et le service répond 403 à tout le
   monde. `--no-invoker-iam-check` est le contournement en place depuis le
   2026-08-15, déjà utilisé par `flowmetrik-links` et `flowmetrik-legal`. Le
   contrôle d'accès doit alors vivre **dans** l'application — ici il n'y en a
   pas : c'est une démonstration publique, assumée comme telle.
2. **Le `Dockerfile` est à la racine**, et pas dans ce dossier où il serait mieux
   rangé : le `gcloud` de cette machine n'a pas l'option `--dockerfile`, et
   `--source .` ne cherche qu'à la racine.
3. **`.gcloudignore` doit rouvrir `dist/`.** Sans fichier `.gcloudignore`,
   gcloud reprend le `.gitignore`, où `dist` figure : le contexte part sans le
   site, le build réussit, et la production rend un 404 sans la moindre erreur.
4. **Le certificat met quelques minutes à une heure.** Tant qu'il n'est pas
   émis, `https://gpa.flowmetrik.com` échoue alors que le service tourne. Suivre
   par `gcloud beta run domain-mappings describe --domain=gpa.flowmetrik.com`.

## Ce que le service fait

Vingt lignes de Node sans dépendance (`server.js`) : il sert `dist/`, pose
`X-Robots-Tag: noindex` et un `robots.txt` fermé — une démonstration portant la
charte d'un tiers ne s'indexe pas —, met `assets/` en cache immuable (les noms
portent une empreinte) et l'index en `no-cache`, sinon un déploiement reste
invisible pour qui a déjà ouvert la page.

Il n'y a **aucune authentification** : c'est voulu, et le bandeau de chaque
écran dit ce que le site est. Le jour où il faudrait fermer la porte, le patron
est celui de FlowAO — lien magique et garde par domaine, cf. `../../README.md`.
