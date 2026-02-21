-- Migration 095: Drop taxonomy_domain column (superseded by 094)
--
-- Context:
--   Migration 087 (V2) added taxonomy_domain as a parallel column alongside application_category.
--   Migration 094 (Video Library) renamed application_category values in-place (3→5).
--
-- Decision: Keep single-column approach (094). The taxonomy_domain column is redundant
-- because application_category now holds the same 5-value vocabulary directly.
-- Dropping it eliminates dual-column ambiguity.
--
-- The V2 team should update their code to read from application_category (new values)
-- before this migration is applied.
--
-- Apply via Supabase Dashboard SQL Editor — ONLY after V2 code is updated.

-- Step 1: Drop constraint and index from 087
ALTER TABLE application_gallery DROP CONSTRAINT IF EXISTS chk_taxonomy_domain;
DROP INDEX IF EXISTS idx_gallery_taxonomy_domain;

-- Step 2: Drop the column
ALTER TABLE application_gallery DROP COLUMN IF EXISTS taxonomy_domain;
