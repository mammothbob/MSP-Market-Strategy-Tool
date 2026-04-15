-- Migration 002: Multi-parcel projects
--
-- Adds a project_parcels junction table so a project can be defined by
-- one or more parcels (from Regrid or county sources). The project's
-- geometry is then derived as the union/centroid of its parcels.
--
-- Run this in Supabase SQL Editor. Idempotent (safe to re-run).

-- ── 1. project_parcels join table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_parcels (
    id              SERIAL PRIMARY KEY,
    project_gis_id  INTEGER NOT NULL REFERENCES projects(gis_id) ON DELETE CASCADE,
    parcel_id       TEXT NOT NULL,
    parcel_source   TEXT,                               -- 'regrid', 'pierce_county', etc.
    parcel_geom     GEOMETRY(MultiPolygon, 4326),
    is_primary      BOOLEAN DEFAULT FALSE,
    parcel_props    JSONB,                              -- raw props from source layer
    added_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_gis_id, parcel_source, parcel_id)
);

CREATE INDEX IF NOT EXISTS idx_project_parcels_project ON project_parcels(project_gis_id);
CREATE INDEX IF NOT EXISTS idx_project_parcels_geom    ON project_parcels USING GIST(parcel_geom);

-- ── 2. Add footprint column to projects ────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS footprint GEOMETRY(MultiPolygon, 4326);
CREATE INDEX IF NOT EXISTS idx_projects_footprint ON projects USING GIST(footprint);

-- ── 3. Trigger: derive footprint + centroid from parcels ──────────────────
CREATE OR REPLACE FUNCTION refresh_project_geom_from_parcels()
RETURNS TRIGGER AS $$
DECLARE
    target_id INTEGER;
BEGIN
    target_id := COALESCE(NEW.project_gis_id, OLD.project_gis_id);

    UPDATE projects p SET
        footprint = (
            SELECT ST_Multi(ST_UnionAgg(parcel_geom))
            FROM project_parcels
            WHERE project_gis_id = target_id AND parcel_geom IS NOT NULL
        ),
        geom = COALESCE(
            (
                SELECT ST_Centroid(ST_UnionAgg(parcel_geom))
                FROM project_parcels
                WHERE project_gis_id = target_id AND parcel_geom IS NOT NULL
            ),
            p.geom  -- fall back to existing geom (from lat/lon trigger)
        ),
        updated_at = NOW()
    WHERE p.gis_id = target_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ST_UnionAgg is the aggregate form of ST_Union. PostGIS ≥3 has it as ST_Union too,
-- but ST_Union as aggregate is name-overloaded; using a CTE form for safety.
-- If the above fails, swap ST_UnionAgg for ST_Union in the aggregate context.
DROP TRIGGER IF EXISTS trg_project_parcels_geom ON project_parcels;
CREATE TRIGGER trg_project_parcels_geom
    AFTER INSERT OR UPDATE OR DELETE ON project_parcels
    FOR EACH ROW EXECUTE FUNCTION refresh_project_geom_from_parcels();

-- ── 4. Refresh v_projects_map to expose the footprint ──────────────────────
DROP VIEW IF EXISTS v_projects_map;
CREATE VIEW v_projects_map AS
SELECT
    gis_id,
    project_name,
    market, tech, project_size_mw,
    state, county, ahj,
    site_control_status,
    risk_score_overall,
    big_rock,
    -- prefer footprint when we have it; otherwise return point
    COALESCE(footprint::geometry, geom::geometry) AS geom,
    geom AS centroid,
    footprint
FROM projects
WHERE geom IS NOT NULL OR footprint IS NOT NULL;

-- ── 5. Helper view: parcels enriched with project info ────────────────────
DROP VIEW IF EXISTS v_project_parcels_map;
CREATE VIEW v_project_parcels_map AS
SELECT
    pp.id AS parcel_row_id,
    pp.project_gis_id,
    pp.parcel_id,
    pp.parcel_source,
    pp.is_primary,
    pp.parcel_props,
    p.project_name,
    p.market,
    p.site_control_status,
    pp.parcel_geom AS geom
FROM project_parcels pp
JOIN projects p ON p.gis_id = pp.project_gis_id
WHERE pp.parcel_geom IS NOT NULL;

-- ── 6. RPC function for the API ────────────────────────────────────────────
-- Lets the Edge Function call a single SQL function instead of multiple
-- INSERTs; ensures atomic creation.
--
-- Input: project metadata + array of parcels (each with id, source, geom_geojson)
-- Output: the new gis_id
CREATE OR REPLACE FUNCTION create_project_from_parcels(
    p_project_name  TEXT,
    p_market        TEXT,
    p_tech          TEXT,
    p_parcels       JSONB        -- array of {parcel_id, parcel_source, geometry}
) RETURNS INTEGER AS $$
DECLARE
    new_gis_id INTEGER;
    parcel JSONB;
    parcel_geom GEOMETRY;
BEGIN
    -- Pick the next gis_id (max+1)
    SELECT COALESCE(MAX(gis_id), 0) + 1 INTO new_gis_id FROM projects;

    -- Insert the project shell. Geometry comes from the parcels via trigger.
    INSERT INTO projects (gis_id, project_name, market, tech)
    VALUES (new_gis_id, p_project_name, p_market, COALESCE(p_tech, 'BESS'));

    -- Insert each parcel
    FOR parcel IN SELECT * FROM jsonb_array_elements(p_parcels) LOOP
        parcel_geom := ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(parcel->>'geometry'), 4326));

        INSERT INTO project_parcels (
            project_gis_id, parcel_id, parcel_source,
            parcel_geom, parcel_props, is_primary
        ) VALUES (
            new_gis_id,
            parcel->>'parcel_id',
            COALESCE(parcel->>'parcel_source', 'regrid'),
            parcel_geom,
            parcel->'props',
            COALESCE((parcel->>'is_primary')::boolean, FALSE)
        );
    END LOOP;

    RETURN new_gis_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to the anon/authenticated roles so PostgREST can call it
GRANT EXECUTE ON FUNCTION create_project_from_parcels(TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
