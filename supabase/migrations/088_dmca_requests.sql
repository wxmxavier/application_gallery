-- DMCA / Takedown Requests Table
-- Migration: 088_dmca_requests.sql
-- Purpose: Store content takedown requests for legal compliance

-- Create the dmca_requests table
CREATE TABLE IF NOT EXISTS dmca_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contact information
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_company TEXT,

    -- Content identification
    content_url TEXT NOT NULL,
    content_title TEXT,
    gallery_item_id UUID REFERENCES application_gallery(id) ON DELETE SET NULL,

    -- Request details
    reason TEXT NOT NULL CHECK (reason IN (
        'copyright',
        'trademark',
        'privacy',
        'defamation',
        'confidential',
        'other'
    )),
    description TEXT NOT NULL,

    -- Legal acknowledgment
    good_faith_statement BOOLEAN DEFAULT false,

    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',
        'under_review',
        'approved',
        'rejected',
        'resolved'
    )),
    reviewer_notes TEXT,
    reviewed_by TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Create indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_dmca_requests_status ON dmca_requests(status);
CREATE INDEX IF NOT EXISTS idx_dmca_requests_content_url ON dmca_requests(content_url);
CREATE INDEX IF NOT EXISTS idx_dmca_requests_email ON dmca_requests(requester_email);
CREATE INDEX IF NOT EXISTS idx_dmca_requests_created ON dmca_requests(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE dmca_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (public submissions)
CREATE POLICY "Allow anonymous inserts" ON dmca_requests
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow authenticated users to view all requests (for admin)
CREATE POLICY "Allow authenticated read" ON dmca_requests
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow service role full access
CREATE POLICY "Service role full access" ON dmca_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dmca_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dmca_requests_timestamp
    BEFORE UPDATE ON dmca_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_dmca_requests_updated_at();

-- Comment on table
COMMENT ON TABLE dmca_requests IS 'Stores DMCA and content takedown requests for legal compliance';
