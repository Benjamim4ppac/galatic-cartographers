# Mars Survival Guide — Western Candor Chasma

**NASA Space Apps Challenge 2026 · Challenge: Interplanetary Survival Guide (Martian Map)**
**Team: Cartógrafos das Galáxias (Uberlândia, Brazil)**

An onboard, offline navigation map for a crewed mission in western Candor Chasma, Valles Marineris. It picks a safe landing spot, finds the nearest water-bearing deposit, plans a route over real slope data, and tells the crew whether it is safe to go.

## The problem

On Mars there is no GPS, no internet and no rescue team, and a message to Earth can take up to 24 minutes. The crew has to decide on their own, and in a canyon up to 7 km deep the shortest route can be the one that kills them. Our map answers one question: **can we drive to the water and still get home?**

## What it does

- **Real terrain:** a 237 × 237 km area (4–8°S, 76–80°W) split into 5.6 million cells of 100 m, each classified from slope derived in QGIS: safe, medium slope (risk) or high slope (blocked). The slope classes line up with the canyon walls visible in the image.
- **Route planner (A\*) on the 100 m grid**, with three risk layers on top of the slope data: medium slope (4× cost), a 500 m rockfall/landslide zone along the canyon walls (3×) and chaotic terrain from the geologic map (4×). High slope is always blocked, and the route never cuts corners around blocked cells. Verified against a reference Dijkstra: identical cost in 25/25 random routes (`tools/verificar_rota.js`).
- **Water and geology:** units from the USGS I-897 geologic map, classified by water potential. Layered deposits (interpreted lake sediments where orbiters later detected hydrated sulfates) are the water targets.
- **Automatic landing and target selection:** lands on the canyon floor, on safe terrain, at least 5 km from any high slope, and picks the closest layered deposit with a fully safe route.
- **Go / caution / no-go decision for the full mission (outbound + 2 h sampling + return)**, with every triggered rule listed on screen:
  - NO-GO: no route; battery or oxygen above 100%; the crew could not walk back within the 8 h suit limit if the rover failed at the target; the route crosses more than 1,000 m of estimated relief (climbing a canyon wall); the mission does not fit in ~12 h of daylight.
  - CAUTION: any risky segment; battery or oxygen above 80%; walk-back above 75% of the suit limit; mission longer than the 6 h midday window (avoiding the strong winds near sunrise and sunset, when one end of the canyon is in daylight and the other in darkness).
- **Traverse simulation** with estimated oxygen, battery, altitude, pressure, temperature and accumulated radiation.
- **Fully offline:** code, libraries, fonts, image, terrain and geology are inside the project. Online NASA mosaics are optional, for context outside the area.

## How to run

Open `mars-survival-guide/index.html` in a browser (double-click works; no server, no internet).

Keyboard: `WASD` move · `+/-` zoom · `F` mission area · `1` base · `2` target · `P` simulate · `M` test a route · `V` route restrictions · `H` geology · `T` temperature · `X` clear.

All parameters (costs, limits, rover, crew, suit) are in `mars-survival-guide/data/parametros.js`.

## Data and sources

| Data | Source | Use |
|---|---|---|
| Slope classes | Derived in QGIS from [PREENCHER: elevation model, e.g. MOLA/HRSC], medium = [PREENCHER]°, high = [PREENCHER]°, exported in IAU_2015:49912 | Where routes can go |
| Image of the area | Exported from QGIS, [PREENCHER: source mosaic] | Offline base map |
| Geologic units | USGS I-897, *Geologic Map of the Coprates Quadrangle of Mars* (McCauley, 1978), doi:10.3133/i897 | Water potential, landing/target selection |
| Radiation reference | Curiosity RAD, ~0.67 mSv/day at Gale crater | Radiation estimate |
| Oxygen reference | NASA life-support planning value, ~0.84 kg O₂ per person per day | Crew oxygen use |
| Context mosaics (optional, online) | NASA MOLA, OpenPlanetary basemap | Context outside the area |

## Preparing the data on Earth

All heavy processing happens before the mission; the app only reads the packaged result.

- `tools/terreno/empacotar_terreno.mjs` (Node 20+) runs the slope rasterizer (`gerar_matriz.js`) on the QGIS polygons in `tools/terreno/dados_qgis/`, blocks a 500 m strip on the map border (the slope data does not cover the edge), packs 4 cells per byte and writes `data/terreno.js`.
- `tools/preparar_dados.py` (Python + shapely) crops the USGS geologic map to the mission area and writes `data/candor_geologia.js`.
- Tests for the rasterizer and the reference router: `cd mars-survival-guide/tools/terreno && node --test tests/*.test.js` (15 tests).
- All mission parameters are in `data/parametros.js`.

## Limitations (honest list)

- Altitude is a simplified model (typical altitude per geologic unit), used for pressure, temperature, radiation, energy and the 1,000 m relief rule. Where the route can go comes from the real slope classes, not from this model.
- Not modeled yet: dunes and rock fields, dust storms, communication shadow from the canyon walls, toxic dust exposure, and planetary-protection "special regions" (no data for this area yet).
- Temperature and radiation are rough estimates, not satellite measurements.
- Water potential is qualitative (high / moderate / low), based on the unit type.
- Some unit codes (SB, PC, CHT) were interpreted by the team from their position on the map; check the official I-897 legend.
- Rover and suit parameters are engineering estimates.

## Next steps

1. Use the elevation model itself for altitude, not only the slope classes.
2. Add THEMIS thermal data, CRISM mineral maps, HiRISE rock abundance and dune maps.
3. Line-of-sight from the canyon floor to orbiters (communication windows) and a dust-storm forecast input.
4. **Scout rover:** send a robotic rover ahead along the planned route to check the soil before the crew leaves.
5. More mission areas (the pipeline works for any QGIS export).

## Team and credits

- Terrain pipeline (QGIS slope, rasterizer, router tests): Yoshida.
- Mission app (geology, mission logic, interface): Benjamim.
- [PREENCHER: Belita, Francisco, Gi, Gustavo e seus papéis]

## Use of AI

The team used AI assistants (Gemini, Claude) to help write and review code and documents. Design decisions, data choices and testing were done by the team.

Leaflet 1.9.4 (BSD-2) and the ARES rasterizer (MIT, `tools/terreno/LICENSE-ARES`) are included with their licenses.
