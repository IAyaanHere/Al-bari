"use client";

import * as React from "react";
import {
  FileText,
  Building2,
  Users,
  Calendar,
  AlertCircle,
  FolderArchive,
  RefreshCw,
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
