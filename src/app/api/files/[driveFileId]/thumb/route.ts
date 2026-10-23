import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDriveAdapter } from "@/lib/drive/factory";
import { canViewPost } from "@/lib/auth/session";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { driveFileId: string } }
) {
  try {
    const driveFileId = params.driveFileId;
    if (!driveFileId || driveFileId.length < 3) {
      return new NextResponse("Invalid file identifier", { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Validate drive_file_id exists in our database post_files table
    const { data: postFile, error: fileErr } = await adminClient
      .from("post_files")
      .select("*, post:posts(*, madrasa:madrasas(*))")
      .eq("drive_file_id", driveFileId)
      .single();

    if (fileErr || !postFile || !postFile.post) {
      return new NextResponse("File record not found or unauthorized", { status: 404 });
    }

    // 2. Authorization check
    const currentProfile = await getCurrentProfile();
    const isAllowed = canViewPost(postFile.post, currentProfile);

    if (!isAllowed) {
      return new NextResponse("Forbidden: Access to this private educational record is restricted", {
        status: 403,
      });
    }

    // 3. Stream file contents through adapter
    const adapter = getDriveAdapter();
    const { stream, mimeType, size } = await adapter.getFileStream(driveFileId);

    // Convert node readable stream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    const isPublicPost = postFile.post.visibility === "public" && postFile.post.approval_status === "approved";
    const cacheHeader = isPublicPost
      ? "public, max-age=3600, s-maxage=3600"
      : "private, no-cache, no-store, must-revalidate";

    const headers: Record<string, string> = {
      "Content-Type": mimeType || "application/octet-stream",
      "Cache-Control": cacheHeader,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="${encodeURIComponent(postFile.name)}"`,
    };

    if (size) {
      headers["Content-Length"] = size.toString();
    }

    return new NextResponse(webStream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error streaming file:", error?.message || error);
    return new NextResponse("Error streaming file", { status: 500 });
  }
}
