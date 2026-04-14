#!/usr/bin/env python3
"""
Port layers from an ArcGIS Online web map to a Felt map.

Reads the web map definition, walks every operational layer, and creates
a corresponding Felt layer pointing at the layer's URL. Layers backed by
hosted files (no URL) are reported but skipped.

Usage:
  pip install -r scripts/requirements.txt
  python scripts/port_arcgis_to_felt.py

Env var overrides:
  ARCGIS_USERNAME, ARCGIS_PASSWORD   - login (defaults embedded below)
  ARCGIS_WEBMAP_ID                   - web map item id
  ARCGIS_ORG_URL                     - org portal base URL
  FELT_API_TOKEN, FELT_MAP_ID        - Felt destination
"""

import os
import sys
import time
import json
import urllib.parse

import requests
from felt_python import upload_url, get_map, list_layers


# Configuration
ARCGIS_USERNAME = os.environ.get("ARCGIS_USERNAME", "mammothbob")
ARCGIS_PASSWORD = os.environ.get("ARCGIS_PASSWORD", "Pey-yYiD-55t25#")
ARCGIS_WEBMAP_ID = os.environ.get("ARCGIS_WEBMAP_ID", "0c2cf49a371c42a5b096657da57a05f6")
ARCGIS_ORG_URL = os.environ.get("ARCGIS_ORG_URL", "https://mammothsummitpow.maps.arcgis.com")

FELT_API_TOKEN = os.environ.get(
    "FELT_API_TOKEN",
    "felt_pat_y+CByAdfmiUCXsKaXmILM4LAQ4SvxGE3UhSr79UWUTk",
)
FELT_MAP_ID = os.environ.get("FELT_MAP_ID", "9AVMOCyQIQhSst879A6KN4RB")

os.environ["FELT_API_TOKEN"] = FELT_API_TOKEN

# Token lifetime (minutes). 2 weeks is the ArcGIS max for generateToken.
TOKEN_LIFETIME_MINUTES = 20160


