import Link from "next/link";
import { Building2, MapPin, User, ArrowRight } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Madrasa } from "@/types/database";

export const revalidate = 60;

async function getMadrasas() {
  const adminClient = createAdminClient();
  const { data: madrasas } = await adminClient
    .from("madrasas")
    .select(`
      id, name, city, contact_person, active, created_at,
      posts:posts(id)
    `)
    .eq("active", true)
    .order("name", { ascending: true });

  return (madrasas || []) as any[];
}

export default async function MadrasasDirectoryPage() {
  const madrasas = await getMadrasas();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Affiliated Madrasas & Educational Centers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Comprehensive directory of Islamic education foundation branches, schools, and madrasas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {madrasas.map((madrasa) => (
          <Link
            key={madrasa.id}
            href={`/madrasas/${madrasa.id}`}
            className="group bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors mb-2">
                {madrasa.name}
              </h2>

              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                {madrasa.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{madrasa.city}</span>
                  </div>
                )}
                {madrasa.contact_person && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>In-Charge: {madrasa.contact_person}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>{madrasa.posts?.length || 0} Archived Records</span>
              <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>View Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
