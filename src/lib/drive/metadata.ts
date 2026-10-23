import { PostJsonMetadata } from "@/types/drive";

export function generatePostJson(data: PostJsonMetadata): string {
  return JSON.stringify(data, null, 2);
}

export function generatePostTxt(data: {
  title: string;
  description?: string | null;
  madrasaName: string;
  teacherName: string;
  category: string;
  eventDate: string;
  createdAt: string;
  fileCount: number;
}): string {
  return `=====================================================
AL BARI ORGANIZATION HUB - EDUCATIONAL RECORD
=====================================================
Title:        ${data.title}
Madrasa:      ${data.madrasaName}
Teacher:      ${data.teacherName}
Category:     ${data.category.toUpperCase()}
Event Date:   ${data.eventDate}
Recorded At:  ${data.createdAt}
File Count:   ${data.fileCount}
=====================================================

DESCRIPTION / NOTES:
${data.description || "No detailed description provided."}

=====================================================
Archived for Al Bari Organization Islamic Education Foundation
Stored securely in Organization Google Drive.
=====================================================`;
}

export function buildFileAppProperties(params: {
  postId: string;
  madrasaId: string;
  teacherId: string;
  category: string;
}): Record<string, string> {
  return {
    postId: params.postId,
    madrasaId: params.madrasaId,
    teacherId: params.teacherId,
    category: params.category,
    source: "AlBariHub",
  };
}
