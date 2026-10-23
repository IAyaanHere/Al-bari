import { describe, it, expect } from "vitest";
import {
  normalizeUsername,
  isValidUsername,
  usernameToInternalEmail,
  INTERNAL_EMAIL_DOMAIN,
} from "@/lib/auth/username";
import { canViewPost } from "@/lib/auth/session";
import { Post, Profile } from "@/types/database";

describe("Authentication & RBAC Rules", () => {
  describe("Username System", () => {
    it("normalizes usernames to lowercase and strips invalid chars", () => {
      expect(normalizeUsername("  Tariq_Ahmad.123  ")).toBe("tariq_ahmad.123");
      expect(normalizeUsername("Zayd@#$Khan")).toBe("zaydkhan");
    });

    it("validates username rules (3-30 chars)", () => {
      expect(isValidUsername("tariq_ahmad")).toBe(true);
      expect(isValidUsername("ab")).toBe(false); // too short
      expect(isValidUsername("a".repeat(35))).toBe(false); // too long
      expect(isValidUsername("_leading")).toBe(false); // must start with letter or digit
    });

    it("generates secured internal email identity from username", () => {
      expect(usernameToInternalEmail("tariq_ahmad")).toBe(`tariq_ahmad@${INTERNAL_EMAIL_DOMAIN}`);
    });
  });

  describe("canViewPost RBAC", () => {
    const approvedPublicPost: Post = {
      id: "post-1",
      madrasa_id: "m-1",
      teacher_id: "teacher-1",
      title: "Approved Public Record",
      description: "Description",
      category: "results",
      event_date: "2026-10-23",
      drive_folder_id: "folder-1",
      status: "complete",
      visibility: "public",
      approval_status: "approved",
      approved_by: "admin-1",
      approved_at: "2026-10-23T10:00:00Z",
      deleted_at: null,
      created_at: "2026-10-23T09:00:00Z",
      madrasa: {
        id: "m-1",
        name: "Madrasa A",
        city: "City",
        contact_person: "Person",
        drive_folder_id: "folder-m",
        active: true,
        created_at: "2026-01-01",
      },
    };

    const pendingPrivatePost: Post = {
      ...approvedPublicPost,
      id: "post-2",
      visibility: "private",
      approval_status: "pending",
    };

    const deletedPost: Post = {
      ...approvedPublicPost,
      id: "post-3",
      deleted_at: "2026-10-23T11:00:00Z",
    };

    const deactivatedMadrasaPost: Post = {
      ...approvedPublicPost,
      id: "post-4",
      madrasa: {
        ...approvedPublicPost.madrasa!,
        active: false,
      },
    };

    const adminProfile: Profile = {
      id: "admin-1",
      full_name: "Admin User",
      username: "admin",
      role: "admin",
      active: true,
      created_at: "2026-01-01",
    };

    const ownerTeacherProfile: Profile = {
      id: "teacher-1",
      full_name: "Owner Teacher",
      username: "owner_teacher",
      role: "teacher",
      active: true,
      created_at: "2026-01-01",
    };

    const otherTeacherProfile: Profile = {
      id: "teacher-2",
      full_name: "Other Teacher",
      username: "other_teacher",
      role: "teacher",
      active: true,
      created_at: "2026-01-01",
    };

    it("allows public visitors to view approved public posts from active madrasas", () => {
      expect(canViewPost(approvedPublicPost, null)).toBe(true);
    });

    it("blocks public visitors from viewing pending or private posts", () => {
      expect(canViewPost(pendingPrivatePost, null)).toBe(false);
    });

    it("blocks public visitors from viewing posts belonging to deactivated madrasas", () => {
      expect(canViewPost(deactivatedMadrasaPost, null)).toBe(false);
    });

    it("blocks public visitors from viewing soft-deleted posts", () => {
      expect(canViewPost(deletedPost, null)).toBe(false);
    });

    it("allows owning teacher to view their own pending/private post", () => {
      expect(canViewPost(pendingPrivatePost, ownerTeacherProfile)).toBe(true);
    });

    it("blocks other teachers from viewing someone else's pending/private post", () => {
      expect(canViewPost(pendingPrivatePost, otherTeacherProfile)).toBe(false);
    });

    it("allows admin to view any post including pending, private, and soft-deleted", () => {
      expect(canViewPost(approvedPublicPost, adminProfile)).toBe(true);
      expect(canViewPost(pendingPrivatePost, adminProfile)).toBe(true);
      expect(canViewPost(deletedPost, adminProfile)).toBe(true);
      expect(canViewPost(deactivatedMadrasaPost, adminProfile)).toBe(true);
    });
  });
});
