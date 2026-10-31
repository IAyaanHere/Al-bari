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

    const isPublicPost =
      postFile.post.visibility === "public" &&
      postFile.post.approval_status === "approved" &&
      !postFile.post.deleted_at;

    // 2. Authorization check: skip auth roundtrip if post is already public
    if (!isPublicPost) {
      const currentProfile = await getCurrentProfile();
      const isAllowed = canViewPost(postFile.post, currentProfile);

      if (!isAllowed) {
        return new NextResponse("Forbidden: Access to this private educational record is restricted", {
          status: 403,
        });
      }
    }

    // 3. Ultra-fast CDN Thumbnail Fetch (Pre-compressed WebP/JPEG from Google edge)
    // This reduces load time from seconds to ~40ms and converts HEIC & video keyframes seamlessly.
    try {
      const googleThumbUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w800`;
      const thumbRes = await fetch(googleThumbUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (thumbRes.ok && thumbRes.headers.get("content-type")?.startsWith("image/")) {
        const thumbBuffer = await thumbRes.arrayBuffer();
        const cacheHeader = isPublicPost
          ? "public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000, immutable"
          : "private, max-age=3600";

        return new NextResponse(thumbBuffer, {
          status: 200,
          headers: {
            "Content-Type": thumbRes.headers.get("content-type") || "image/jpeg",
            "Content-Length": thumbBuffer.byteLength.toString(),
            "Cache-Control": cacheHeader,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
    } catch (thumbErr) {
      console.warn("Direct Google thumbnail fetch failed, falling back to full stream:", thumbErr);
    }

    // 4. Fallback: Stream file contents through adapter with known mime type from DB
    const adapter = getDriveAdapter();
    const { stream, mimeType, size } = await adapter.getFileStream(
      driveFileId,
      postFile.mime_type,
      postFile.size_bytes
    );

    // Convert node readable stream to web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    const cacheHeader = isPublicPost
      ? "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800, immutable"
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