def get_arcgis_token():
    """Exchange username/password for an ArcGIS token."""
    print(f"Authenticating to ArcGIS as {ARCGIS_USERNAME}...")
    resp = requests.post(
        "https://www.arcgis.com/sharing/rest/generateToken",
        data={
            "username": ARCGIS_USERNAME,
            "password": ARCGIS_PASSWORD,
            "client": "referer",
            "referer": ARCGIS_ORG_URL,
            "expiration": TOKEN_LIFETIME_MINUTES,
            "f": "json",
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if "token" not in data:
        raise RuntimeError(f"ArcGIS auth failed: {data}")
    print(f"  Token OK (expires in {TOKEN_LIFETIME_MINUTES // 60}h)")
    return data["token"]


def fetch_webmap(token):
    """Fetch the web map item's data definition."""
    url = f"{ARCGIS_ORG_URL}/sharing/rest/content/items/{ARCGIS_WEBMAP_ID}/data"
    resp = requests.get(url, params={"f": "json", "token": token}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_item_metadata(token):
    """Fetch the web map item metadata (for title)."""
    url = f"{ARCGIS_ORG_URL}/sharing/rest/content/items/{ARCGIS_WEBMAP_ID}"
    resp = requests.get(url, params={"f": "json", "token": token}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def walk_layers(layer, parent_path=""):
    """Yield (name, url, layer_type, item_id) tuples for every leaf layer."""
    name = layer.get("title") or layer.get("id") or "Unnamed Layer"
    full_name = f"{parent_path} / {name}" if parent_path else name
    layer_type = layer.get("layerType", "")

    if layer_type == "GroupLayer" or layer.get("layers"):
        for sub in layer.get("layers", []):
            yield from walk_layers(sub, full_name)
        return

    url = layer.get("url")
    item_id = layer.get("itemId")
    yield (full_name, url, layer_type, item_id)


def append_token_to_url(url, token):
    """Add ?token=XXX to a URL (preserves any existing query string)."""
    if not url:
        return url
    parsed = urllib.parse.urlparse(url)
    qs = dict(urllib.parse.parse_qsl(parsed.query))
    qs["token"] = token
    new_query = urllib.parse.urlencode(qs)
    return urllib.parse.urlunparse(parsed._replace(query=new_query))


def _flatten_layer_items(obj):
    """Recursively yield dicts that look like layer objects from whatever
    the Felt API hands back (dict, list, list of lists, etc.)."""
    if isinstance(obj, dict):
        yield obj
    elif isinstance(obj, list):
        for item in obj:
            yield from _flatten_layer_items(item)


def _extract_layer_name(lyr):
    """Pull a name out of a layer dict regardless of shape."""
    if not isinstance(lyr, dict):
        return None
    # Try common locations
    name = lyr.get("name")
    if name:
        return name
    attrs = lyr.get("attributes")
    if isinstance(attrs, dict):
        n = attrs.get("name")
        if n:
            return n
    return None


def existing_layer_names():
    """Return a set of layer names already on the Felt map."""
    try:
        layers = list_layers(map_id=FELT_MAP_ID)
    except Exception as e:
        print(f"  (Could not list existing layers: {e})")
        return set()

    names = set()
    for lyr in _flatten_layer_items(layers):
        n = _extract_layer_name(lyr)
        if n:
            names.add(n)
    return names


def create_felt_url_layer(name, url):
    """Create a Felt layer from a URL. Returns the API response or raises."""
    return upload_url(
        map_id=FELT_MAP_ID,
        layer_url=url,
        layer_name=name,
    )


def main():
    print("=" * 60)
    print("Port ArcGIS Online -> Felt")
    print("=" * 60)

    token = get_arcgis_token()

    print(f"\nFetching web map {ARCGIS_WEBMAP_ID}...")
    meta = fetch_item_metadata(token)
    print(f"  Map title: {meta.get('title', '?')}")
    data = fetch_webmap(token)

    op_layers = data.get("operationalLayers", [])
    basemap = data.get("baseMap", {})
    basemap_layers = basemap.get("baseMapLayers", [])
    print(f"  Operational layers (top-level): {len(op_layers)}")
    print(f"  Basemap layers: {len(basemap_layers)}")

    all_layers = []
    for top in op_layers:
        all_layers.extend(list(walk_layers(top)))

    with_url = [l for l in all_layers if l[1]]
    without_url = [l for l in all_layers if not l[1]]

    print(f"\n  Total leaf layers: {len(all_layers)}")
    print(f"    With URL (portable): {len(with_url)}")
    print(f"    Without URL (hosted files, manual upload needed): {len(without_url)}")

    print(f"\nVerifying Felt map {FELT_MAP_ID}...")
    try:
        m = get_map(map_id=FELT_MAP_ID)
        attrs = m.get("attributes", m) if isinstance(m, dict) else {}
        print(f"  Map: {attrs.get('title', 'Unknown') if isinstance(attrs, dict) else 'Unknown'}")
    except Exception as e:
        print(f"  Cannot access Felt map: {e}")
        sys.exit(1)

    existing = existing_layer_names()
    print(f"  Existing layers on Felt: {len(existing)}")

    print(f"\n-- Porting URL-backed layers --")
    ported = 0
    skipped = 0
    failed = 0
    failures = []

    for i, (name, url, layer_type, item_id) in enumerate(with_url, 1):
        prefix = f"[{i}/{len(with_url)}]"

        if name in existing:
            print(f"  {prefix} SKIP (already on map): {name}")
            skipped += 1
            continue

        authed_url = append_token_to_url(url, token)
        print(f"  {prefix} {name}")
        print(f"         type: {layer_type}")
        print(f"         url:  {url}")

        try:
            result = create_felt_url_layer(name, authed_url)
            if isinstance(result, dict):
                layer_id = result.get("layer_id") or result.get("id") or "?"
            else:
                layer_id = "?"
            print(f"         -> created (id: {layer_id})")
            ported += 1
        except Exception as e:
            print(f"         -> FAILED: {e}")
            failed += 1
            failures.append((name, url, str(e)))

        time.sleep(0.5)

    if without_url:
        print(f"\n-- Layers requiring manual upload (no URL) --")
        for name, url, layer_type, item_id in without_url:
            item_note = f" (ArcGIS item {item_id})" if item_id else ""
            print(f"  - {name} [type: {layer_type}]{item_note}")

    if failures:
        print(f"\n-- Failed URL layers --")
        for name, url, err in failures:
            print(f"  - {name}")
            print(f"    url: {url}")
            print(f"    err: {err}")

    print(f"\n{'=' * 60}")
    print(f"Ported:     {ported}")
    print(f"Skipped:    {skipped} (already existed)")
    print(f"Failed:     {failed}")
    print(f"Manual:     {len(without_url)} (no URL -- upload source files to Felt directly)")
    print(f"\nView map: https://felt.com/map/{FELT_MAP_ID}")
    print("=" * 60)


if __name__ == "__main__":
    main()
