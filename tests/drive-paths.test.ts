import { describe, it, expect } from "vitest";
import { buildPostFolderPathParts, buildDriveFileName } from "@/lib/drive/path";
import { generatePostJson, generatePostTxt, buildFileAppProperties } from "@/lib/drive/metadata";

describe("Drive Path & Metadata Engine", () => {
  it("builds correct hierarchical folder structure parts", () => {
    const parts = buildPostFolderPathParts({
      madrasaName: "Madrasa Darul Uloom",
      eventDate: "2026-10-23",
      category: "results",
      title: "Quarterly Examination",
      postId: "12345678-abcd-ef01-2345-6789abcdef01",
    });

    expect(parts.rootFolderName).toBe("Al Bari Organization Data");
    expect(parts.madrasaName).toBe("Madrasa Darul Uloom");
    expect(parts.year).toBe("2026");
    expect(parts.month).toBe("10");
    expect(parts.category).toBe("results");
    expect(parts.postFolderName).toContain("2026-10-23_quarterly-examination_12345678");
  });

  it("builds sequential prefixed filenames correctly", () => {
    expect(buildDriveFileName(0, "marks.xlsx")).toBe("01_marks.xlsx");
    expect(buildDriveFileName(1, "photo.jpg")).toBe("02_photo.jpg");
    expect(buildDriveFileName(9, "certificate.pdf")).toBe("10_certificate.pdf");
  });

  it("builds appProperties with all required metadata fields", () => {
    const props = buildFileAppProperties({
      postId: "post-101",
      madrasaId: "madrasa-202",
      teacherId: "teacher-303",
      category: "tests",
    });

    expect(props).toEqual({
      postId: "post-101",
      madrasaId: "madrasa-202",
      teacherId: "teacher-303",
      category: "tests",
      source: "AlBariHub",
    });
  });

  it("generates valid _post.json string parseable as JSON", () => {
    const meta = {
      postId: "p-1",
      title: "Test",
      description: "Sample",
      madrasa: { id: "m-1", name: "Madrasa A" },
      teacher: { id: "t-1", name: "Teacher A" },
      category: "results",
      eventDate: "2026-10-23",
      createdAt: "2026-10-23T12:00:00Z",
      files: [
        {
          name: "01_paper.pdf",
          driveFileId: "drive-1",
          mimeType: "application/pdf",
          sizeBytes: 1024,
        },
      ],
    };

    const jsonString = generatePostJson(meta);
    const parsed = JSON.parse(jsonString);

    expect(parsed.postId).toBe("p-1");
    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0].driveFileId).toBe("drive-1");
  });

  it("generates human-readable _post.txt summary", () => {
    const txt = generatePostTxt({
      title: "Tajweed Workshop",
      description: "Recitation guidelines",
      madrasaName: "Madrasa A",
      teacherName: "Qari Zayd",
      category: "resources",
      eventDate: "2026-10-23",
      createdAt: "2026-10-23T12:00:00Z",
      fileCount: 2,
    });

    expect(txt).toContain("AL BARI ORGANIZATION HUB");
    expect(txt).toContain("Tajweed Workshop");
    expect(txt).toContain("Qari Zayd");
  });
});
