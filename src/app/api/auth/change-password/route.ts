import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validatePasswordStrength } from "@/lib/auth/passwords";

const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parse = ChangePasswordSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const { newPassword } = parse.data;
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.error }, { status: 400 });
    }

    // Update password in Supabase Auth
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Set must_change_password = false in profiles
    const adminClient = createAdminClient();
    await adminClient
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id);

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Change password error:", error?.message || error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
