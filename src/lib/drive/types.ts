import {
  DriveFileMetadata,
  DriveFolderMetadata,
  ResumableSessionOptions,
  ResumableSessionResult,
} from "@/types/drive";
import type { Readable } from "stream";

export interface IDriveAdapter {
  /**
   * Idempotently finds an existing folder by name and parentId, or creates it.
   */
  findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<DriveFolderMetadata>;

  /**
   * Initializes a Google Drive resumable upload session.
   * Returns the direct upload URL that the browser will send chunked PUT requests to.
   */
  createResumableUploadSession(options: ResumableSessionOptions): Promise<ResumableSessionResult>;

  /**
   * Verifies that a file was successfully uploaded to Google Drive, has valid size, and is accessible.
   */
  verifyFile(fileId: string, expectedSize?: number): Promise<DriveFileMetadata | null>;

  /**
   * Directly uploads small text or json metadata files (e.g. _post.json, _post.txt)
   */
  uploadBufferOrString(
    fileName: string,
    content: string | Buffer,
    mimeType: string,
    parentFolderId: string,
    description?: string,
    appProperties?: Record<string, string>
  ): Promise<DriveFileMetadata>;

  /**
   * Gets metadata for a specific file.
   */
  getFileMetadata(fileId: string): Promise<DriveFileMetadata | null>;

  /**
   * Retrieves a readable stream for a file (used by authenticated thumbnail proxy).
   */
  getFileStream(fileId: string): Promise<{ stream: Readable; mimeType: string; size?: number }>;

  /**
   * Deletes or trashes a file or folder in Google Drive.
   */
  deleteFile(fileId: string): Promise<boolean>;
}
