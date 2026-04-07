#!/usr/bin/env python3
"""
Load project spreadsheet data into Supabase PostGIS.

Parses the MSP project tracker CSV (exported from Google Sheets) and
inserts rows into the `projects`, `interconnection`, `environmental`,
`studies`, `land_contracts`, and `permitting_jurisdictions` tables.

Usage:
  pip install -r scripts/requirements.txt
  python scripts/load_spreadsheet.py [path/to/spreadsheet.csv]

If no path given, reads from scripts/data/projects.csv
"""

import os
import sys
import csv
import re
import psycopg2
from datetime import datetime
from pathlib import Path

DB_URL = os.environ.get(
    "SUPABASE_DB_URL",
    "postgresql://postgres.gbhjcyhnkjbauiigxpiz:s8L-STDwc/q9iqs@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
)

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = REPO_ROOT / "scripts" / "data" / "projects.csv"

# ── Helpers ────────────────────────────────────────────────────────────────

def clean(val):
    """Strip whitespace, return None for empty/N/A."""
    if val is None:
        return None
    val = str(val).strip()
    if val in ("", "N/A", "n/a", "#VALUE!", "#REF!", "#N/A", "#REF"):
        return None
    return val

def to_num(val):
    """Parse a numeric value, returning None on failure."""
    val = clean(val)
    if val is None:
        return None
    val = val.replace(",", "").replace("$", "").replace("%", "").replace("k", "").strip()
    # Handle ranges like "35-45" by taking first number
    if "-" in val and not val.startswith("-"):
        val = val.split("-")[0].strip()
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def to_date(val):
    """Parse a date string to YYYY-MM-DD or None."""
    val = clean(val)
    if val is None:
        return None
    # Try common formats
    for fmt in ("%m/%d/%y", "%m/%d/%Y", "%Y-%m-%d", "%m/%d"):
        try:
            d = datetime.strptime(val, fmt)
            if d.year < 100:
                d = d.replace(year=d.year + 2000)
            return d.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

def to_bool(val):
    """Parse boolean-ish values."""
    val = clean(val)
    if val is None:
        return None
    low = val.lower()
    if low in ("true", "yes", "1"):
        return True
    if low in ("false", "no", "0"):
        return False
    return None

def parse_latlon(val):
    """Parse 'lat, lon' string into (lat, lon) tuple or (None, None)."""
    val = clean(val)
    if val is None:
        return None, None
    # Remove any trailing whitespace/newlines
    val = val.replace("\n", "").replace("\r", "").strip()
    parts = [p.strip() for p in val.split(",")]
    if len(parts) >= 2:
        try:
            lat = float(parts[0])
            lon = float(parts[1])
            # Basic sanity check
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                return lat, lon
        except (ValueError, TypeError):
            pass
    return None, None


def find_col(headers, *candidates):
    """Find column index by trying multiple header name candidates (case-insensitive, partial match)."""
    for candidate in candidates:
        candidate_lower = candidate.lower().strip()
        for i, h in enumerate(headers):
            if h.lower().strip() == candidate_lower:
                return i
        # Try partial match
        for i, h in enumerate(headers):
            if candidate_lower in h.lower().strip():
                return i
    return None


# ── Column Mapping ─────────────────────────────────────────────────────────

