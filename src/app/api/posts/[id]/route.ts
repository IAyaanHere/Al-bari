import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { canViewPost } from "@/lib/auth/session";

const UpdatePostSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminClient = createAdminClient();
    const postId = params.id;

    const { data: post, error } = await adminClient
      .from("posts")
      .select(`
        *,
        madrasa:madrasas(*),
        teacher:profiles!posts_teacher_id_fkey(id, full_name, username),
        files:post_files(*)
      `)
      .eq("id", postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const currentProfile = await getCurrentProfile();
    const isAllowed = canViewPost(post, currentProfile);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Access to this educational record is restricted" },
        { status: 403 }
      );
    }

    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = params.id;
    const body = await req.json();
    const parse = UpdatePostSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: post } = await adminClient
      .from("posts")
      .select("id, teacher_id, status")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Only post owner or admin can edit
    if (currentProfile.role !== "admin" && post.teacher_id !== currentProfile.id) {
      return NextResponse.json({ error: "Forbidden: Not owner" }, { status: 403 });
    }

    const updateData: Record<string, any> = {};
    if (parse.data.title !== undefined) updateData.title = parse.data.title.trim();
    if (parse.data.description !== undefined) updateData.description = parse.data.description.trim();
    if (parse.data.eventDate !== undefined) updateData.event_date = parse.data.eventDate;

    const { data: updated, error } = await adminClient
      .from("posts")
      .update(updateData)
      .eq("id", postId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const postId = params.id;
    const adminClient = createAdminClient();

    const { data: post } = await adminClient
      .from("posts")
      .select("id, teacher_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    // Strict requirement: Only Head Administrator can delete records
    if (currentProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only Head Administrator can delete records." },
        { status: 403 }
      );
    }

    // Soft delete: sets deleted_at to current timestamp
    const { error } = await adminClient
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", postId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      actor_id: currentProfile.id,
      action: "SOFT_DELETE_POST",
      target_type: "post",
      target_id: postId,
    });

    return NextResponse.json({ success: true, message: "Record soft-deleted safely." });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
