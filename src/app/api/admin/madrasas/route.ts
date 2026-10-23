import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDriveAdapter } from "@/lib/drive/factory";
import { sanitizeFilename } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CreateMadrasaSchema = z.object({
  name: z.string().min(2).max(150),
  city: z.string().max(100).optional().default(""),
  contactPerson: z.string().max(100).optional().default(""),
});

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data: madrasas, error } = await adminClient
      .from("madrasas")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ madrasas });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const body = await req.json();

    const parse = CreateMadrasaSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Validation error", details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { name, city, contactPerson } = parse.data;
    const adminClient = createAdminClient();
    const adapter = getDriveAdapter();

    // Check duplicate name
    const { data: existing } = await adminClient
      .from("madrasas")
      .select("id")
      .ilike("name", name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Madrasa with name "${name}" already exists.` },
        { status: 409 }
      );
    }

    // 1. Create or find Root Drive Folder
    const rootFolder = await adapter.findOrCreateFolder("Al Bari Organization Data");

    // 2. Create Madrasa Drive Folder safely
    const cleanMadrasaFolderName = sanitizeFilename(name.trim());
    const madrasaFolder = await adapter.findOrCreateFolder(
      cleanMadrasaFolderName,
      rootFolder.id
    );

    // 3. Insert madrasa record in database
    const { data: madrasa, error: insertError } = await adminClient
      .from("madrasas")
      .insert({
        name: name.trim(),
        city: city.trim() || null,
        contact_person: contactPerson.trim() || null,
        drive_folder_id: madrasaFolder.id,
        active: true,
      })
      .select()
      .single();

    if (insertError || !madrasa) {
      return NextResponse.json(
        { error: `Failed to save madrasa: ${insertError?.message}` },
        { status: 500 }
      );
    }

    // 4. Audit Log
    await adminClient.from("audit_logs").insert({
      actor_id: adminProfile.id,
      action: "CREATE_MADRASA",
      target_type: "madrasa",
      target_id: madrasa.id,
      details: {
        name: madrasa.name,
        city: madrasa.city,
        driveFolderId: madrasaFolder.id,
      },
    });

    return NextResponse.json({
      success: true,
      madrasa,
    });
  } catch (error: any) {
    console.error("Madrasa creation error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
