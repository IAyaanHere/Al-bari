import { generateSlug, sanitizeFilename } from "../utils";

export interface PostFolderPathParts {
  rootFolderName: string;
  madrasaName: string;
  year: string;
  month: string;
  category: string;
  postFolderName: string;
}

export function buildPostFolderPathParts(options: {
  madrasaName: string;
  eventDate: string | Date;
  category: string;
  title: string;
  postId: string;
  rootFolderName?: string;
}): PostFolderPathParts {
  const rootFolderName = options.rootFolderName || "Al Bari Organization Data";
  const date = typeof options.eventDate === "string" ? new Date(options.eventDate) : options.eventDate;
  
  const yyyy = isNaN(date.getTime())
    ? new Date().getFullYear().toString()
    : date.getFullYear().toString();
  const mm = isNaN(date.getTime())
    ? String(new Date().getMonth() + 1).padStart(2, "0")
    : String(date.getMonth() + 1).padStart(2, "0");
  const dd = isNaN(date.getTime())
    ? String(new Date().getDate()).padStart(2, "0")
    : String(date.getDate()).padStart(2, "0");

  const cleanMadrasa = sanitizeFilename(options.madrasaName || "Unknown Madrasa");
  const cleanCategory = (options.category || "other").toLowerCase();
  const slug = generateSlug(options.title || "post");
  const shortId = (options.postId || "new").slice(0, 8);
  const postFolderName = `${yyyy}-${mm}-${dd}_${slug}_${shortId}`;

  return {
    rootFolderName,
    madrasaName: cleanMadrasa,
    year: yyyy,
    month: mm,
    category: cleanCategory,
    postFolderName,
  };
}

/**
 * Creates prefixed file name for sequential storage
 * e.g. "01_exam-paper.pdf"
 */
export function buildDriveFileName(index: number, originalName: string): string {
  const cleanName = sanitizeFilename(originalName);
  const prefix = String(index + 1).padStart(2, "0");
  return `${prefix}_${cleanName}`;
}
