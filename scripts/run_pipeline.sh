#!/bin/bash
# Full pipeline: Migrate data to PostGIS, then upload to Felt
#
# Usage:
#   cd MSP-Market-Strategy-Tool
#   pip install -r scripts/requirements.txt
#   bash scripts/run_pipeline.sh
#
# Optional env vars:
#   SUPABASE_DB_URL   - Override default Supabase connection string
#   FELT_API_TOKEN    - Override default Felt API token
#   FELT_MAP_ID       - Override default Felt map ID

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Step 1/2: Migrating data to PostGIS..."
python3 "$SCRIPT_DIR/migrate_to_postgis.py"

echo ""
echo "Step 2/2: Uploading to Felt..."
python3 "$SCRIPT_DIR/upload_to_felt.py"

echo ""
echo "Pipeline complete!"
