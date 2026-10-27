import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Public endpoint: returns only active madrasa names (no sensitive data)
export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data: madrasas, error } = await adminClient
      .from("madrasas")
      .select("id, name, city")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ madrasas });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
