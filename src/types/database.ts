export type AppRole = 'admin' | 'teacher' | 'viewer';

export type PostCategory =
  | 'photos'
  | 'results'
  | 'tests'
  | 'resources'
  | 'attendance'
  | 'activity'
  | 'other';

export type PostVisibility = 'public' | 'private';

export type PostApprovalStatus = 'pending' | 'approved' | 'rejected';

export type UploadSessionStatus = 'pending' | 'uploading' | 'complete' | 'failed';

export interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  role: AppRole;
  active: boolean;
  must_change_password?: boolean;
  created_at: string;
}

export interface Madrasa {
  id: string;
  name: string;
  city: string | null;
  contact_person: string | null;
  drive_folder_id: string | null;
  active: boolean;
  created_at: string;
}

export interface TeacherMadrasa {
  teacher_id: string;
  madrasa_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  madrasa_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  category: PostCategory;
  event_date: string;
  drive_folder_id: string | null;
  status: 'pending' | 'complete' | 'incomplete';
  visibility: PostVisibility;
  approval_status: PostApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  deleted_at: string | null;
  created_at: string;
  // Joined relation fields
  madrasa?: Madrasa;
  teacher?: Profile;
  files?: PostFile[];
}

export interface PostFile {
  id: string;
  post_id: string;
  drive_file_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface UploadSession {
  id: string;
  post_id: string;
  owner_id: string;
  drive_file_id: string | null;
  expected_size: number;
  mime_type: string | null;
  original_name: string;
  status: UploadSessionStatus;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}
