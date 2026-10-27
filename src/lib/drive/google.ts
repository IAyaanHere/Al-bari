import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";
import { IDriveAdapter } from "./types";
import {
  DriveFileMetadata,
  DriveFolderMetadata,
  ResumableSessionOptions,
  ResumableSessionResult,
} from "@/types/drive";

// In-memory cache for folder metadata to eliminate redundant Google Drive API roundtrips
const folderCache = new Map<string, DriveFolderMetadata>();

export class GoogleDriveAdapter implements IDriveAdapter {
  private drive: drive_v3.Drive;
  private oauth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        "Google Drive credentials missing. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN."
      );
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    this.drive = google.drive({ version: "v3", auth: this.oauth2Client });

    // Seed root folder cache if configured
    const rootId = process.env.DRIVE_ROOT_FOLDER_ID;
    if (rootId) {
      folderCache.set("root:Al Bari Organization Data", {
        id: rootId,
        name: "Al Bari Organization Data",
      });
    }
  }

  async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<DriveFolderMetadata> {
    const rootId = parentFolderId || process.env.DRIVE_ROOT_FOLDER_ID || "root";
    const cacheKey = `${rootId}:${folderName.trim()}`;

    // Return cached folder immediately (0ms)
    const cached = folderCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Direct match if root folder requested
    if (folderName === "Al Bari Organization Data" && process.env.DRIVE_ROOT_FOLDER_ID) {
      const rootMeta = { id: process.env.DRIVE_ROOT_FOLDER_ID, name: folderName };
      folderCache.set(cacheKey, rootMeta);
      return rootMeta;
    }

    const escapedName = folderName.replace(/'/g, "\\'");
    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and '${rootId}' in parents and trashed = false`;

    try {
      const res = await this.drive.files.list({
        q: query,
        fields: "files(id, name, parents)",
        spaces: "drive",
        pageSize: 1,
      });

      if (res.data.files && res.data.files.length > 0) {
        const folder = res.data.files[0];
        const result: DriveFolderMetadata = {
          id: folder.id!,
          name: folder.name!,
          parentId: folder.parents ? folder.parents[0] : undefined,
        };
        folderCache.set(cacheKey, result);
        return result;
      }

      // Create folder if not found
      const createRes = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [rootId],
        },
        fields: "id, name, parents",
      });

      const result: DriveFolderMetadata = {
        id: createRes.data.id!,
        name: createRes.data.name!,
        parentId: createRes.data.parents ? createRes.data.parents[0] : rootId,
      };
      folderCache.set(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error(`Error in findOrCreateFolder (${folderName}):`, error?.message || error);
      throw new Error(`Google Drive folder error: ${error?.message || "Unknown error"}`);
    }
  }

  async createResumableUploadSession(options: ResumableSessionOptions): Promise<ResumableSessionResult> {
    try {
      const tokenResponse = await this.oauth2Client.getAccessToken();
      const accessToken = tokenResponse.token;

      if (!accessToken) {
        throw new Error("Unable to obtain Google OAuth access token.");
      }

      const metadata = {
        name: options.fileName,
        parents: [options.parentFolderId],
        description: options.description || "",
        appProperties: options.appProperties || {},
      };

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": options.mimeType,
        "X-Upload-Content-Length": options.fileSize.toString(),
      };

      if (options.origin) {
        headers["Origin"] = options.origin;
      }

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
        method: "POST",
        headers,
        body: JSON.stringify(metadata),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to initiate Google Drive upload session: ${res.status} ${errText}`);
      }

      const uploadUrl = res.headers.get("location");
      if (!uploadUrl) {
        throw new Error("Google Drive did not return a resumable upload location header.");
      }

      // Extract session ID or generate deterministic reference
      const urlObj = new URL(uploadUrl);
      const uploadId = urlObj.searchParams.get("upload_id") || `gdrive-${Date.now()}`;

      return {
        uploadUrl,
        sessionId: uploadId,
      };
    } catch (error: any) {
      console.error("Error creating resumable upload session:", error?.message || error);
      throw error;
    }
  }

  async verifyFile(fileId: string, expectedSize?: number): Promise<DriveFileMetadata | null> {
    try {
      const res = await this.drive.files.get({
        fileId,
        fields: "id, name, mimeType, size, description, appProperties, webContentLink, webViewLink, thumbnailLink",
      });

      if (!res.data.id) return null;

      const size = res.data.size ? parseInt(res.data.size, 10) : undefined;
      if (expectedSize !== undefined && size !== undefined && size !== expectedSize) {
        console.warn(`File size mismatch for ${fileId}: expected ${expectedSize}, got ${size}`);
      }

      return {
        id: res.data.id,
        name: res.data.name || "unnamed",
        mimeType: res.data.mimeType || "application/octet-stream",
        size,
        description: res.data.description || undefined,
        appProperties: (res.data.appProperties as Record<string, string>) || undefined,
        webContentLink: res.data.webContentLink || undefined,
        webViewLink: res.data.webViewLink || undefined,
        thumbnailLink: res.data.thumbnailLink || undefined,
      };
    } catch (error: any) {
      console.error(`Error verifying file ${fileId}:`, error?.message || error);
      return null;
    }
  }

  async uploadBufferOrString(
    fileName: string,
    content: string | Buffer,
    mimeType: string,
    parentFolderId: string,
    description?: string,
    appProperties?: Record<string, string>
  ): Promise<DriveFileMetadata> {
    try {
      const buffer = typeof content === "string" ? Buffer.from(content, "utf-8") : content;
      const stream = Readable.from(buffer);

      const res = await this.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [parentFolderId],
          description,
          appProperties,
        },
        media: {
          mimeType,
          body: stream,
        },
        fields: "id, name, mimeType, size, description, appProperties",
      });

      return {
        id: res.data.id!,
        name: res.data.name!,
        mimeType: res.data.mimeType || mimeType,
        size: res.data.size ? parseInt(res.data.size, 10) : buffer.length,
        description: res.data.description || undefined,
        appProperties: (res.data.appProperties as Record<string, string>) || undefined,
      };
    } catch (error: any) {
      console.error(`Error uploading buffer ${fileName}:`, error?.message || error);
      throw error;
    }
  }

  async getFileMetadata(fileId: string): Promise<DriveFileMetadata | null> {
    return this.verifyFile(fileId);
  }

  async getFileStream(
    fileId: string,
    knownMime?: string,
    knownSize?: number
  ): Promise<{ stream: Readable; mimeType: string; size?: number }> {
    try {
      // If mimeType is already known from DB, avoid redundant getFileMetadata network call
      const mime = knownMime || (await this.getFileMetadata(fileId))?.mimeType || "application/octet-stream";
      const res = await this.drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );

      return {
        stream: res.data as Readable,
        mimeType: mime,
        size: knownSize,
      };
    } catch (error: any) {
      console.error(`Error streaming file ${fileId}:`, error?.message || error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      await this.drive.files.delete({ fileId });
      return true;
    } catch (error: any) {
      console.error(`Error deleting file ${fileId}:`, error?.message || error);
      return false;
    }
  }
}
