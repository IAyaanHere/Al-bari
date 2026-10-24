import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUsername, usernameToInternalEmail } from "@/lib/auth/username";
import { checkRateLimit } from "@/lib/rate-limit/limiter";

const LoginSchema = z.object({
  identifier: z.string().min(2).max(100), // username or email
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rate = checkRateLimit(`login_${ip}`, 10, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parse = LoginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 400 });
    }

    const { identifier, password } = parse.data;
    const adminClient = createAdminClient();
    const supabase = createServerSupabaseClient();

    let targetEmail = identifier.trim();

    // If identifier doesn't look like an email, resolve from username
    if (!targetEmail.includes("@")) {
      const cleanUsername = normalizeUsername(targetEmail);

      // Check profiles table for this username
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id, active, must_change_password, username, role")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (profile) {
        if (!profile.active) {
          return NextResponse.json(
            { error: "Account has been deactivated. Please contact your organization administrator." },
            { status: 403 }
          );
        }
        // Retrieve actual registered email for this user from Supabase Auth
        const { data: authUserRecord } = await adminClient.auth.admin.getUserById(profile.id);
        if (authUserRecord?.user?.email) {
          targetEmail = authUserRecord.user.email;
        } else {
          targetEmail = usernameToInternalEmail(cleanUsername);
        }
      } else {
        targetEmail = usernameToInternalEmail(cleanUsername);
      }
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    // Verify profile status
    const { data: userProfile, error: profErr } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profErr || !userProfile) {
      return NextResponse.json(
        { error: "User profile record not found." },
        { status: 401 }
      );
    }

    if (!userProfile.active) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Account has been deactivated. Please contact your administrator." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: authData.session,
      user: {
        id: userProfile.id,
        fullName: userProfile.full_name,
        role: userProfile.role,
        mustChangePassword: !!userProfile.must_change_password,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error?.message || error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
