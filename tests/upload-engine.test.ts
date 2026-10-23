import { describe, it, expect } from "vitest";
import { MockDriveAdapter } from "@/lib/drive/mock";

describe("Upload Engine & Mock Adapter", () => {
  const adapter = new MockDriveAdapter();

  it("generates deterministic and idempotent folder IDs across separate invocations", async () => {
    const folderA1 = await adapter.findOrCreateFolder("Darul Uloom", "root");
    const folderA2 = await adapter.findOrCreateFolder("Darul Uloom", "root");

    expect(folderA1.id).toBe(folderA2.id);
    expect(folderA1.id).toMatch(/^mock_folder_[a-f0-9]{16}$/);

    const folderB = await adapter.findOrCreateFolder("Other Branch", "root");
    expect(folderB.id).not.toBe(folderA1.id);
  });

  it("creates a resumable upload session returning chunk endpoint and session ID", async () => {
    const session = await adapter.createResumableUploadSession({
      fileName: "01_test.pdf",
      mimeType: "application/pdf",
      fileSize: 1048576,
      parentFolderId: "folder-123",
    });

    expect(session.uploadUrl).toContain("/api/uploads/chunk");
    expect(session.uploadUrl).toContain("fileName=01_test.pdf");
    expect(session.uploadUrl).toContain("expectedSize=1048576");
    expect(session.sessionId).toContain("mock_session_");
    expect(session.driveFileId).toContain("mock_drive_file_");
  });

  it("verifies file metadata idempotently", async () => {
    const fileId = "mock_drive_file_abc123";
    const verified = await adapter.verifyFile(fileId, 2048);

    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(fileId);
    expect(verified?.size).toBe(2048);
    expect(verified?.appProperties?.mock).toBe("true");
  });

  it("uploads small text or json metadata buffer", async () => {
    const content = JSON.stringify({ key: "val" });
    const meta = await adapter.uploadBufferOrString(
      "_post.json",
      content,
      "application/json",
      "folder-123"
    );

    expect(meta.name).toBe("_post.json");
    expect(meta.mimeType).toBe("application/json");
    expect(meta.size).toBe(Buffer.byteLength(content));
  });
});
