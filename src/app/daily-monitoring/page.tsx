"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  Calendar,
  Building2,
  Camera,
  Upload,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  School,
  FileCheck2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Madrasa } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

interface UploadSlot {
  id: "notebook" | "blackboard" | "extra";
  label: string;
  urduLabel: string;
  hindiLabel: string;
  description: string;
  required: boolean;
  file: File | null;
  previewUrl: string | null;
  compressedFile?: File;
  progress: number;
  status: "idle" | "compressing" | "uploading" | "complete" | "error";
  errorMessage?: string;
}

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB (Google Drive aligned)

export default function DailyMonitoringUploadPage() {
  const router = useRouter();

  // Authentication & Madrasa state
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [madrasas, setMadrasas] = React.useState<Madrasa[]>([]);
  const [selectedMadrasaId, setSelectedMadrasaId] = React.useState<string>("");
  const [isLoadingAuth, setIsLoadingAuth] = React.useState<boolean>(true);

  // Daily report details
  const [reportDate, setReportDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [teacherNote, setTeacherNote] = React.useState<string>("");

  // Slots for the 2 mandatory photos + 1 optional
  const [slots, setSlots] = React.useState<Record<string, UploadSlot>>({
    notebook: {
      id: "notebook",
      label: "Student Notebook Picture",
      urduLabel: "طالب علم کی کاپی",
      hindiLabel: "छात्र की कॉपी की फोटो",
      description: "Photo of student work / classwork notebook completed today.",
      required: true,
      file: null,
      previewUrl: null,
      progress: 0,
      status: "idle",
    },
    blackboard: {
      id: "blackboard",
      label: "Blackboard / Chapter Covered",
      urduLabel: "بلیک بورڈ یا کتاب کا سبق",
      hindiLabel: "ब्लैकबोर्ड या आज का पाठ",
      description: "Photo of blackboard summary or today's textbook chapter.",
      required: true,
      file: null,
      previewUrl: null,
      progress: 0,
      status: "idle",
    },
    extra: {
      id: "extra",
      label: "Additional Classroom Photo",
      urduLabel: "اضافی تصویر (اختیاری)",
      hindiLabel: "अतिरिक्त कक्षा फोटो (वैकल्पिक)",
      description: "Optional: Classroom attendance, student group, or extra notes.",
      required: false,
      file: null,
      previewUrl: null,
      progress: 0,
      status: "idle",
    },
  });

  // Upload execution state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [overallError, setOverallError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<boolean>(false);
  const [createdPostId, setCreatedPostId] = React.useState<string | null>(null);

  // Hidden file input refs
  const notebookInputRef = React.useRef<HTMLInputElement>(null);
  const blackboardInputRef = React.useRef<HTMLInputElement>(null);
  const extraInputRef = React.useRef<HTMLInputElement>(null);

  // Check auth and fetch assigned madrasas
  React.useEffect(() => {
    const init = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData?.user) {
            setCurrentUser(userData.user);
          } else {
            router.push("/login?redirect=/daily-monitoring");
            return;
          }
        }

        const madrasaRes = await fetch("/api/admin/madrasas");
        if (madrasaRes.ok) {
          const mData = await madrasaRes.json();
          if (mData?.madrasas && mData.madrasas.length > 0) {
            setMadrasas(mData.madrasas);
            // Default to first madrasa (or Darul Uloom Alamgir if present)
            const alamgir = mData.madrasas.find((m: Madrasa) =>
              m.name.toLowerCase().includes("alamgir")
            );
            setSelectedMadrasaId(alamgir ? alamgir.id : mData.madrasas[0].id);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    init();
  }, [router]);

  // Handle file chosen for a specific slot
  const handleSlotFileSelected = (slotId: string, file: File | null) => {
    if (!file) return;
    setOverallError(null);

    // Revoke old preview url to prevent memory leaks
    if (slots[slotId]?.previewUrl) {
      URL.revokeObjectURL(slots[slotId].previewUrl!);
    }

    const previewUrl = URL.createObjectURL(file);

    setSlots((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        file,
        previewUrl,
        progress: 0,
        status: "idle",
        errorMessage: undefined,
      },
    }));
  };

  const removeSlotFile = (slotId: string) => {
    if (isSubmitting) return;
    if (slots[slotId]?.previewUrl) {
      URL.revokeObjectURL(slots[slotId].previewUrl!);
    }
    setSlots((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        file: null,
        previewUrl: null,
        progress: 0,
        status: "idle",
        errorMessage: undefined,
      },
    }));
  };

  // Selected madrasa object
  const currentMadrasa = madrasas.find((m) => m.id === selectedMadrasaId);

  // Auto-formatted heading / title
  const formattedDate = new Date(reportDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const autoTitle = `${formattedDate} - ${currentMadrasa?.name || "Daily Academic Monitoring"}`;

  // Upload via server proxy to avoid CORS issues with Google Drive
  const uploadViaProxy = async (
    file: File,
    uploadUrl: string,
    sessionId: string,
    onProgress: (uploaded: number, total: number) => void
  ): Promise<{ success: boolean; driveFileId?: string; error?: string }> => {
    const totalSize = file.size;

    try {
      // Small files (< 8 MiB) single request
      if (totalSize <= CHUNK_SIZE) {
        const proxyUrl = `/api/uploads/proxy?uploadUrl=${encodeURIComponent(uploadUrl)}&sessionId=${encodeURIComponent(sessionId)}`;
        const res = await fetch(proxyUrl, {
          method: "PUT",
          headers: {
            "Content-Range": `bytes 0-${totalSize - 1}/${totalSize}`,
            "Content-Type": file.type || "image/jpeg",
          },
          body: file,
        });

        if (res.status === 200 || res.status === 201) {
          onProgress(totalSize, totalSize);
          const data = await res.json().catch(() => null);
          return { success: true, driveFileId: data?.id };
        }
        const errText = await res.text().catch(() => "");
        return { success: false, error: `Upload returned status ${res.status}: ${errText}` };
      }

      // Chunked multi-part upload
      let offset = 0;
      while (offset < totalSize) {
        const end = Math.min(offset + CHUNK_SIZE, totalSize);
        const chunk = file.slice(offset, end);
        const proxyUrl = `/api/uploads/proxy?uploadUrl=${encodeURIComponent(uploadUrl)}&sessionId=${encodeURIComponent(sessionId)}`;

        const res = await fetch(proxyUrl, {
          method: "PUT",
          headers: {
            "Content-Range": `bytes ${offset}-${end - 1}/${totalSize}`,
            "Content-Type": file.type || "image/jpeg",
          },
          body: chunk,
        });

        if (res.status === 308) {
          const range = res.headers.get("Range");
          if (range) {
            const match = range.match(/bytes=0-(\d+)/);
            offset = match ? parseInt(match[1], 10) + 1 : end;
          } else {
            offset = end;
          }
          onProgress(offset, totalSize);
        } else if (res.status === 200 || res.status === 201) {
          onProgress(totalSize, totalSize);
          const data = await res.json().catch(() => null);
          return { success: true, driveFileId: data?.id };
        } else {
          const errText = await res.text().catch(() => "");
          return { success: false, error: `Chunk failed status ${res.status}: ${errText}` };
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Upload network failure" };
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverallError(null);

    // 1. Validation: Ensure both mandatory slots have files
    if (!slots.notebook.file) {
      setOverallError("Student Notebook Picture is required.");
      return;
    }

    if (!slots.blackboard.file) {
      setOverallError("Blackboard or Covered Chapter Picture is required.");
      return;
    }

    if (!selectedMadrasaId) {
      setOverallError("Please select an institution / madrasa.");
      return;
    }

    if (!teacherNote.trim()) {
      setOverallError("Please write what was taught or covered today in the notes.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Compress images client-side for rapid mobile upload
      const compressionOptions = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.8,
      };

      const preparedList: Array<{ slotId: string; file: File; name: string }> = [];

      // Slot 1: Notebook
      setSlots((prev) => ({
        ...prev,
        notebook: { ...prev.notebook, status: "compressing" },
      }));
      let notebookFile = slots.notebook.file!;
      try {
        notebookFile = await imageCompression(slots.notebook.file!, compressionOptions);
      } catch (err) {
        console.warn("Compression fallback:", err);
      }
      preparedList.push({
        slotId: "notebook",
        file: notebookFile,
        name: `01_student_notebook_${Date.now()}.jpg`,
      });

      // Slot 2: Blackboard
      setSlots((prev) => ({
        ...prev,
        blackboard: { ...prev.blackboard, status: "compressing" },
      }));
      let blackboardFile = slots.blackboard.file!;
      try {
        blackboardFile = await imageCompression(slots.blackboard.file!, compressionOptions);
      } catch (err) {
        console.warn("Compression fallback:", err);
      }
      preparedList.push({
        slotId: "blackboard",
        file: blackboardFile,
        name: `02_blackboard_chapter_${Date.now()}.jpg`,
      });

      // Slot 3: Extra (if chosen)
      if (slots.extra.file) {
        setSlots((prev) => ({
          ...prev,
          extra: { ...prev.extra, status: "compressing" },
        }));
        let extraFile = slots.extra.file;
        try {
          extraFile = await imageCompression(slots.extra.file, compressionOptions);
        } catch (err) {
          console.warn("Compression fallback:", err);
        }
        preparedList.push({
          slotId: "extra",
          file: extraFile,
          name: `03_extra_${Date.now()}.jpg`,
        });
      }

      // 3. Initiate Upload with auto-approval flag
      const initPayload = {
        madrasaId: selectedMadrasaId,
        title: autoTitle,
        description: teacherNote.trim(),
        category: "activity",
        eventDate: reportDate,
        isDailyMonitoring: true, // AUTO-APPROVAL: Direct publish to public dashboard
        files: preparedList.map((item) => ({
          name: item.name,
          size: item.file.size,
          type: item.file.type || "image/jpeg",
        })),
      };

      const initRes = await fetch("/api/uploads/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initPayload),
      });

      if (!initRes.ok) {
        const errData = await initRes.json();
        throw new Error(errData.error || "Failed to initiate daily upload session.");
      }

      const initData = await initRes.json();
      const postId = initData.postId;
      setCreatedPostId(postId);

      // 4. Stream each image directly to Google Drive (with auto-fallback to proxy)
      const uploadedFiles: Array<{ sessionId: string; driveFileId?: string }> = [];

      for (let i = 0; i < preparedList.length; i++) {
        const item = preparedList[i];
        const session = initData.sessions[i];
        if (!session?.uploadUrl) {
          throw new Error(`Upload session missing for ${item.name}`);
        }

        setSlots((prev) => ({
          ...prev,
          [item.slotId]: { ...prev[item.slotId], status: "uploading", progress: 10 },
        }));

        const result = await uploadViaProxy(
          item.file,
          session.uploadUrl,
          session.sessionId,
          (uploaded, total) => {
            const pct = Math.round((uploaded / total) * 100);
            setSlots((prev) => ({
              ...prev,
              [item.slotId]: { ...prev[item.slotId], progress: pct },
            }));
          }
        );

        if (!result.success) {
          throw new Error(`Failed to upload ${slots[item.slotId].label}: ${result.error || "Upload failed"}`);
        }

        uploadedFiles.push({
          sessionId: session.sessionId,
          driveFileId: result.driveFileId,
        });

        setSlots((prev) => ({
          ...prev,
          [item.slotId]: { ...prev[item.slotId], status: "complete", progress: 100 },
        }));
      }

      // 5. Finalize Post (Marks complete & public)
      const finalizeRes = await fetch("/api/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          uploadedFiles,
        }),
      });

      if (!finalizeRes.ok) {
        const finErr = await finalizeRes.json();
        throw new Error(finErr.error || "Failed to finalize daily monitoring post.");
      }

      setUploadSuccess(true);
    } catch (err: any) {
      console.error("Upload error:", err);
      setOverallError(err.message || "An error occurred during upload. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    // Clear slots
    Object.values(slots).forEach((s) => {
      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
    });

    setSlots({
      notebook: {
        id: "notebook",
        label: "Student Notebook Picture",
        urduLabel: "طالب علم کی کاپی",
        hindiLabel: "छात्र की कॉपी की फोटो",
        description: "Photo of student work / classwork notebook completed today.",
        required: true,
        file: null,
        previewUrl: null,
        progress: 0,
        status: "idle",
      },
      blackboard: {
        id: "blackboard",
        label: "Blackboard / Chapter Covered",
        urduLabel: "بلیک بورڈ یا کتاب کا سبق",
        hindiLabel: "ब्लैकबोर्ड या आज का पाठ",
        description: "Photo of blackboard summary or today's textbook chapter.",
        required: true,
        file: null,
        previewUrl: null,
        progress: 0,
        status: "idle",
      },
      extra: {
        id: "extra",
        label: "Additional Classroom Photo",
        urduLabel: "اضافی تصویر (اختیاری)",
        hindiLabel: "अतिरिक्त कक्षा फोटो (वैकल्पिक)",
        description: "Optional: Classroom attendance, student group, or extra notes.",
        required: false,
        file: null,
        previewUrl: null,
        progress: 0,
        status: "idle",
      },
    });

    setTeacherNote("");
    setUploadSuccess(false);
    setCreatedPostId(null);
    setOverallError(null);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-800" />
        <p className="text-xs text-slate-500 font-medium">Opening Daily Monitoring Portal...</p>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (uploadSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 sm:py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md border border-emerald-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-700" />
        </div>

        <div className="space-y-2">
          <Badge variant="success" className="text-xs font-bold px-3 py-1">
            ⚡ Published Directly to Public Dashboard
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daily Academic Progress Recorded!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your lesson coverage, student notebook, and blackboard photos have been successfully uploaded and are now visible publicly on the organization hub dashboard.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500">Record Title:</span>
            <span className="font-bold text-slate-900">{autoTitle}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <span className="text-slate-500">Educator:</span>
            <span className="font-medium text-slate-900">{currentUser?.full_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Files Preserved:</span>
            <span className="font-mono text-emerald-800 font-semibold">
              {slots.extra.file ? "3 Photos" : "2 Photos"} in Google Drive
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard")}
            className="flex-1 h-12 font-bold gap-2 text-sm shadow-sm"
          >
            <span>View on Public Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleResetForAnother}
            className="flex-1 h-12 text-sm font-semibold text-slate-700"
          >
            Upload Another Update
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 border border-amber-500/30 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950">
              Direct Auto-Publish
            </span>
            <span className="text-xs text-emerald-300 font-medium">
              Daily Academic Monitoring
            </span>
          </div>
          <span className="text-xs text-emerald-300/80">
            {currentUser?.full_name}
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Daily Academic Monitoring
          </h1>
          <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
            Upload today&apos;s student notebook and blackboard photos. This update is published directly to the public dashboard for community visibility without needing administrative approval.
          </p>
        </div>
      </div>

      {overallError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Upload Incomplete</strong>
            <span>{overallError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Madrasa & Date Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-800" />
            <span>Institution & Lesson Date</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Madrasa / Campus *
              </label>
              <select
                required
                value={selectedMadrasaId}
                onChange={(e) => setSelectedMadrasaId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
              >
                {madrasas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.city ? `(${m.city})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date of Upload / Lesson *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Heading Preview */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between">
            <span className="text-slate-500 font-medium">Public Post Title:</span>
            <span className="font-bold text-slate-900 text-right">{autoTitle}</span>
          </div>
        </div>

        {/* Mandatory Photo Upload Slots */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-800" />
              <span>Required Daily Photos (2 Must)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Snap photos directly using your mobile camera or pick from gallery. Both Slot 1 &amp; Slot 2 are mandatory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slot 1: Student Notebook */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                slots.notebook.file
                  ? "border-emerald-500 bg-emerald-50/20"
                  : "border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-800 text-white">
                    Must 1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {slots.notebook.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {slots.notebook.urduLabel} / {slots.notebook.hindiLabel}
                  </p>
                </div>

                {slots.notebook.file ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-1" />
                ) : (
                  <span className="text-[11px] font-bold text-rose-600 shrink-0">Required</span>
                )}
              </div>

              {/* Preview or Empty State */}
              {slots.notebook.previewUrl ? (
                <div className="relative rounded-xl overflow-hidden h-44 bg-slate-100 border border-slate-200 mt-3 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slots.notebook.previewUrl}
                    alt="Student Notebook Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => notebookInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold hover:bg-white"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlotFile("notebook")}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => notebookInputRef.current?.click()}
                  className="mt-3 h-44 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-emerald-50/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-2xs border border-slate-200 mb-2">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Snap Student Notebook
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Tap to use camera or upload photo
                  </span>
                </div>
              )}

              {/* Hidden input */}
              <input
                ref={notebookInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) =>
                  handleSlotFileSelected("notebook", e.target.files?.[0] || null)
                }
              />
            </div>

            {/* Slot 2: Blackboard / Covered Chapter */}
            <div
              className={`p-4 rounded-2xl border-2 transition-all ${
                slots.blackboard.file
                  ? "border-emerald-500 bg-emerald-50/20"
                  : "border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-800 text-white">
                    Must 2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {slots.blackboard.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {slots.blackboard.urduLabel} / {slots.blackboard.hindiLabel}
                  </p>
                </div>

                {slots.blackboard.file ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-1" />
                ) : (
                  <span className="text-[11px] font-bold text-rose-600 shrink-0">Required</span>
                )}
              </div>

              {/* Preview or Empty State */}
              {slots.blackboard.previewUrl ? (
                <div className="relative rounded-xl overflow-hidden h-44 bg-slate-100 border border-slate-200 mt-3 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slots.blackboard.previewUrl}
                    alt="Blackboard / Chapter Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => blackboardInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold hover:bg-white"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlotFile("blackboard")}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => blackboardInputRef.current?.click()}
                  className="mt-3 h-44 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-emerald-50/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center shadow-2xs border border-slate-200 mb-2">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Snap Blackboard or Chapter
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Tap to use camera or upload photo
                  </span>
                </div>
              )}

              {/* Hidden input */}
              <input
                ref={blackboardInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) =>
                  handleSlotFileSelected("blackboard", e.target.files?.[0] || null)
                }
              />
            </div>
          </div>

          {/* Slot 3: Optional Extra Photo */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Slot 3: Additional Classroom Photo (Optional)
              </span>
              {slots.extra.file && (
                <button
                  type="button"
                  onClick={() => removeSlotFile("extra")}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {slots.extra.previewUrl ? (
              <div className="relative rounded-xl overflow-hidden h-32 bg-slate-100 border border-slate-200 group max-w-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slots.extra.previewUrl}
                  alt="Extra Photo Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => extraInputRef.current?.click()}
                className="w-full sm:w-auto text-xs h-10 gap-2 border-dashed border-slate-300 text-slate-600 hover:text-slate-900"
              >
                <Camera className="w-4 h-4" />
                <span>+ Add Optional Photo (Attendance / Classroom)</span>
              </Button>
            )}

            <input
              ref={extraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) =>
                handleSlotFileSelected("extra", e.target.files?.[0] || null)
              }
            />
          </div>
        </div>

        {/* Teacher Note Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div>
            <label className="block text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              What was covered or done on this day? *
            </label>
            <p className="text-xs text-slate-500">
              Mention the lesson, Surah, Ayat, book chapter, student performance remarks, or topics covered.
            </p>
          </div>

          <textarea
            required
            rows={4}
            value={teacherNote}
            onChange={(e) => setTeacherNote(e.target.value)}
            placeholder="e.g. आज कक्षा में सूरह मुल्क की आयत 1 से 10 तक का तर्जुमा और हिफ्ज़ का सबक सुना गया। साथ ही उर्दू कायदा का सबक नंबर 4 मुकम्मल किया..."
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs leading-relaxed"
            dir="auto"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full h-14 text-base font-extrabold rounded-2xl gap-2 shadow-md bg-emerald-800 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <span>Uploading Photos to Google Drive...</span>
            ) : (
              <>
                <Upload className="w-5 h-5 text-amber-300" />
                <span>Publish Daily Academic Monitoring Update</span>
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-slate-500 mt-2.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Files are encrypted &amp; stored directly in Google Drive cloud storage.</span>
          </p>
        </div>
      </form>
    </div>
  );
}
