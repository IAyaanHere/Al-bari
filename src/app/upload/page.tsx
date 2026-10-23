"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, Building2 } from "lucide-react";
import { DirectDriveUploader } from "@/components/upload/DirectDriveUploader";
import { Madrasa } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";

export default function UploadPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [madrasas, setMadrasas] = React.useState<Madrasa[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [unauthorized, setUnauthorized] = React.useState<boolean>(false);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Check user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, active")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.active) {
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }

      if (profile.role === "admin") {
        // Admins can upload to any active madrasa
        const { data: allMadrasas } = await supabase
          .from("madrasas")
          .select("*")
          .eq("active", true)
          .order("name");
        setMadrasas(allMadrasas || []);
      } else {
        // Teachers see only their assigned active madrasas
        const { data: assigned } = await supabase
          .from("teacher_madrasas")
          .select("madrasa:madrasas(*)")
          .eq("teacher_id", user.id);

        const activeAssigned = (assigned || [])
          .map((item: any) => item.madrasa)
          .filter((m: any) => m && m.active);

        setMadrasas(activeAssigned);
      }

      setIsLoading(false);
    });
  }, [router]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <p className="text-sm font-semibold">Validating educator assignments...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 text-center">
        <p className="text-base font-bold text-rose-800 mb-1">Access Restricted</p>
        <p className="text-xs text-slate-500 mb-4">
          Only authorized active educators and administrators may publish educational records.
        </p>
      </div>
    );
  }

  if (madrasas.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-amber-200 text-center shadow-xs">
        <Building2 className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">No Active Madrasas Assigned</h2>
        <p className="text-xs text-slate-500 mb-6">
          You currently have no active madrasas assigned to your educator profile. Please contact an administrator to assign your institution.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Zero-Byte Serverless Upload Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.upload.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          {t.upload.subtitle}
        </p>
      </div>

      <DirectDriveUploader
        madrasas={madrasas}
        onSuccess={(postId) => router.push(`/posts/${postId}`)}
      />
    </div>
  );
}
