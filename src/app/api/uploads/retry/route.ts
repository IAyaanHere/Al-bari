import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacherOrAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDriveAdapter } from "@/lib/drive/factory";
import { buildFileAppProperties } from "@/lib/drive/metadata";

const RetrySchema = z.object({
  postId: z.string().uuid(),
  sessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { profile } = await requireTeacherOrAdmin();

    const body = await req.json();
    const parseResult = RetrySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid retry request" }, { status: 400 });
    }

    const { postId, sessionId } = parseResult.data;
    const adminClient = createAdminClient();
    const adapter = getDriveAdapter();

    // Check post ownership
    const { data: post, error: postErr } = await adminClient
      .from("posts")
      .select("id, teacher_id, madrasa_id, category, drive_folder_id, title")
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (profile.role !== "admin" && post.teacher_id !== profile.id) {
      return NextResponse.json({ error: "Unauthorized access to this post" }, { status: 403 });
    }

    // Check upload session
    const { data: session, error: sessErr } = await adminClient
      .from("upload_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("post_id", postId)
      .single();

    if (sessErr || !session) {
      return NextResponse.json({ error: "Upload session not found" }, { status: 404 });
    }

    if (!post.drive_folder_id) {
      return NextResponse.json({ error: "Post folder not initialized" }, { status: 400 });
    }

    // Create a fresh resumable session
    const appProps = buildFileAppProperties({
      postId: post.id,
      madrasaId: post.madrasa_id,
      teacherId: post.teacher_id,
      category: post.category,
    });

    const newResumable = await adapter.createResumableUploadSession({
      fileName: session.original_name,
      mimeType: session.mime_type || "application/octet-stream",
      fileSize: session.expected_size,
      parentFolderId: post.drive_folder_id,
      description: `${post.title} - ${session.original_name}`,
      appProperties: appProps,
    });

    // Update session record
    await adminClient
      .from("upload_sessions")
      .update({
        drive_file_id: newResumable.driveFileId || null,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      uploadUrl: newResumable.uploadUrl,
      sessionId: session.id,
      fileName: session.original_name,
      expectedSize: session.expected_size,
    });
  } catch (error: any) {
    console.error("API error in retry upload:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
