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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
