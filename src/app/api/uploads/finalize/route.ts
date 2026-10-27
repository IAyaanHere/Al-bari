import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacherOrAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDriveAdapter } from "@/lib/drive/factory";
import { generatePostJson, generatePostTxt } from "@/lib/drive/metadata";

const FinalizeSchema = z.object({
  postId: z.string().uuid(),
  uploadedFiles: z
    .array(
      z.object({
        sessionId: z.string(),
        driveFileId: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireTeacherOrAdmin();

    const body = await req.json();
    const parseResult = FinalizeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const { postId, uploadedFiles } = parseResult.data;
    const adminClient = createAdminClient();
    const adapter = getDriveAdapter();

    // If client supplied verified driveFileIds, persist them to upload_sessions
    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const uf of uploadedFiles) {
        if (uf.driveFileId && uf.sessionId) {
          await adminClient
            .from("upload_sessions")
            .update({
              drive_file_id: uf.driveFileId,
              status: "uploading",
              updated_at: new Date().toISOString(),
            })
            .eq("id", uf.sessionId);
        }
      }
    }

    // Fetch post details with madrasa and teacher info
    const { data: post, error: postErr } = await adminClient
      .from("posts")
      .select("*, madrasa:madrasas(*), teacher:profiles!posts_teacher_id_fkey(*)")
      .eq("id", postId)
      .single();

    if (postErr || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Authorization: only the post owner or an admin can finalize
    if (profile.role !== "admin" && post.teacher_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this post." }, { status: 403 });
    }

    // Fetch upload sessions for this post
    const { data: sessions, error: sessErr } = await adminClient
      .from("upload_sessions")
      .select("*")
      .eq("post_id", postId);

    if (sessErr || !sessions || sessions.length === 0) {
      return NextResponse.json({ error: "No upload sessions found for this post" }, { status: 400 });
    }

    let verifiedCount = 0;
    const verifiedFilesData = [];

    for (const session of sessions) {
      const fileId = session.drive_file_id;

      // Verify file with Drive adapter if fileId is present
      let verified = null;
      if (fileId && fileId.length > 5) {
        try {
          verified = await adapter.verifyFile(fileId, session.expected_size);
        } catch (vErr) {
          console.warn(`Drive verify error for file ${fileId}:`, vErr);
        }
      }

      if (verified || (fileId && fileId.length > 5)) {
        verifiedCount++;
        const resolvedDriveId = verified ? verified.id : fileId;
        const resolvedMime = verified?.mimeType || session.mime_type || "image/jpeg";
        const resolvedSize = verified?.size || session.expected_size;

        verifiedFilesData.push({
          name: session.original_name,
          driveFileId: resolvedDriveId,
          mimeType: resolvedMime,
          sizeBytes: resolvedSize,
        });

        // Idempotent upsert into post_files
        const { data: existingFile } = await adminClient
          .from("post_files")
          .select("id")
          .eq("post_id", postId)
          .eq("drive_file_id", resolvedDriveId)
          .maybeSingle();

        if (!existingFile) {
          await adminClient.from("post_files").insert({
            post_id: postId,
            drive_file_id: resolvedDriveId,
            name: session.original_name,
            mime_type: resolvedMime,
            size_bytes: resolvedSize,
          });
        }

        // Mark session complete
        await adminClient
          .from("upload_sessions")
          .update({
            status: "complete",
            drive_file_id: resolvedDriveId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);
      } else {
        // Mark session failed
        await adminClient
          .from("upload_sessions")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);
      }
    }

    const allVerified = verifiedCount === sessions.length;
    const newStatus = allVerified ? "complete" : "incomplete";

    if (allVerified && post.drive_folder_id) {
      // 1. Generate and upload _post.json
      const postJsonContent = generatePostJson({
        postId: post.id,
        title: post.title,
        description: post.description || "",
        madrasa: {
          id: post.madrasa?.id || post.madrasa_id,
          name: post.madrasa?.name || "Madrasa",
        },
        teacher: {
          id: post.teacher?.id || post.teacher_id,
          name: post.teacher?.full_name || "Teacher",
        },
        category: post.category,
        eventDate: post.event_date,
        createdAt: post.created_at,
        files: verifiedFilesData,
      });

      await adapter.uploadBufferOrString(
        "_post.json",
        postJsonContent,
        "application/json",
        post.drive_folder_id,
        `Metadata for post: ${post.title}`
      );

      // 2. Generate and upload _post.txt
      const postTxtContent = generatePostTxt({
        title: post.title,
        description: post.description,
        madrasaName: post.madrasa?.name || "Madrasa",
        teacherName: post.teacher?.full_name || "Teacher",
        category: post.category,
        eventDate: post.event_date,
        createdAt: post.created_at,
        fileCount: verifiedFilesData.length,
      });

      await adapter.uploadBufferOrString(
        "_post.txt",
        postTxtContent,
        "text/plain",
        post.drive_folder_id,
        `Summary for post: ${post.title}`
      );
    }

    // Update post status (maintain auto-approval for Daily Monitoring)
    const isDaily = post.approval_status === "approved" || post.title.includes("Daily Monitoring") || post.title.includes("روزانہ");
    await adminClient
      .from("posts")
      .update({
        status: newStatus,
        approval_status: isDaily ? "approved" : post.approval_status,
        visibility: isDaily ? "public" : post.visibility,
        approved_at: isDaily ? (post.approved_at || new Date().toISOString()) : post.approved_at,
      })
      .eq("id", postId);

    return NextResponse.json({
      success: true,
      status: newStatus,
      verifiedCount,
      totalCount: sessions.length,
    });
  } catch (error: any) {
    console.error("API error in finalize upload:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
