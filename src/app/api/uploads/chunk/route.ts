import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, PUT, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Content-Range, Content-Length, X-Upload-Content-Type, Range",
    },
  });
}

export async function PUT(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const fileId = searchParams.get("fileId") || `mock_drive_file_${Date.now()}`;
    const expectedSize = parseInt(searchParams.get("expectedSize") || "0", 10);
    const fileName = searchParams.get("fileName") || "file";

    const contentRange = req.headers.get("content-range");
    const rangeHeader = req.headers.get("range");

    // 1. Handling offset check: Content-Range: bytes */TOTAL
    if (contentRange && contentRange.startsWith("bytes */")) {
      return new NextResponse(null, {
        status: 308,
        headers: {
          "Range": `bytes=0-${Math.max(0, expectedSize - 1)}`,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2. Parse chunk range: Content-Range: bytes START-END/TOTAL
    let isComplete = false;
    let endByte = expectedSize - 1;

    if (contentRange) {
      const match = contentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+|\*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        const total = match[3] !== "*" ? parseInt(match[3], 10) : expectedSize;
        endByte = end;
        if (end + 1 >= total) {
          isComplete = true;
        }
      } else {
        isComplete = true;
      }
    } else {
      isComplete = true;
    }

    // Read body buffer to consume stream
    await req.arrayBuffer();

    if (!isComplete) {
      // Incomplete chunk - respond with HTTP 308 Resume Incomplete
      return new NextResponse(null, {
        status: 308,
        headers: {
          "Range": `bytes=0-${endByte}`,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Final chunk complete - update upload_sessions if sessionId is a valid UUID
    try {
      const adminClient = createAdminClient();
      if (sessionId && sessionId.length > 20) {
        // Strip mock prefix if present
        const cleanId = sessionId.replace(/^mock_session_/, "");
        await adminClient
          .from("upload_sessions")
          .update({
            status: "uploading",
            drive_file_id: fileId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cleanId);
      }
    } catch {
      // Ignore DB errors during mock chunk updates
    }

    // Return Google Drive file metadata structure
    return NextResponse.json(
      {
        id: fileId,
        name: fileName,
        mimeType: "application/octet-stream",
        size: expectedSize.toString(),
        appProperties: { mock: "true" },
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in mock chunk upload:", error?.message || error);
    return NextResponse.json(
      { error: "Chunk upload simulation error" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
