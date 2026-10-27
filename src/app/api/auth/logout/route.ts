import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();

    // Expire all auth-related cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();

    const response = NextResponse.json({ success: true });

    for (const cookie of allCookies) {
      if (
        cookie.name.startsWith("sb-") ||
        cookie.name.includes("auth") ||
        cookie.name.includes("token") ||
        cookie.name.includes("session")
      ) {
        response.cookies.set({
          name: cookie.name,
          value: "",
          path: "/",
          maxAge: 0,
          expires: new Date(0),
        });
      }
    }

    return response;
  } catch (error: any) {
    console.error("Logout API error:", error);
    return NextResponse.json({ success: true });
  }
}
