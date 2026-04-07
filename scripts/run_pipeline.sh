#!/bin/bash
# Connect Supabase PostGIS to Felt
#
# Tries the direct PostGIS connection first (requires Felt Enterprise).
# Falls back to GeoJSON upload if direct connection fails.
#
# Usage:
#   pip install -r scripts/requirements.txt
#   bash scripts/run_pipeline.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Attempting direct PostGIS -> Felt connection..."
if python3 "$SCRIPT_DIR/connect_felt_postgis.py"; then
    echo "Direct connection succeeded!"
else
    echo ""
    echo "Direct connection failed (likely requires Felt Enterprise)."
    echo "Falling back to GeoJSON upload..."
    echo ""
    python3 "$SCRIPT_DIR/upload_geojson_to_felt.py"
fi
