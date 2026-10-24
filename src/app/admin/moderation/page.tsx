"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  Building2,
  User,
  Paperclip,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Post } from "@/types/database";

export default function AdminModerationPage() {
  const router = useRouter();

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [filterStatus, setFilterStatus] = React.useState<string>("pending");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const fetchPosts = () => {
    setIsLoading(true);
    const url = `/api/posts?status=all&approvalStatus=${filterStatus}&limit=50`;
    fetch(url)
      .then((res) => {
        if (res.status === 403) {
          router.push("/dashboard");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.posts) setPosts(data.posts);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  React.useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleModerate = async (postId: string, approvalStatus: "approved" | "rejected" | "pending", visibility: "public" | "private" = "public") => {
    setUpdatingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus, visibility }),
      });

      if (!res.ok) throw new Error("Moderation update failed");

      // Update state locally
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, approval_status: approvalStatus, visibility } : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to moderate post");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Educational Records Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review educator uploads, verify attached examination files, and grant public visibility.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === "pending"
                ? "bg-white text-emerald-950 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilterStatus("approved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === "approved"
                ? "bg-white text-emerald-950 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === "all"
                ? "bg-white text-emerald-950 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Posts
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-800" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-2xs">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">No Posts in Queue</p>
          <p className="text-xs text-slate-500 mt-1">
            All submitted educational records for this filter status have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isApproved = post.approval_status === "approved";
            const isPending = post.approval_status === "pending";
            const isRejected = post.approval_status === "rejected";
            const isPublic = post.visibility === "public";
            const isUpdating = updatingId === post.id;

            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="gold" className="text-xs">
                      {post.category}
                    </Badge>
                    {isApproved ? (
                      <Badge variant="success" className="text-[11px] gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Approved</span>
                      </Badge>
                    ) : isPending ? (
                      <Badge variant="warning" className="text-[11px] gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Pending Review</span>
                      </Badge>
                    ) : (
                      <Badge variant="danger" className="text-[11px] gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </Badge>
                    )}
                    {isPublic ? (
                      <Badge variant="info" className="text-[11px] gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Public</span>
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[11px] gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900" dir="auto">
                    <Link href={`/posts/${post.id}`} className="hover:text-emerald-800 transition-colors">
                      {post.title}
                    </Link>
                  </h3>

                  {post.description && (
                    <p className="text-xs text-slate-500 line-clamp-2" dir="auto">
                      {post.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.madrasa?.name || "Madrasa"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.teacher?.full_name || "Educator"}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span>{post.files?.length || 0} files</span>
                    </span>
                    <span>Date: {formatDate(post.event_date)}</span>
                  </div>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Link href={`/posts/${post.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Button>
                  </Link>

                  {isPending && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isUpdating}
                        onClick={() => handleModerate(post.id, "approved", "public")}
                        className="gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve & Publish</span>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={isUpdating}
                        onClick={() => handleModerate(post.id, "rejected", "private")}
                        className="gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </Button>
                    </>
                  )}

                  {isApproved && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isUpdating}
                      onClick={() => handleModerate(post.id, "pending", "private")}
                      className="text-amber-700 hover:bg-amber-50"
                    >
                      Revoke Approval
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
