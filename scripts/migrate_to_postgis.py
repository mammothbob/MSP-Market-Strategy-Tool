#!/usr/bin/env python3
"""
Migration script: Load MSP Market Strategy data into Supabase PostGIS.

Creates tables for:
  - utility_markets: Core utility/market data with service territory polygons
  - market_key_dates: Key dates for each utility market

Usage:
  pip install psycopg2-binary
  python scripts/migrate_to_postgis.py

Set SUPABASE_DB_URL env var or it uses the default pooler connection string.
"""

import os
import sys
import json
import psycopg2
from psycopg2.extras import execute_values
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────
DB_URL = os.environ.get(
    "SUPABASE_DB_URL",
    "postgresql://postgres.gbhjcyhnkjbauiigxpiz:s8L-STDwc/q9iqs@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
)

# Paths relative to repo root
REPO_ROOT = Path(__file__).resolve().parent.parent
TERRITORIES_JSON = REPO_ROOT / "dashboard" / "src" / "data" / "utility_territories.json"

# ── Utility project data (mirrored from utilities.ts) ──────────────────────
UTILITIES = [
    {
        "utility_id": "BGE_MD",
        "utility_name": "Baltimore Gas & Electric",
        "utility_short_name": "BGE",
        "state": "Maryland",
        "state_abbr": "MD",
        "iso_rto": "PJM",
        "market_type": "contract_based",
        "inclusion_rationale": "ISC Program 3 procurement + PJM DERA access",
        "total_contracted_revenue": 200,
        "total_merchant_revenue": 125,
        "capex_total": 2379,
        "opex_total": 23.69,
        "development_timeline_months": 30,
        "mammoth_sites": 8,
        "active_rfp": "BGE ISC Program 3",
        "discount_rate": 0.07,
        "storage_mandate_exists": False,
        "storage_mandate_mw": None,
        "interconnection_tier": 1,
        "regulatory_posture": "supportive",
        "development_notes": "Primary focus market for 2026-2027 development pipeline",
        "key_dates": [
            {"date": "2026-07-01", "event": "RFP release (estimated)"},
            {"date": "2026-09-01", "event": "Bid submission deadline (estimated)"},
            {"date": "2026-12-31", "event": "Awards expected"},
        ],
    },
    {
        "utility_id": "PSE_WA",
        "utility_name": "Puget Sound Energy",
        "utility_short_name": "PSE",
        "state": "Washington",
        "state_abbr": "WA",
        "iso_rto": "non-ISO",
        "market_type": "contract_based",
        "inclusion_rationale": "DSS RFP proven track record + clear distribution IX",
        "total_contracted_revenue": 224,
        "total_merchant_revenue": 0,
        "capex_total": 2504,
        "opex_total": 23.69,
        "development_timeline_months": 36,
        "mammoth_sites": 5,
        "active_rfp": "PSE DSS 2026 (awarded)",
        "discount_rate": 0.07,
        "storage_mandate_exists": False,
        "storage_mandate_mw": None,
        "interconnection_tier": 1,
        "regulatory_posture": "supportive",
        "development_notes": "Proven market with track record. Future RFPs expected.",
        "key_dates": [
            {"date": "2026-06-01", "event": "2026 DSS COD target"},
            {"date": "2027-03-01", "event": "Next DSS RFP expected"},
        ],
    },
    {
        "utility_id": "COMED_IL",
        "utility_name": "Commonwealth Edison",
        "utility_short_name": "ComEd",
        "state": "Illinois",
        "state_abbr": "IL",
        "iso_rto": "PJM",
        "market_type": "merchant_incentive",
        "inclusion_rationale": "IL rebate + ITC + PJM DERA + VPP dispatch",
        "total_contracted_revenue": 0,
        "total_merchant_revenue": 0,
        "capex_total": 2498,
        "opex_total": 25.20,
        "development_timeline_months": 36,
        "mammoth_sites": 4,
        "active_rfp": "ComEd VPP tariff (pending)",
        "discount_rate": 0.07,
        "storage_mandate_exists": False,
        "storage_mandate_mw": None,
        "interconnection_tier": 2,
        "regulatory_posture": "neutral",
        "development_notes": "High uncertainty market. VPP tariff approval is binary event.",
        "key_dates": [
            {"date": "2026-06-30", "event": "ICC VPP tariff decision"},
            {"date": "2026-08-26", "event": "IPA CRGA Round 1 bids due"},
        ],
    },
    {
        "utility_id": "EVERSOURCE_MA",
        "utility_name": "Eversource Energy",
        "utility_short_name": "Eversource",
        "state": "Massachusetts",
        "state_abbr": "MA",
        "iso_rto": "ISO-NE",
        "market_type": "merchant_incentive",
        "inclusion_rationale": "ConnectedSolutions $275/kW + SMART + ISO-NE markets + 5GW mandate",
        "total_contracted_revenue": 0,
        "total_merchant_revenue": 235,
        "capex_total": 2579,
        "opex_total": 26.50,
        "development_timeline_months": 32,
        "mammoth_sites": 3,
        "active_rfp": "No active RFP - merchant + incentive market",
        "discount_rate": 0.08,
        "storage_mandate_exists": True,
        "storage_mandate_mw": 5000,
        "interconnection_tier": 2,
        "regulatory_posture": "supportive",
        "development_notes": "ConnectedSolutions is the anchor revenue stream. Monitor for program changes.",
        "key_dates": [
            {"date": "2026-06-01", "event": "ConnectedSolutions summer season begins"},
            {"date": "2026-12-31", "event": "SMART program block update"},
        ],
    },
    {
        "utility_id": "NGRID_MA",
        "utility_name": "National Grid",
        "utility_short_name": "National Grid",
        "state": "Massachusetts",
        "state_abbr": "MA",
        "iso_rto": "ISO-NE",
        "market_type": "merchant_incentive",
        "inclusion_rationale": "ConnectedSolutions + SMART + ISO-NE markets + 5GW mandate",
        "total_contracted_revenue": 0,
        "total_merchant_revenue": 230,
        "capex_total": 2579,
        "opex_total": 26.50,
        "development_timeline_months": 32,
        "mammoth_sites": 2,
        "active_rfp": "No active RFP - merchant + incentive market",
        "discount_rate": 0.08,
        "storage_mandate_exists": True,
        "storage_mandate_mw": 5000,
        "interconnection_tier": 2,
        "regulatory_posture": "supportive",
        "development_notes": "Same revenue stack as Eversource. Central/Western MA territory.",
        "key_dates": [
            {"date": "2026-06-01", "event": "ConnectedSolutions summer season begins"},
        ],
    },
    {
        "utility_id": "PSEG_NJ",
        "utility_name": "Public Service Electric & Gas",
        "utility_short_name": "PSE&G",
        "state": "New Jersey",
        "state_abbr": "NJ",
        "iso_rto": "PJM",
        "market_type": "merchant_incentive",
        "inclusion_rationale": "NJ Clean Energy rebates ($300/kWh) + PJM DERA + 2GW mandate",
        "total_contracted_revenue": 0,
        "total_merchant_revenue": 175,
        "capex_total": 2079,
        "opex_total": 25.00,
        "development_timeline_months": 30,
        "mammoth_sites": 2,
        "active_rfp": "No active RFP - merchant + incentive market",
        "discount_rate": 0.08,
        "storage_mandate_exists": True,
        "storage_mandate_mw": 2000,
        "interconnection_tier": 2,
        "regulatory_posture": "neutral",
        "development_notes": "NJ $300/kWh upfront rebate is a massive CapEx offset (~$6M for 20 MWh).",
        "key_dates": [],
    },
    {
        "utility_id": "JCPL_NJ",
        "utility_name": "Jersey Central Power & Light",
        "utility_short_name": "JCP&L",
        "state": "New Jersey",
        "state_abbr": "NJ",
        "iso_rto": "PJM",
        "market_type": "merchant_incentive",
        "inclusion_rationale": "NJ Clean Energy rebates + PJM DERA + 2GW mandate",
        "total_contracted_revenue": 0,
        "total_merchant_revenue": 161,
        "capex_total": 2129,
        "opex_total": 24.50,
        "development_timeline_months": 30,
        "mammoth_sites": 1,
        "active_rfp": "No active RFP",
        "discount_rate": 0.08,
        "storage_mandate_exists": True,
        "storage_mandate_mw": 2000,
        "interconnection_tier": 2,
        "regulatory_posture": "neutral",
        "development_notes": "Central NJ territory. Same NJ incentive structure as PSE&G.",
        "key_dates": [],
    },
    {
        "utility_id": "ACE_NJ",
        "utility_name": "Atlantic City Electric",
        "utility_short_name": "ACE",
        "state": "New Jersey",
        "state_abbr": "NJ",
        "iso_rto": "PJM",
        "market_type": "merchant_incentive",
        "inclusion_rationale": "NJ Clean Energy rebates + PJM DERA + 2GW mandate",
        "total_contracted_revenue": 0,
        "total_merchant_revenue": 150,
        "capex_total": 2129,
        "opex_total": 24.00,
        "development_timeline_months": 30,
        "mammoth_sites": 1,
        "active_rfp": "No active RFP",
        "discount_rate": 0.08,
        "storage_mandate_exists": True,
        "storage_mandate_mw": 2000,
        "interconnection_tier": 2,
        "regulatory_posture": "neutral",
        "development_notes": "Southern NJ territory. Lower energy spreads than northern NJ.",
        "key_dates": [],
    },
    {
        "utility_id": "CONED_NY",
        "utility_name": "Consolidated Edison",
        "utility_short_name": "ConEd",
        "state": "New York",
        "state_abbr": "NY",
        "iso_rto": "NYISO",
        "market_type": "merchant_incentive",
        "inclusion_rationale": "VDER value stack + NYISO capacity (NYC zone premium) + 6GW mandate",
        "total_contracted_revenue": 0,
        "total_merchant_revenue": 200,
        "capex_total": 2779,
        "opex_total": 28.00,
        "development_timeline_months": 36,
        "mammoth_sites": 2,
        "active_rfp": "No active RFP - VDER + merchant market",
        "discount_rate": 0.08,
        "storage_mandate_exists": True,
        "storage_mandate_mw": 6000,
        "interconnection_tier": 3,
        "regulatory_posture": "neutral",
        "development_notes": "High revenue potential offset by high costs and complex permitting.",
        "key_dates": [
            {"date": "2026-09-01", "event": "NYISO capacity auction (NYC zone)"},
        ],
    },
    {
        "utility_id": "XCEL_CO",
        "utility_name": "Xcel Energy",
        "utility_short_name": "Xcel",
        "state": "Colorado",
        "state_abbr": "CO",
        "iso_rto": "non-ISO",
        "market_type": "contract_based",
        "inclusion_rationale": "DDG RFP pending - watch for 2027 procurement",
        "total_contracted_revenue": 140,
        "total_merchant_revenue": 0,
        "capex_total": 2379,
        "opex_total": 23.69,
        "development_timeline_months": 36,
        "mammoth_sites": 0,
        "active_rfp": "Xcel DDG RFP (watch - 2027)",
        "discount_rate": 0.08,
        "storage_mandate_exists": False,
        "storage_mandate_mw": None,
        "interconnection_tier": 2,
        "regulatory_posture": "neutral",
        "development_notes": "Watch list market. No active development. Monitor for 2027 RFP.",
        "key_dates": [
            {"date": "2027-03-01", "event": "DDG RFP expected (estimated)"},
        ],
    },
]

