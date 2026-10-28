"use client";

import * as React from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  FolderArchive,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  School,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function HomeTeacherPanel() {
  const [user, setUser] = React.useState<{
    id: string;
    role: string;
    full_name: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data } = await supabase
            .from("profiles")
            .select("id, role, full_name")
            .eq("id", authUser.id)
            .single();
          if (data) {
            setUser(data);
            return;
          }
        }

        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
            return;
          }
        }
        setUser(null);
      } catch (err) {
        console.error("HomeTeacherPanel auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return null; // Don't cause layout flicker while checking auth
  }

  const isTeacherOrAdmin = user && (user.role === "teacher" || user.role === "admin");

  if (!isTeacherOrAdmin) {
    // Guest view: Show helpful shortcut for teachers to sign in and upload
    return (
      <section className="bg-emerald-950/5 border-b border-emerald-900/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                Are you an affiliated Madrasa Teacher?
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Upload today&apos;s student notebook &amp; blackboard monitoring directly to the public dashboard.
              </p>
            </div>
          </div>
          <Link href="/login" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="sm" className="w-full sm:w-auto gap-1.5 text-xs font-bold">
              <LogIn className="w-3.5 h-3.5" />
              <span>Teacher Sign In to Upload</span>
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  // Teacher / Admin Logged In: Dedicated Faculty Action Center
  return (
    <section className="bg-gradient-to-b from-emerald-900 to-emerald-950 text-white py-6 px-4 sm:px-6 lg:px-8 border-b-2 border-amber-500/40 shadow-inner">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950">
              {user.role === "admin" ? "Admin Faculty Center" : "Teacher Action Center"}
            </span>
            <span className="text-xs text-emerald-200">
              Welcome, <strong className="text-white font-bold">{user.full_name}</strong>
            </span>
          </div>
          <span className="text-[11px] text-emerald-300/80 hidden sm:inline">
            Direct Auto-Publish to Dashboard Active
          </span>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* PRIMARY: Daily Monitoring Shortcut Card */}
          <Link
            href="/daily-monitoring"
            className="md:col-span-2 group p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-300 active:scale-[0.99]"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                    Daily Academic Monitoring Upload
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-950 text-amber-300">
                    Shortcut
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-800 mt-0.5 leading-snug">
                  Upload today&apos;s Student Notebook &amp; Blackboard photos. Auto-published directly to public dashboard in &lt;5 seconds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 text-white font-bold text-xs shrink-0 self-stretch sm:self-auto justify-center group-hover:bg-slate-900 transition-colors shadow-sm">
              <span>Upload Now</span>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* SECONDARY TOOLS: General Upload & Archives */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5">
            <Link
              href="/upload"
              className="p-3 sm:p-3.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-700 text-white shadow-2xs transition-colors flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">General Upload</p>
                <p className="text-[10px] text-emerald-200 truncate">Exams, Results, Events</p>
              </div>
            </Link>

            <Link
              href="/my-uploads"
              className="p-3 sm:p-3.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 border border-emerald-700 text-white shadow-2xs transition-colors flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FolderArchive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">My Uploads</p>
                <p className="text-[10px] text-emerald-200 truncate">History &amp; file statuses</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
