"""
Preparação do pacote de dados (roda UMA vez, na Terra, antes da missão).

Entrada:  data/raw/candor_chemistry.geojson
          Carta geológica do quadrângulo de Coprates (USGS I-897, McCauley 1978),
          em metros (projeção equiretangular, raio de Marte 3.396.190 m).
Saída:    data/candor_geologia.js
          Só a área da missão (o mesmo quadrado do terreno do QGIS: 4–8°S, 76–80°W),
          em graus (lat/lon), com geometria simplificada (~300 m) e embutida num arquivo .js
          para o app abrir direto do disco, sem servidor e sem internet.

Uso:  pip install shapely
      python tools/preparar_dados.py
"""
import json
import math
from datetime import date
from pathlib import Path

from shapely.geometry import box, mapping, shape
from shapely.ops import transform

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / "data" / "raw" / "candor_chemistry.geojson"
SAIDA = RAIZ / "data" / "candor_geologia.js"

R_MARTE_M = 3_396_190
AREA_MISSAO = box(-80.0, -8.0, -76.0, -4.0)  # (lon_min, lat_min, lon_max, lat_max)
TOLERANCIA_GRAUS = 0.005  # ~300 m em Marte
IGNORAR = {"nodata", ""}


def metros_para_graus(x, y, z=None):
    return (math.degrees(x / R_MARTE_M), math.degrees(y / R_MARTE_M))


def main():
    bruto = json.loads(ENTRADA.read_text(encoding="utf-8"))
    saida = []
    for f in bruto["features"]:
        unidade = str(f["properties"].get("UName", "")).strip().lower()
        if unidade in IGNORAR or not f.get("geometry"):
            continue
        geom = transform(metros_para_graus, shape(f["geometry"])).buffer(0)
        if not geom.intersects(AREA_MISSAO):
            continue
        geom = geom.intersection(AREA_MISSAO).simplify(TOLERANCIA_GRAUS, preserve_topology=True)
        if geom.geom_type == "GeometryCollection":
            geom = geom.buffer(0)
        if geom.geom_type not in ("Polygon", "MultiPolygon"):
            continue
        if geom.is_empty:
            continue
        coords_arredondadas = json.loads(json.dumps(mapping(geom)), parse_float=lambda v: round(float(v), 4))
        saida.append({"type": "Feature", "properties": {"UName": unidade}, "geometry": coords_arredondadas})

    pacote = {
        "type": "FeatureCollection",
        "name": "candor_geologia",
        "fonte": "USGS I-897 Geologic Map of the Coprates Quadrangle of Mars (McCauley, 1978)",
        "preparado_em": date.today().isoformat(),
        "features": saida,
    }
    SAIDA.write_text(
        "// Gerado por tools/preparar_dados.py — não editar à mão.\n"
        "const CANDOR_GEOLOGIA = " + json.dumps(pacote, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"{len(saida)} unidades salvas em {SAIDA.relative_to(RAIZ)} ({SAIDA.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
