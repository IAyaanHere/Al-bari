import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTemporaryPassword } from "@/lib/auth/passwords";

const UpdateUserSchema = z.object({
  active: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
  assignedMadrasaIds: z.array(z.string().uuid()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const userId = params.id;

    const body = await req.json();
    const parse = UpdateUserSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Prevent admin from deactivating themselves
    if (adminProfile.id === userId && parse.data.active === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own administrative account." },
        { status: 400 }
      );
    }

    let generatedPassword: string | null = null;

    // 1. Password reset
    if (parse.data.resetPassword) {
      generatedPassword = generateTemporaryPassword(12);
      const { error: resetErr } = await adminClient.auth.admin.updateUserById(userId, {
        password: generatedPassword,
      });

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 500 });
      }

      await adminClient
        .from("profiles")
        .update({ must_change_password: true })
        .eq("id", userId);
    }

    // 2. Active status toggle
    if (typeof parse.data.active === "boolean") {
      await adminClient
        .from("profiles")
        .update({ active: parse.data.active })
        .eq("id", userId);
    }

    // 3. Update assigned madrasas
    if (parse.data.assignedMadrasaIds) {
      // Remove old assignments
      await adminClient.from("teacher_madrasas").delete().eq("teacher_id", userId);

      // Insert new assignments
      const rows = parse.data.assignedMadrasaIds.map((madrasaId) => ({
        teacher_id: userId,
        madrasa_id: madrasaId,
      }));

      if (rows.length > 0) {
        await adminClient.from("teacher_madrasas").insert(rows);
      }
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      actor_id: adminProfile.id,
      action: "UPDATE_USER",
      target_type: "profile",
      target_id: userId,
      details: {
        active: parse.data.active,
        passwordReset: !!parse.data.resetPassword,
        assignedMadrasas: parse.data.assignedMadrasaIds,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      newTemporaryPassword: generatedPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Forbidden" }, { status: 403 });
  }
}
