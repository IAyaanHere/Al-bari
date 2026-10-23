import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const madrasaId = searchParams.get("madrasaId");
    const currentProfile = await getCurrentProfile();
    const isAdmin = currentProfile?.role === "admin";
    const adminClient = createAdminClient();

    // 1. Base counts & filters
    let postsQuery = adminClient
      .from("posts")
      .select("id, category, event_date, status, approval_status, visibility, madrasa_id, teacher_id, created_at, deleted_at, files:post_files(id)");

    if (!isAdmin) {
      postsQuery = postsQuery
        .is("deleted_at", null)
        .eq("approval_status", "approved")
        .eq("visibility", "public");
    }

    if (madrasaId && madrasaId !== "all") {
      postsQuery = postsQuery.eq("madrasa_id", madrasaId);
    }

    const { data: rawPosts, error: postErr } = await postsQuery;
    if (postErr) {
      return NextResponse.json({ error: postErr.message }, { status: 500 });
    }

    const posts = rawPosts || [];

    // 2. Madrasas & Teachers count
    const { count: activeMadrasasCount } = await adminClient
      .from("madrasas")
      .select("id", { count: "exact", head: true })
      .eq("active", true);

    const { count: activeTeachersCount } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "teacher")
      .eq("active", true);

    // 3. KPI Calculations
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let postsThisMonth = 0;
    let incompleteUploads = 0;
    let totalFiles = 0;

    const monthlyMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const madrasaMap: Record<string, number> = {};
    const teacherMap: Record<string, number> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthlyMap[key] = 0;
    }

    for (const p of posts) {
      const filesCount = p.files ? p.files.length : 0;
      totalFiles += filesCount;

      if (p.status === "incomplete") {
        incompleteUploads++;
      }

      // Check this month
      const pDate = new Date(p.created_at);
      if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
        postsThisMonth++;
      }

      // Monthly aggregation
      const monthKey = pDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (monthlyMap[monthKey] !== undefined) {
        monthlyMap[monthKey]++;
      }

      // Category aggregation
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;

      // Madrasa aggregation
      if (p.madrasa_id) {
        madrasaMap[p.madrasa_id] = (madrasaMap[p.madrasa_id] || 0) + 1;
      }

      // Teacher aggregation
      if (p.teacher_id) {
        teacherMap[p.teacher_id] = (teacherMap[p.teacher_id] || 0) + 1;
      }
    }

    // Format monthly chart data
    const monthlyUploads = Object.entries(monthlyMap).map(([month, count]) => ({
      month,
      count,
    }));

    // Format category chart data
    const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    }));

    // Resolve madrasa names for madrasa breakdown
    const { data: allMadrasas } = await adminClient.from("madrasas").select("id, name");
    const madrasaNameMap = new Map((allMadrasas || []).map((m) => [m.id, m.name]));

    const madrasaBreakdown = Object.entries(madrasaMap).map(([id, count]) => ({
      name: madrasaNameMap.get(id) || "Other",
      count,
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Resolve teacher names
    const { data: allTeachers } = await adminClient.from("profiles").select("id, full_name");
    const teacherNameMap = new Map((allTeachers || []).map((t) => [t.id, t.full_name]));

    const topTeachers = Object.entries(teacherMap).map(([id, count]) => ({
      name: teacherNameMap.get(id) || "Teacher",
      count,
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    return NextResponse.json({
      kpi: {
        totalPosts: posts.length,
        totalFiles,
        activeMadrasas: activeMadrasasCount || 0,
        activeTeachers: activeTeachersCount || 0,
        postsThisMonth,
        incompleteUploads,
      },
      charts: {
        monthlyUploads,
        categoryDistribution,
        madrasaBreakdown,
        topTeachers,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
