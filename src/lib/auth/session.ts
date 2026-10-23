import { createServerSupabaseClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { Profile, AppRole, Post } from "@/types/database";

export async function getCurrentUser() {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const adminClient = createAdminClient();
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;
  return profile as Profile;
}

export async function requireAuth(): Promise<{ user: any; profile: Profile }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Unauthorized: Profile not found.");
  }

  if (!profile.active) {
    throw new Error("Forbidden: Account has been deactivated. Please contact administrator.");
  }

  return { user, profile };
}

export async function requireAdmin(): Promise<{ user: any; profile: Profile }> {
  const { user, profile } = await requireAuth();
  if (profile.role !== "admin") {
    throw new Error("Forbidden: Administrator privileges required.");
  }
  return { user, profile };
}

export async function requireTeacherOrAdmin(): Promise<{ user: any; profile: Profile }> {
  const { user, profile } = await requireAuth();
  if (profile.role !== "admin" && profile.role !== "teacher") {
    throw new Error("Forbidden: Teacher or Administrator access required.");
  }
  return { user, profile };
}

/**
 * Validates that teacher has permission to upload or manage posts for the specified madrasa.
 * Admins are permitted for all active madrasas.
 */
export async function validateMadrasaAccess(
  teacherId: string,
  role: AppRole,
  madrasaId: string
): Promise<{ allowed: boolean; error?: string }> {
  const adminClient = createAdminClient();

  // Check madrasa exists and is active
  const { data: madrasa, error: madrasaError } = await adminClient
    .from("madrasas")
    .select("id, name, active")
    .eq("id", madrasaId)
    .single();

  if (madrasaError || !madrasa) {
    return { allowed: false, error: "Madrasa not found." };
  }

  if (!madrasa.active) {
    return { allowed: false, error: "This madrasa is deactivated. Uploads are closed." };
  }

  if (role === "admin") {
    return { allowed: true };
  }

  // Teacher check: must have entry in teacher_madrasas
  const { data: assignment, error: assignmentError } = await adminClient
    .from("teacher_madrasas")
    .select("teacher_id, madrasa_id")
    .eq("teacher_id", teacherId)
    .eq("madrasa_id", madrasaId)
    .single();

  if (assignmentError || !assignment) {
    return { allowed: false, error: "Teacher is not assigned to this madrasa." };
  }

  return { allowed: true };
}

/**
 * Checks if a user is allowed to view a post.
 * Public users can only view non-deleted, approved, public posts from active madrasas.
 * Teachers can view their own posts.
 * Admins can view all posts.
 */
export function canViewPost(
  post: Post,
  userProfile?: Profile | null
): boolean {
  if (post.deleted_at) {
    return userProfile?.role === "admin";
  }

  // Admin can always view
  if (userProfile?.role === "admin") {
    return true;
  }

  // Teacher who owns the post can view
  if (userProfile && userProfile.id === post.teacher_id) {
    return true;
  }

  // Public visibility rules
  const isApproved = post.approval_status === "approved";
  const isPublic = post.visibility === "public";
  const isMadrasaActive = !post.madrasa || post.madrasa.active !== false;

  return isApproved && isPublic && isMadrasaActive;
}
