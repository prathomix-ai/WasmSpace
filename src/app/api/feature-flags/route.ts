import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/featureFlags";
import { FeatureFlag } from "@/types/admin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("category", { ascending: true });

    if (error || !rows || rows.length === 0) {
      return NextResponse.json(
        {
          success: true,
          flags: DEFAULT_FEATURE_FLAGS,
          source: "fallback_defaults",
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
          },
        }
      );
    }

    const flagsMap: Record<string, FeatureFlag> = { ...DEFAULT_FEATURE_FLAGS };
    rows.forEach((row) => {
      flagsMap[row.id] = {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        enabled: Boolean(row.enabled),
        created_at: row.created_at,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
      };
    });

    return NextResponse.json(
      {
        success: true,
        flags: flagsMap,
        source: "supabase",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        success: true,
        flags: DEFAULT_FEATURE_FLAGS,
        source: "local_memory",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  }
}
