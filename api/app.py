from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import os
import json

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/jrpm")

def get_geojson(table_name):
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT jsonb_build_object(
                    'type',     'FeatureCollection',
                    'features', jsonb_agg(
                        jsonb_build_object(
                            'type',       'Feature',
                            'geometry',   ST_AsGeoJSON(geom)::jsonb,
                            'properties', to_jsonb(t) - 'geom'
                        )
                    )
                )
                FROM (SELECT * FROM {table_name}) t;
            """)
            result = cur.fetchone()[0]
            return result

@app.route("/api/stations")
def stations():
    return jsonify(get_geojson("jr_stations"))

@app.route("/api/lines")
def lines():
    return jsonify(get_geojson("jr_lines"))

from flask import jsonify

@app.route('/api/schematic-lines')
def schematic_lines():
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                  gid,
                  n02_001,
                  n02_002,
                  n02_003,
                  n02_003_en,
                  n02_004,
                  n02_004_en,
                  n02_005,
                  n02_005_en,
                  n02_005c,
                  n02_005g,
                  COALESCE(ST_AsGeoJSON(geom_schematic), ST_AsGeoJSON(geom))
                FROM jr_lines;
            """)
            rows = cur.fetchall()

    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "properties": {
                "gid": row[0],
                "n02_001": row[1],
                "n02_002": row[2],
                "n02_003": row[3],
                "n02_003_en": row[4],
                "n02_004": row[5],
                "n02_004_en": row[6],
                "n02_005": row[7],
                "n02_005_en": row[8],
                "n02_005c": row[9],
                "n02_005g": row[10],
            },
            "geometry": json.loads(row[11])
        })

    return jsonify({
        "type": "FeatureCollection",
        "features": features
    })

@app.route('/api/schematic-stations')
def schematic_stations():
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                  gid,
                  n02_001,
                  n02_002,
                  n02_003,
                  n02_003_en,
                  n02_004,
                  n02_004_en,
                  n02_005,
                  n02_005_en,
                  n02_005c,
                  n02_005g,
                  COALESCE(ST_AsGeoJSON(geom_schematic), ST_AsGeoJSON(geom))
                FROM jr_stations;
            """)
            rows = cur.fetchall()

    features = []
    for row in rows:
        features.append({
            "type": "Feature",
            "properties": {
                "gid": row[0],
                "n02_001": row[1],
                "n02_002": row[2],
                "n02_003": row[3],
                "n02_003_en": row[4],
                "n02_004": row[5],
                "n02_004_en": row[6],
                "n02_005": row[7],
                "n02_005_en": row[8],
                "n02_005c": row[9],
                "n02_005g": row[10],
            },
            "geometry": json.loads(row[11])
        })

    return jsonify({
        "type": "FeatureCollection",
        "features": features
    })



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
