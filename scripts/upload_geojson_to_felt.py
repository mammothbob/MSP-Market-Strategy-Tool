#!/usr/bin/env python3
"""
Fallback: Export projects from Supabase PostGIS as GeoJSON, upload to Felt.

Use this if direct PostGIS connection requires Enterprise.
Exports the v_projects_map view as GeoJSON and uploads it to your Felt map.

Usage:
  pip install -r scripts/requirements.txt
  python scripts/upload_geojson_to_felt.py
"""

import os
import sys
import json
import tempfile
from pathlib import Path

import psycopg2
from felt_python import upload_file, get_map, list_layers

# ── Configuration ─────────────────────────────────────────────
DB_URL = os.environ.get(
    "SUPABASE_DB_URL",
    "postgresql://postgres.gbhjcyhnkjbauiigxpiz:s8L-STDwc/q9iqs@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
)
FELT_API_TOKEN = os.environ.get(
    "FELT_API_TOKEN",
    "felt_pat_y+CByAdfmiUCXsKaXmILM4LAQ4SvxGE3UhSr79UWUTk",
)
FELT_MAP_ID = os.environ.get("FELT_MAP_ID", "9AVMOCyQIQhSst879A6KN4RB")

os.environ["FELT_API_TOKEN"] = FELT_API_TOKEN

OUTPUT_DIR = Path(__file__).resolve().parent / "output"


def export_geojson_from_postgis():
    """Query v_projects_map and export as GeoJSON FeatureCollection."""
    print("Connecting to Supabase PostGIS...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Check if the view exists; fall back to the projects table
    cur.execute("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.views
            WHERE table_name = 'v_projects_map'
        );
    """)
    has_view = cur.fetchone()[0]

    if has_view:
        source_table = "v_projects_map"
    else:
        source_table = "projects"
        print("  v_projects_map view not found, using projects table directly")

    print(f"  Exporting from: {source_table}")

    # Use ST_AsGeoJSON to build a FeatureCollection
    cur.execute(f"""
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(geom)::json,
                    'properties', to_jsonb(t.*) - 'geom'
                )
            ), '[]'::json)
        )
        FROM {source_table} t
        WHERE geom IS NOT NULL;
    """)
    geojson = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {source_table} WHERE geom IS NULL;")
    no_geom_count = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {source_table} WHERE geom IS NOT NULL;")
    geom_count = cur.fetchone()[0]

    cur.close()
    conn.close()

    print(f"  Projects with geometry: {geom_count}")
    if no_geom_count > 0:
        print(f"  Projects WITHOUT geometry (skipped): {no_geom_count}")

    OUTPUT_DIR.mkdir(exist_ok=True)
    out_path = OUTPUT_DIR / "projects.geojson"
    with open(out_path, "w") as f:
        json.dump(geojson, f, indent=2)
    print(f"  Saved to: {out_path}")

    return out_path, geom_count


def upload_to_felt(geojson_path, feature_count):
    """Upload the GeoJSON file to the Felt map."""
    print(f"\nVerifying Felt map access...")
    try:
        map_info = get_map(map_id=FELT_MAP_ID)
        attrs = map_info.get("attributes", map_info)
        print(f"  Map: {attrs.get('title', 'Unknown')}")
    except Exception as e:
        print(f"  Cannot access map: {e}")
        sys.exit(1)

    if feature_count == 0:
        print("\n  No projects with geometry to upload.")
        print("  Make sure your projects table has latitude/longitude populated.")
        return

    print(f"\nUploading {feature_count} projects to Felt...")
    try:
        result = upload_file(
            map_id=FELT_MAP_ID,
            file_name=str(geojson_path),
            layer_name="Battery Storage Projects",
        )
        print(f"  Layer created: {result.get('layer_id', 'unknown')}")
    except Exception as e:
        print(f"  Upload error: {e}")
        return

    try:
        layers = list_layers(map_id=FELT_MAP_ID)
        print(f"\n  Map now has {len(layers)} layers:")
        for lyr in layers:
            attrs = lyr.get("attributes", lyr)
            print(f"    - {attrs.get('name', 'unnamed')}")
    except Exception:
        pass


def main():
    print("=" * 60)
    print("PostGIS -> GeoJSON -> Felt Upload")
    print("=" * 60)

    geojson_path, count = export_geojson_from_postgis()
    upload_to_felt(geojson_path, count)

    print("\n" + "=" * 60)
    print(f"View your map: https://felt.com/map/{FELT_MAP_ID}")
    print("=" * 60)


if __name__ == "__main__":
    main()
