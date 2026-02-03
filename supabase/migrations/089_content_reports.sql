-- Content Reports Table
-- Migration: 089_content_reports.sql
-- Purpose: Store user-submitted content reports for moderation

-- Create the content_reports table
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content being reported
    gallery_item_id UUID NOT NULL REFERENCES application_gallery(id) ON DELETE CASCADE,
    content_url TEXT,
    content_title TEXT,

    -- Reporter info (anonymous allowed)
    reporter_email TEXT,

    -- Report details
    reason TEXT NOT NULL CHECK (reason IN (
        'inappropriate',
        'copyright',
        'misleading',
        'broken_link',
        'spam',
        'other'
    )),
    description TEXT,

    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'reviewed',
        'dismissed',
        'action_taken'
    )),
    reviewer_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_item ON content_reports(gallery_item_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_reason ON content_reports(reason);

-- Enable RLS (Row Level Security)
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (public submissions)
CREATE POLICY "Allow anonymous reports" ON content_reports
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow authenticated users to view all reports (for admin)
CREATE POLICY "Allow authenticated read" ON content_reports
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to update reports (for admin)
CREATE POLICY "Allow authenticated update" ON content_reports
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow service role full access
CREATE POLICY "Service role full access" ON content_reports
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add trigger to update reviewed_at timestamp when status changes
CREATE OR REPLACE FUNCTION update_content_reports_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status AND NEW.status != 'pending' THEN
        NEW.reviewed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_reports_reviewed_timestamp
    BEFORE UPDATE ON content_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_content_reports_reviewed_at();

-- Comment on table
COMMENT ON TABLE content_reports IS 'Stores user-submitted content reports for moderation review';
