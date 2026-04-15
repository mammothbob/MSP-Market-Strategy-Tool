// Supabase Edge Function: create_project
//
// Receives a payload from the Felt "Add Project" app and creates a new
// project in PostGIS, plus its constituent parcel rows. The project's
// geometry is auto-derived by the trigger we set up in migration 002.
//
// Deploy:
//   supabase functions deploy create_project --no-verify-jwt
//
// Invoke (from the Felt app):
//   POST https://<project-ref>.supabase.co/functions/v1/create_project
//   Body: {
//     "project_name": "Hovander 2",
//     "market": "WA",
//     "tech": "BESS",
//     "parcels": [
//       {
//         "parcel_id": "abc-123",
//         "parcel_source": "regrid",
//         "geometry": { "type": "Polygon", "coordinates": [...] },
//         "props": { ... },
//         "is_primary": true
//       }
//     ]
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface IncomingParcel {
  parcel_id: string;
  parcel_source?: string;
  geometry: GeoJSON.Geometry; // Polygon or MultiPolygon
  props?: Record<string, unknown>;
  is_primary?: boolean;
}

interface CreateProjectRequest {
  project_name: string;
  market?: string;
  tech?: string;
  parcels: IncomingParcel[];
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let payload: CreateProjectRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  // Validate
  if (!payload.project_name || typeof payload.project_name !== "string") {
    return jsonResponse({ error: "project_name_required" }, 400);
  }
  if (!Array.isArray(payload.parcels) || payload.parcels.length === 0) {
    return jsonResponse({ error: "at_least_one_parcel_required" }, 400);
  }
  for (const p of payload.parcels) {
    if (!p.parcel_id) {
      return jsonResponse({ error: "parcel_id_required_on_each_parcel" }, 400);
    }
    if (!p.geometry || !p.geometry.type) {
      return jsonResponse({ error: "geometry_required_on_each_parcel" }, 400);
    }
  }

  // Build the parcels array for the SQL function. Stringify geometry so the
  // SQL side can ST_GeomFromGeoJSON it.
  const parcels = payload.parcels.map((p) => ({
    parcel_id: p.parcel_id,
    parcel_source: p.parcel_source ?? "regrid",
    geometry: JSON.stringify(p.geometry),
    props: p.props ?? null,
    is_primary: !!p.is_primary,
  }));

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase.rpc("create_project_from_parcels", {
    p_project_name: payload.project_name,
    p_market: payload.market ?? null,
    p_tech: payload.tech ?? "BESS",
    p_parcels: parcels,
  });

  if (error) {
    console.error("RPC error:", error);
    return jsonResponse({ error: "db_error", detail: error.message }, 500);
  }

  return jsonResponse({
    ok: true,
    gis_id: data,
    parcel_count: parcels.length,
  });
});
