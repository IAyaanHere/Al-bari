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
} from "lucide-react";
import { Badge } from "../ui/badge";
import { formatDate } from "@/lib/utils";
import { Post } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";

export function PostCard({ post }: { post: Post }) {
  const { t } = useTranslation();

  const categoryName = t.post.category[post.category] || post.category;
  const isApproved = post.approval_status === "approved";
  const isPending = post.approval_status === "pending";
  const isRejected = post.approval_status === "rejected";

  const fileCount = post.files ? post.files.length : 0;
  const firstImageFile = post.files?.find((f) => f.mime_type?.startsWith("image/"));

  return (
    <Link
      href={`/posts/${post.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all overflow-hidden"
    >
      {/* Thumbnail Header if image present */}
      {firstImageFile ? (
        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/files/${firstImageFile.drive_file_id}/thumb`}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <Badge variant="gold" className="shadow-xs backdrop-blur-md">
              {categoryName}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 pb-0 flex items-center justify-between">
          <Badge variant="gold">{categoryName}</Badge>
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
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="text-base font-bold text-slate-900 group-hover:text-emerald-900 line-clamp-2 transition-colors mb-2"
            dir="auto"
          >
            {post.title}
          </h3>

          {post.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed" dir="auto">
              {post.description}
            </p>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate font-medium">{post.madrasa?.name || "Madrasa"}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDate(post.event_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3 text-slate-400" />
              <span>{fileCount} files</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
