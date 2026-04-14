#!/bin/bash
# Full pipeline: Load CSV → PostGIS → Felt
#
# Usage:
#   pip install -r scripts/requirements.txt
#   # Place your exported spreadsheet at scripts/data/projects.csv
#   bash scripts/run_pipeline.sh [path/to/spreadsheet.csv]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CSV_PATH="${1:-$SCRIPT_DIR/data/projects.csv}"

echo "Step 1/3: Loading spreadsheet into PostGIS..."
python3 "$SCRIPT_DIR/load_spreadsheet.py" "$CSV_PATH"

echo ""
echo "Step 2/3: Attempting direct PostGIS -> Felt connection..."
if python3 "$SCRIPT_DIR/connect_felt_postgis.py"; then
    echo "Direct connection succeeded!"
else
    echo ""
    echo "Direct connection failed (likely requires Felt Enterprise)."
    echo "Falling back to GeoJSON upload..."
    echo ""
    python3 "$SCRIPT_DIR/upload_geojson_to_felt.py"
fi

echo ""
echo "Pipeline complete!"
