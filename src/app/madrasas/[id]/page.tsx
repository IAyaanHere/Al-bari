import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin, User, ArrowLeft, Calendar, FileText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { MadrasaPostsSection } from "@/components/madrasas/MadrasaPostsSection";
import { Post } from "@/types/database";

export const revalidate = 60;

async function getMadrasaDetails(id: string) {
  const adminClient = createAdminClient();

  const { data: madrasa } = await adminClient
    .from("madrasas")
    .select("*")
    .eq("id", id)
    .single();

  if (!madrasa) return null;

  const { data: posts } = await adminClient
    .from("posts")
    .select(`
      id, title, description, category, event_date, status, approval_status, visibility, created_at,
      madrasa:madrasas(*),
      teacher:profiles!posts_teacher_id_fkey(id, full_name, username),
      files:post_files(*)
    `)
    .eq("madrasa_id", id)
    .eq("approval_status", "approved")
    .eq("visibility", "public")
    .is("deleted_at", null)
    .order("event_date", { ascending: false });

  return {
    madrasa,
    posts: (posts || []) as unknown as Post[],
  };
}

export default async function MadrasaDetailPage({ params }: { params: { id: string } }) {
  const data = await getMadrasaDetails(params.id);
  if (!data) notFound();

  const { madrasa, posts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <Link
        href="/madrasas"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Madrasas</span>
      </Link>

      {/* Madrasa Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              {madrasa.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
              {madrasa.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>{madrasa.city}</span>
                </div>
              )}
              {madrasa.contact_person && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>In-Charge: {madrasa.contact_person}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Educational Archives & Category Posts Section */}
      <MadrasaPostsSection posts={posts} madrasaName={madrasa.name} />
    </div>
  );
}
