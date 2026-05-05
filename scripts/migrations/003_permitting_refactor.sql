-- Migration 003: Permitting schema refactor (beta)
--
-- Restructures into 5 tables:
--   1. projects (slimmed down)
--   2. permitting_state
--   3. permitting_ahj
--   4. permitting_project
--   5. project_updates (add category column)
--
-- Also drops: permitting_jurisdictions (replaced by permitting_ahj)
--
-- Run in Supabase SQL Editor.

-- ============================================================
-- 0. Drop views that depend on projects columns we're removing
-- ============================================================
DROP VIEW IF EXISTS v_projects_map CASCADE;
DROP VIEW IF EXISTS v_project_full CASCADE;
DROP VIEW IF EXISTS v_project_parcels_map CASCADE;

-- ============================================================
-- 1. permitting_state
-- ============================================================
CREATE TABLE IF NOT EXISTS permitting_state (
    state_abbr              CHAR(2) PRIMARY KEY,
    state_name              TEXT NOT NULL,

    storage_mandate         BOOLEAN DEFAULT FALSE,
    storage_mandate_mw      INTEGER,
    storage_mandate_year    INTEGER,

    prevailing_wage         BOOLEAN DEFAULT FALSE,
    environmental_review    TEXT,
    forest_conservation     TEXT,
    state_fire_code         TEXT,

    state_incentive_programs TEXT,
    property_tax_exemption  BOOLEAN DEFAULT FALSE,
    sales_tax_exemption     BOOLEAN DEFAULT FALSE,

    bess_classification     TEXT,
    reca_applies            BOOLEAN,

    notes                   TEXT,
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the two states you operate in
INSERT INTO permitting_state (state_abbr, state_name) VALUES
    ('WA', 'Washington'),
    ('MD', 'Maryland'),
    ('OR', 'Oregon')
ON CONFLICT (state_abbr) DO NOTHING;

-- ============================================================
-- 2. permitting_ahj
-- ============================================================
CREATE TABLE IF NOT EXISTS permitting_ahj (
    ahj_name                TEXT PRIMARY KEY,
    county                  TEXT,
    state_abbr              CHAR(2) REFERENCES permitting_state(state_abbr),
    ahj_type                TEXT,

    bess_classification     TEXT,
    permit_path             TEXT,
    active_moratorium       BOOLEAN DEFAULT FALSE,
    moratorium_end_date     DATE,

    fire_code_review        TEXT,
    noise_rules             TEXT,
    stormwater_threshold    TEXT,
    community_sentiment     TEXT,

    general_permit_process  TEXT,
    zoning_code_link        TEXT,
    permit_fee_schedule     TEXT,
    permitting_links        TEXT,

    notes                   TEXT,
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate data from old permitting_jurisdictions if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permitting_jurisdictions') THEN
        INSERT INTO permitting_ahj (
            ahj_name, state_abbr,
            active_moratorium, general_permit_process, permitting_links,
            fire_code_review, noise_rules, community_sentiment, notes
        )
        SELECT
            ahj_name, state,
            CASE WHEN active_moratorium IS NOT NULL AND active_moratorium != '' THEN TRUE ELSE FALSE END,
            general_permit_process, permitting_links,
            fire_code_review, noise_rules, community_sentiment, notes
        FROM permitting_jurisdictions
        ON CONFLICT (ahj_name) DO NOTHING;
    END IF;
END $$;

-- Drop old table
DROP TABLE IF EXISTS permitting_jurisdictions CASCADE;

-- ============================================================
-- 3. permitting_project
-- ============================================================
CREATE TABLE IF NOT EXISTS permitting_project (
    id                      SERIAL PRIMARY KEY,
    project_gis_id          INTEGER NOT NULL REFERENCES projects(gis_id) ON DELETE CASCADE,

    by_right                TEXT,
    sup_cup_required        TEXT,

    permit_status           TEXT,
    pre_app_date            DATE,
    pre_app_notes           TEXT,
    permit_submitted        DATE,
    permit_approved         DATE,

    risk_score              NUMERIC,
    consultant              TEXT,
    consultant_notes        TEXT,

    setback_rules           TEXT,
    lot_coverage_constraints TEXT,
    nearby_sensitive_uses   TEXT,
    actual_setbacks         TEXT,

    fire_code_notes         TEXT,
    nearest_school_ft       NUMERIC,
    nearest_house_ft        NUMERIC,

    notes                   TEXT,
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_gis_id)
);

-- Migrate existing permitting data from projects into permitting_project
INSERT INTO permitting_project (
    project_gis_id,
    by_right,
    sup_cup_required,
    risk_score,
    consultant_notes
)
SELECT
    gis_id,
    by_right,
    sup_cup,
    risk_score_permitting,
    permitting_consultant_notes
FROM projects
WHERE gis_id IS NOT NULL
ON CONFLICT (project_gis_id) DO NOTHING;

-- ============================================================
-- 4. project_updates: add category column
-- ============================================================
ALTER TABLE project_updates
    ADD COLUMN IF NOT EXISTS category TEXT;

-- Migrate existing update_permitting text blobs as 'permitting' entries
INSERT INTO project_updates (project_gis_id, project_name, update_text, category, update_timestamp)
SELECT
    gis_id,
    project_name,
    update_permitting,
    'permitting',
    updated_at
FROM projects
WHERE update_permitting IS NOT NULL AND update_permitting != '';

-- ============================================================
-- 5. Slim down projects table
-- ============================================================
-- Drop columns that moved to permitting tables or are no longer needed
ALTER TABLE projects
    DROP COLUMN IF EXISTS project_duration_mwh,
    DROP COLUMN IF EXISTS land_agent,
    DROP COLUMN IF EXISTS paces_link,
    DROP COLUMN IF EXISTS buildable_acreage,
    DROP COLUMN IF EXISTS risk_score_site_control,
    DROP COLUMN IF EXISTS risk_score_permitting,
    DROP COLUMN IF EXISTS risk_score_design,
    DROP COLUMN IF EXISTS risk_score_overall,
    DROP COLUMN IF EXISTS priority_tier,
    DROP COLUMN IF EXISTS update_site_control,
    DROP COLUMN IF EXISTS update_permitting,
    DROP COLUMN IF EXISTS update_design,
    DROP COLUMN IF EXISTS action_items,
    DROP COLUMN IF EXISTS big_rock,
    DROP COLUMN IF EXISTS key_risks,
    DROP COLUMN IF EXISTS next_steps,
    DROP COLUMN IF EXISTS mitigation_plan,
    DROP COLUMN IF EXISTS glint_fit_check,
    DROP COLUMN IF EXISTS site_visit_notes,
    DROP COLUMN IF EXISTS permitting_consultant_notes,
    DROP COLUMN IF EXISTS dd_approval_bob,
    DROP COLUMN IF EXISTS dd_approval_ben,
    DROP COLUMN IF EXISTS dd_approval_adam,
    DROP COLUMN IF EXISTS loi_sent,
    DROP COLUMN IF EXISTS dsc_approval_bob,
    DROP COLUMN IF EXISTS dsc_approval_ben,
    DROP COLUMN IF EXISTS dsc_approval_adam,
    DROP COLUMN IF EXISTS projected_spend_before_dsc,
    DROP COLUMN IF EXISTS projected_spend_triggered,
    DROP COLUMN IF EXISTS option_length_years,
    DROP COLUMN IF EXISTS option_payments_k,
    DROP COLUMN IF EXISTS lease_rate_k,
    DROP COLUMN IF EXISTS annual_escalator_pct,
    DROP COLUMN IF EXISTS purchase_price_k,
    DROP COLUMN IF EXISTS project_bid_value_k,
    DROP COLUMN IF EXISTS feedlim_project_size_mw,
    DROP COLUMN IF EXISTS qual_score_6mw,
    DROP COLUMN IF EXISTS qual_score_feedlim,
    DROP COLUMN IF EXISTS quant_score,
    DROP COLUMN IF EXISTS by_right,
    DROP COLUMN IF EXISTS sup_cup,
    DROP COLUMN IF EXISTS arcgis_link,
    DROP COLUMN IF EXISTS consultant_doc_links,
    DROP COLUMN IF EXISTS task_board_link,
    DROP COLUMN IF EXISTS dev_plan_link;

-- ============================================================
-- 6. Add FK constraints on projects
-- ============================================================
-- state -> permitting_state (only if not already constrained)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_projects_state' AND table_name = 'projects'
    ) THEN
        -- First ensure all existing state values exist in permitting_state
        INSERT INTO permitting_state (state_abbr, state_name)
        SELECT DISTINCT state, state
        FROM projects
        WHERE state IS NOT NULL AND length(state) = 2
        ON CONFLICT (state_abbr) DO NOTHING;

        ALTER TABLE projects
            ADD CONSTRAINT fk_projects_state
            FOREIGN KEY (state) REFERENCES permitting_state(state_abbr);
    END IF;
