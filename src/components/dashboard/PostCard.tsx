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
  const [isPlayingVideo, setIsPlayingVideo] = React.useState<boolean>(false);

  const categoryName = t.post.category[post.category] || post.category;
  const isApproved = post.approval_status === "approved";
  const isPending = post.approval_status === "pending";
  const isRejected = post.approval_status === "rejected";

  const isDailyMonitoring =
    post.title.toLowerCase().includes("daily monitoring") ||
    post.title.toLowerCase().includes("daily academic monitoring");

  const imageFiles = post.files?.filter((f) => f.mime_type?.startsWith("image/")) || [];
  const videoFiles = post.files?.filter((f) => f.mime_type?.startsWith("video/")) || [];
  const pdfFiles = post.files?.filter((f) => f.mime_type === "application/pdf") || [];
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

      {/* Visual Header / Media Display */}
      {videoFiles.length > 0 ? (
        <div className="relative w-full bg-slate-950 overflow-hidden">
          {isPlayingVideo ? (
            <div className="relative h-48 sm:h-52 w-full">
              <iframe
                src={`https://drive.google.com/file/d/${videoFiles[0].drive_file_id}/preview`}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media"
                title={post.title}
              />
            </div>
          ) : (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsPlayingVideo(true);
              }}
              className="relative h-48 sm:h-52 w-full group/video cursor-pointer overflow-hidden bg-slate-900"
            >
              {/* Ultra-fast pre-generated thumbnail from Google CDN */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/files/${videoFiles[0].drive_file_id}/thumb`}
                alt={post.title}
                className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-300 opacity-90"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/35 group-hover/video:bg-black/20 transition-colors flex items-center justify-center">
                {/* Red YouTube / video player play button */}
                <div className="w-14 h-14 rounded-full bg-red-600/95 text-white flex items-center justify-center shadow-lg group-hover/video:scale-110 group-hover/video:bg-red-600 transition-all border border-white/20">
                  <svg className="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Tag on Top Left */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10 pointer-events-none">
            <Badge className="shadow-xs backdrop-blur-md font-bold text-[10px] bg-red-600 text-white border border-red-700 flex items-center gap-1">
              ▶ Video Feedback
            </Badge>
            <Badge className="shadow-xs backdrop-blur-md font-bold text-[11px] bg-amber-400 text-slate-950 border border-amber-500">
              🏷️ {post.title.includes(":") ? post.title.split(":")[0] : "Feedback"}
            </Badge>
          </div>
        </div>
      ) : imageFiles.length > 0 ? (
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
            // 2+ Photos Side-by-Side Gallery
            <Link href={`/posts/${post.id}`} className="grid grid-cols-2 gap-1 h-48 sm:h-52 w-full overflow-hidden">
              <div className="relative h-full w-full bg-slate-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${imageFiles[0].drive_file_id}/thumb`}
                  alt="Record Photo"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                {isDailyMonitoring && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    Notebook
                  </span>
                )}
              </div>
              <div className="relative h-full w-full bg-slate-200 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${imageFiles[1].drive_file_id}/thumb`}
                  alt="Record Photo"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                {isDailyMonitoring && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    Blackboard / Chapter
                  </span>
                )}
                {imageFiles.length > 2 && (
                  <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-xs border border-amber-500">
                    +{imageFiles.length - 2} Photos
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
              <>
                <Badge className="shadow-xs backdrop-blur-md font-black text-[11px] bg-amber-400 text-slate-950 border border-amber-500">
                  🏷️ {post.title.includes(":") ? post.title.split(":")[0] : post.title}
                </Badge>
                <Badge className="shadow-xs backdrop-blur-md text-[10px] font-semibold bg-emerald-950/80 text-emerald-100 border border-emerald-700/60">
                  {categoryName}
                </Badge>
              </>
            )}
          </div>
        </div>
      ) : post.files && post.files.length > 0 ? (
        <Link href={`/posts/${post.id}`} className="relative w-full bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 h-44 flex items-center justify-center p-6 text-white group-hover:from-emerald-900 transition-colors">
          <div className="text-center space-y-1.5">
            <div className="w-11 h-11 mx-auto rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/15 shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-amber-300 truncate max-w-[240px]">
              {post.title.includes(":") ? post.title.split(":")[0] : "Academic Record"}
            </p>
            <p className="text-[11px] text-slate-300 truncate max-w-[220px]">{post.files[0].name}</p>
          </div>
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10 pointer-events-none">
            <Badge className="shadow-xs backdrop-blur-md font-bold text-[11px] bg-amber-400 text-slate-950 border border-amber-500">
              🏷️ {post.title.includes(":") ? post.title.split(":")[0] : post.category}
            </Badge>
          </div>
        </Link>
      ) : (
        <div className="p-4 sm:p-5 pb-0 flex items-center justify-between flex-wrap gap-2">
          {isDailyMonitoring ? (
            <Badge variant="success" className="font-bold text-[11px] gap-1 bg-emerald-800 text-amber-300">
              <BookOpen className="w-3 h-3" />
              <span>Daily Monitoring</span>
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="font-black text-[11px] bg-amber-400 text-slate-950 border border-amber-500">
                🏷️ {post.title.includes(":") ? post.title.split(":")[0] : post.title}
              </Badge>
              <Badge className="text-[10px] font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300">
                {categoryName}
              </Badge>
            </div>
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

          {/* Teacher's Daily Comment / Record Note */}
          {post.description && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 text-xs text-slate-700 leading-relaxed space-y-1">
              {isDailyMonitoring && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  <MessageSquare className="w-3 h-3" />
                  <span>Today&apos;s Lesson &amp; Progress Notes:</span>
                </div>
              )}
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
