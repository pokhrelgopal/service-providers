#!/usr/bin/env bash
# One-time OSRM data prep for the Servio routing service.
# Downloads a map extract (default: Nepal) and runs the OSRM MLD pipeline.
# Requires Docker + internet + a few GB of disk/RAM. Re-run to refresh the map.
#
#   ./docker/osrm/prepare.sh
#   docker compose --profile routing up -d osrm
#
# Override the region:  OSRM_REGION_URL=https://download.geofabrik.de/asia/india-latest.osm.pbf ./prepare.sh
set -euo pipefail
cd "$(dirname "$0")"

REGION_URL="${OSRM_REGION_URL:-https://download.geofabrik.de/asia/nepal-latest.osm.pbf}"
PBF="region.osm.pbf"
OSRM="region.osrm"
IMAGE="osrm/osrm-backend:latest"

if [ ! -f "$PBF" ]; then
  echo "==> Downloading map extract: $REGION_URL"
  curl -L --fail -o "$PBF" "$REGION_URL"
fi

echo "==> osrm-extract (car profile)"
docker run --rm -v "$PWD:/data" "$IMAGE" osrm-extract -p /opt/car.lua "/data/$PBF"
echo "==> osrm-partition"
docker run --rm -v "$PWD:/data" "$IMAGE" osrm-partition "/data/$OSRM"
echo "==> osrm-customize"
docker run --rm -v "$PWD:/data" "$IMAGE" osrm-customize "/data/$OSRM"

echo "==> Done. Start it with:  docker compose --profile routing up -d osrm"
echo "    Then set NEXT_PUBLIC_OSRM_URL=http://localhost:5001/route/v1"
