"use client";

import * as React from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Post } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";
import { Eye, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export function PostTable({ posts }: { posts: Post[] }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4 min-w-[200px]">Title</th>
              <th className="py-3.5 px-4">Madrasa</th>
              <th className="py-3.5 px-4">Instructor</th>
              <th className="py-3.5 px-4 text-center">Files</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.map((post) => {
              const categoryName = t.post.category[post.category] || post.category;
              const isApproved = post.approval_status === "approved";
              const isPending = post.approval_status === "pending";

              return (
                <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(post.event_date)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant="gold" className="text-[11px]">
                      {categoryName}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900" dir="auto">
                    <Link
                      href={`/posts/${post.id}`}
                      className="hover:text-emerald-800 transition-colors line-clamp-1"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                    {post.madrasa?.name || "Madrasa"}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {post.teacher?.full_name || "Teacher"}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                    {post.files?.length || 0}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
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
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      href={`/posts/${post.id}`}
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t.post.details.viewFile}</span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
