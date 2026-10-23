"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Building2,
  User,
  Paperclip,
  Download,
  Eye,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Video,
  FileQuestion,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Edit,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Lightbox } from "@/components/ui/lightbox";
import { formatDate, formatBytes } from "@/lib/utils";
import { Post, PostFile } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { t } = useTranslation();
  const router = useRouter();
  const postId = params.id;

  const [post, setPost] = React.useState<Post | null>(null);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = React.useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = React.useState<number>(0);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = React.useState<boolean>(false);
  const [editTitle, setEditTitle] = React.useState<string>("");
  const [editDescription, setEditDescription] = React.useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = React.useState<boolean>(false);

  // Fetch current user and post
  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setCurrentUser(data));
      }
    });

    fetch(`/api/posts/${postId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load record");
        }
        return res.json();
      })
      .then((data) => {
        if (data.post) {
          setPost(data.post);
          setEditTitle(data.post.title);
          setEditDescription(data.post.description || "");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [postId]);

  const isOwner = currentUser?.id === post?.teacher_id;
  const isAdmin = currentUser?.role === "admin";
  const canModify = isOwner || isAdmin;

  // Filter image files for lightbox
  const imageFiles = React.useMemo(() => {
    if (!post?.files) return [];
    return post.files.filter((f) => f.mime_type?.startsWith("image/"));
  }, [post]);

  const lightboxImages = React.useMemo(() => {
    return imageFiles.map((f) => ({
      src: `/api/files/${f.drive_file_id}/thumb`,
      alt: f.name,
      caption: f.name,
      downloadUrl: `/api/files/${f.drive_file_id}/thumb`,
    }));
  }, [imageFiles]);

  const openLightboxAtFile = (driveFileId: string) => {
    const index = imageFiles.findIndex((f) => f.drive_file_id === driveFileId);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update post");
      const data = await res.json();
      setPost((prev) => (prev ? { ...prev, title: editTitle, description: editDescription } : null));
      setEditModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save edits");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to soft-delete this educational record?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Failed to delete record");
    }
  };

  const getFileIcon = (mimeType?: string | null) => {
    if (!mimeType) return FileQuestion;
    if (mimeType.startsWith("image/")) return Eye;
    if (mimeType.includes("pdf")) return FileText;
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
    if (mimeType.startsWith("video/")) return Video;
    return FileText;
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <p className="text-base font-semibold">Loading educational record...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 text-center shadow-xs">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Record Unavailable</h2>
        <p className="text-sm text-slate-500 mb-6">{error || "The requested post could not be found."}</p>
        <Link href="/dashboard">
          <Button variant="outline">{t.post.details.backToPosts}</Button>
        </Link>
      </div>
    );
  }

  const categoryName = t.post.category[post.category] || post.category;
  const isApproved = post.approval_status === "approved";
  const isPending = post.approval_status === "pending";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button & Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.post.details.backToPosts}</span>
        </Link>

        {canModify && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)} className="gap-1.5">
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} className="gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        )}
      </div>

      {/* Moderation Status Banner if not approved */}
      {!isApproved && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
          isPending ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-rose-50 border-rose-200 text-rose-900"
        }`}>
          <div className="flex items-center gap-3">
            {isPending ? <Clock className="w-5 h-5 text-amber-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            <div>
              <p className="text-sm font-bold">
                {isPending ? "Pending Administrative Approval" : "Revision Needed"}
              </p>
              <p className="text-xs opacity-90">
                {isPending
                  ? "This record is currently private and visible only to assigned educators and admins."
                  : "An administrator requested revisions before public publishing."}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Link href="/admin/moderation">
              <Button variant="primary" size="sm">
                Moderate Now
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Post Main Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gold" className="text-xs px-3 py-1">
            {categoryName}
          </Badge>
          {isApproved ? (
            <Badge variant="success" className="gap-1 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t.post.status.approved}</span>
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.post.status.pending}</span>
            </Badge>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight" dir="auto">
          {post.title}
        </h1>

        {/* Metadata info ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{t.post.details.madrasa}</p>
              <p className="font-semibold text-slate-900">{post.madrasa?.name || "Madrasa"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-emerald-800 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{t.post.details.teacher}</p>
              <p className="font-semibold text-slate-900">{post.teacher?.full_name || "Educator"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-emerald-800 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">{t.post.details.eventDate}</p>
              <p className="font-semibold text-slate-900">{formatDate(post.event_date)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {post.description && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Description / Record Summary
            </h4>
            <div
              className="p-4 rounded-xl bg-[#fcfbf7] border border-slate-200 text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line"
              dir="auto"
            >
              {post.description}
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery (if photographs present) */}
      {imageFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-800" />
            <span>Photographs & Media Gallery ({imageFiles.length})</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => openLightboxAtFile(file.drive_file_id)}
                className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200/80 shadow-2xs hover:shadow-md transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${file.drive_file_id}/thumb`}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-6 h-6 drop-shadow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attached Files & Documents */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-emerald-800" />
          <span>{t.post.details.filesAttached} ({post.files?.length || 0})</span>
        </h3>

        {!post.files || post.files.length === 0 ? (
          <p className="text-xs text-slate-500">No documents attached to this record.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {post.files.map((file) => {
              const Icon = getFileIcon(file.mime_type);
              const downloadUrl = `/api/files/${file.drive_file_id}/thumb`;

              return (
                <div
                  key={file.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {file.size_bytes ? formatBytes(file.size_bytes) : "Document"} • Secure Drive Storage
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={downloadUrl}
                      download={file.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.post.details.downloadFile}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      <Dialog
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Educational Record Details"
        description="Update record title or descriptive summary."
      >
        <div className="space-y-4">
          <Input
            label="Title / Topic"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            dir="auto"
          />

          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              dir="auto"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSavingEdit} onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Lightbox for full screen viewing */}
      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
