import { useEffect, useRef } from 'react'
// MapLibre 6 n'a plus d'export par défaut : `import maplibregl from …` compile
// chez certains bundlers et casse chez les autres. Imports nommés, toujours.
import {
  Map as CarteMapLibre, NavigationControl, ScaleControl, Popup, LngLatBounds,
  type GeoJSONSource, type MapMouseEvent, type MapLayerMouseEvent,
} from 'maplibre-gl'
import type { Feature, FeatureCollection, Point } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Operation } from '@/donnees/socle'

/**
 * La carte des opérations — fond IGN, points cliquables, liste synchronisée.
 *
 * **Pourquoi la Géoplateforme IGN et pas un fond tiers.** Un établissement
 * public français regarde ses opérations sur la carte de l'État : c'est un
 * argument d'offre autant qu'un choix technique. Le service est ouvert, sans
 * clé ni compte — CARTO conviendrait aussi, Mapbox demanderait un jeton, et un
 * fond qui exige une clé est une dépendance qu'un marché public fait justifier.
 *
 * **Pourquoi pas de regroupement de points.** Cinquante-huit opérations ne le
 * justifient pas : le regroupement cacherait la seule chose que la carte doit
 * montrer d'un coup d'œil — où l'établissement travaille, et où il ne travaille
 * pas.
 *
 * **Le piège qui vide une carte sans rien dire** : un point sans coordonnées
 * produit un `NaN` que MapLibre ignore en silence. Les opérations sans
 * localisation sont donc écartées AVANT la source, et leur nombre est affiché.
 */

const FOND = 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM' +
  '&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}'

/** Une couleur par direction territoriale. Les valeurs sont celles de la charte. */
export const COULEUR_DT: Record<string, string> = {
  'Grand Paris Sud': '#23145F',
  'Grand Paris Ouest': '#EA515A',
  'Grand Paris Nord': '#789983',
  'Grand Paris Est': '#64635B',
  'Grand Paris Seine Amont': '#1D1D26',
  ORSA: '#8A7FB5',
  DIAH: '#B3283A',
  DDOI: '#4C6B57',
  'non rattachée': '#9CA3AF',
}

export const dtDe = (o: Operation) => o.dt ?? 'non rattachée'

