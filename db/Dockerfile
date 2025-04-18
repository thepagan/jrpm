# db/Dockerfile
FROM postgis/postgis:15-3.3

# Force install GDAL with secure workaround
RUN apt-get update && \
    apt-get install -y gnupg postgis && \
    apt-get install -y gdal-bin --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*