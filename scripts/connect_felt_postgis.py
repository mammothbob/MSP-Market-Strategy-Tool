#!/usr/bin/env python3
"""
Connect Supabase PostGIS to Felt as a live data source.

This script:
  1. Registers your Supabase PostGIS database as a Felt Source
  2. Waits for Felt to inspect the source and discover datasets
  3. Adds the projects layer (v_projects_map view) to your Felt map

Usage:
  pip install -r scripts/requirements.txt
  python scripts/connect_felt_postgis.py

Env var overrides:
  SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME,
  SUPABASE_DB_USER, SUPABASE_DB_PASSWORD
  FELT_API_TOKEN, FELT_MAP_ID
"""

import os
import sys
import time
import json

from felt_python import (
    create_source,
    get_source,
    list_sources,
    sync_source,
    add_source_layer,
    get_map,
    list_layers,
)

# ── Configuration ──────────────────────────────────────────────────────────
# Supabase pooler connection details (parsed from your connection string)
DB_HOST = os.environ.get("SUPABASE_DB_HOST", "aws-1-us-east-2.pooler.supabase.com")
DB_PORT = os.environ.get("SUPABASE_DB_PORT", "5432")
DB_NAME = os.environ.get("SUPABASE_DB_NAME", "postgres")
DB_USER = os.environ.get("SUPABASE_DB_USER", "postgres.gbhjcyhnkjbauiigxpiz")
DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD", "s8L-STDwc/q9iqs")

FELT_API_TOKEN = os.environ.get(
    "FELT_API_TOKEN",
    "felt_pat_y+CByAdfmiUCXsKaXmILM4LAQ4SvxGE3UhSr79UWUTk",
)
FELT_MAP_ID = os.environ.get("FELT_MAP_ID", "9AVMOCyQIQhSst879A6KN4RB")

# Set token for SDK
os.environ["FELT_API_TOKEN"] = FELT_API_TOKEN

# ── Helpers ────────────────────────────────────────────────────────────────

def wait_for_source_ready(source_id, timeout=120, poll_interval=5):
    """Poll until the source sync_status is 'completed' or timeout."""
    print(f"  Waiting for Felt to inspect source {source_id}...")
    elapsed = 0
    while elapsed < timeout:
        source = get_source(source_id=source_id)
        attrs = source.get("attributes", source)
        status = attrs.get("sync_status") or attrs.get("status")
        print(f"    Status: {status} ({elapsed}s)")
        if status in ("completed", "synced", "ready"):
            return source
        if status in ("failed", "error"):
            print(f"  Source sync failed: {json.dumps(attrs, indent=2)}")
            sys.exit(1)
        time.sleep(poll_interval)
        elapsed += poll_interval
    print(f"  Timeout after {timeout}s. Source may still be syncing.")
    return get_source(source_id=source_id)


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Felt <-> PostGIS Connection Setup")
    print("=" * 60)

    # Step 0: Verify Felt map access
    print("\n[1/4] Verifying Felt map access...")
    try:
        map_info = get_map(map_id=FELT_MAP_ID)
        attrs = map_info.get("attributes", map_info)
        title = attrs.get("title", "Unknown")
        print(f"  Map: {title}")
    except Exception as e:
        print(f"  Cannot access map: {e}")
        sys.exit(1)

    # Step 1: Check if source already exists
    print("\n[2/4] Checking existing sources...")
    existing_source_id = None
    try:
        sources = list_sources()
        for s in sources:
            attrs = s.get("attributes", s)
            name = attrs.get("name", "")
            if "mammoth" in name.lower() or "supabase" in name.lower():
                existing_source_id = s.get("id")
                print(f"  Found existing source: {name} (id: {existing_source_id})")
                break
    except Exception as e:
        print(f"  Could not list sources: {e}")

    # Step 2: Create or reuse the PostGIS source
    if existing_source_id:
        print(f"  Reusing existing source {existing_source_id}")
        source_id = existing_source_id
        # Trigger a re-sync
        try:
            sync_source(source_id=source_id)
            print("  Triggered re-sync")
        except Exception as e:
            print(f"  Re-sync note: {e}")
    else:
        print("\n[2/4] Creating PostGIS source in Felt...")
        try:
            result = create_source(
                name="Mammoth Summit Power - PostGIS",
                connection={
                    "type": "postgres",
                    "host": DB_HOST,
                    "port": DB_PORT,
                    "database": DB_NAME,
                    "username": DB_USER,
                    "password": DB_PASSWORD,
                },
                permissions={"visibility": "workspace_editors"},
            )
            source_id = result.get("id")
            print(f"  Source created: {source_id}")
            print(f"  Response: {json.dumps(result, indent=2)[:500]}")
        except Exception as e:
            print(f"  Error creating source: {e}")
            print("\n  NOTE: Direct PostGIS connections require a Felt Enterprise plan.")
            print("  If this fails, run the fallback script instead:")
            print("    python scripts/upload_geojson_to_felt.py")
            sys.exit(1)

    # Step 3: Wait for source to be ready
    print("\n[3/4] Waiting for source inspection...")
    source = wait_for_source_ready(source_id)
    print(f"  Source details: {json.dumps(source, indent=2)[:800]}")

    # Step 4: Add the projects map layer from a SQL query
    print("\n[4/4] Adding project map layer...")
    try:
        # Use a SQL query against the v_projects_map view for a clean map layer
        layer_result = add_source_layer(
            map_id=FELT_MAP_ID,
            source_layer_params={
                "from": "sql",
                "source_id": source_id,
                "query": "SELECT * FROM v_projects_map",
                "name": "Battery Storage Projects",
            },
        )
        print(f"  Layer added: {json.dumps(layer_result, indent=2)[:500]}")
    except Exception as e:
        print(f"  Error adding SQL layer: {e}")
        print("  Trying dataset-based approach instead...")

        # Fallback: try to find and add the projects dataset directly
        try:
            source_detail = get_source(source_id=source_id)
            datasets = source_detail.get("attributes", {}).get("datasets", [])
            print(f"  Available datasets: {json.dumps(datasets, indent=2)[:500]}")

            # Look for the projects table or v_projects_map view
            for ds in datasets:
                ds_name = ds.get("name", "")
                if "project" in ds_name.lower():
                    layer_result = add_source_layer(
                        map_id=FELT_MAP_ID,
                        source_layer_params={
                            "from": "dataset",
                            "dataset_id": ds.get("id"),
                        },
                    )
                    print(f"  Layer added from dataset '{ds_name}': {json.dumps(layer_result, indent=2)[:300]}")
                    break
        except Exception as e2:
            print(f"  Dataset fallback also failed: {e2}")

    # Final verification
    print("\n── Verification ──")
    try:
        layers = list_layers(map_id=FELT_MAP_ID)
        print(f"  Map has {len(layers)} layers:")
        for lyr in layers:
            attrs = lyr.get("attributes", lyr)
            print(f"    - {attrs.get('name', 'unnamed')} (type: {attrs.get('type', '?')})")
    except Exception as e:
        print(f"  Could not list layers: {e}")

    print("\n" + "=" * 60)
    print(f"View your map: https://felt.com/map/{FELT_MAP_ID}")
    print("=" * 60)


if __name__ == "__main__":
    main()
