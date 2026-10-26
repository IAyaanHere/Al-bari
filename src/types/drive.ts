export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  parents?: string[];
  description?: string;
  appProperties?: Record<string, string>;
  webContentLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export interface DriveFolderMetadata {
  id: string;
  name: string;
  parentId?: string;
}

export interface ResumableSessionOptions {
  fileName: string;
  mimeType: string;
  fileSize: number;
  parentFolderId: string;
  description?: string;
  appProperties?: Record<string, string>;
  origin?: string;
}

export interface ResumableSessionResult {
  uploadUrl: string;
  sessionId: string;
  driveFileId?: string;
}

export interface PostJsonMetadata {
  postId: string;
  title: string;
  description: string;
  madrasa: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  category: string;
  eventDate: string;
  createdAt: string;
  files: Array<{
    name: string;
    driveFileId: string;
    mimeType: string;
    sizeBytes: number;
  }>;
}
