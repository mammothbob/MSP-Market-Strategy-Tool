#!/usr/bin/env python3
"""
Upload PostGIS-exported GeoJSON layers to a Felt map.

Uses the felt-python SDK to:
  1. Upload utility service territory polygons as a layer
  2. Upload utility market centroids as a point layer

Usage:
  pip install felt-python
  python scripts/upload_to_felt.py

Set env vars or uses defaults:
  FELT_API_TOKEN  - Your Felt API token
  FELT_MAP_ID     - The target Felt map ID
"""

import os
import sys
from pathlib import Path

from felt_python import upload_file, get_map

# ── Configuration ──────────────────────────────────────────────────────────
FELT_API_TOKEN = os.environ.get(
    "FELT_API_TOKEN",
    "felt_pat_y+CByAdfmiUCXsKaXmILM4LAQ4SvxGE3UhSr79UWUTk"
)
FELT_MAP_ID = os.environ.get("FELT_MAP_ID", "9AVMOCyQIQhSst879A6KN4RB")

REPO_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = REPO_ROOT / "scripts" / "output"

# Set the token for the SDK
os.environ["FELT_API_TOKEN"] = FELT_API_TOKEN


def main():
    print("=" * 60)
    print("Upload GeoJSON to Felt Map")
    print("=" * 60)

    # Verify Felt map access
    print(f"Checking access to map {FELT_MAP_ID}...")
    try:
        map_info = get_map(map_id=FELT_MAP_ID)
        title = map_info.get("attributes", {}).get("title", map_info.get("title", "Unknown"))
        print(f"  Map: {title}")
    except Exception as e:
        print(f"  Failed to access map: {e}")
        print("  Check your FELT_API_TOKEN and FELT_MAP_ID.")
        sys.exit(1)

    # Check for exported GeoJSON files
    territories_file = OUTPUT_DIR / "utility_territories.geojson"
    centroids_file = OUTPUT_DIR / "utility_centroids.geojson"

    if not territories_file.exists() or not centroids_file.exists():
        print(f"\nGeoJSON files not found in {OUTPUT_DIR}/")
        print("Run the migration first: python scripts/migrate_to_postgis.py")
        sys.exit(1)

    # Upload territory polygons
    print("\n── Uploading Territory Polygons ──")
    try:
        result1 = upload_file(
            map_id=FELT_MAP_ID,
            file_name=str(territories_file),
            layer_name="Utility Service Territories (PostGIS)",
        )
        layer_id1 = result1.get("layer_id", "unknown")
        print(f"  Layer created: {layer_id1}")
    except Exception as e:
        print(f"  Error uploading territories: {e}")

    # Upload centroids (point layer)
    print("\n── Uploading Market Centroids ──")
    try:
        result2 = upload_file(
            map_id=FELT_MAP_ID,
            file_name=str(centroids_file),
            layer_name="Battery Storage Markets (PostGIS)",
        )
        layer_id2 = result2.get("layer_id", "unknown")
        print(f"  Layer created: {layer_id2}")
    except Exception as e:
        print(f"  Error uploading centroids: {e}")

    print("\n" + "=" * 60)
    print("Upload complete!")
    print(f"\nView your map: https://felt.com/map/{FELT_MAP_ID}")
    print("=" * 60)


if __name__ == "__main__":
    main()
