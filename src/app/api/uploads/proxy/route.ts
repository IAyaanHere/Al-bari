import { NextRequest, NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    await requireTeacherOrAdmin();

    const uploadUrl = req.nextUrl.searchParams.get("uploadUrl");
    const sessionId = req.nextUrl.searchParams.get("sessionId");

    if (!uploadUrl || !uploadUrl.startsWith("https://www.googleapis.com/")) {
      return NextResponse.json({ error: "Invalid upload URL" }, { status: 400 });
    }

    const contentRange = req.headers.get("content-range");
    const contentType = req.headers.get("content-type") || "application/octet-stream";

    const bodyBuffer = await req.arrayBuffer();

    const forwardHeaders: Record<string, string> = {
      "Content-Type": contentType,
    };
    if (contentRange) {
      forwardHeaders["Content-Range"] = contentRange;
    }

    const driveRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: forwardHeaders,
      body: bodyBuffer,
    });

    const responseHeaders = new Headers();
    const driveRange = driveRes.headers.get("range");
    if (driveRange) {
      responseHeaders.set("Range", driveRange);
    }

    // If upload complete (200/201), extract driveFileId and save to DB
    if (driveRes.status === 200 || driveRes.status === 201) {
      const driveData = await driveRes.json().catch(() => null);
      const driveFileId = driveData?.id;

      if (driveFileId && sessionId) {
        try {
          const adminClient = createAdminClient();
          await adminClient
            .from("upload_sessions")
            .update({
              drive_file_id: driveFileId,
              status: "uploading",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sessionId);
        } catch (dbErr) {
          console.warn("Failed to update upload_session with driveFileId:", dbErr);
        }
      }

      return new NextResponse(JSON.stringify(driveData || {}), {
        status: driveRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For 308 (resume incomplete), forward as-is
    const driveBody = await driveRes.text();
    return new NextResponse(driveBody, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Proxy chunk upload error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