export function CarteOperations(
  { operations, choisie, onChoisir }:
  { operations: Operation[]; choisie: string | null; onChoisir: (cle: string | null) => void },
) {
  const conteneur = useRef<HTMLDivElement | null>(null)
  const carte = useRef<CarteMapLibre | null>(null)
  const prete = useRef(false)
  // Le gestionnaire de clic est lu dans une référence : l'attacher à nouveau à
  // chaque rendu multiplierait les écouteurs, et le détacher au démontage de
  // l'effet recréerait la carte à chaque sélection.
  const surClic = useRef(onChoisir)
  surClic.current = onChoisir

  const geo = operations.filter(o => o.localisation)

  useEffect(() => {
    if (!conteneur.current || carte.current) return undefined
    const m = new CarteMapLibre({
      container: conteneur.current,
      style: {
        version: 8,
        sources: {
          ign: {
            type: 'raster', tiles: [FOND], tileSize: 256,
            attribution: '© IGN — Géoplateforme',
          },
        },
        layers: [{ id: 'ign', type: 'raster', source: 'ign' }],
      },
      center: [2.38, 48.78],
      zoom: 8.4,
      attributionControl: { compact: true },
    })
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    m.addControl(new ScaleControl({ maxWidth: 110, unit: 'metric' }))

    m.on('load', () => {
      m.addSource('operations', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

      // L'anneau de sélection est une COUCHE À PART, sous les points : peindre
      // le point sélectionné autrement obligerait à reconstruire la source à
      // chaque clic, et la carte clignoterait.
      m.addLayer({
        id: 'operations-choisie', type: 'circle', source: 'operations',
        filter: ['==', ['get', 'cle'], ''],
        paint: {
          'circle-radius': ['+', ['get', 'rayon'], 7],
          'circle-color': '#FFFFFF',
          'circle-opacity': 0.55,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#23145F',
        },
      })
      m.addLayer({
        id: 'operations-points', type: 'circle', source: 'operations',
        paint: {
          'circle-radius': ['get', 'rayon'],
          'circle-color': ['get', 'couleur'],
          'circle-opacity': 0.75,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#FFFFFF',
        },
      })

      const bulle = new Popup({ closeButton: false, closeOnClick: false, offset: 12 })
      m.on('mouseenter', 'operations-points', (e: MapLayerMouseEvent) => {
        m.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0]
        if (!f) return
        const p = f.properties as Record<string, string>
        bulle.setLngLat((f.geometry as Point).coordinates as [number, number])
          .setHTML(
            `<div style="font-family:Rubik,sans-serif;max-width:220px">
               <div style="font-weight:600;color:#23145F;line-height:1.25">${p.nom}</div>
               <div style="color:#6B7280;font-size:12px">${p.commune}</div>
               <div style="color:#6B7280;font-size:12px;margin-top:2px">${p.dt}</div>
             </div>`)
          .addTo(m)
      })
      m.on('mouseleave', 'operations-points', () => {
        m.getCanvas().style.cursor = ''
        bulle.remove()
      })
      m.on('click', 'operations-points', (e: MapLayerMouseEvent) => {
        const cle = e.features?.[0]?.properties?.cle as string | undefined
        if (cle) surClic.current(cle)
      })
      m.on('click', (e: MapMouseEvent) => {
        const dessus = m.queryRenderedFeatures(e.point, { layers: ['operations-points'] })
        if (dessus.length === 0) surClic.current(null)
      })

      prete.current = true
      carte.current = m
    })

    carte.current = m
    return () => { m.remove(); carte.current = null; prete.current = false }
  }, [])

  // Les données, à chaque changement de filtre.
  useEffect(() => {
    const m = carte.current
    if (!m) return undefined
    const poser = () => {
      const src = m.getSource('operations') as GeoJSONSource | undefined
      if (!src) return
      const features: Feature[] = geo.map(o => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [o.localisation!.lon, o.localisation!.lat] },
        properties: {
          cle: o.cle, nom: o.nom ?? '', commune: o.commune ?? '', dt: dtDe(o),
          couleur: COULEUR_DT[dtDe(o)] ?? COULEUR_DT['non rattachée'],
          // Le rayon suit la RACINE de la surface : une opération dix fois plus
          // grande doit paraître trois fois plus large, pas dix — sinon les
          // grandes mangent la carte et les petites disparaissent.
          rayon: Math.max(5, Math.min(22, Math.sqrt(o.surface_ha ?? 4) * 1.9)),
        },
      }))
      src.setData({ type: 'FeatureCollection', features } satisfies FeatureCollection)

      if (features.length > 0) {
        const lons = geo.map(o => o.localisation!.lon)
        const lats = geo.map(o => o.localisation!.lat)
        const bornes = new LngLatBounds(
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        )
        m.fitBounds(bornes, { padding: 56, maxZoom: 12, duration: 600 })
      }
    }
    // `idle` est émis après le premier rendu complet : c'est le seul moment où
    // la source existe à coup sûr. Un événement inventé (`m.fire('pret')`)
    // compilait mal et, surtout, personne n'aurait su qu'il n'était plus émis.
    if (prete.current) poser()
    else m.once('idle', poser)
    return undefined
  }, [geo])

  // La sélection : anneau, et vol vers le point quand elle vient de la liste.
  useEffect(() => {
    const m = carte.current
    if (!m || !prete.current) return undefined
    if (m.getLayer('operations-choisie')) {
      m.setFilter('operations-choisie', ['==', ['get', 'cle'], choisie ?? ''])
    }
    const o = geo.find(x => x.cle === choisie)
    if (o) {
      m.flyTo({
        center: [o.localisation!.lon, o.localisation!.lat],
        zoom: Math.max(m.getZoom(), 11.5),
        duration: 800,
      })
    }
    return undefined
  }, [choisie, geo])

  return <div ref={conteneur} className="h-full w-full" aria-label="Carte des opérations d’aménagement" />
}
