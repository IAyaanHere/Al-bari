"use client";

import * as React from "react";
import {
  FileText,
  Search,
  BookOpen,
  CheckCircle2,
  Filter,
  Sparkles,
  Camera,
  GraduationCap,
  Award,
  MessageSquare,
} from "lucide-react";
import { PostCard } from "@/components/dashboard/PostCard";
import { Post } from "@/types/database";

interface MadrasaPostsSectionProps {
  posts: Post[];
  madrasaName: string;
}

export function MadrasaPostsSection({ posts, madrasaName }: MadrasaPostsSectionProps) {
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const categories = React.useMemo(() => {
    const counts: Record<string, number> = {
      all: posts.length,
      activity: 0,
      tests: 0,
      results: 0,
      resources: 0,
      other: 0,
    };

    posts.forEach((p) => {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      } else {
        counts.other = (counts.other || 0) + 1;
      }
    });

    return [
      { id: "all", label: "All Records", count: counts.all, icon: BookOpen },
      { id: "resources", label: "Faculty & Student Feedbacks", count: counts.resources, icon: MessageSquare },
      { id: "activity", label: "Activities & Photos", count: counts.activity, icon: Camera },
      { id: "tests", label: "Tests & Question Papers", count: counts.tests, icon: GraduationCap },
      { id: "results", label: "Performance & Outcomes", count: counts.results, icon: Award },
    ];
  }, [posts]);

  const filteredPosts = React.useMemo(() => {
    return posts.filter((p) => {
      const matchesCategory = activeTab === "all" || p.category === activeTab;
      const matchesSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
              Verified Educational Records
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Records &amp; Activities
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse teacher evaluations, feedbacks, question papers, and classroom activities for {madrasaName}.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search posts or records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
          />
        </div>
      </div>

      {/* Category Tabs Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs ${
                isActive
                  ? "bg-emerald-800 text-white shadow-sm border border-emerald-900"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-emerald-700"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-emerald-950 text-emerald-200" : "bg-slate-100 text-slate-600"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 shadow-2xs space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <p className="font-bold text-slate-800 text-base">No records found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              No posts match the selected category or search filter for this campus.
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
