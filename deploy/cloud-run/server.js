// Le serveur statique de gpa.flowmetrik.com — sans dépendance.
//
// L'application navigue par hash (`#carte`), donc il n'y a aucune réécriture
// d'URL à faire : tout ce qui n'est pas un fichier est l'index. Un serveur de
// SPA qui réécrit tout en `/index.html` masquerait une erreur de chemin en
// affichant l'accueil — ici, un fichier absent rend un 404, ce qui est la
// seule façon de s'en apercevoir.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const RACINE = new URL('./public/', import.meta.url).pathname
const PORT = process.env.PORT || 8080

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  // Absent de la plupart des tables : servi en type générique, le navigateur
  // refuse la police et la page retombe en repli, sans erreur.
  '.woff2': 'font/woff2',
}

const server = createServer(async (req, res) => {
  const commun = {
    // Une démonstration portant la charte d'un tiers ne s'indexe pas.
    'X-Robots-Tag': 'noindex, nofollow',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }

  if (req.url === '/robots.txt') {
    res.writeHead(200, { ...commun, 'Content-Type': 'text/plain' })
    return res.end('User-agent: *\nDisallow: /\n')
  }

  const chemin = decodeURIComponent((req.url || '/').split('?')[0])
  const relatif = normalize(chemin).replace(/^(\.\.[/\\])+/, '')
  let fichier = join(RACINE, relatif === '/' ? 'index.html' : relatif)

  try {
    const s = await stat(fichier)
    if (s.isDirectory()) fichier = join(fichier, 'index.html')
    const corps = await readFile(fichier)
    const ext = extname(fichier)
    res.writeHead(200, {
      ...commun,
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      // Les fichiers d'`assets/` portent une empreinte dans leur nom : ils sont
      // immuables. L'index, lui, ne se met jamais en cache, sinon un déploiement
      // reste invisible pour qui a déjà visité la page.
      'Cache-Control': relatif.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    })
    res.end(corps)
  } catch {
    res.writeHead(404, { ...commun, 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('404\n')
  }
})

server.listen(PORT, () => console.log(`gpa-referentiel sur :${PORT}`))
