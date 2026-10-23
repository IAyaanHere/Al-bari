-- Al Bari Organization Hub: Initial Schema Migration
-- Migration: 001_init.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'teacher', 'viewer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_category') THEN
    CREATE TYPE post_category AS ENUM ('photos', 'results', 'tests', 'resources', 'attendance', 'activity', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_visibility') THEN
    CREATE TYPE post_visibility AS ENUM ('public', 'private');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_approval_status') THEN
    CREATE TYPE post_approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'upload_session_status') THEN
    CREATE TYPE upload_session_status AS ENUM ('pending', 'uploading', 'complete', 'failed');
  END IF;
END $$;

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  role app_role NOT NULL DEFAULT 'teacher',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Madrasas table
CREATE TABLE IF NOT EXISTS madrasas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  city TEXT,
  contact_person TEXT,
  drive_folder_id TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Teacher Madrasas Assignment
CREATE TABLE IF NOT EXISTS teacher_madrasas (
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (teacher_id, madrasa_id)
);

-- 4. Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  category post_category NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  drive_folder_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'incomplete')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Post Files table
CREATE TABLE IF NOT EXISTS post_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. App Settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Upload Sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  drive_file_id TEXT,
  expected_size BIGINT,
  mime_type TEXT,
  original_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'complete', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_madrasa ON posts(madrasa_id);
CREATE INDEX IF NOT EXISTS idx_posts_teacher ON posts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_event_date ON posts(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_approval_visibility ON posts(approval_status, visibility);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_files_post_id ON post_files(post_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_post_id ON upload_sessions(post_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_owner_id ON upload_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_teacher_madrasas_madrasa_id ON teacher_madrasas(madrasa_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE madrasas ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_madrasas ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security definer functions to prevent recursive RLS checks
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() AND active = true LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION is_teacher_assigned_to_madrasa(p_madrasa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teacher_madrasas
    WHERE teacher_id = auth.uid()
      AND madrasa_id = p_madrasa_id
  );
$$;

-- RLS POLICIES

-- PROFILES
-- 1. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- 2. Authenticated users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 3. Public can read teacher full_name for public posts (limited view)
CREATE POLICY "Public can view active profiles limited"
  ON profiles FOR SELECT
  TO anon
  USING (active = true);

-- 4. Admins can update profiles
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 5. Users can update own profile (except role)
CREATE POLICY "Users can update own profile limited"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- MADRASAS
-- 1. Public can view active madrasas
CREATE POLICY "Public can view active madrasas"
  ON madrasas FOR SELECT
  TO anon, authenticated
  USING (active = true OR is_admin());

-- 2. Admins can manage all madrasas
CREATE POLICY "Admins can insert madrasas"
  ON madrasas FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update madrasas"
  ON madrasas FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- TEACHER MADRASAS
-- 1. Teachers can see their own assignments
CREATE POLICY "Teachers can view own assignments"
  ON teacher_madrasas FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() OR is_admin());

-- 2. Admins can manage teacher assignments
CREATE POLICY "Admins can insert teacher assignments"
  ON teacher_madrasas FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete teacher assignments"
  ON teacher_madrasas FOR DELETE
  TO authenticated
  USING (is_admin());

-- POSTS
-- 1. Public can view approved, public, non-deleted posts from active madrasas
CREATE POLICY "Public can view approved public posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND approval_status = 'approved'
    AND visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM madrasas
      WHERE madrasas.id = posts.madrasa_id
        AND madrasas.active = true
    )
  );

-- 2. Teachers can view their own non-deleted posts
CREATE POLICY "Teachers can view own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() AND deleted_at IS NULL);

-- 3. Admins can view all posts
CREATE POLICY "Admins can view all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (is_admin());

-- 4. Teachers can insert posts for assigned, active madrasas
CREATE POLICY "Teachers can insert posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND is_teacher_assigned_to_madrasa(madrasa_id)
    AND EXISTS (SELECT 1 FROM madrasas WHERE id = madrasa_id AND active = true)
    AND approval_status = 'pending'
  );

-- 5. Teachers can update their own pending posts (title, description, category, event_date)
CREATE POLICY "Teachers can update own pending posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (teacher_id = auth.uid());

-- 6. Admins can update any post (e.g. approve/reject, edit)
CREATE POLICY "Admins can update any post"
  ON posts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- POST FILES
-- 1. Anyone can view files of approved public posts
CREATE POLICY "Public can view approved post files"
  ON post_files FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_files.post_id
        AND posts.deleted_at IS NULL
        AND posts.approval_status = 'approved'
        AND posts.visibility = 'public'
    )
  );

-- 2. Teachers can view files of their own posts
CREATE POLICY "Teachers can view own post files"
  ON post_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_files.post_id
        AND posts.teacher_id = auth.uid()
    )
  );

-- 3. Admins can view all post files
CREATE POLICY "Admins can view all post files"
  ON post_files FOR SELECT
  TO authenticated
  USING (is_admin());

-- UPLOAD SESSIONS
-- 1. Owners and Admins can view their upload sessions
CREATE POLICY "Owners and admins can view upload sessions"
  ON upload_sessions FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR is_admin());

-- 2. Owners can insert upload sessions
CREATE POLICY "Owners can insert upload sessions"
  ON upload_sessions FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() OR is_admin());

-- 3. Owners and admins can update upload sessions
CREATE POLICY "Owners and admins can update upload sessions"
  ON upload_sessions FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

-- APP SETTINGS
-- Read settings
CREATE POLICY "Authenticated users and public can read settings"
  ON app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admins can update settings
CREATE POLICY "Admins can manage app settings"
  ON app_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- AUDIT LOGS
-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins and system can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR actor_id = auth.uid());
