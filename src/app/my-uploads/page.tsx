"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderArchive,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Post } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";
import { createClient } from "@/lib/supabase/client";

export default function MyUploadsPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Edit dialog state
  const [editPost, setEditPost] = React.useState<Post | null>(null);
  const [editTitle, setEditTitle] = React.useState<string>("");
  const [editDescription, setEditDescription] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const fetchMyUploads = () => {
    setIsLoading(true);
    fetch("/api/posts?myUploads=true&limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      fetchMyUploads();
    });
  }, [router]);

  const handleEditClick = (post: Post) => {
    setEditPost(post);
    setEditTitle(post.title);
    setEditDescription(post.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editPost || !editTitle.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/posts/${editPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update post");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editPost.id ? { ...p, title: editTitle, description: editDescription } : p
        )
      );
      setEditPost(null);
    } catch (err: any) {
      alert(err.message || "Failed to update record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this upload?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.nav.myUploads}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your archived educational posts, upload statuses, and reviews.
          </p>
        </div>

        <Link href="/upload">
          <Button variant="primary" className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Upload New Record</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-800" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No uploads recorded yet.</p>
          <p className="text-xs mt-1 mb-4">Start preserving educational records and examination results.</p>
          <Link href="/upload">
            <Button variant="primary" size="sm">
              Publish First Record
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Title</th>
                  <th className="py-3.5 px-4">Madrasa</th>
                  <th className="py-3.5 px-4 text-center">Files</th>
                  <th className="py-3.5 px-4">Upload State</th>
                  <th className="py-3.5 px-4">Approval</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => {
                  const isComplete = post.status === "complete";
                  const isIncomplete = post.status === "incomplete";
                  const isApproved = post.approval_status === "approved";
                  const isPending = post.approval_status === "pending";

                  return (
                    <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(post.event_date)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant="gold" className="text-[11px]">
                          {t.post.category[post.category] || post.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900" dir="auto">
                        <Link href={`/posts/${post.id}`} className="hover:text-emerald-800">
                          {post.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {post.madrasa?.name || "Madrasa"}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                        {post.files?.length || 0}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isComplete ? (
                          <Badge variant="success" className="text-[11px]">Complete</Badge>
                        ) : isIncomplete ? (
                          <Badge variant="danger" className="text-[11px]">Incomplete</Badge>
                        ) : (
                          <Badge variant="warning" className="text-[11px]">Pending</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isApproved ? (
                          <Badge variant="success" className="gap-1 text-[11px]">
                            <CheckCircle className="w-3 h-3" />
                            <span>Approved</span>
                          </Badge>
                        ) : isPending ? (
                          <Badge variant="warning" className="gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="gap-1 text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Revision</span>
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => handleEditClick(post)}
                          className="p-1.5 text-slate-500 hover:text-emerald-800 rounded hover:bg-slate-100"
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Details Dialog */}
      <Dialog
        isOpen={!!editPost}
        onClose={() => setEditPost(null)}
        title="Edit Record Title & Notes"
      >
        <div className="space-y-4">
          <Input
            label="Record Title"
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
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              dir="auto"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setEditPost(null)}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isSaving} onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
