from flask import Flask, jsonify, request
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


# Route for pgRouting route between two station IDs
@app.route("/api/route/<int:start_id>/<int:end_id>")
def route(start_id, end_id):
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT seq, node, edge, cost, 
                       s.name as source_name, 
                       s.geom as source_geom, 
                       t.name as target_name, 
                       t.geom as target_geom
                FROM pgr_dijkstra(
                    'SELECT id, source, target, cost, reverse_cost FROM jr_edges',
                    %s, %s, directed := false
                ) AS route
                LEFT JOIN jr_edges_vertices_pgr AS vs ON route.node = vs.id
                LEFT JOIN jr_stations AS s ON route.node = s.id
                LEFT JOIN jr_stations AS t ON route.node = t.id
            """, (start_id, end_id))
            rows = cur.fetchall()
            return jsonify([
                {
                    "seq": r[0],
                    "node": r[1],
                    "edge": r[2],
                    "cost": r[3],
                    "source_name": r[4],
                    "source_geom": r[5],
                    "target_name": r[6],
                    "target_geom": r[7]
                }
                for r in rows
            ])

# Route to find the nearest station to a given latitude and longitude
@app.route("/api/nearest_station")
def nearest_station():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)

    if lat is None or lon is None:
        return jsonify({"error": "Missing lat or lon"}), 400

    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT gid, n02_005, ST_AsGeoJSON(geom)::json,
                       ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) AS dist
                FROM jr_stations
                ORDER BY geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                LIMIT 1;
            """, (lon, lat, lon, lat))
            row = cur.fetchone()
            return jsonify({
                "id": row[0],
                "name": row[1],
                "geom": row[2],
                "distance_m": row[3]
            })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
