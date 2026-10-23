import { describe, it, expect } from "vitest";
import {
  generateSlug,
  sanitizeFilename,
  validateFileMeta,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_POST,
} from "@/lib/utils";

describe("Utils & Validation", () => {
  describe("generateSlug", () => {
    it("generates clean hyphenated slug for English text", () => {
      expect(generateSlug("Annual Examination Results 2026")).toBe("annual-examination-results-2026");
    });

    it("preserves Urdu and Arabic Unicode characters", () => {
      const urduTitle = "امتحان سالانہ ۲۰۲۶";
      const slug = generateSlug(urduTitle);
      expect(slug).toContain("امتحان");
      expect(slug).not.toContain(" ");
    });

    it("preserves Hindi Devanagari characters", () => {
      const hindiTitle = "वार्षिक परीक्षा परिणाम";
      const slug = generateSlug(hindiTitle);
      expect(slug).toContain("वार");
      expect(slug).not.toContain(" ");
    });

    it("handles punctuation and special characters safely", () => {
      expect(generateSlug("Hifz Test: Class 10 (Final!)")).toBe("hifz-test-class-10-final");
    });

    it("handles empty or whitespace strings with fallback", () => {
      expect(generateSlug("")).toBe("post");
      expect(generateSlug("   ")).toBe("item");
    });
  });

  describe("sanitizeFilename", () => {
    it("strips directory traversal paths", () => {
      expect(sanitizeFilename("../../etc/passwd.pdf")).toBe("passwd.pdf");
      expect(sanitizeFilename("..\\..\\windows\\system32.docx")).toBe("system32.docx");
    });

    it("replaces illegal filesystem characters", () => {
      expect(sanitizeFilename('test<file>:name"*.pdf')).toBe("test_file__name__.pdf");
    });

    it("preserves standard extensions and clean names", () => {
      expect(sanitizeFilename("hifz_results_2026.xlsx")).toBe("hifz_results_2026.xlsx");
    });
  });

  describe("validateFileMeta", () => {
    it("allows valid PDF within size limit", () => {
      const res = validateFileMeta("exam.pdf", "application/pdf", 5 * 1024 * 1024);
      expect(res.valid).toBe(true);
    });

    it("allows valid images (JPEG, PNG, WebP)", () => {
      expect(validateFileMeta("photo.jpg", "image/jpeg", 2 * 1024 * 1024).valid).toBe(true);
      expect(validateFileMeta("photo.webp", "image/webp", 1 * 1024 * 1024).valid).toBe(true);
    });

    it("allows Excel and Word files", () => {
      expect(validateFileMeta("marks.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 500000).valid).toBe(true);
      expect(validateFileMeta("paper.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 500000).valid).toBe(true);
    });

    it("rejects files exceeding 100MB limit", () => {
      const res = validateFileMeta("video.mp4", "video/mp4", 101 * 1024 * 1024);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("100MB");
    });

    it("rejects empty files (0 bytes)", () => {
      const res = validateFileMeta("empty.pdf", "application/pdf", 0);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("empty");
    });

    it("rejects forbidden extensions (.exe, .bat, .sh)", () => {
      expect(validateFileMeta("malware.exe", "application/octet-stream", 1000).valid).toBe(false);
      expect(validateFileMeta("script.sh", "application/x-sh", 1000).valid).toBe(false);
    });
  });

  describe("formatBytes", () => {
    it("formats 0 correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("formats Kilobytes, Megabytes, Gigabytes", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
      expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
    });
  });
});