END $$;

-- ahj -> permitting_ahj
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_projects_ahj' AND table_name = 'projects'
    ) THEN
        -- Ensure all existing AHJ values exist in permitting_ahj
        INSERT INTO permitting_ahj (ahj_name)
        SELECT DISTINCT ahj
        FROM projects
        WHERE ahj IS NOT NULL AND ahj != ''
        ON CONFLICT (ahj_name) DO NOTHING;

        ALTER TABLE projects
            ADD CONSTRAINT fk_projects_ahj
            FOREIGN KEY (ahj) REFERENCES permitting_ahj(ahj_name);
    END IF;
END $$;

-- ============================================================
-- 7. Recreate views
-- ============================================================
CREATE VIEW v_projects_map AS
SELECT
    gis_id,
    project_name,
    market, tech, project_size_mw,
    state, county, ahj,
    site_control_status,
    zoning_designation,
    COALESCE(footprint::geometry, geom::geometry) AS geom,
    geom AS centroid,
    footprint
FROM projects
WHERE geom IS NOT NULL OR footprint IS NOT NULL;

CREATE VIEW v_project_full AS
SELECT
    p.*,
    ps.storage_mandate, ps.prevailing_wage, ps.state_incentive_programs,
    ps.bess_classification AS state_bess_classification,
    pa.permit_path, pa.active_moratorium, pa.community_sentiment,
    pa.fire_code_review, pa.noise_rules,
    pa.bess_classification AS ahj_bess_classification,
    pp.by_right, pp.sup_cup_required, pp.permit_status,
    pp.risk_score AS permitting_risk_score,
    pp.setback_rules, pp.lot_coverage_constraints,
    pp.nearest_school_ft, pp.nearest_house_ft
FROM projects p
LEFT JOIN permitting_state ps ON p.state = ps.state_abbr
LEFT JOIN permitting_ahj pa ON p.ahj = pa.ahj_name
LEFT JOIN permitting_project pp ON p.gis_id = pp.project_gis_id;

-- ============================================================
-- 8. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_permitting_ahj_state ON permitting_ahj(state_abbr);
CREATE INDEX IF NOT EXISTS idx_permitting_ahj_county ON permitting_ahj(county);
CREATE INDEX IF NOT EXISTS idx_permitting_project_gis ON permitting_project(project_gis_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_category ON project_updates(category);