def build_column_map(headers):
    """Build a dict mapping field names to column indices."""
    m = {}

    # Core project fields
    m["project_name"] = find_col(headers, "Project Name")
    m["gis_id"] = find_col(headers, "GIS_ID*", "GIS_ID")
    m["market"] = find_col(headers, "Market")
    m["tech"] = find_col(headers, "Tech")
    m["project_size_mw"] = find_col(headers, "Base Case Project Size", "Project Size")
    m["project_duration_mwh"] = find_col(headers, "Project Duration")
    m["land_agent"] = find_col(headers, "Land Agent")
    m["paces_link"] = find_col(headers, "Paces Link")

    # Location
    m["address"] = find_col(headers, "Address*", "Address")
    m["latlon"] = find_col(headers, "Lat/Long*", "Lat/Long")
    m["state"] = find_col(headers, "State")
    m["county"] = find_col(headers, "County")
    m["ahj"] = find_col(headers, "AHJ*", "AHJ")
    m["parcel_id"] = find_col(headers, "Parcel ID")
    m["total_acreage"] = find_col(headers, "Total Acreage")
    m["buildable_acreage"] = find_col(headers, "Buildable Acreage")

    # Status & Risk
    m["site_control_status"] = find_col(headers, "Site Control Status")
    m["risk_score_site_control"] = find_col(headers, "Risk Score - Site Control", "Risk Scores")
    m["risk_score_permitting"] = find_col(headers, "Risk Score - Permitting", "Permit")
    m["risk_score_design"] = find_col(headers, "Risk Score - Design", "Design")
    m["risk_score_overall"] = find_col(headers, "Risk Score - Overall", "Binary Risk Rating")
    m["priority_tier"] = find_col(headers, "Priority Tier")

    # Updates
    m["update_site_control"] = find_col(headers, "Site Control Updates", "Updates - Site Control")
    m["update_permitting"] = find_col(headers, "Permitting Updates", "Updates - Permitting")
    m["update_design"] = find_col(headers, "Design Updates", "Updates - Design")

    # Action items
    m["action_items"] = find_col(headers, "Action Items")
    m["big_rock"] = find_col(headers, "Big Rock")
    m["key_risks"] = find_col(headers, "Key Risks")
    m["next_steps"] = find_col(headers, "Next Steps")
    m["mitigation_plan"] = find_col(headers, "Mitigation Plan")

    # Site characteristics
    m["glint_fit_check"] = find_col(headers, "Glint Fit Check")
    m["site_conditions"] = find_col(headers, "Site Conditions Description")
    m["site_visit_notes"] = find_col(headers, "Site Visit Notes")
    m["permitting_consultant_notes"] = find_col(headers, "Permitting Consultant Notes")

    # Approvals
    m["dd_approval_bob"] = find_col(headers, "MSP Site DD Approved By:", "DD Approval - Bob")
    m["loi_sent"] = find_col(headers, "LOI\nSent", "LOI Sent")
    m["epf_submitted"] = find_col(headers, "Date EPF Submitted", "EPF Submitted")
    m["epf_approved"] = find_col(headers, "Date EPF Approved", "EPF Approved")
    m["epf_on_hold"] = find_col(headers, "EPF On Hold")

    # Budget
    m["projected_spend_before_dsc"] = find_col(headers, "Projected Spend\nBefore DSC", "Projected Spend Before DSC")
    m["projected_spend_triggered"] = find_col(headers, "Projected Spend\nTriggered by DSC", "Projected Spend Triggered")
    m["option_length_years"] = find_col(headers, "Option Length")
    m["option_payments_k"] = find_col(headers, "Option Payments")
    m["lease_rate_k"] = find_col(headers, "Lease Rate* ($k)", "Lease Rate ($k)")
    m["annual_escalator_pct"] = find_col(headers, "Annual Escalator")
    m["purchase_price_k"] = find_col(headers, "Purchase Price*", "Purchase Price ($k)", "Purchase Price\n[$k]")

    # Project valuation
    m["project_bid_value_k"] = find_col(headers, "Project Expected Bid Value")

    # Zoning
    m["zoning_designation"] = find_col(headers, "Zoning Designation")
    m["by_right"] = find_col(headers, "By Right")
    m["sup_cup"] = find_col(headers, "SUP / CUP")

    # Communities
    m["energy_community"] = find_col(headers, "Energy Community")
    m["highly_impacted_community_wa"] = find_col(headers, "Highly Impacted Community (WA)")
    m["vulnerable_population_wa"] = find_col(headers, "Vulnerable Population (WA)")
    m["low_income_community"] = find_col(headers, "Low Income Community")
    m["dac_justice40"] = find_col(headers, "DAC (Justice40)")
    m["opportunity_zone"] = find_col(headers, "Opportunity Zone")
    m["nmtc_eligible"] = find_col(headers, "NMTC")
    m["incentive_zone_md"] = find_col(headers, "Incentive Zone (MD)")

    # Site fit
    m["site_fit_check"] = find_col(headers, "Site Fit Check")

    # Links
    m["arcgis_link"] = find_col(headers, "ArcGIS Link")
    m["task_board_link"] = find_col(headers, "Task Board Link")
    m["dev_plan_link"] = find_col(headers, "Dev Plan Link")

    # ── Interconnection fields ──
    m["ix_utility"] = find_col(headers, "Utility")
    m["ix_priority_feeder"] = find_col(headers, "Priority Feeder")
    m["ix_poi_hcm"] = find_col(headers, "POI HCM Base Capacity")
    m["ix_mw_queued_feeder"] = find_col(headers, "MW Queued on Feeder")
    m["ix_mw_queued_sub"] = find_col(headers, "MW Queued on Sub")
    m["ix_two_subs"] = find_col(headers, "Two Subs Feeder")
    m["ix_feeder_id"] = find_col(headers, "Feeder ID*", "Feeder ID")
    m["ix_feeder_section_id"] = find_col(headers, "Feeder Section ID")
    m["ix_sub_loading"] = find_col(headers, "Substation Loading")
    m["ix_nwa"] = find_col(headers, "NWA Eligibility")
    m["ix_poi_voltage"] = find_col(headers, "POI Voltage (kV)")
    m["ix_poi_distance"] = find_col(headers, "POI Distance to Site")
    m["ix_sub_name"] = find_col(headers, "Substation Name")
    m["ix_poi_distance_sub"] = find_col(headers, "POI Distance to Sub")
    m["ix_notes"] = find_col(headers, "IX Notes")
    m["ix_single_max"] = find_col(headers, "Single Project Max")
    m["ix_double_max"] = find_col(headers, "Double Project Max")
    m["ix_net_grid_cap"] = find_col(headers, "Net Grid Capacity")
    m["ix_circuit_mva"] = find_col(headers, "Circuit MVA")
    m["ix_hcm_thermal"] = find_col(headers, "HCM Thermal Rating")
    m["ix_feeder_elevation"] = find_col(headers, "Feeder Elevation")
    m["ix_upgrade_score"] = find_col(headers, "POI 5 MW Network Upgrade Score")
    m["ix_num_easements"] = find_col(headers, "Unique Easements Required", "Num Unique Easements")

    # Environmental (select key fields)
    m["env_slope"] = find_col(headers, "Slope/Topo")
    m["env_wetlands"] = find_col(headers, "Federal Wetlands")
    m["env_flood"] = find_col(headers, "Flood\n Plains", "Flood Plains")
    m["env_vegetation"] = find_col(headers, "Vegetation (NVC)")
    m["env_soil"] = find_col(headers, "Soil Hydrologic Group")
    m["env_tribal"] = find_col(headers, "Tribal Nexus")
    m["env_species"] = find_col(headers, "State-Level Species Review")
    m["env_site_fit"] = find_col(headers, "Site Fit Check")

    return m


