import Link from "next/link";
import {
  Building2,
  FileCheck2,
  ShieldCheck,
  Upload,
  ArrowRight,
  BookOpen,
  Award,
  Users,
  Search,
  Sparkles,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { PostCard } from "@/components/dashboard/PostCard";
import { Post, Madrasa } from "@/types/database";
import { HomeTeacherPanel } from "@/components/home/HomeTeacherPanel";

export const revalidate = 10; // ISR 10 seconds

async function getLandingData() {
  const adminClient = createAdminClient();

  // 1. Fetch KPI counts
  const { count: postsCount } = await adminClient
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("approval_status", "approved")
    .eq("visibility", "public")
    .is("deleted_at", null);

  const { count: filesCount } = await adminClient
    .from("post_files")
    .select("id", { count: "exact", head: true });

  const { count: madrasasCount } = await adminClient
    .from("madrasas")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  const { count: teachersCount } = await adminClient
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "teacher")
    .eq("active", true);

  // 2. Fetch Recent Approved Public Posts
  const { data: recentPosts } = await adminClient
    .from("posts")
    .select(`
      id, title, description, category, event_date, status, approval_status, visibility, created_at,
      madrasa:madrasas(id, name, city, active),
      teacher:profiles!posts_teacher_id_fkey(id, full_name, username),
      files:post_files(*)
    `)
    .eq("approval_status", "approved")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("event_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(18);

  // 3. Fetch Active Madrasas
  const { data: madrasas } = await adminClient
    .from("madrasas")
    .select("id, name, city, contact_person, active")
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(4);

  return {
    kpi: {
      posts: postsCount || 0,
      files: filesCount || 0,
      madrasas: madrasasCount || 0,
      teachers: teachersCount || 0,
    },
    recentPosts: (recentPosts || []) as unknown as Post[],
    madrasas: (madrasas || []) as Madrasa[],
  };
}

export default async function HomePage() {
  const data = await getLandingData();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Islamic Geometric Pattern Accent */}
      <section className="relative islamic-pattern text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b-4 border-amber-600 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-medium shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Islamic Education Foundation • Central Records Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Al Bari Organization Hub
          </h1>

          <p className="text-emerald-100/90 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Centralized archive preserving examination results, attendance registries, academic curriculum resources, and institutional activities across all affiliated madrasas and schools.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/daily-monitoring">
              <Button variant="gold" size="lg" className="w-full sm:w-auto px-6 font-black gap-2 shadow-md bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300">
                <Camera className="w-5 h-5 text-slate-950" />
                <span>Upload Daily Monitoring</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6 font-semibold gap-2 bg-emerald-800 hover:bg-emerald-700 text-white border border-emerald-600/50">
                <Search className="w-4 h-4 text-emerald-200" />
                <span>Explore Public Records</span>
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6 font-semibold gap-2">
                <Upload className="w-4 h-4" />
                <span>Teacher / Admin Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Faculty Action Center (Teacher / Admin Shortcut Panel) */}
      <HomeTeacherPanel />

      {/* KPI Stats Ribbon */}
      <section className="bg-white border-b border-slate-200/80 shadow-2xs py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{data.kpi.posts}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Verified Records</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-700">{data.kpi.files}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Files Archived</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">{data.kpi.madrasas}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Active Madrasas</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
            <p className="text-2xl sm:text-3xl font-extrabold text-sky-700">{data.kpi.teachers}</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Educators Registered</p>
          </div>
        </div>
      </section>

      {/* Recent Approved Educational Records */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Recent Approved Educational Records
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Publicly approved examinations, academic tests, activity registers, and curriculum files.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold text-sm"
          >
            <span>View All Records</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {data.recentPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No educational records published yet.</p>
            <p className="text-xs mt-1">Records approved by administrators will appear here for public viewing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      {/* Affiliated Madrasas Directory Preview */}
      <section className="bg-emerald-50/50 border-t border-slate-200/80 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-950">
                Affiliated Madrasas & Educational Branches
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Explore individual madrasa profiles, academic timelines, and archived materials.
              </p>
            </div>
            <Link
              href="/madrasas"
              className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold text-sm"
            >
              <span>View All Branches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.madrasas.map((madrasa) => (
              <Link
                key={madrasa.id}
                href={`/madrasas/${madrasa.id}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-emerald-900 transition-colors">
                  {madrasa.name}
                </h3>
                <p className="text-xs text-slate-500">{madrasa.city || "Branch"}</p>
                {madrasa.contact_person && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    In-Charge: {madrasa.contact_person}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
