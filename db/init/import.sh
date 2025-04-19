#!/bin/bash
set -e
set -x

# Check required shapefiles exist
if [ ! -f "/docker-entrypoint-initdb.d/data/N02-23_Station.shp" ]; then
  echo "❌ Missing Station shapefile! Aborting." && exit 1
fi

if [ ! -f "/docker-entrypoint-initdb.d/data/N02-23_RailroadSection.shp" ]; then
  echo "❌ Missing RailroadSection shapefile! Aborting." && exit 1
fi

import_stations() {
  echo "Importing JR station data..."
  SECONDS=0
  shp2pgsql -a -s 6668 -W UTF-8 -g geom -t 2D "/docker-entrypoint-initdb.d/data/N02-23_Station.shp" jr_stations | \
    psql -h /var/run/postgresql -U postgres -d jrpm > /dev/null 2>&1
  echo "✅ JR station data import complete! ⏱ ${SECONDS}s"
}

import_lines() {
  echo "Importing JR line data..."
  SECONDS=0
  shp2pgsql -a -s 6668 -W UTF-8 -g geom -t 2D "/docker-entrypoint-initdb.d/data/N02-23_RailroadSection.shp" jr_lines | \
    psql -h /var/run/postgresql -U postgres -d jrpm > /dev/null 2>&1
  echo "✅ JR line data import complete! ⏱ ${SECONDS}s"
}

analyze_tables() {
  echo "Analyzing Indexes"
  psql -h /var/run/postgresql -U postgres -d jrpm -c "ANALYZE jr_lines;" > /dev/null 2>&1
  psql -h /var/run/postgresql -U postgres -d jrpm -c "ANALYZE jr_stations;" > /dev/null 2>&1
  echo "✅ Analysis complete!"
}

apply_post_import_processing() {
  echo "🔧 Post-import processing begins..."
  echo "Applying translations from translations.sql..."
  psql -h /var/run/postgresql -U postgres -d jrpm -f /docker-entrypoint-initdb.d/data/translations.sql > /dev/null 2>&1
  echo "✅ Translations applied!"
  echo "✅ Post-import processing complete."
}

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -q -h /var/run/postgresql -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 1
done

echo "Enabling PostGIS extension..."
psql -h /var/run/postgresql -U postgres -d jrpm -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null 2>&1

# Import script modifications
echo 'Dropping and recreating tables...'
(
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
) > /dev/null 2>&1

import_stations
import_lines
echo "✅ JR shapefile import complete!"
analyze_tables
echo "Running row count validation..."
psql -h /var/run/postgresql -U postgres -d jrpm -c "SELECT 'jr_lines' AS table, COUNT(*) FROM jr_lines;" > /dev/null 2>&1
psql -h /var/run/postgresql -U postgres -d jrpm -c "SELECT 'jr_stations' AS table, COUNT(*) FROM jr_stations;" > /dev/null 2>&1
apply_post_import_processing

# Optional reprojection after import (uncomment if needed)
# psql -h /var/run/postgresql -U postgres -d jrpm -c "ALTER TABLE jr_lines ALTER COLUMN geom TYPE geometry(MultiLineString, 4326) USING ST_Transform(geom, 4326);"
# psql -h /var/run/postgresql -U postgres -d jrpm -c "ALTER TABLE jr_stations ALTER COLUMN geom TYPE geometry(MultiLineString, 4326) USING ST_Transform(geom, 4326);"