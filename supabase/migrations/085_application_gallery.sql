-- ============================================
-- RSIP Application Gallery System
-- Migration: 085_application_gallery.sql
-- Purpose: Real-world robotics application showcase
--          aligned with RSIP platform taxonomy
-- Date: 2026-01-30
-- ============================================

-- Main application gallery table
CREATE TABLE IF NOT EXISTS application_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content identification
  external_id VARCHAR(255),
  source_type VARCHAR(50) NOT NULL
    CHECK (source_type IN ('company_website', 'news', 'youtube', 'linkedin',
                           'twitter', 'research', 'case_study', 'other')),
  source_url TEXT NOT NULL,
  source_name VARCHAR(255),

  -- Content metadata
  title VARCHAR(500) NOT NULL,
  title_zh VARCHAR(500),
  description TEXT,
  description_zh TEXT,
  media_type VARCHAR(50) NOT NULL
    CHECK (media_type IN ('video', 'photo', 'article', 'case_study', 'gallery')),
  thumbnail_url TEXT,
  content_url TEXT,
  duration_seconds INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,

  -- RSIP-ALIGNED CLASSIFICATION
  application_category VARCHAR(50) NOT NULL
    CHECK (application_category IN ('industrial_automation', 'service_robotics',
                                     'surveillance_security')),
  task_types TEXT[] DEFAULT '{}',
  functional_requirements TEXT[] DEFAULT '{}',
  scene_type VARCHAR(50),

  -- Environment features
  environment_setting VARCHAR(50)
    CHECK (environment_setting IN ('indoor', 'outdoor', 'mixed')),
  environment_features JSONB DEFAULT '{}',

  -- Robot identification (secondary)
  robot_names TEXT[] DEFAULT '{}',
  robot_types TEXT[] DEFAULT '{}',
  manufacturers TEXT[] DEFAULT '{}',

  -- AI analysis results
  ai_classification JSONB,
  ai_confidence JSONB,
  ai_summary TEXT,
  ai_summary_zh TEXT,

  -- Moderation
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'archived')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason VARCHAR(255),

  -- Crawl tracking
  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  crawler_source VARCHAR(100),
  crawler_run_id VARCHAR(100),

  -- Engagement
  view_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  featured_order INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(source_type, external_id)
);

-- User content suggestions
CREATE TABLE IF NOT EXISTS gallery_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by UUID REFERENCES users(id),
  url TEXT NOT NULL,
  title VARCHAR(500),
  description TEXT,
  suggested_category VARCHAR(50),
  suggested_tags TEXT[],

  -- Review status
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  -- If approved, link to created gallery entry
  gallery_item_id UUID REFERENCES application_gallery(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crawler run history
CREATE TABLE IF NOT EXISTS gallery_crawler_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id VARCHAR(100) UNIQUE NOT NULL,
  crawler_type VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'partial')),

  -- Statistics
  items_found INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Configuration used
  config JSONB
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary filtering indexes
CREATE INDEX idx_gallery_status ON application_gallery(status);
CREATE INDEX idx_gallery_category ON application_gallery(application_category);
CREATE INDEX idx_gallery_scene_type ON application_gallery(scene_type);
CREATE INDEX idx_gallery_media_type ON application_gallery(media_type);
CREATE INDEX idx_gallery_environment ON application_gallery(environment_setting);
CREATE INDEX idx_gallery_published ON application_gallery(published_at DESC);
CREATE INDEX idx_gallery_featured ON application_gallery(featured, featured_order);
CREATE INDEX idx_gallery_created ON application_gallery(created_at DESC);

-- GIN indexes for array fields (RSIP taxonomy filtering)
CREATE INDEX idx_gallery_task_types ON application_gallery USING GIN(task_types);
CREATE INDEX idx_gallery_requirements ON application_gallery USING GIN(functional_requirements);
CREATE INDEX idx_gallery_robot_names ON application_gallery USING GIN(robot_names);
CREATE INDEX idx_gallery_robot_types ON application_gallery USING GIN(robot_types);
CREATE INDEX idx_gallery_manufacturers ON application_gallery USING GIN(manufacturers);

-- Full-text search index
CREATE INDEX idx_gallery_search ON application_gallery
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Suggestion and crawler indexes
CREATE INDEX idx_suggestions_status ON gallery_suggestions(status);
CREATE INDEX idx_suggestions_user ON gallery_suggestions(suggested_by);
CREATE INDEX idx_crawler_runs_type ON gallery_crawler_runs(crawler_type);
CREATE INDEX idx_crawler_runs_status ON gallery_crawler_runs(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE application_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_crawler_runs ENABLE ROW LEVEL SECURITY;

-- Public: View approved items only
CREATE POLICY "Public can view approved gallery items" ON application_gallery
  FOR SELECT USING (status = 'approved');

-- Admins: View all items
CREATE POLICY "Admins can view all gallery items" ON application_gallery
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role IN ('admin', 'system_admin', 'moderator'))
  );

