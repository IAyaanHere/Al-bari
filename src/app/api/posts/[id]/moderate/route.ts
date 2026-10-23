import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const ModeratePostSchema = z.object({
  approvalStatus: z.enum(["pending", "approved", "rejected"]),
  visibility: z.enum(["public", "private"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { profile: adminProfile } = await requireAdmin();
    const postId = params.id;

    const body = await req.json();
    const parse = ModeratePostSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
    }

    const { approvalStatus, visibility } = parse.data;
    const adminClient = createAdminClient();

    const updateData: Record<string, any> = {
      approval_status: approvalStatus,
      approved_by: adminProfile.id,
      approved_at: approvalStatus === "approved" ? new Date().toISOString() : null,
    };

    if (visibility) {
      updateData.visibility = visibility;
    } else if (approvalStatus === "approved") {
      // By default approving promotes to public unless explicitly set
      updateData.visibility = "public";
    }

    const { data: updatedPost, error } = await adminClient
      .from("posts")
      .update(updateData)
      .eq("id", postId)
      .select()
      .single();

    if (error || !updatedPost) {
      return NextResponse.json({ error: error?.message || "Failed to update post" }, { status: 500 });
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      actor_id: adminProfile.id,
      action: "MODERATE_POST",
      target_type: "post",
      target_id: postId,
      details: {
        approvalStatus,
        visibility: updateData.visibility,
      },
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Forbidden" }, { status: 403 });
  }
}
