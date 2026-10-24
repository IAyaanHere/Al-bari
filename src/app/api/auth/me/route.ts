import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        id: profile.id,
        role: profile.role,
        full_name: profile.full_name,
        username: profile.username,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
