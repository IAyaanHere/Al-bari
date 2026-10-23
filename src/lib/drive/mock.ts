import crypto from "crypto";
import { Readable } from "stream";
import { IDriveAdapter } from "./types";
import {
  DriveFileMetadata,
  DriveFolderMetadata,
  ResumableSessionOptions,
  ResumableSessionResult,
} from "@/types/drive";

export class MockDriveAdapter implements IDriveAdapter {
  private generateDeterministicFolderId(name: string, parentId?: string): string {
    const hash = crypto
      .createHash("md5")
      .update(`${parentId || "root"}:${name.trim().toLowerCase()}`)
      .digest("hex")
      .slice(0, 16);
    return `mock_folder_${hash}`;
  }

  async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<DriveFolderMetadata> {
    const folderId = this.generateDeterministicFolderId(folderName, parentFolderId);
    return {
      id: folderId,
      name: folderName,
      parentId: parentFolderId || "root",
    };
  }

  async createResumableUploadSession(options: ResumableSessionOptions): Promise<ResumableSessionResult> {
    const sessionId = `mock_session_${crypto.randomUUID()}`;
    const fileId = `mock_drive_file_${crypto.randomUUID()}`;

    // Return the local mock chunk endpoint as upload URL
    const uploadUrl = `/api/uploads/chunk?sessionId=${sessionId}&fileId=${fileId}&expectedSize=${options.fileSize}&fileName=${encodeURIComponent(
      options.fileName
    )}&mimeType=${encodeURIComponent(options.mimeType)}`;

    return {
      uploadUrl,
      sessionId,
      driveFileId: fileId,
    };
  }

  async verifyFile(fileId: string, expectedSize?: number): Promise<DriveFileMetadata | null> {
    if (!fileId) return null;

    return {
      id: fileId,
      name: `mock_file_${fileId.slice(-8)}`,
      mimeType: "application/octet-stream",
      size: expectedSize || 1024 * 1024,
      description: "Mock Drive File for testing",
      appProperties: {
        mock: "true",
        verifiedAt: new Date().toISOString(),
      },
      webContentLink: `https://mock-drive.local/files/${fileId}/download`,
      webViewLink: `https://mock-drive.local/files/${fileId}/view`,
      thumbnailLink: `https://mock-drive.local/files/${fileId}/thumb`,
    };
  }

  async uploadBufferOrString(
    fileName: string,
    content: string | Buffer,
    mimeType: string,
    parentFolderId: string,
    description?: string,
    appProperties?: Record<string, string>
  ): Promise<DriveFileMetadata> {
    const size = typeof content === "string" ? Buffer.byteLength(content, "utf8") : content.length;
    const fileId = `mock_meta_${crypto.randomUUID()}`;

    return {
      id: fileId,
      name: fileName,
      mimeType,
      size,
      parents: [parentFolderId],
      description,
      appProperties: {
        ...(appProperties || {}),
        mock: "true",
      },
    };
  }

  async getFileMetadata(fileId: string): Promise<DriveFileMetadata | null> {
    return this.verifyFile(fileId);
  }

  async getFileStream(fileId: string): Promise<{ stream: Readable; mimeType: string; size?: number }> {
    // Generate a minimal 1x1 green PNG placeholder stream for image preview mocks
    const png1x1 = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    return {
      stream: Readable.from(png1x1),
      mimeType: "image/png",
      size: png1x1.length,
    };
  }

  async deleteFile(_fileId: string): Promise<boolean> {
    return true;
  }
}
