import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: { host: '0.0.0.0', port: 5273 },
  build: {
    rollupOptions: {
      output: {
        /**
         * Les gros vendeurs dans leurs propres morceaux — pour le CACHE.
         *
         * Sans cela, le découpage par page ne sert qu'à moitié : deux écrans
         * qui partagent AG Grid le dupliquent, et surtout **une mise à jour de
         * notre code invalide AG Grid avec lui**. L'utilisateur retélécharge
         * 400 ko à chaque déploiement pour trois lignes changées.
         *
         * Séparés, ils sont téléchargés une fois, mis en cache par le
         * navigateur sous un nom qui ne bouge pas, et nos déploiements ne les
         * touchent plus. C'est le réglage repris de flowimmo, et c'est le plus
         * rentable de tout le fichier.
         *
         * Ce qui N'A PAS son morceau, et pourquoi :
         *  - React est importé par l'entrée elle-même ; le déclarer produisait
         *    un fichier vide de 50 octets — une requête et une ligne de
         *    manifeste pour rien ;
         *  - Recharts est déjà isolé par son `lazy()` dans `features/`, qui
         *    fait le même travail à un meilleur endroit : il n'est même pas
         *    téléchargé sur un écran sans graphique.
         */
        manualChunks: {
          'vendor-grille': ['ag-grid-community', 'ag-grid-react', '@ag-grid-community/locale'],
        },
      },
    },
    // Le seuil d'alerte reste au défaut : un morceau qui repasse au-dessus de
    // 500 ko doit se voir, y compris `vendor-grille`.
  },
})
