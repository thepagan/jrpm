# db/Dockerfile
FROM postgis/postgis:15-3.3

# Install pgRouting and GDAL
RUN apt-get update && \
    apt-get install -y gnupg postgis gdal-bin postgresql-15-pgrouting --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*