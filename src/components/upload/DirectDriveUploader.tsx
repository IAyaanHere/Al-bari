"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { formatBytes, validateFileMeta, MAX_FILES_PER_POST } from "@/lib/utils";
import { Madrasa } from "@/types/database";
import { useTranslation } from "@/lib/i18n/context";

interface DirectDriveUploaderProps {
  madrasas: Madrasa[];
  defaultMadrasaId?: string;
  onSuccess?: (postId: string) => void;
}

interface FileUploadItem {
  id: string;
  file: File;
  compressedFile?: File;
  name: string;
  size: number;
  originalSize: number;
  type: string;
  isImage: boolean;
  progress: number;
  status: "idle" | "compressing" | "uploading" | "complete" | "error";
  errorMessage?: string;
  uploadUrl?: string;
  sessionId?: string;
  driveFileId?: string;
}

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB (Google Drive aligned)

export function DirectDriveUploader({
  madrasas,
  defaultMadrasaId,
  onSuccess,
}: DirectDriveUploaderProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Form states
  const [selectedMadrasa, setSelectedMadrasa] = React.useState<string>(
    defaultMadrasaId || (madrasas.length > 0 ? madrasas[0].id : "")
  );
  const [category, setCategory] = React.useState<string>("photos");
  const [eventDate, setEventDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [uploadOriginalQuality, setUploadOriginalQuality] = React.useState<boolean>(false);

  // File list & engine state
  const [fileItems, setFileItems] = React.useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = React.useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = React.useState<boolean>(false);
  const [createdPostId, setCreatedPostId] = React.useState<string | null>(null);
  const [overallError, setOverallError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // File selection & compression handler
  const handleFilesAdded = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setOverallError(null);

    const newItems: FileUploadItem[] = [];
    const currentCount = fileItems.length;

    for (let i = 0; i < files.length; i++) {
      if (currentCount + i >= MAX_FILES_PER_POST) {
        setOverallError(`Maximum ${MAX_FILES_PER_POST} files per record allowed.`);
        break;
      }

      const file = files[i];
      const validation = validateFileMeta(file.name, file.type, file.size);
      if (!validation.valid) {
        setOverallError(validation.error || `File ${file.name} is invalid.`);
        continue;
      }

      const isImage = file.type.startsWith("image/");
      newItems.push({
        id: `item-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        originalSize: file.size,
        type: file.type || "application/octet-stream",
        isImage,
        progress: 0,
        status: "idle",
      });
    }

    setFileItems((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string) => {
    if (isUploading) return;
    setFileItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Upload file chunks via server proxy (avoids CORS issues with Google Drive)
  const uploadFileInChunks = async (
    item: FileUploadItem,
    uploadUrl: string,
    onProgressUpdate: (bytesUploaded: number, totalBytes: number) => void
  ): Promise<boolean> => {
    const targetFile = (!uploadOriginalQuality && item.compressedFile) || item.file;
    const totalBytes = targetFile.size;
    let startByte = 0;
    let attempts = 0;
    const maxAttempts = 3;

    while (startByte < totalBytes && attempts < maxAttempts) {
      const endByte = Math.min(startByte + CHUNK_SIZE, totalBytes);
      const chunk = targetFile.slice(startByte, endByte);
      const contentRange = `bytes ${startByte}-${endByte - 1}/${totalBytes}`;
      const proxyUrl = `/api/uploads/proxy?uploadUrl=${encodeURIComponent(uploadUrl)}&sessionId=${encodeURIComponent(item.sessionId || "")}`;

      try {
        const response = await fetch(proxyUrl, {
          method: "PUT",
          headers: { "Content-Range": contentRange },
          body: chunk,
        });

        if (response.status === 200 || response.status === 201) {
          onProgressUpdate(totalBytes, totalBytes);
          const data = await response.json().catch(() => null);
          if (data?.id) {
            item.driveFileId = data.id;
          }
          return true;
        } else if (response.status === 308) {
          const rangeHeader = response.headers.get("Range");
          if (rangeHeader) {
            const match = rangeHeader.match(/bytes=0-(\d+)/);
            if (match) {
              startByte = parseInt(match[1], 10) + 1;
            } else {
              startByte = endByte;
            }
          } else {
            startByte = endByte;
          }
          onProgressUpdate(startByte, totalBytes);
        } else {
          attempts++;
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) throw err;
        await new Promise((r) => setTimeout(r, 1500 * attempts));
      }
    }

    return startByte >= totalBytes;
  };

  // Main Upload Trigger
  const startUploadProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setOverallError(null);

    if (!selectedMadrasa) {
      setOverallError("Please select a madrasa.");
      return;
    }
    if (!title.trim()) {
      setOverallError("Please provide a title or topic.");
      return;
    }
    if (fileItems.length === 0) {
      setOverallError("Please attach at least one document or media file.");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Client-Side Image Compression (unless disabled)
      const preparedItems = [...fileItems];
      if (!uploadOriginalQuality) {
        for (let i = 0; i < preparedItems.length; i++) {
          const item = preparedItems[i];
          if (item.isImage && item.size > 200 * 1024) {
            try {
              item.status = "compressing";
              setFileItems([...preparedItems]);

              const compressed = await imageCompression(item.file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 1600,
                useWebWorker: true,
                initialQuality: 0.8,
              });

              item.compressedFile = compressed;
              item.size = compressed.size;
              item.status = "idle";
              setFileItems([...preparedItems]);
            } catch (compErr) {
              console.warn("Compression fallback to original:", compErr);
              item.status = "idle";
            }
          }
        }
      }

      // Step 2: Request Resumable Sessions from server (ZERO FILE BYTES SENT TO SERVER)
      const payload = {
        madrasaId: selectedMadrasa,
        title: title.trim(),
        description: description.trim(),
        category,
        eventDate,
        files: preparedItems.map((item) => ({
          name: item.name,
          size: (!uploadOriginalQuality && item.compressedFile?.size) || item.size,
          type: item.type,
        })),
      };

      const initRes = await fetch("/api/uploads/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!initRes.ok) {
        const errorData = await initRes.json();
        throw new Error(errorData.error || "Failed to initialize upload sessions.");
      }

      const initData = await initRes.json();
      const postId = initData.postId;
      setCreatedPostId(postId);

      // Match returned sessions to file items
      for (let i = 0; i < preparedItems.length; i++) {
        const session = initData.sessions[i];
        if (session) {
          preparedItems[i].uploadUrl = session.uploadUrl;
          preparedItems[i].sessionId = session.sessionId;
        }
      }
      setFileItems([...preparedItems]);

      // Step 3: Concurrency-Controlled Direct-to-Drive Chunk Uploads (max 2 concurrent)
      const queue = [...preparedItems];
      const concurrencyLimit = 2;
      let activeCount = 0;

      await new Promise<void>((resolve, reject) => {
        let index = 0;
        let hasErrors = false;

        const next = () => {
          if (index >= queue.length && activeCount === 0) {
            if (hasErrors) {
              reject(new Error("One or more files failed to upload."));
            } else {
              resolve();
            }
            return;
          }

          while (activeCount < concurrencyLimit && index < queue.length) {
            const currentItem = queue[index++];
            activeCount++;

            currentItem.status = "uploading";
            setFileItems([...preparedItems]);

            uploadFileInChunks(
              currentItem,
              currentItem.uploadUrl!,
              (uploaded, total) => {
                currentItem.progress = Math.round((uploaded / total) * 100);
                setFileItems([...preparedItems]);
              }
            )
              .then((success) => {
                activeCount--;
                if (success) {
                  currentItem.status = "complete";
                  currentItem.progress = 100;
                } else {
                  currentItem.status = "error";
                  currentItem.errorMessage = "Chunk transfer failed";
                  hasErrors = true;
                }
                setFileItems([...preparedItems]);
                next();
              })
              .catch((err) => {
                activeCount--;
                currentItem.status = "error";
                currentItem.errorMessage = err?.message || "Transfer error";
                hasErrors = true;
                setFileItems([...preparedItems]);
                next();
              });
          }
        };

        next();
      });

      // Step 4: Finalize Post & Persist _post.json / _post.txt
      const uploadedFiles = preparedItems
        .filter((item) => item.sessionId)
        .map((item) => ({
          sessionId: item.sessionId!,
          driveFileId: item.driveFileId,
        }));

      const finalRes = await fetch("/api/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          uploadedFiles,
        }),
      });

      if (!finalRes.ok) {
        const finalErr = await finalRes.json();
        throw new Error(finalErr.error || "Failed to finalize post records.");
      }

      setUploadComplete(true);
      if (onSuccess) onSuccess(postId);
    } catch (err: any) {
      console.error("Upload error:", err);
      setOverallError(err?.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  // Overall progress calculation
  const overallProgress =
    fileItems.length > 0
      ? Math.round(
          fileItems.reduce((acc, curr) => acc + curr.progress, 0) / fileItems.length
        )
      : 0;

  if (uploadComplete) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-10 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {t.upload.uploadComplete}
        </h3>
        <p className="text-slate-600 text-sm mb-6">
          Educational record files and metadata have been securely verified and archived in Google Drive. It is currently submitted for administrative review.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {createdPostId && (
            <Button
              variant="primary"
              onClick={() => router.push(`/posts/${createdPostId}`)}
            >
              View Uploaded Record
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setUploadComplete(false);
              setFileItems([]);
              setTitle("");
              setDescription("");
              setCreatedPostId(null);
            }}
          >
            Upload Another Record
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={startUploadProcess} className="space-y-6">
      {overallError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Upload Notice</p>
            <p>{overallError}</p>
          </div>
        </div>
      )}

      {/* Record Basic Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Madrasa Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
            {t.upload.selectMadrasa} *
          </label>
          <select
            value={selectedMadrasa}
            onChange={(e) => setSelectedMadrasa(e.target.value)}
            disabled={isUploading}
            className="w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            {madrasas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.city ? `(${m.city})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
            {t.upload.chooseCategory} *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isUploading}
            className="w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="photos">{t.post.category.photos}</option>
            <option value="results">{t.post.category.results}</option>
            <option value="tests">{t.post.category.tests}</option>
            <option value="resources">{t.post.category.resources}</option>
            <option value="attendance">{t.post.category.attendance}</option>
            <option value="activity">{t.post.category.activity}</option>
            <option value="other">{t.post.category.other}</option>
          </select>
        </div>

        {/* Event / Activity Date */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
            {t.upload.eventDate} *
          </label>
          <Input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={isUploading}
            required
          />
        </div>

        {/* Title */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
            {t.upload.postTitle} *
          </label>
          <Input
            placeholder="e.g. Annual Hifz Examination Results 2026 or Seerat Conference"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            required
            dir="auto"
          />
        </div>

        {/* Description / Notes */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
            {t.upload.postDescription}
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
            placeholder="Provide context, participant details, examiner remarks or summary..."
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
            dir="auto"
          />
        </div>
      </div>

      {/* Mobile-First File Dropzone & Picker */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900">{t.upload.uploadFiles}</h4>
            <p className="text-xs text-slate-500">
              PDFs, Images, Word, Excel, PowerPoint or MP4. Max 100 MB each (up to 20 files).
            </p>
          </div>

          {/* Original Quality Toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-slate-700 select-none">
            <input
              type="checkbox"
              checked={uploadOriginalQuality}
              onChange={(e) => setUploadOriginalQuality(e.target.checked)}
              disabled={isUploading}
              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700 w-4 h-4"
            />
            <span>{t.upload.uploadOriginal}</span>
          </label>
        </div>

        {/* Dropzone area */}
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!isUploading) handleFilesAdded(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
            isUploading
              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-60"
              : "border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,video/mp4"
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
            disabled={isUploading}
          />
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            {t.upload.browseFiles}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t.upload.dragDropText}
          </p>
          {!uploadOriginalQuality && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full text-[11px] font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Smart Mobile Compression Active (Fast & Data-saving)</span>
            </div>
          )}
        </div>

        {/* File Queue Items */}
        {fileItems.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>{fileItems.length} Files Selected</span>
              <span>
                Total Size:{" "}
                {formatBytes(
                  fileItems.reduce((acc, curr) => acc + (curr.compressedFile?.size || curr.size), 0)
                )}
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {fileItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      {item.isImage ? (
                        <ImageIcon className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <FileText className="w-5 h-5 text-sky-700" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{formatBytes(item.originalSize)}</span>
                        {item.compressedFile && (
                          <span className="text-emerald-700 font-semibold">
                            → {formatBytes(item.compressedFile.size)} (Compressed)
                          </span>
                        )}
                        {item.status === "compressing" && (
                          <span className="text-amber-600 font-medium">Optimizing...</span>
                        )}
                        {item.status === "error" && (
                          <span className="text-rose-600 font-medium">{item.errorMessage}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: progress and status */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {item.status === "uploading" && (
                      <div className="w-24 sm:w-32 flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 w-8 text-right">
                          {item.progress}%
                        </span>
                      </div>
                    )}

                    {item.status === "complete" && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </Badge>
                    )}

                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress & Submit Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="w-full sm:w-auto">
          {isUploading && (
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-700 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {t.upload.uploading} ({overallProgress}%)
                </p>
                <p className="text-xs text-slate-500">
                  Transferring chunked streams directly to Google Drive
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={() => router.back()}
          >
            {t.upload.cancel}
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isUploading}
            disabled={isUploading || fileItems.length === 0}
            className="w-full sm:w-auto px-6 py-2.5 text-base"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span>{isUploading ? t.upload.uploading : t.upload.startUpload}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
