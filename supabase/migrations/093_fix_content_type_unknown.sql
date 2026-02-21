-- Migration 093: Fix content_type CHECK constraint
-- Adds 'interview_comment' and 'unknown' to the valid content_type values.
-- Both were missing from the constraint after migration 091.
--
-- Apply via Supabase Dashboard SQL Editor.

ALTER TABLE application_gallery DROP CONSTRAINT IF EXISTS gallery_content_type_check;
ALTER TABLE application_gallery ADD CONSTRAINT gallery_content_type_check
  CHECK (content_type IN (
    'real_application', 'pilot_poc', 'case_study',
    'tech_demo', 'product_announcement', 'tutorial',
    'interview_comment', 'unknown'
  ));
