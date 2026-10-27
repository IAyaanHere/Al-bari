import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    const madrasaId = searchParams.get("madrasaId");
    const teacherId = searchParams.get("teacherId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // upload status: complete, pending, incomplete
    const approvalStatus = searchParams.get("approvalStatus"); // approved, pending, rejected
    const myUploadsOnly = searchParams.get("myUploads") === "true";

    const currentProfile = await getCurrentProfile();
    const isAdmin = currentProfile?.role === "admin";
    const isTeacher = currentProfile?.role === "teacher";

    const adminClient = createAdminClient();

    let query = adminClient
      .from("posts")
      .select(
        `
        id, madrasa_id, teacher_id, title, description, category, event_date,
        drive_folder_id, status, visibility, approval_status, created_at, deleted_at,
        madrasa:madrasas(id, name, city, active),
        teacher:profiles!posts_teacher_id_fkey(id, full_name, username),
        files:post_files(id, name, mime_type, size_bytes, drive_file_id)
      `,
        { count: "exact" }
      );

    // Soft deletion filter: do not show deleted posts
    const showDeleted = searchParams.get("showDeleted") === "true";
    if (!showDeleted) {
      query = query.is("deleted_at", null);
    }

    // Role-based visibility enforcement
    if (myUploadsOnly && currentProfile) {
      query = query.eq("teacher_id", currentProfile.id);
    } else if (!isAdmin) {
      if (isTeacher) {
        // Teacher sees public approved posts OR their own posts
        query = query.or(
          `and(approval_status.eq.approved,visibility.eq.public),teacher_id.eq.${currentProfile.id}`
        );
      } else {
        // Public viewer: only approved, public posts
        query = query
          .eq("approval_status", "approved")
          .eq("visibility", "public");
      }
    }

    // Filters
    if (madrasaId && madrasaId !== "all") {
      query = query.eq("madrasa_id", madrasaId);
    }
    if (teacherId && teacherId !== "all") {
      query = query.eq("teacher_id", teacherId);
    }
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (approvalStatus && approvalStatus !== "all" && isAdmin) {
      query = query.eq("approval_status", approvalStatus);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Order & pagination
    query = query
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: posts, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("Posts query error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
