import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeacherOrAdmin, validateMadrasaAccess } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDriveAdapter } from "@/lib/drive/factory";
import { buildPostFolderPathParts, buildDriveFileName } from "@/lib/drive/path";
import { buildFileAppProperties } from "@/lib/drive/metadata";
import { validateFileMeta, MAX_FILES_PER_POST } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit/limiter";

const FileMetaSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().positive(),
  type: z.string(),
});

const InitiateUploadSchema = z.object({
  madrasaId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional().default(""),
  category: z.enum(["photos", "results", "tests", "resources", "attendance", "activity", "other"]),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  files: z.array(FileMetaSchema).min(1).max(MAX_FILES_PER_POST),
  isDailyMonitoring: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await requireTeacherOrAdmin();

    // Rate limiting: 15 upload starts per 5 minutes per user
    const rateCheck = checkRateLimit(`upload_init_${user.id}`, 15, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many upload requests. Please wait before starting another upload." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = InitiateUploadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { madrasaId, title, description, category, eventDate, files, isDailyMonitoring } = parseResult.data;

    // Validate madrasa assignment
    const accessCheck = await validateMadrasaAccess(profile.id, profile.role, madrasaId);
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.error }, { status: 403 });
    }

    // Validate each file
    for (const file of files) {
      const fileValid = validateFileMeta(file.name, file.type, file.size);
      if (!fileValid.valid) {
        return NextResponse.json({ error: fileValid.error }, { status: 400 });
      }
    }

    const adminClient = createAdminClient();
    const adapter = getDriveAdapter();

    // Fetch madrasa details
    const { data: madrasa, error: madrasaErr } = await adminClient
      .from("madrasas")
      .select("id, name, drive_folder_id")
      .eq("id", madrasaId)
      .single();

    if (madrasaErr || !madrasa) {
      return NextResponse.json({ error: "Madrasa not found" }, { status: 404 });
    }

    // Daily Academic Monitoring updates are auto-approved & public by design
    const initialVisibility = isDailyMonitoring ? "public" : "private";
    const initialApproval = isDailyMonitoring ? "approved" : "pending";
    const initialApprovedAt = isDailyMonitoring ? new Date().toISOString() : null;

    // 1. Create pending post record in Supabase
    const { data: post, error: postErr } = await adminClient
      .from("posts")
      .insert({
        madrasa_id: madrasaId,
        teacher_id: profile.id,
        title,
        description,
        category,
        event_date: eventDate,
        status: "pending",
        visibility: initialVisibility,
        approval_status: initialApproval,
        approved_at: initialApprovedAt,
      })
      .select()
      .single();

    if (postErr || !post) {
      console.error("Error creating post record:", postErr);
      return NextResponse.json({ error: "Failed to create post record" }, { status: 500 });
    }

    // 2. Resolve Drive Folder Hierarchy:
    // Root -> Madrasa -> Year -> Month -> Category -> PostFolder
    const pathParts = buildPostFolderPathParts({
      madrasaName: madrasa.name,
      eventDate,
      category,
      title,
      postId: post.id,
    });

    const rootFolder = await adapter.findOrCreateFolder(pathParts.rootFolderName);
    const madrasaFolder = await adapter.findOrCreateFolder(pathParts.madrasaName, rootFolder.id);
    const yearFolder = await adapter.findOrCreateFolder(pathParts.year, madrasaFolder.id);
    const monthFolder = await adapter.findOrCreateFolder(pathParts.month, yearFolder.id);
    const categoryFolder = await adapter.findOrCreateFolder(pathParts.category, monthFolder.id);
    const postFolder = await adapter.findOrCreateFolder(pathParts.postFolderName, categoryFolder.id);

    // Save drive_folder_id on post
    await adminClient
      .from("posts")
      .update({ drive_folder_id: postFolder.id })
      .eq("id", post.id);

    // 3. Create Resumable Upload Session for each file
    const uploadSessionsResponse = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sequentialFileName = buildDriveFileName(i, file.name);

      const appProps = buildFileAppProperties({
        postId: post.id,
        madrasaId,
        teacherId: profile.id,
        category,
      });

      const session = await adapter.createResumableUploadSession({
        fileName: sequentialFileName,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        parentFolderId: postFolder.id,
        description: `${title} - ${sequentialFileName}`,
        appProperties: appProps,
      });

      // Insert upload_sessions record in Supabase
      const { data: dbSession, error: sessionErr } = await adminClient
        .from("upload_sessions")
        .insert({
          post_id: post.id,
          owner_id: profile.id,
          drive_file_id: session.driveFileId || null,
          expected_size: file.size,
          mime_type: file.type || "application/octet-stream",
          original_name: sequentialFileName,
          status: "pending",
        })
        .select()
        .single();

      if (sessionErr) {
        console.error("Error creating upload_session record:", sessionErr);
      }

      uploadSessionsResponse.push({
        index: i,
        originalName: file.name,
        storedName: sequentialFileName,
        uploadUrl: session.uploadUrl,
        sessionId: dbSession?.id || session.sessionId,
        expectedSize: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      postId: post.id,
      postFolderId: postFolder.id,
      sessions: uploadSessionsResponse,
    });
  } catch (error: any) {
    console.error("API error in initiate upload:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
