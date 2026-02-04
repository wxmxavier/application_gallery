-- Migration 091: Add 'interview_comment' as allowed content_type
-- Date: 2026-02-04
-- Purpose: Classify videos that primarily show people speaking (interviews, commentary, reactions)
--          rather than robot footage

-- Drop the old constraint
ALTER TABLE application_gallery
DROP CONSTRAINT IF EXISTS gallery_content_type_check;

-- Add new constraint with 'interview_comment' included
ALTER TABLE application_gallery
ADD CONSTRAINT gallery_content_type_check
CHECK (content_type IN (
    'real_application',
    'pilot_poc',
    'case_study',
    'tech_demo',
    'product_announcement',
    'tutorial',
    'interview_comment'
));

-- Add comment explaining the content types
COMMENT ON COLUMN application_gallery.content_type IS
'Content classification:
- real_application: Robot deployed in actual business operations
- pilot_poc: Trial deployment, proof of concept
- case_study: Documented implementation with results/metrics
- tech_demo: Capability demonstration, trade show, lab footage
- product_announcement: New product reveal, feature announcement
- tutorial: How-to content, educational
- interview_comment: Interviews, commentary, reactions - videos primarily showing people speaking about robots';
