# Add Project from Felt — setup

Three-piece system that lets a user click parcels in Felt and save them as
a new project in PostGIS.

```
┌─────────────┐    ┌────────────────────┐    ┌──────────────────┐
│  Felt app   │ →  │  Supabase Edge Fn  │ →  │  Postgres / RPC  │
│  (browser)  │    │  /create_project   │    │  + triggers fire │
└─────────────┘    └────────────────────┘    └──────────────────┘
```

Pieces in this repo:
- **`scripts/migrations/002_project_parcels.sql`** — schema + trigger + RPC function
- **`supabase/functions/create_project/index.ts`** — the API endpoint
- **`felt-app/add-project/index.html`** — the iframe UI Felt loads

---

## 1. Apply the SQL migration

Open Supabase → SQL Editor → paste the contents of
`scripts/migrations/002_project_parcels.sql` → Run.

You should see "Success. No rows returned." It creates:
- `project_parcels` table
- `projects.footprint` column (multi-polygon)
- `refresh_project_geom_from_parcels` trigger
- updated `v_projects_map` view
- new `v_project_parcels_map` view (lets you visualize parcels grouped by project)
- `create_project_from_parcels(...)` SQL function

Verify:
```sql
SELECT * FROM project_parcels LIMIT 1;            -- empty table OK
SELECT routine_name FROM information_schema.routines
  WHERE routine_name = 'create_project_from_parcels';
```

## 2. Deploy the Edge Function

You'll need the Supabase CLI:
```bash
brew install supabase/tap/supabase   # macOS
supabase login
supabase link --project-ref gbhjcyhnkjbauiigxpiz
```

Then from the repo root:
```bash
supabase functions deploy create_project --no-verify-jwt
```

(`--no-verify-jwt` lets the Felt app call it with just the anon key. If you
later want stricter auth, drop the flag and have the Felt app pass a real
user JWT.)

The function URL will be:
```
https://gbhjcyhnkjbauiigxpiz.supabase.co/functions/v1/create_project
```

Test it with curl:
```bash
curl -X POST \
  "https://gbhjcyhnkjbauiigxpiz.supabase.co/functions/v1/create_project" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Test Project",
    "market": "WA",
    "tech": "BESS",
    "parcels": [{
      "parcel_id": "test-001",
      "parcel_source": "regrid",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-122.5,48.8],[-122.4,48.8],[-122.4,48.9],[-122.5,48.9],[-122.5,48.8]]]
      },
      "is_primary": true
    }]
  }'
```

You should get back `{"ok":true,"gis_id":N,"parcel_count":1}`.

Get your anon key from Supabase → Settings → API → "Project API keys" → `anon` `public`.

## 3. Host the Felt app

The `felt-app/add-project/index.html` is a single HTML file. Felt loads it
as an iframe. Easiest hosts:

### Option A: Vercel (recommended, free, custom domain)
```bash
cd felt-app/add-project
npx vercel --prod
```
You'll get a URL like `https://msp-add-project.vercel.app`.

### Option B: GitHub Pages
Enable GitHub Pages on the repo, set source to `claude/felt-postgis-connection-jOy8Q`
branch, `/felt-app/add-project` folder. URL will be:
```
https://mammothbob.github.io/MSP-Market-Strategy-Tool/felt-app/add-project/
```

### Option C: Netlify
Drag-and-drop the folder onto netlify.app — instant URL.

**Before hosting**, edit `index.html` and replace `REPLACE_WITH_YOUR_ANON_KEY`
with your Supabase anon key (line ~110).

## 4. Register the app in Felt

In your Felt map → click the apps/extensions panel (looks like a puzzle piece
or "+ Add app") → "Add custom app" → paste the URL from step 3.

Felt will load it as a side panel.

## 5. Use it

1. Open the Felt map.
2. Make sure the **"Real Estate / Current Parcels"** layer is enabled and visible.
3. Open the Add Project panel.
4. Click parcels on the map. They'll appear in the panel's list.
5. Fill in project name + market + tech.
6. Click **Save project**.

The Edge Function inserts the project + parcels into PostGIS. The trigger
auto-derives the project's footprint and centroid from the union of parcels.

To see the new project on the map, run:
```bash
bash scripts/run_pipeline.sh
```
This re-exports the projects layer to Felt. (Until you have Felt Enterprise,
the projects layer is a snapshot, not live.)

## Troubleshooting

**Felt SDK can't connect** — make sure your iframe URL is HTTPS. Felt
requires it.

**`extractParcelId` returns "(unknown)"** — open the parcel layer's
properties in Felt to see the actual field name. Edit `extractParcelId`
in `index.html` to match.

**Edge Function returns 401** — your anon key is wrong, or you forgot
`--no-verify-jwt` when deploying.

**Trigger fails with "function st_unionagg does not exist"** — your PostGIS
version uses `ST_Union` as the aggregate (not `ST_UnionAgg`). Edit
migration 002, swap `ST_UnionAgg` → `ST_Union`. Re-run the migration.

**Project saved but no points appear in PostGIS** — the trigger might have
failed silently. Check `SELECT footprint FROM projects WHERE gis_id = N;`.
If null, parcel geometries didn't make it. Check the Edge Function logs:
`supabase functions logs create_project`.

## Architecture notes

- **Why Edge Function and not direct Postgres**: The browser can't safely
  hold the Postgres password. The Edge Function runs server-side with
  the service role key, validates input, then calls the RPC.
- **Why an RPC and not raw SQL from the function**: Atomicity. The RPC
  inserts the project and all parcels in a single transaction; if any
  parcel insert fails, the whole project is rolled back.
- **Why `is_primary` on parcels**: For naming and centroid bias. The first
  parcel selected in the Felt app becomes primary. Optional.
- **Why `parcel_props JSONB`**: We capture the full property bag from
  Regrid (or whatever source). Preserves data without forcing a rigid
  schema. You can query it later with `parcel_props->>'owner'` etc.
