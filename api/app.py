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

@app.route("/api/stations_pgr")
def stations_pgr():
    return jsonify(get_geojson("jr_stations_pgr"))


# Route for pgRouting route between two station IDs
@app.route("/api/route/<int:start_id>/<int:end_id>")
def route(start_id, end_id):
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT route.seq, route.node, route.edge, route.cost,
                       ST_AsGeoJSON(vs.the_geom)::json,
                       s.n02_005 AS station_name,
                       s.n02_005_en AS station_name_en,
                       e.n02_003 AS line_name,
                       e.n02_003_en AS line_name_en,
                       ST_AsGeoJSON(e.geom)::json AS edge_geom
                FROM pgr_dijkstra(
                    'SELECT id, source, target, weighted_cost AS cost, reverse_cost FROM jr_edges',
                    %s, %s, directed := false
                ) AS route
                LEFT JOIN jr_edges_vertices_pgr AS vs ON route.node = vs.id
                LEFT JOIN jr_edges AS e ON route.edge = e.id
                LEFT JOIN LATERAL (
                    SELECT n02_005, n02_005_en
                    FROM jr_stations_pgr
                    ORDER BY geom <-> vs.the_geom
                    LIMIT 1
                ) AS s ON true
            """, (start_id, end_id))
            rows = cur.fetchall()
            return jsonify([
                {
                    "seq": r[0],
                    "node": r[1],
                    "edge": r[2],
                    "cost": r[3],
                    "geom": r[4],
                    "station_name": r[5],
                    "station_name_en": r[6],
                    "line_name": r[7],
                    "line_name_en": r[8],
                    "edge_geom": r[9]
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
                SELECT s.gid, s.n02_005, ST_AsGeoJSON(s.geom)::json,
                       ST_Distance(s.geom::geography, ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 6668)::geography) AS dist,
                       (
                           SELECT id
                           FROM jr_edges_vertices_pgr
                           ORDER BY the_geom <-> s.geom
                           LIMIT 1
                       ) AS nearest_node
                FROM jr_stations_pgr AS s
                ORDER BY s.geom <-> ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 6668)
                LIMIT 1;
            """, (lon, lat, lon, lat))
            row = cur.fetchone()
            return jsonify({
                "id": row[0],
                "name": row[1],
                "geom": row[2],
                "distance_m": row[3],
                "node_id": row[4]
            })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