def get(row, col_map, field, default=None):
    """Get a value from a row using the column map."""
    idx = col_map.get(field)
    if idx is None or idx >= len(row):
        return default
    return row[idx]


# ── Database Operations ────────────────────────────────────────────────────

def insert_project(cur, row, col_map):
    """Insert a single project row."""
    name = clean(get(row, col_map, "project_name"))
    gis_id_raw = clean(get(row, col_map, "gis_id"))

    if not name or not gis_id_raw:
        return None

    try:
        gis_id = int(float(gis_id_raw))
    except (ValueError, TypeError):
        return None

    lat, lon = parse_latlon(get(row, col_map, "latlon"))

    cur.execute("""
        INSERT INTO projects (
            gis_id, project_name, market, tech,
            project_size_mw, project_duration_mwh,
            land_agent, paces_link,
            address, latitude, longitude,
            state, county, ahj, parcel_id,
            total_acreage, buildable_acreage,
            site_control_status,
            risk_score_site_control, risk_score_permitting,
            risk_score_design, risk_score_overall,
            priority_tier,
            update_site_control, update_permitting, update_design,
            action_items, big_rock, key_risks, next_steps, mitigation_plan,
            glint_fit_check, site_conditions, site_visit_notes,
            permitting_consultant_notes,
            loi_sent, epf_submitted, epf_approved, epf_on_hold,
            option_length_years, option_payments_k,
            lease_rate_k, annual_escalator_pct, purchase_price_k,
            project_bid_value_k,
            zoning_designation, by_right, sup_cup,
            energy_community,
            highly_impacted_community_wa, vulnerable_population_wa,
            low_income_community, dac_justice40,
            opportunity_zone, nmtc_eligible, incentive_zone_md,
            arcgis_link, task_board_link, dev_plan_link
        ) VALUES (
            %s, %s, %s, %s,
            %s, %s,
            %s, %s,
            %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s,
            %s,
            %s, %s,
            %s, %s,
            %s,
            %s, %s, %s,
            %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s,
            %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s,
            %s,
            %s, %s, %s,
            %s,
            %s, %s,
            %s, %s,
            %s, %s, %s,
            %s, %s, %s
        )
        ON CONFLICT (gis_id) DO UPDATE SET
            project_name = EXCLUDED.project_name,
            market = EXCLUDED.market,
            updated_at = NOW()
        RETURNING gis_id
    """, (
        gis_id,
        name,
        clean(get(row, col_map, "market")),
        clean(get(row, col_map, "tech")) or "BESS",
        to_num(get(row, col_map, "project_size_mw")),
        to_num(get(row, col_map, "project_duration_mwh")),
        clean(get(row, col_map, "land_agent")),
        clean(get(row, col_map, "paces_link")),
        clean(get(row, col_map, "address")),
        lat, lon,
        clean(get(row, col_map, "state")),
        clean(get(row, col_map, "county")),
        clean(get(row, col_map, "ahj")),
        clean(get(row, col_map, "parcel_id")),
        to_num(get(row, col_map, "total_acreage")),
        to_num(get(row, col_map, "buildable_acreage")),
        clean(get(row, col_map, "site_control_status")),
        to_num(get(row, col_map, "risk_score_site_control")),
        to_num(get(row, col_map, "risk_score_permitting")),
        to_num(get(row, col_map, "risk_score_design")),
        to_num(get(row, col_map, "risk_score_overall")),
        clean(get(row, col_map, "priority_tier")),
        clean(get(row, col_map, "update_site_control")),
        clean(get(row, col_map, "update_permitting")),
        clean(get(row, col_map, "update_design")),
        clean(get(row, col_map, "action_items")),
        clean(get(row, col_map, "big_rock")),
        clean(get(row, col_map, "key_risks")),
        clean(get(row, col_map, "next_steps")),
        clean(get(row, col_map, "mitigation_plan")),
        clean(get(row, col_map, "glint_fit_check")),
        clean(get(row, col_map, "site_conditions")),
        clean(get(row, col_map, "site_visit_notes")),
        clean(get(row, col_map, "permitting_consultant_notes")),
        to_date(get(row, col_map, "loi_sent")),
        to_date(get(row, col_map, "epf_submitted")),
        to_date(get(row, col_map, "epf_approved")),
        clean(get(row, col_map, "epf_on_hold")),
        to_num(get(row, col_map, "option_length_years")),
        clean(get(row, col_map, "option_payments_k")),
        to_num(get(row, col_map, "lease_rate_k")),
        to_num(get(row, col_map, "annual_escalator_pct")),
        to_num(get(row, col_map, "purchase_price_k")),
        to_num(get(row, col_map, "project_bid_value_k")),
        clean(get(row, col_map, "zoning_designation")),
        clean(get(row, col_map, "by_right")),
        clean(get(row, col_map, "sup_cup")),
        clean(get(row, col_map, "energy_community")),
        clean(get(row, col_map, "highly_impacted_community_wa")),
        clean(get(row, col_map, "vulnerable_population_wa")),
        clean(get(row, col_map, "low_income_community")),
        clean(get(row, col_map, "dac_justice40")),
        clean(get(row, col_map, "opportunity_zone")),
        clean(get(row, col_map, "nmtc_eligible")),
        clean(get(row, col_map, "incentive_zone_md")),
        clean(get(row, col_map, "arcgis_link")),
        clean(get(row, col_map, "task_board_link")),
        clean(get(row, col_map, "dev_plan_link")),
    ))

    result = cur.fetchone()
    return result[0] if result else gis_id


