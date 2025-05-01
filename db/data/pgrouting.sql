-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgrouting;

-- Drop existing topology
DROP TABLE IF EXISTS jr_edges CASCADE;
DROP TABLE IF EXISTS jr_vertices_pgr CASCADE;

-- Explode JR lines into 2-point LineStrings for routing
CREATE TABLE jr_edges AS
SELECT
    row_number() OVER () AS id,
    ST_StartPoint(geom_6668)::geometry(Point, 6668) AS source_geom,
    ST_EndPoint(geom_6668)::geometry(Point, 6668) AS target_geom,
    geom_6668 AS geom,
    ST_Length(geom_6668::geography) AS cost
FROM (
    SELECT (ST_Dump(geom)).geom::geometry(LineString, 6668) AS geom_6668
    FROM jr_lines
) AS exploded
WHERE ST_NPoints(geom_6668) = 2;

ALTER TABLE jr_edges ADD COLUMN source bigint;
ALTER TABLE jr_edges ADD COLUMN target bigint;

SELECT pgr_createTopology('jr_edges', 0.0001, 'geom', 'id', 'source', 'target');

-- Add reverse cost for bidirectional routing
ALTER TABLE jr_edges ADD COLUMN reverse_cost double precision;
UPDATE jr_edges SET reverse_cost = cost;

-- Spatial index for edges and vertex geometry
CREATE INDEX idx_jr_edges_geom ON jr_edges USING GIST (geom);
CREATE INDEX idx_jr_edges_vertices_pgr_geom ON jr_edges_vertices_pgr USING GIST (the_geom);


-- Fix incorrect geometry type in jr_stations
ALTER TABLE jr_stations DROP COLUMN geom;
ALTER TABLE jr_stations ADD COLUMN geom geometry(Point, 6668);

-- Populate with schematic points
UPDATE jr_stations
SET geom = geom_schematic;

-- Drop schematic column
ALTER TABLE jr_stations DROP COLUMN geom_schematic;

-- Recreate spatial index
DROP INDEX IF EXISTS idx_jr_stations_geom;
CREATE INDEX idx_jr_stations_geom ON jr_stations USING GIST (geom);