# Fallback boundaries for utilities not in the HIFLD dataset
FALLBACK_GEOJSON = {
    "NGRID_MA": {
        "type": "Polygon",
        "coordinates": [[
            [-73.3, 42.7], [-71.8, 42.7], [-71.8, 42.4], [-71.5, 42.2],
            [-71.4, 42.0], [-71.4, 41.8], [-71.8, 41.5], [-72.5, 41.5],
            [-73.0, 41.5], [-73.3, 42.0], [-73.3, 42.7]
        ]]
    },
    "JCPL_NJ": {
        "type": "Polygon",
        "coordinates": [[
            [-75.2, 41.0], [-74.9, 41.1], [-74.8, 39.8], [-74.4, 39.8],
            [-74.3, 39.5], [-74.6, 39.4], [-75.0, 39.5], [-75.2, 39.8],
            [-75.3, 40.3], [-75.2, 41.0]
        ]]
    },
}


def get_connection():
    """Connect to Supabase PostGIS."""
    print(f"Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    return conn


def create_schema(cur):
    """Create PostGIS extension and tables."""
    print("Creating schema...")

    cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # Main utility markets table with geometry
    cur.execute("""
        DROP TABLE IF EXISTS market_key_dates CASCADE;
        DROP TABLE IF EXISTS utility_markets CASCADE;

        CREATE TABLE utility_markets (
            utility_id          TEXT PRIMARY KEY,
            utility_name        TEXT NOT NULL,
            utility_short_name  TEXT NOT NULL,
            state               TEXT NOT NULL,
            state_abbr          CHAR(2) NOT NULL,
            iso_rto             TEXT NOT NULL,
            market_type         TEXT NOT NULL,
            inclusion_rationale TEXT,

            -- Revenue ($/kW-year)
            total_contracted_revenue NUMERIC,
            total_merchant_revenue   NUMERIC,

            -- Costs ($/kW)
            capex_total              NUMERIC,
            opex_total               NUMERIC,
            development_timeline_months INTEGER,

            -- Development
            mammoth_sites       INTEGER DEFAULT 0,
            active_rfp          TEXT,
            discount_rate       NUMERIC,

            -- State/utility factors
            storage_mandate_exists  BOOLEAN DEFAULT FALSE,
            storage_mandate_mw      INTEGER,
            interconnection_tier    INTEGER,
            regulatory_posture      TEXT,

            development_notes   TEXT,

            -- Service territory geometry (SRID 4326 = WGS84)
            territory           GEOMETRY(GEOMETRY, 4326),
            -- Centroid for point-based display
            centroid            GEOMETRY(POINT, 4326),

            created_at          TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE market_key_dates (
            id          SERIAL PRIMARY KEY,
            utility_id  TEXT NOT NULL REFERENCES utility_markets(utility_id),
            event_date  DATE NOT NULL,
            event       TEXT NOT NULL
        );

        -- Spatial index for fast queries
        CREATE INDEX idx_utility_markets_territory ON utility_markets USING GIST(territory);
        CREATE INDEX idx_utility_markets_centroid ON utility_markets USING GIST(centroid);
        CREATE INDEX idx_market_key_dates_utility ON market_key_dates(utility_id);
    """)
    print("  Tables created: utility_markets, market_key_dates")


def load_territories():
    """Load GeoJSON territory boundaries into a lookup dict."""
    territories = {}

    # Load HIFLD boundaries
    if TERRITORIES_JSON.exists():
        with open(TERRITORIES_JSON) as f:
            fc = json.load(f)
        for feature in fc["features"]:
            uid = feature["properties"].get("utility_id")
            if uid:
                territories[uid] = feature["geometry"]
        print(f"  Loaded {len(territories)} HIFLD territory boundaries")
    else:
        print(f"  WARNING: {TERRITORIES_JSON} not found, skipping HIFLD boundaries")

    # Add fallback boundaries
    for uid, geom in FALLBACK_GEOJSON.items():
        if uid not in territories:
            territories[uid] = geom
    print(f"  Total territories: {len(territories)}")

    return territories


def insert_utilities(cur, territories):
    """Insert utility market data with territory geometry."""
    print("Inserting utility data...")

    for u in UTILITIES:
        uid = u["utility_id"]
        geom_json = territories.get(uid)

        if geom_json:
            geom_sql = f"ST_SetSRID(ST_GeomFromGeoJSON('{json.dumps(geom_json)}'), 4326)"
            centroid_sql = f"ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON('{json.dumps(geom_json)}'), 4326))"
        else:
            geom_sql = "NULL"
            centroid_sql = "NULL"
            print(f"  WARNING: No territory geometry for {uid}")

        cur.execute(f"""
            INSERT INTO utility_markets (
                utility_id, utility_name, utility_short_name,
                state, state_abbr, iso_rto, market_type, inclusion_rationale,
                total_contracted_revenue, total_merchant_revenue,
                capex_total, opex_total, development_timeline_months,
                mammoth_sites, active_rfp, discount_rate,
                storage_mandate_exists, storage_mandate_mw,
                interconnection_tier, regulatory_posture,
                development_notes,
                territory, centroid
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                {geom_sql}, {centroid_sql}
            )
        """, (
            uid, u["utility_name"], u["utility_short_name"],
            u["state"], u["state_abbr"], u["iso_rto"], u["market_type"], u["inclusion_rationale"],
            u["total_contracted_revenue"], u["total_merchant_revenue"],
            u["capex_total"], u["opex_total"], u["development_timeline_months"],
            u["mammoth_sites"], u["active_rfp"], u["discount_rate"],
            u["storage_mandate_exists"], u["storage_mandate_mw"],
            u["interconnection_tier"], u["regulatory_posture"],
            u["development_notes"],
        ))

        # Insert key dates
        for kd in u.get("key_dates", []):
            cur.execute("""
                INSERT INTO market_key_dates (utility_id, event_date, event)
                VALUES (%s, %s, %s)
            """, (uid, kd["date"], kd["event"]))

    print(f"  Inserted {len(UTILITIES)} utility markets")


def verify_data(cur):
    """Run verification queries."""
    print("\n── Verification ──")

    cur.execute("SELECT COUNT(*) FROM utility_markets;")
    count = cur.fetchone()[0]
    print(f"  utility_markets rows: {count}")

    cur.execute("SELECT COUNT(*) FROM utility_markets WHERE territory IS NOT NULL;")
    geo_count = cur.fetchone()[0]
    print(f"  with territory geometry: {geo_count}")

    cur.execute("SELECT COUNT(*) FROM market_key_dates;")
    dates_count = cur.fetchone()[0]
    print(f"  market_key_dates rows: {dates_count}")

    cur.execute("""
        SELECT utility_id, utility_short_name, state_abbr, iso_rto,
               mammoth_sites, market_type,
               ST_AsText(centroid) as centroid_wkt
        FROM utility_markets
        ORDER BY mammoth_sites DESC;
    """)
    print("\n  Utility Markets Summary:")
    print(f"  {'ID':<15} {'Name':<15} {'State':<6} {'ISO':<8} {'Sites':<6} {'Type':<20} {'Centroid'}")
    print(f"  {'─'*15} {'─'*15} {'─'*6} {'─'*8} {'─'*6} {'─'*20} {'─'*30}")
    for row in cur.fetchall():
        centroid = row[6] if row[6] else "N/A"
        print(f"  {row[0]:<15} {row[1]:<15} {row[2]:<6} {row[3]:<8} {row[4]:<6} {row[5]:<20} {centroid}")


def export_geojson(cur):
    """Export utility markets as GeoJSON for Felt upload."""
    print("\n── Exporting GeoJSON ──")

    # Export territories as GeoJSON FeatureCollection
    cur.execute("""
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(territory)::json,
                    'properties', json_build_object(
                        'utility_id', utility_id,
                        'utility_name', utility_name,
                        'utility_short_name', utility_short_name,
                        'state', state,
                        'state_abbr', state_abbr,
                        'iso_rto', iso_rto,
                        'market_type', market_type,
                        'total_contracted_revenue', total_contracted_revenue,
                        'total_merchant_revenue', total_merchant_revenue,
                        'capex_total', capex_total,
                        'mammoth_sites', mammoth_sites,
                        'active_rfp', active_rfp,
                        'storage_mandate_exists', storage_mandate_exists,
                        'interconnection_tier', interconnection_tier,
                        'regulatory_posture', regulatory_posture
                    )
                )
            )
        )
        FROM utility_markets
        WHERE territory IS NOT NULL;
    """)
    territories_geojson = cur.fetchone()[0]

    out_dir = REPO_ROOT / "scripts" / "output"
    out_dir.mkdir(exist_ok=True)

    territories_path = out_dir / "utility_territories.geojson"
    with open(territories_path, "w") as f:
        json.dump(territories_geojson, f, indent=2)
    print(f"  Wrote {territories_path}")

    # Export centroids as GeoJSON (for point-based map layer)
    cur.execute("""
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', json_agg(
                json_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(centroid)::json,
                    'properties', json_build_object(
                        'utility_id', utility_id,
                        'utility_name', utility_name,
                        'utility_short_name', utility_short_name,
                        'state', state,
                        'state_abbr', state_abbr,
                        'iso_rto', iso_rto,
                        'market_type', market_type,
                        'mammoth_sites', mammoth_sites,
                        'active_rfp', active_rfp,
                        'total_contracted_revenue', total_contracted_revenue,
                        'total_merchant_revenue', total_merchant_revenue,
                        'capex_total', capex_total
                    )
                )
            )
        )
        FROM utility_markets
        WHERE centroid IS NOT NULL;
    """)
    centroids_geojson = cur.fetchone()[0]

    centroids_path = out_dir / "utility_centroids.geojson"
    with open(centroids_path, "w") as f:
        json.dump(centroids_geojson, f, indent=2)
    print(f"  Wrote {centroids_path}")

    return territories_path, centroids_path


def main():
    print("=" * 60)
    print("MSP Market Strategy → PostGIS Migration")
    print("=" * 60)

    conn = get_connection()
    try:
        cur = conn.cursor()

        create_schema(cur)
        territories = load_territories()
        insert_utilities(cur, territories)

        conn.commit()
        print("\n  ✓ Data committed to database")

        verify_data(cur)
        territories_path, centroids_path = export_geojson(cur)

        cur.close()
    except Exception as e:
        conn.rollback()
        print(f"\n  ✗ Error: {e}")
        raise
    finally:
        conn.close()

    print("\n" + "=" * 60)
    print("Migration complete!")
    print(f"\nNext step: Upload to Felt")
    print(f"  python scripts/upload_to_felt.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
