-- Migration 090: Add Facebook as allowed source type
-- Date: 2026-02-03

-- Drop the old constraint
ALTER TABLE application_gallery
DROP CONSTRAINT IF EXISTS application_gallery_source_type_check;

-- Add new constraint with Facebook included
ALTER TABLE application_gallery
ADD CONSTRAINT application_gallery_source_type_check
CHECK (source_type IN (
    'youtube',
    'company_website',
    'news',
    'linkedin',
    'twitter',
    'tiktok',
    'instagram',
    'facebook',
    'serpapi_news',
    'serpapi_image',
    'other'
));

-- Add comment
COMMENT ON COLUMN application_gallery.source_type IS 'Content source platform: youtube, company_website, news, linkedin, twitter, tiktok, instagram, facebook, serpapi_news, serpapi_image, other';
