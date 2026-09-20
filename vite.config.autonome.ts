import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

/**
 * La sortie **autonome** : un seul fichier `.html`, tout inliné.
 *
 *     pnpm build:autonome      → dist-autonome/index.html
 *
 * Pourquoi elle existe, alors que la sortie normale est meilleure en tout
 * point (cache, découpage, poids) : un fichier unique **s'ouvre sans serveur**.
 * C'est la seule forme qui traverse un courriel, un téléphone, un poste de
 * soutenance sans réseau, ou un partage de fichier — et un livrable qu'on ne
 * peut pas ouvrir n'est pas un livrable. Servi avec des chemins relatifs, le
 * même build s'affiche sans mise en page **et rien ne le signale**.
 *
 * Ce que cela coûte, et il faut le savoir : polices, logos et données passent
 * en base64 dans le HTML, le découpage par page disparaît, et le fichier pèse
 * quelques mégaoctets. C'est un mode de démonstration, jamais un mode de
 * déploiement.
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  build: {
    outDir: 'dist-autonome',
    // Tout inliner, polices et images comprises : au-delà de cette limite, Vite
    // écrirait un fichier à côté, et le fichier « autonome » aurait une
    // dépendance externe muette — exactement le défaut qu'on veut éviter.
    assetsInlineLimit: 50 * 1024 * 1024,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 8000,
  },
})