-- Admins: Manage all items
CREATE POLICY "Admins can manage gallery items" ON application_gallery
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role IN ('admin', 'system_admin', 'moderator'))
  );

-- Users: View own suggestions
CREATE POLICY "Users can view own suggestions" ON gallery_suggestions
  FOR SELECT USING (suggested_by = auth.uid());

-- Users: Create suggestions
CREATE POLICY "Authenticated users can suggest content" ON gallery_suggestions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins: Manage suggestions
CREATE POLICY "Admins can manage suggestions" ON gallery_suggestions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role IN ('admin', 'system_admin', 'moderator'))
  );

-- Crawler runs: Service role only
CREATE POLICY "Service role for crawler runs" ON gallery_crawler_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role = 'system_admin')
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Search gallery by RSIP context
CREATE OR REPLACE FUNCTION search_gallery_by_context(
  p_category VARCHAR DEFAULT NULL,
  p_task_types TEXT[] DEFAULT NULL,
  p_requirements TEXT[] DEFAULT NULL,
  p_scene_type VARCHAR DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  title_zh VARCHAR,
  description TEXT,
  thumbnail_url TEXT,
  content_url TEXT,
  media_type VARCHAR,
  application_category VARCHAR,
  task_types TEXT[],
  functional_requirements TEXT[],
  scene_type VARCHAR,
  environment_setting VARCHAR,
  source_name VARCHAR,
  source_type VARCHAR,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER,
  featured BOOLEAN,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.title,
    g.title_zh,
    g.description,
    g.thumbnail_url,
    g.content_url,
    g.media_type,
    g.application_category,
    g.task_types,
    g.functional_requirements,
    g.scene_type,
    g.environment_setting,
    g.source_name,
    g.source_type,
    g.published_at,
    g.view_count,
    g.featured,
    (
      CASE WHEN g.featured THEN 10.0 ELSE 0.0 END +
      COALESCE(array_length(g.task_types & p_task_types, 1), 0) * 2.0 +
      COALESCE(array_length(g.functional_requirements & p_requirements, 1), 0) * 1.5 +
      CASE WHEN p_search_query IS NOT NULL AND
           to_tsvector('english', g.title || ' ' || COALESCE(g.description, ''))
           @@ plainto_tsquery('english', p_search_query)
      THEN 5.0 ELSE 0.0 END
    )::FLOAT AS relevance_score
  FROM application_gallery g
  WHERE g.status = 'approved'
    AND (p_category IS NULL OR g.application_category = p_category)
    AND (p_task_types IS NULL OR g.task_types && p_task_types)
    AND (p_requirements IS NULL OR g.functional_requirements && p_requirements)
    AND (p_scene_type IS NULL OR g.scene_type = p_scene_type)
    AND (p_search_query IS NULL OR
         to_tsvector('english', g.title || ' ' || COALESCE(g.description, ''))
         @@ plainto_tsquery('english', p_search_query))
  ORDER BY
    relevance_score DESC,
    g.featured DESC,
    g.view_count DESC,
    g.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Increment view count
CREATE OR REPLACE FUNCTION increment_gallery_view(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE application_gallery
  SET view_count = view_count + 1
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Get filter options
CREATE OR REPLACE FUNCTION get_gallery_filter_options()
RETURNS TABLE (
  categories TEXT[],
  scene_types TEXT[],
  task_types_list TEXT[],
  manufacturers_list TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ARRAY(SELECT DISTINCT application_category FROM application_gallery WHERE status = 'approved'),
    ARRAY(SELECT DISTINCT scene_type FROM application_gallery WHERE status = 'approved' AND scene_type IS NOT NULL),
    ARRAY(SELECT DISTINCT unnest(task_types) FROM application_gallery WHERE status = 'approved'),
    ARRAY(SELECT DISTINCT unnest(manufacturers) FROM application_gallery WHERE status = 'approved');
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_gallery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_updated_at
  BEFORE UPDATE ON application_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_gallery_timestamp();

-- ============================================
-- MIGRATION COMPLETE
--
-- To apply: Run this SQL in Supabase Dashboard
-- Tables created:
--   - application_gallery (main content)
--   - gallery_suggestions (user submissions)
--   - gallery_crawler_runs (crawler history)
-- ============================================
