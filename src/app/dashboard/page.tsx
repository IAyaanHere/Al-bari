"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Users,
  Calendar,
  AlertCircle,
  FolderArchive,
  RefreshCw,
  Upload,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { PostCard } from "@/components/dashboard/PostCard";
import { PostTable } from "@/components/dashboard/PostTable";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Button } from "@/components/ui/button";
import { Post, Madrasa } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";

export default function DashboardPage() {
  const { t } = useTranslation();

  // Filters state
  const [selectedMadrasa, setSelectedMadrasa] = React.useState<string>("all");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");

  // Data state
  const [madrasas, setMadrasas] = React.useState<Madrasa[]>([]);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [pagination, setPagination] = React.useState({ page: 1, total: 0, totalPages: 1 });
  const [stats, setStats] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  // Check authenticated user
  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on filter change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load madrasas list
  React.useEffect(() => {
    fetch("/api/admin/madrasas")
      .then((res) => res.json())
      .then((data) => {
        if (data.madrasas) setMadrasas(data.madrasas);
      })
      .catch(() => {});
  }, []);

  // Load stats
  React.useEffect(() => {
    const url = `/api/dashboard/stats?madrasaId=${selectedMadrasa}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.kpi) setStats(data);
      })
      .catch(() => {});
  }, [selectedMadrasa]);

  // Load posts
  React.useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "12",
      madrasaId: selectedMadrasa,
      category: selectedCategory,
      status: selectedStatus,
    });
    if (debouncedSearch) params.set("search", debouncedSearch);

    fetch(`/api/posts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) {
          setPosts(data.posts);
          setPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [page, selectedMadrasa, selectedCategory, selectedStatus, debouncedSearch]);

  const handleResetFilters = () => {
    setSelectedMadrasa("all");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.dashboard.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          {t.dashboard.subtitle}
        </p>
      </div>

      {/* Admin Action Center Banner */}
      {currentUser?.role === "admin" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border border-amber-500/30 text-white shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-extrabold tracking-wider bg-amber-400 text-emerald-950 rounded uppercase shadow-2xs">
                  Head Administrator
                </span>
                <span className="text-xs text-emerald-300 font-medium">
                  {currentUser.full_name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Organization Administration Center
              </h2>
              <p className="text-xs text-emerald-200/90 max-w-xl">
                Quickly access madrasa creation, teacher provisioning, and post moderation from your centralized console.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              <Link
                href="/admin/users"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-xs font-semibold text-white border border-emerald-600/50 shadow-2xs transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-amber-300" />
                Manage Teachers
              </Link>
              <Link
                href="/admin/madrasas"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-xs font-semibold text-white border border-emerald-600/50 shadow-2xs transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-300" />
                Manage Madrasas
              </Link>
              <Link
                href="/admin/moderation"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-xs font-semibold text-white border border-emerald-600/50 shadow-2xs transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5 text-amber-300" />
                Moderate Posts
              </Link>
              <Link
                href="/upload"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 shadow-sm transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950" />
                New Upload
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Action Center Banner */}
      {currentUser?.role === "teacher" && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-emerald-950 border border-emerald-700 text-white shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-700 text-emerald-100 rounded uppercase">
                Faculty Portal
              </span>
              <h2 className="text-base sm:text-lg font-bold mt-1">
                Welcome, {currentUser.full_name}
              </h2>
              <p className="text-xs text-emerald-200">
                Upload student examination results, attendance records, and educational resources directly to Google Drive.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/upload"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 shadow-sm transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Records
              </Link>
              <Link
                href="/my-uploads"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold text-white border border-emerald-600/50 transition-colors"
              >
                <FolderArchive className="w-3.5 h-3.5 text-emerald-300" />
                My Submissions
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 rounded-xl border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-emerald-800">
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase">{t.dashboard.kpi.totalPosts}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {stats?.kpi?.totalPosts ?? "-"}
          </p>
        </Card>

        <Card className="p-3 sm:p-4 rounded-xl border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-amber-700">
            <FolderArchive className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase">{t.dashboard.kpi.totalFiles}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {stats?.kpi?.totalFiles ?? "-"}
          </p>
        </Card>

        <Card className="p-3 sm:p-4 rounded-xl border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-emerald-800">
            <Building2 className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase">{t.dashboard.kpi.activeMadrasas}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {stats?.kpi?.activeMadrasas ?? "-"}
          </p>
        </Card>

        <Card className="p-3 sm:p-4 rounded-xl border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-sky-700">
            <Users className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase">{t.dashboard.kpi.activeTeachers}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {stats?.kpi?.activeTeachers ?? "-"}
          </p>
        </Card>

        <Card className="p-3 sm:p-4 rounded-xl border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-purple-700">
            <Calendar className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase">{t.dashboard.kpi.postsThisMonth}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {stats?.kpi?.postsThisMonth ?? "-"}
          </p>
        </Card>

        <Card className="p-3 sm:p-4 rounded-xl border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 mb-1 text-rose-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase">{t.dashboard.kpi.incompleteUploads}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">
            {stats?.kpi?.incompleteUploads ?? 0}
          </p>
        </Card>
      </div>

      {/* Analytics Charts */}
      {stats?.charts && <DashboardCharts data={stats.charts} />}

      {/* Search & Filter Bar */}
      <FilterBar
        madrasas={madrasas}
        selectedMadrasa={selectedMadrasa}
        onSelectMadrasa={(m) => {
          setSelectedMadrasa(m);
          setPage(1);
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={(c) => {
          setSelectedCategory(c);
          setPage(1);
        }}
        selectedStatus={selectedStatus}
        onSelectStatus={(s) => {
          setSelectedStatus(s);
          setPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onReset={handleResetFilters}
        showAdminFilters={false}
      />

      {/* Records Listing */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-800 animate-spin" />
          <p className="text-sm font-medium">Loading educational records...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs">
          <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {t.dashboard.empty.noPosts}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {t.dashboard.empty.noPostsDesc}
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <PostTable posts={posts} />
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs sm:text-sm text-slate-600">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
