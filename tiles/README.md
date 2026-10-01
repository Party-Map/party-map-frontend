# The Hungary basemap

The map draws its own tiles: OpenStreetMap data for Hungary, built into one vector tile archive and served by a tile
server next to the app, styled in the browser (light and dark, `src/map/basemap/`). No third-party tile service is
involved.

| Piece    | What                                                                                                               | Where                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Data     | Geofabrik's Hungary extract plus ocean polygons and Natural Earth (about 1.7 GB of downloads, kept for later runs) | `tiles/data/sources/` (git-ignored)            |
| Build    | [Planetiler](https://github.com/onthegomap/planetiler) 0.10.2 (OpenMapTiles schema, zoom 0–14)                     | compose service `tiles-build`, profile `build` |
| Archive  | `hungary.pmtiles`, about 275 MB, built in two minutes on a laptop                                                  | `tiles/data/` (git-ignored)                    |
| Server   | [Martin](https://maplibre.org/martin/) 1.16.1 serves the tiles and renders font glyphs from the TTFs               | compose service `tiles`, `tiles/martin.yaml`   |
| Fonts    | Inter 4.1 Regular, Medium and SemiBold (SIL Open Font License, `fonts/LICENSE.txt`)                                | `tiles/fonts/`                                 |
| Renderer | MapLibre GL inside Leaflet (`@maplibre/maplibre-gl-leaflet`), `src/map/Basemap.tsx`                                | the app                                        |

Every Martin endpoint lives under `/tiles` (`route_prefix` in `martin.yaml`): `/tiles/catalog`, `/tiles/hungary`
(TileJSON), `/tiles/hungary/{z}/{x}/{y}` and `/tiles/font/{name}/{start}-{end}`. The app requests exactly these paths on
its own origin; the dev server (`TILES_URL`) and the production nginx (`TILES_UPSTREAM`) pass them through unchanged.
`PUBLIC_TILES_BASE` (default `/tiles`) is the only app-side setting.

## Development

```bash
docker compose --profile build run --rm tiles-build   # once (and after a data refresh): writes tiles/data/hungary.pmtiles
docker compose up -d tiles                            # Martin on http://localhost:3001
curl -s localhost:3001/tiles/catalog | jq             # the source "hungary" and the font names
pnpm dev                                              # proxies /tiles to the container
```

Planetiler needs about 1.5 GB of memory (`JAVA_TOOL_OPTIONS` in `docker-compose.yml`). If Docker's VM is smaller and
the build dies, give Docker Desktop more memory, or run the jar natively with the installed JDK and the same arguments:

```bash
curl -LO https://github.com/onthegomap/planetiler/releases/download/v0.10.2/planetiler.jar
cd tiles/data && java -Xmx2g -jar ../../planetiler.jar --download --area=hungary --output=hungary.pmtiles --force
```

**Fonts.** Martin names a font after the family and style inside the TTF (`Inter Regular`, `Inter Medium`,
`Inter SemiBold`); the names are listed in `/tiles/catalog` and used verbatim in `src/map/basemap/style.ts`
(`FONT_REGULAR`, `FONT_MEDIUM`, `FONT_SEMIBOLD`). Changing a font file means checking the catalog and updating those
constants. Glyph ranges are rendered on the fly, so no pre-generated glyph files exist.

**Refreshing the data.** Rerun `tiles-build`: `--download` keeps the files in `tiles/data/sources/` and `--force`
overwrites the archive. Delete `tiles/data/sources/hungary.osm.pbf` first to fetch a newer extract. Restart `tiles`
afterwards; browsers and nginx cache tiles for a day (`cache_control` in `martin.yaml`, `proxy_cache` in
`nginx/templates/default.conf.template`).

**Attribution.** The tiles are OpenStreetMap data (ODbL) in the OpenMapTiles schema, so both must be credited. The
maps show no attribution control (the owner's choice); the credit is the "Map data" line of the first-visit privacy
notice (`src/components/ConsentBanner.tsx`, text in `TILE_ATTRIBUTION`). Keep it.

## Production

Build the archive on a workstation (the server has 4 GB of memory, which Planetiler would share with the database),
then copy the archive, the config and the fonts to the server's app project and add the `tiles` service there:

```bash
scp tiles/data/hungary.pmtiles root@terkep-prod-server:/root/partymap/app/tiles/data/
scp tiles/martin.yaml root@terkep-prod-server:/root/partymap/app/tiles/
scp -r tiles/fonts root@terkep-prod-server:/root/partymap/app/tiles/
```

```yaml
# /root/partymap/app/docker-compose.yml: internal only, no ports, no Traefik labels; the frontend proxies /tiles to it.
tiles:
    image: ghcr.io/maplibre/martin:1.16.1
    command: ["--config", "/config/martin.yaml"]
    restart: unless-stopped
    mem_limit: 512m
    volumes:
        - /root/partymap/app/tiles/martin.yaml:/config/martin.yaml:ro
        - /root/partymap/app/tiles/fonts:/fonts:ro
        - /root/partymap/app/tiles/data:/data:ro
```

The frontend image reaches it as `tiles:3000` (`TILES_UPSTREAM`, the Dockerfile's default), so nothing changes on the
`frontend` service. Then:

```bash
cd /root/partymap/app
docker compose up -d tiles
docker compose exec -T tiles wget -qO- http://127.0.0.1:3000/tiles/catalog </dev/null   # source + fonts
docker compose pull frontend && docker compose up -d frontend
curl -sI https://terkep.party/tiles/hungary/14/9058/5729 | grep -i -E "HTTP|cache"       # 200, X-Cache-Status
```

Rollback: start the previous frontend image (it has no `/tiles` route and uses public OpenStreetMap tiles) and
`docker compose rm -sf tiles`. Disk: the archive plus at most 512 MB of nginx cache. Memory: Martin stays well under
its 512 MB limit for one country.
