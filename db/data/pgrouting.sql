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
    ST_Length(geom_6668::geography) AS cost,
    l.n02_002,
    l.n02_003,
    l.n02_004,
    l.n02_003_en,
    l.n02_004_en
FROM (
    SELECT
        (ST_Dump(geom)).geom::geometry(LineString, 6668) AS geom_6668,
        jl.n02_002,
        jl.n02_003,
        jl.n02_004,
        jl.n02_003_en,
        jl.n02_004_en
    FROM jr_lines jl
) AS l
WHERE ST_NPoints(geom_6668) > 1;

ALTER TABLE jr_edges ADD COLUMN source bigint;
ALTER TABLE jr_edges ADD COLUMN target bigint;

SELECT pgr_createTopology('jr_edges', 0.0001, 'geom', 'id', 'source', 'target');

-- Add reverse cost for bidirectional routing
ALTER TABLE jr_edges ADD COLUMN reverse_cost double precision;
UPDATE jr_edges SET reverse_cost = cost;

-- Spatial index for edges and vertex geometry
CREATE INDEX idx_jr_edges_geom ON jr_edges USING GIST (geom);
CREATE INDEX idx_jr_edges_vertices_pgr_geom ON jr_edges_vertices_pgr USING GIST (the_geom);

-- Create pgRouting-compatible station point table
DROP TABLE IF EXISTS jr_stations_pgr;

CREATE TABLE jr_stations_pgr AS
SELECT
    gid,
    n02_001, n02_002, n02_003, n02_004, n02_005,
    n02_005c, n02_005g, n02_003_en, n02_004_en, n02_005_en,
    ST_Centroid(ST_CollectionExtract(geom, 2))::geometry(Point, 6668) AS geom
FROM jr_stations;

-- Index for spatial queries
CREATE INDEX idx_jr_stations_pgr_geom ON jr_stations_pgr USING GIST (geom);
