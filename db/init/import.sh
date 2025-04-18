#!/bin/bash
set -e
set -x

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -q -h /var/run/postgresql -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 1
done

echo "Enabling PostGIS extension..."
psql -h /var/run/postgresql -U postgres -d jrpm -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null

# Import script modifications
echo 'Dropping and recreating tables...'
psql -h /var/run/postgresql -U postgres -d jrpm <<EOF
DROP TABLE IF EXISTS jr_stations;
CREATE TABLE jr_stations (
    gid serial PRIMARY KEY,
    n02_001 varchar(2),
    n02_002 varchar(1),
    n02_003 varchar(254),
    n02_004 varchar(254),
    n02_005 varchar(254),
    n02_005c varchar(254),
    n02_005g varchar(254),
    geom geometry(MultiLineString, 6668)
);
CREATE INDEX idx_jr_stations_geom ON jr_stations USING GIST (geom);

DROP TABLE IF EXISTS jr_lines;
CREATE TABLE jr_lines (
    ogc_fid SERIAL PRIMARY KEY,
    n02_001 VARCHAR(2),
    n02_002 VARCHAR(1),
    n02_003 VARCHAR(254),
    n02_004 VARCHAR(254),
    geom geometry(MultiLineString, 6668)
);
CREATE INDEX idx_jr_lines_geom ON jr_lines USING GIST (geom);
EOF

echo 'Importing JR station data...'
shp2pgsql -a -s 6668 -W UTF-8 -g geom -t 2D /docker-entrypoint-initdb.d/data/N02-23_Station.shp jr_stations | \
  psql -h /var/run/postgresql -U postgres -d jrpm > /dev/null
echo "✅ JR station data import complete!"

echo "Importing JR line data..."
shp2pgsql -a -s 6668 -W UTF-8 -g geom -t 2D /docker-entrypoint-initdb.d/data/N02-23_RailroadSection.shp jr_lines | \
  psql -h /var/run/postgresql -U postgres -d jrpm > /dev/null
echo "✅ JR line data import complete!"

echo "✅ JR shapefile import complete!"

echo "Analyzing Indexes"
psql -h /var/run/postgresql -U postgres -d jrpm -c "ANALYZE jr_lines;"
psql -h /var/run/postgresql -U postgres -d jrpm -c "ANALYZE jr_stations;"
echo "✅ Analysis complete!"