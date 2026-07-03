// Scheduled by pg_cron (see the 20260703120500_schedule_fetch_festivals.sql
// migration) to periodically refresh the `festivals` cache table.
//
// Source: Wikidata's public SPARQL endpoint — no API key required, so this
// keeps the festival calendar working with zero external secrets. It's
// best-effort: Wikidata has broad coverage of known recurring festivals but
// not always this year's exact dates. Swapping in a higher-fidelity paid
// events API later only means rewriting `fetchFromWikidata` below — the
// upsert/dedupe/scheduling plumbing stays the same.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";

type RawEvent = {
  qid: string;
  name: string;
  start: string | null;
  end: string | null;
  website: string | null;
  city: string | null;
};

type Region = "Netherlands" | "Berlin";

// wd:Q132241 = festival; P279* walks subclasses (music festival, film
// festival, etc). P17 = country (Q55 = Netherlands). For Berlin we match
// P131 (located in the administrative territorial entity) transitively via
// P131* against Q64 (Berlin).
function buildQuery(region: Region): string {
  const locationClause =
    region === "Netherlands" ? "?item wdt:P17 wd:Q55 ." : "?item wdt:P131* wd:Q64 .";

  return `
    SELECT ?item ?itemLabel ?start ?end ?website ?cityLabel WHERE {
      ?item wdt:P31/wdt:P279* wd:Q132241 .
      ${locationClause}
      OPTIONAL { ?item wdt:P580 ?start. }
      OPTIONAL { ?item wdt:P582 ?end. }
      OPTIONAL { ?item wdt:P856 ?website. }
      OPTIONAL { ?item wdt:P131 ?city. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 200
  `;
}

async function fetchFromWikidata(region: Region): Promise<RawEvent[]> {
  const url = `${WIKIDATA_SPARQL_URL}?query=${encodeURIComponent(buildQuery(region))}&format=json`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      // Wikidata asks anonymous callers to identify themselves.
      "User-Agent": "FlamingoBringo/1.0 (festival-calendar-cache)",
    },
  });
  if (!res.ok) {
    console.error(`Wikidata query failed for ${region}`, res.status, await res.text());
    return [];
  }
  const json = await res.json();
  const bindings = json?.results?.bindings ?? [];
  return bindings
    .map((b: Record<string, { value?: string } | undefined>) => ({
      qid: (b.item?.value ?? "").split("/").pop() ?? "",
      name: b.itemLabel?.value ?? "Untitled festival",
      start: b.start?.value ?? null,
      end: b.end?.value ?? null,
      website: b.website?.value ?? null,
      city: b.cityLabel?.value ?? null,
    }))
    .filter((e: RawEvent) => e.qid);
}

function toDateOnly(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function isUpcomingOrRecurring(
  startsOn: string | null,
  endsOn: string | null,
  today: string,
): boolean {
  if (!startsOn && !endsOn) return true; // no dated instance on record — treat as a recurring evergreen entry
  const end = endsOn ?? startsOn!;
  return end >= today;
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = new Date().toISOString().slice(0, 10);
  const regions: Region[] = ["Netherlands", "Berlin"];
  let upserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const region of regions) {
    let raw: RawEvent[] = [];
    try {
      raw = await fetchFromWikidata(region);
    } catch (e) {
      errors.push(`${region}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const rows = raw
      .map((e) => ({
        source: "wikidata",
        external_id: e.qid,
        name: e.name,
        region,
        city: e.city,
        starts_on: toDateOnly(e.start),
        ends_on: toDateOnly(e.end),
        url: e.website,
      }))
      .filter((r) => isUpcomingOrRecurring(r.starts_on, r.ends_on, today));

    skipped += raw.length - rows.length;
    if (rows.length === 0) continue;

    const { error } = await supabase
      .from("festivals")
      .upsert(rows, { onConflict: "source,external_id" });

    if (error) {
      errors.push(`${region}: ${error.message}`);
    } else {
      upserted += rows.length;
    }
  }

  return new Response(
    JSON.stringify({ upserted, skipped, errors, ranAt: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" }, status: errors.length > 0 ? 207 : 200 },
  );
});