def insert_interconnection(cur, gis_id, row, col_map):
    """Insert interconnection data for a project."""
    utility = clean(get(row, col_map, "ix_utility"))
    if not utility and not clean(get(row, col_map, "ix_priority_feeder")):
        return  # No IX data

    cur.execute("""
        INSERT INTO interconnection (
            project_gis_id, utility, priority_feeder,
            poi_hcm_base_capacity, mw_queued_on_feeder, mw_queued_on_sub,
            two_subs_feeder, feeder_id, feeder_section_id,
            substation_loading, nwa_eligibility,
            poi_voltage_kv, poi_distance_to_site,
            substation_name, poi_distance_to_sub,
            ix_notes, single_project_max_mw, double_project_max_mw,
            net_grid_capacity_mw,
            circuit_mva_rating, hcm_thermal_rating, feeder_elevation,
            poi_network_upgrade_score, num_easements_to_poi
        ) VALUES (
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s,
            %s, %s,
            %s, %s,
            %s, %s, %s,
            %s,
            %s, %s, %s,
            %s, %s
        )
        ON CONFLICT (project_gis_id) DO UPDATE SET
            utility = EXCLUDED.utility,
            updated_at = NOW()
    """, (
        gis_id,
        utility,
        clean(get(row, col_map, "ix_priority_feeder")),
        to_num(get(row, col_map, "ix_poi_hcm")),
        to_num(get(row, col_map, "ix_mw_queued_feeder")),
        to_num(get(row, col_map, "ix_mw_queued_sub")),
        clean(get(row, col_map, "ix_two_subs")),
        clean(get(row, col_map, "ix_feeder_id")),
        clean(get(row, col_map, "ix_feeder_section_id")),
        clean(get(row, col_map, "ix_sub_loading")),
        clean(get(row, col_map, "ix_nwa")),
        to_num(get(row, col_map, "ix_poi_voltage")),
        clean(get(row, col_map, "ix_poi_distance")),
        clean(get(row, col_map, "ix_sub_name")),
        to_num(get(row, col_map, "ix_poi_distance_sub")),
        clean(get(row, col_map, "ix_notes")),
        to_num(get(row, col_map, "ix_single_max")),
        to_num(get(row, col_map, "ix_double_max")),
        to_num(get(row, col_map, "ix_net_grid_cap")),
        clean(get(row, col_map, "ix_circuit_mva")),
        to_num(get(row, col_map, "ix_hcm_thermal")),
        clean(get(row, col_map, "ix_feeder_elevation")),
        to_num(get(row, col_map, "ix_upgrade_score")),
        clean(get(row, col_map, "ix_num_easements")),
    ))


