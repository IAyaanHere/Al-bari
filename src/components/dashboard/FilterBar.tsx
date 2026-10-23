"use client";

import * as React from "react";
import { Search, LayoutGrid, Table as TableIcon, X, Filter } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Madrasa } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";

interface FilterBarProps {
  madrasas: Madrasa[];
  selectedMadrasa: string;
  onSelectMadrasa: (id: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  onReset: () => void;
  showAdminFilters?: boolean;
}

export function FilterBar({
  madrasas,
  selectedMadrasa,
  onSelectMadrasa,
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onReset,
  showAdminFilters,
}: FilterBarProps) {
  const { t } = useTranslation();
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedMadrasa !== "all" ||
    selectedCategory !== "all" ||
    selectedStatus !== "all";

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
      {/* Search Input & Mobile Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t.dashboard.filters.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 sm:h-11 pl-10 pr-9 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View toggle (desktop & mobile) */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid" ? "bg-white text-emerald-900 shadow-2xs font-medium" : "text-slate-500 hover:text-slate-900"
            }`}
            title={t.dashboard.views.grid}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "table" ? "bg-white text-emerald-900 shadow-2xs font-medium" : "text-slate-500 hover:text-slate-900"
            }`}
            title={t.dashboard.views.table}
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile toggle button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="sm:hidden shrink-0 gap-1.5 h-10"
        >
          <Filter className="w-4 h-4 text-emerald-700" />
          <span>{t.dashboard.filters.filterButton}</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </Button>
      </div>

      {/* Select Filters: Desktop (always visible) and Mobile (collapsible) */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${mobileFiltersOpen ? "block" : "hidden sm:grid"}`}>
        {/* Madrasa filter */}
        <div>
          <select
            value={selectedMadrasa}
            onChange={(e) => onSelectMadrasa(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">{t.dashboard.filters.allMadrasas}</option>
            {madrasas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">{t.dashboard.filters.allCategories}</option>
            <option value="photos">{t.post.category.photos}</option>
            <option value="results">{t.post.category.results}</option>
            <option value="tests">{t.post.category.tests}</option>
            <option value="resources">{t.post.category.resources}</option>
            <option value="attendance">{t.post.category.attendance}</option>
            <option value="activity">{t.post.category.activity}</option>
            <option value="other">{t.post.category.other}</option>
          </select>
        </div>

        {/* Status filter (for admins/teachers) */}
        {showAdminFilters && (
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => onSelectStatus(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">{t.dashboard.filters.allStatuses}</option>
              <option value="approved">{t.post.status.approved}</option>
              <option value="pending">{t.post.status.pending}</option>
              <option value="rejected">{t.post.status.rejected}</option>
            </select>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-slate-500 hover:text-rose-600 text-xs w-full sm:w-auto h-10"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              <span>{t.dashboard.filters.clearFilters}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
