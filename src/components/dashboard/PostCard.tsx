"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Building2,
  User,
  Paperclip,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Trash2,
  BookOpen,
  Camera,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { formatDate } from "@/lib/utils";
import { Post } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";

interface PostCardProps {
  post: Post;
  currentUser?: {
    id: string;
    role: string;
    full_name: string;
  } | null;
  onDeleted?: (postId: string) => void;
}

export function PostCard({ post, currentUser, onDeleted }: PostCardProps) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);

  const categoryName = t.post.category[post.category] || post.category;
  const isApproved = post.approval_status === "approved";
  const isPending = post.approval_status === "pending";
  const isRejected = post.approval_status === "rejected";

  const isDailyMonitoring =
    post.category === "activity" ||
    post.title.includes("Daily Monitoring") ||
    post.title.includes(" - ");

  const imageFiles = post.files?.filter((f) => f.mime_type?.startsWith("image/")) || [];
  const fileCount = post.files ? post.files.length : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${post.title}"?\nOnly administrators can perform this action.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete post");
      }

      if (onDeleted) {
        onDeleted(post.id);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete record");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all overflow-hidden">
      {/* Admin Delete Action Button (ONLY VISIBLE TO HEAD ADMINISTRATOR) */}
      {currentUser?.role === "admin" && (
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete this record (Admin Only)"
            className="p-2 rounded-xl bg-white/95 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 shadow-xs transition-colors backdrop-blur-xs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Visual Header / Photos Display */}
      {imageFiles.length > 0 ? (
        <div className="relative w-full bg-slate-100 overflow-hidden">
          {imageFiles.length === 1 ? (
            <Link href={`/posts/${post.id}`} className="block h-48 sm:h-52 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/files/${imageFiles[0].drive_file_id}/thumb`}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                loading="lazy"
              />
            </Link>
          ) : (
            // 2+ Photos Side-by-Side Gallery (Ideal for Notebook + Blackboard pictures)
            <Link href={`/posts/${post.id}`} className="grid grid-cols-2 gap-1 h-48 sm:h-52 w-full overflow-hidden">
              <div className="relative h-full w-full bg-slate-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${imageFiles[0].drive_file_id}/thumb`}
                  alt="Student Notebook"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                  Notebook
                </span>
              </div>
              <div className="relative h-full w-full bg-slate-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${imageFiles[1].drive_file_id}/thumb`}
                  alt="Blackboard / Lesson"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                  Blackboard / Chapter
                </span>
                {imageFiles.length > 2 && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-xs">
                    +{imageFiles.length - 2}
                  </span>
                )}
              </div>
            </Link>
          )}

          {/* Badges on Top Left */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10 pointer-events-none">
            {isDailyMonitoring ? (
              <Badge variant="success" className="shadow-xs backdrop-blur-md font-bold text-[11px] gap-1 bg-emerald-800 text-amber-300 border-amber-400/40">
                <BookOpen className="w-3 h-3" />
                <span>Daily Monitoring</span>
              </Badge>
            ) : (
              <Badge variant="gold" className="shadow-xs backdrop-blur-md">
                {categoryName}
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 pb-0 flex items-center justify-between">
          {isDailyMonitoring ? (
            <Badge variant="success" className="font-bold text-[11px] gap-1 bg-emerald-800 text-amber-300">
              <BookOpen className="w-3 h-3" />
              <span>Daily Monitoring</span>
            </Badge>
          ) : (
            <Badge variant="gold">{categoryName}</Badge>
          )}

          {isApproved ? (
            <Badge variant="success" className="gap-1 text-[11px]">
              <CheckCircle className="w-3 h-3" />
              <span>{t.post.status.approved}</span>
            </Badge>
          ) : isPending ? (
            <Badge variant="warning" className="gap-1 text-[11px]">
              <Clock className="w-3 h-3" />
              <span>{t.post.status.pending}</span>
            </Badge>
          ) : (
            <Badge variant="danger" className="gap-1 text-[11px]">
              <AlertTriangle className="w-3 h-3" />
              <span>{t.post.status.rejected}</span>
            </Badge>
          )}
        </div>
      )}

      {/* Card Body */}
      <Link href={`/posts/${post.id}`} className="p-4 sm:p-5 flex-1 flex flex-col justify-between block">
        <div>
          {/* Post Title (Date + Madrasa Name) */}
          <h3
            className="text-base font-bold text-slate-900 group-hover:text-emerald-900 line-clamp-2 transition-colors mb-2 leading-snug"
            dir="auto"
          >
            {post.title}
          </h3>

          {/* Teacher's Daily Comment / Covered Note */}
          {post.description && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 text-xs text-slate-700 leading-relaxed space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                <MessageSquare className="w-3 h-3" />
                <span>Today&apos;s Lesson &amp; Progress Notes:</span>
              </div>
              <p className="line-clamp-3 text-slate-700" dir="auto">
                {post.description}
              </p>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate font-semibold text-slate-900">
                {post.madrasa?.name || "Madrasa"}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-slate-500 text-[11px]">
              <Paperclip className="w-3 h-3 text-slate-400" />
              <span>{fileCount} files</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-500 text-[11px] pt-0.5">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                {post.teacher?.full_name || "Educator"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDate(post.event_date)}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
