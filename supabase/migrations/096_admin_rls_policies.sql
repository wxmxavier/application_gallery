-- Migration 096: Add RLS policies for admin operations via anon key
--
-- The frontend admin interface uses the Supabase anon key (no auth yet).
-- Current RLS only allows SELECT for anon; INSERT/UPDATE/DELETE require
-- an authenticated admin role. This migration adds policies to allow
-- anon insert, update, and delete on application_gallery so the admin
-- interface can function until proper auth (RSIP SSO) is implemented.
--
-- TODO: Remove these policies once admin authentication is in place
-- and replace with proper role-based policies.

-- Allow anon inserts (for "Add Content by URL" feature)
CREATE POLICY "Allow anon insert for admin" ON application_gallery
  FOR INSERT WITH CHECK (true);

-- Allow anon updates (for classification editing, approve/reject)
CREATE POLICY "Allow anon update for admin" ON application_gallery
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anon deletes (for content removal)
CREATE POLICY "Allow anon delete for admin" ON application_gallery
  FOR DELETE USING (true);
