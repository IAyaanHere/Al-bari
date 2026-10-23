import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unhealthy";

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from("app_settings").select("key").limit(1);
    if (!error) {
      dbStatus = "healthy";
    }
  } catch {
    dbStatus = "unreachable";
  }

  const isHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      database: dbStatus,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
