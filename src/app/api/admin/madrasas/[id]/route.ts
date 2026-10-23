import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const UpdateMadrasaSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  city: z.string().max(100).optional(),
  contactPerson: z.string().max(100).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const madrasaId = params.id;

    const body = await req.json();
    const parse = UpdateMadrasaSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const updateData: Record<string, any> = {};
    if (parse.data.name !== undefined) updateData.name = parse.data.name.trim();
    if (parse.data.city !== undefined) updateData.city = parse.data.city.trim();
    if (parse.data.contactPerson !== undefined) updateData.contact_person = parse.data.contactPerson.trim();
    if (parse.data.active !== undefined) updateData.active = parse.data.active;

    const { data: updated, error } = await adminClient
      .from("madrasas")
      .update(updateData)
      .eq("id", madrasaId)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || "Madrasa not found" }, { status: 500 });
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      actor_id: adminProfile.id,
      action: "UPDATE_MADRASA",
      target_type: "madrasa",
      target_id: madrasaId,
      details: updateData,
    });

    return NextResponse.json({ success: true, madrasa: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Forbidden" }, { status: 403 });
  }
}
