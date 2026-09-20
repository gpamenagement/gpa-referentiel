#!/usr/bin/env python3
"""Sert `dist/` en statique, pour le pont tailnet.

    python3 scripts/servir.py [--port 5390]

Pourquoi pas `pnpm preview` derrière le pont : Vite refuse une requête dont
l'en-tête `Host` ne figure pas dans `allowedHosts`, et la réponse est un
« Blocked request » que rien dans le journal du pont n'explique. Un serveur
statique n'a pas d'opinion sur le `Host` — et l'application navigue par hash,
donc aucune réécriture d'URL n'est nécessaire.
"""
import argparse
import functools
import http.server
import mimetypes
import pathlib
import socketserver

mimetypes.add_type("font/woff2", ".woff2")      # absent de la table par défaut
mimetypes.add_type("image/svg+xml", ".svg")

ap = argparse.ArgumentParser()
ap.add_argument("--port", type=int, default=5390)
args = ap.parse_args()

racine = pathlib.Path(__file__).resolve().parent.parent / "dist"
if not (racine / "index.html").exists():
    raise SystemExit(f"ÉCHEC — {racine}/index.html absent : lancer `pnpm build` d'abord")

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(racine))


class Serveur(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


with Serveur(("127.0.0.1", args.port), handler) as httpd:
    print(f"dist/ servi sur http://127.0.0.1:{args.port}")
    httpd.serve_forever()
