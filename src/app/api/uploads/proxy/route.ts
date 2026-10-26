import { NextRequest, NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/auth/session";

export const maxDuration = 60; // Allow sufficient time for chunk upload
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  try {
    await requireTeacherOrAdmin();

    const uploadUrl = req.nextUrl.searchParams.get("uploadUrl");
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

    const driveText = await driveRes.text();
    let driveJson = null;
    try {
      driveJson = JSON.parse(driveText);
    } catch {
      // Not JSON
    }

    const responseHeaders = new Headers();
    const driveRange = driveRes.headers.get("range");
    if (driveRange) {
      responseHeaders.set("Range", driveRange);
    }

    return new NextResponse(driveText, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Proxy chunk upload error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
