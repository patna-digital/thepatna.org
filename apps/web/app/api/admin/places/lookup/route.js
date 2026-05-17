import { NextResponse } from "next/server";
import { lookupNominatimPlaces } from "@/lib/place-lookup";
import { requireAdminContext } from "@/lib/supabase/access";

export async function GET(request) {
  const { supabase } = await requireAdminContext();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const countryCode = String(searchParams.get("countryCode") || "").toUpperCase();

  if (!query.trim()) {
    return NextResponse.json({ candidates: [] });
  }

  const { data: country } = countryCode
    ? await supabase
        .from("countries")
        .select("code, alpha2")
        .eq("code", countryCode)
        .maybeSingle()
    : { data: null };

  try {
    const candidates = await lookupNominatimPlaces({
      countryAlpha2: country?.alpha2 || "",
      countryCode,
      query,
    });

    return NextResponse.json({ candidates });
  } catch (error) {
    return NextResponse.json(
      {
        candidates: [],
        error: error instanceof Error ? error.message : "Place lookup failed.",
      },
      { status: 502 },
    );
  }
}
