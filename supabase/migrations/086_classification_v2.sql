-- Migration 086: Classification System V2
-- Adds enhanced content classification to distinguish real applications from demos

-- Add new classification columns
ALTER TABLE application_gallery
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'unknown';

ALTER TABLE application_gallery
ADD COLUMN IF NOT EXISTS deployment_maturity VARCHAR(50) DEFAULT 'unknown';

ALTER TABLE application_gallery
ADD COLUMN IF NOT EXISTS educational_value INTEGER DEFAULT 3;

ALTER TABLE application_gallery
ADD COLUMN IF NOT EXISTS specific_tasks TEXT[] DEFAULT '{}';

ALTER TABLE application_gallery
ADD COLUMN IF NOT EXISTS application_context JSONB DEFAULT '{}';

-- Drop existing constraints if they exist, then add new ones
DO $$
BEGIN
  -- Drop constraints if they exist
  ALTER TABLE application_gallery DROP CONSTRAINT IF EXISTS gallery_content_type_check;
  ALTER TABLE application_gallery DROP CONSTRAINT IF EXISTS gallery_deployment_maturity_check;
  ALTER TABLE application_gallery DROP CONSTRAINT IF EXISTS gallery_educational_value_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add constraints
ALTER TABLE application_gallery
ADD CONSTRAINT gallery_content_type_check
CHECK (content_type IN (
  'real_application', 'pilot_poc', 'case_study',
  'tech_demo', 'product_announcement', 'tutorial', 'unknown'
));

ALTER TABLE application_gallery
ADD CONSTRAINT gallery_deployment_maturity_check
CHECK (deployment_maturity IN (
  'production', 'pilot', 'prototype', 'concept', 'unknown'
));

ALTER TABLE application_gallery
ADD CONSTRAINT gallery_educational_value_check
CHECK (educational_value BETWEEN 1 AND 5);

-- Create indexes for new filters
CREATE INDEX IF NOT EXISTS idx_gallery_content_type
ON application_gallery(content_type);

CREATE INDEX IF NOT EXISTS idx_gallery_educational_value
ON application_gallery(educational_value);

CREATE INDEX IF NOT EXISTS idx_gallery_deployment_maturity
ON application_gallery(deployment_maturity);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_gallery_content_type_edu_value
ON application_gallery(content_type, educational_value)
WHERE status = 'approved';

-- GIN index for specific_tasks array
CREATE INDEX IF NOT EXISTS idx_gallery_specific_tasks
ON application_gallery USING GIN(specific_tasks);

-- GIN index for application_context JSONB
CREATE INDEX IF NOT EXISTS idx_gallery_app_context
ON application_gallery USING GIN(application_context);

-- Update existing items to have default content_type based on relevance_score
UPDATE application_gallery
SET content_type = CASE
  WHEN ai_classification->>'relevance_score' IS NOT NULL
       AND (ai_classification->>'relevance_score')::float >= 0.8 THEN 'real_application'
  WHEN ai_classification->>'relevance_score' IS NOT NULL
       AND (ai_classification->>'relevance_score')::float >= 0.6 THEN 'pilot_poc'
  ELSE 'tech_demo'
END
WHERE content_type = 'unknown' OR content_type IS NULL;

-- Set educational_value based on existing relevance
UPDATE application_gallery
SET educational_value = CASE
  WHEN ai_classification->>'relevance_score' IS NOT NULL
       AND (ai_classification->>'relevance_score')::float >= 0.9 THEN 5
  WHEN ai_classification->>'relevance_score' IS NOT NULL
       AND (ai_classification->>'relevance_score')::float >= 0.8 THEN 4
  WHEN ai_classification->>'relevance_score' IS NOT NULL
       AND (ai_classification->>'relevance_score')::float >= 0.6 THEN 3
  WHEN ai_classification->>'relevance_score' IS NOT NULL
       AND (ai_classification->>'relevance_score')::float >= 0.4 THEN 2
  ELSE 1
END
WHERE educational_value = 3 OR educational_value IS NULL;

-- Create view for high-quality content (default view)
CREATE OR REPLACE VIEW gallery_quality_content AS
SELECT *
FROM application_gallery
WHERE status = 'approved'
  AND content_type IN ('real_application', 'case_study', 'pilot_poc')
  AND educational_value >= 3
ORDER BY educational_value DESC, featured DESC, created_at DESC;

-- Create function to get content type statistics
CREATE OR REPLACE FUNCTION get_gallery_content_stats()
RETURNS TABLE (
  content_type VARCHAR(50),
  count BIGINT,
  avg_educational_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ag.content_type,
    COUNT(*)::BIGINT,
    ROUND(AVG(ag.educational_value)::NUMERIC, 2)
  FROM application_gallery ag
  WHERE ag.status = 'approved'
  GROUP BY ag.content_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function for filtered gallery search with V2 fields
CREATE OR REPLACE FUNCTION search_gallery_v2(
  p_content_types TEXT[] DEFAULT NULL,
  p_min_educational_value INTEGER DEFAULT 3,
  p_category VARCHAR(50) DEFAULT NULL,
  p_scene_type VARCHAR(50) DEFAULT NULL,
  p_specific_tasks TEXT[] DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  content_type VARCHAR,
  deployment_maturity VARCHAR,
  educational_value INTEGER,
  application_category VARCHAR,
  scene_type VARCHAR,
  specific_tasks TEXT[],
  task_types TEXT[],
  thumbnail_url TEXT,
  source_url TEXT,
  ai_summary TEXT,
  application_context JSONB,
  featured BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ag.id,
    ag.title,
    ag.content_type,
    ag.deployment_maturity,
    ag.educational_value,
    ag.application_category,
    ag.scene_type,
    ag.specific_tasks,
    ag.task_types,
    ag.thumbnail_url,
    ag.source_url,
    ag.ai_summary,
    ag.application_context,
    ag.featured,
    ag.created_at
  FROM application_gallery ag
  WHERE ag.status = 'approved'
    AND (p_content_types IS NULL OR ag.content_type = ANY(p_content_types))
    AND ag.educational_value >= p_min_educational_value
    AND (p_category IS NULL OR ag.application_category = p_category)
    AND (p_scene_type IS NULL OR ag.scene_type = p_scene_type)
    AND (p_specific_tasks IS NULL OR ag.specific_tasks && p_specific_tasks)
    AND (p_search_query IS NULL OR
         ag.title ILIKE '%' || p_search_query || '%' OR
         ag.description ILIKE '%' || p_search_query || '%' OR
         ag.ai_summary ILIKE '%' || p_search_query || '%')
  ORDER BY
    ag.featured DESC,
    ag.educational_value DESC,
    ag.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Add comments explaining the new classification system
COMMENT ON COLUMN application_gallery.content_type IS
'V2 Classification: real_application, pilot_poc, case_study, tech_demo, product_announcement, tutorial';

COMMENT ON COLUMN application_gallery.deployment_maturity IS
'Deployment stage: production, pilot, prototype, concept, unknown';

COMMENT ON COLUMN application_gallery.educational_value IS
'Educational value 1-5: 5=full case study, 4=real deployment details, 3=real app limited context, 2=demo with relevance, 1=marketing only';

COMMENT ON COLUMN application_gallery.specific_tasks IS
'Specific task types (e.g., pallet_transport, machine_tending) mapped from broad task_types';

COMMENT ON COLUMN application_gallery.application_context IS
'JSON with problem_solved, deployment_scale, customer_identified, has_metrics';
