import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeUsername,
  isValidUsername,
  usernameToInternalEmail,
} from "@/lib/auth/username";
import { generateTemporaryPassword } from "@/lib/auth/passwords";

export const dynamic = "force-dynamic";

const RegisterTeacherSchema = z.object({
  fullName: z.string().min(2).max(100),
  username: z.string().min(3).max(30),
  temporaryPassword: z.string().min(8).optional(),
  assignedMadrasaIds: z.array(z.string().uuid()).min(1, "Assign at least one madrasa"),
});

export async function GET() {
  try {
    await requireAdmin();
    const adminClient = createAdminClient();

    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select(`
        id, full_name, username, role, active, must_change_password, created_at,
        teacher_madrasas(madrasa:madrasas(id, name, city))
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profiles });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const body = await req.json();

    const parse = RegisterTeacherSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation error", details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { fullName, username, temporaryPassword, assignedMadrasaIds } = parse.data;
    const cleanUsername = normalizeUsername(username);

    if (!isValidUsername(cleanUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-30 lowercase alphanumeric characters, dots, or underscores." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check username uniqueness
    const { data: existingUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: `Username "${cleanUsername}" is already taken.` },
        { status: 409 }
      );
    }

    const finalPassword = temporaryPassword || generateTemporaryPassword(12);
    const internalEmail = usernameToInternalEmail(cleanUsername);

    // 1. Create Supabase Auth User
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: internalEmail,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: cleanUsername,
        role: "teacher",
      },
    });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: `Auth registration failed: ${authError?.message}` },
        { status: 500 }
      );
    }

    const newUserId = authUser.user.id;

    // 2. Create Profile Record
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUserId,
      full_name: fullName,
      username: cleanUsername,
      role: "teacher",
      active: true,
      must_change_password: true,
    });

    if (profileError) {
      // Rollback auth user
      await adminClient.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: `Profile creation failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 3. Assign Madrasas
    const assignmentRows = assignedMadrasaIds.map((madrasaId) => ({
      teacher_id: newUserId,
      madrasa_id: madrasaId,
    }));

    await adminClient.from("teacher_madrasas").insert(assignmentRows);

    // 4. Record Audit Log
    await adminClient.from("audit_logs").insert({
      actor_id: adminProfile.id,
      action: "REGISTER_TEACHER",
      target_type: "profile",
      target_id: newUserId,
      details: {
        username: cleanUsername,
        fullName,
        assignedMadrasaCount: assignedMadrasaIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Teacher account registered successfully.",
      credentials: {
        fullName,
        username: cleanUsername,
        temporaryPassword: finalPassword,
        assignedMadrasaIds,
      },
    });
  } catch (error: any) {
    console.error("Teacher registration error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