def insert_environmental(cur, gis_id, row, col_map):
    """Insert environmental data for a project."""
    slope = clean(get(row, col_map, "env_slope"))
    wetlands = clean(get(row, col_map, "env_wetlands"))
    if not slope and not wetlands:
        return

    cur.execute("""
        INSERT INTO environmental (
            project_gis_id,
            slope_topo, federal_wetlands, flood_plains,
            vegetation_nvc, soil_hydrologic_group,
            tribal_nexus, state_species_review,
            site_fit_check
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (project_gis_id) DO UPDATE SET
            slope_topo = EXCLUDED.slope_topo,
            updated_at = NOW()
    """, (
        gis_id,
        slope,
        wetlands,
        clean(get(row, col_map, "env_flood")),
        clean(get(row, col_map, "env_vegetation")),
        clean(get(row, col_map, "env_soil")),
        clean(get(row, col_map, "env_tribal")),
        clean(get(row, col_map, "env_species")),
        clean(get(row, col_map, "env_site_fit")),
    ))


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV

    if not csv_path.exists():
        print(f"CSV file not found: {csv_path}")
        print(f"Place your exported spreadsheet at: {DEFAULT_CSV}")
        print(f"Or pass the path as an argument: python {sys.argv[0]} path/to/file.csv")
        sys.exit(1)

    print("=" * 60)
    print("Load Project Spreadsheet → PostGIS")
    print("=" * 60)

    # Read CSV
    print(f"\nReading: {csv_path}")
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        all_rows = list(reader)

    if len(all_rows) < 4:
        print("ERROR: CSV has fewer than 4 rows (expected 3 header rows + data)")
        sys.exit(1)

    # The spreadsheet has 3 header rows; row index 2 is the main field name row
    # Row 0: category groupings
    # Row 1: section headers
    # Row 2: actual column names (this is the one we match against)
    headers = all_rows[2]
    data_rows = all_rows[3:]  # Skip the unit/format row (row 3) and start at row 4

    # Actually, looking at the data, row 3 is units/formats, data starts at row 4
    # But let's be safe - skip rows that start with empty project name AND empty GIS_ID
    print(f"  Total rows: {len(all_rows)}")
    print(f"  Headers (row 3): {len(headers)} columns")
    print(f"  Data rows: {len(data_rows)}")

    col_map = build_column_map(headers)

    # Debug: show what we mapped
    mapped = {k: v for k, v in col_map.items() if v is not None}
    unmapped = [k for k, v in col_map.items() if v is None]
    print(f"\n  Mapped {len(mapped)} fields, {len(unmapped)} unmapped")
    if unmapped:
        print(f"  Unmapped: {', '.join(unmapped[:10])}{'...' if len(unmapped) > 10 else ''}")

    # Connect to DB
    print(f"\nConnecting to database...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    inserted = 0
    skipped = 0
    errors = 0

    for i, row in enumerate(data_rows):
        # Skip the units/format row and empty rows
        name = clean(get(row, col_map, "project_name"))
        gis_id_raw = clean(get(row, col_map, "gis_id"))

        if not name or not gis_id_raw:
            skipped += 1
            continue

        try:
            gis_id = insert_project(cur, row, col_map)
            if gis_id:
                insert_interconnection(cur, gis_id, row, col_map)
                insert_environmental(cur, gis_id, row, col_map)
                inserted += 1
            else:
                skipped += 1
        except Exception as e:
            errors += 1
            print(f"  ERROR row {i+4} ({name}): {e}")
            conn.rollback()
            # Re-open transaction for remaining rows
            continue

    conn.commit()

    # Verify
    print(f"\n── Results ──")
    print(f"  Inserted/updated: {inserted}")
    print(f"  Skipped (empty): {skipped}")
    print(f"  Errors: {errors}")

    cur.execute("SELECT COUNT(*) FROM projects;")
    print(f"  Total projects in DB: {cur.fetchone()[0]}")

    cur.execute("SELECT COUNT(*) FROM projects WHERE geom IS NOT NULL;")
    print(f"  With geometry: {cur.fetchone()[0]}")

    cur.execute("SELECT COUNT(*) FROM interconnection;")
    print(f"  Interconnection records: {cur.fetchone()[0]}")

    cur.execute("SELECT COUNT(*) FROM environmental;")
    print(f"  Environmental records: {cur.fetchone()[0]}")

    # Show a sample
    cur.execute("""
        SELECT gis_id, project_name, state, market,
               site_control_status, ST_AsText(geom)
        FROM projects
        WHERE geom IS NOT NULL
        ORDER BY gis_id
        LIMIT 10;
    """)
    print(f"\n── Sample Projects ──")
    for row in cur.fetchall():
        geom = row[5][:40] + "..." if row[5] else "NULL"
        print(f"  [{row[0]}] {row[1][:30]:<30} {row[2] or '?':<4} {row[3] or '?':<4} {row[4] or '?':<20} {geom}")

    cur.close()
    conn.close()

    print(f"\n{'=' * 60}")
    print("Data loaded! Next: connect to Felt")
    print(f"  python scripts/connect_felt_postgis.py")
    print(f"  # or: python scripts/upload_geojson_to_felt.py")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
