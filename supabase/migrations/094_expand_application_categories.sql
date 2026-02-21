-- Migration 094: Expand application_category from 3 to 5 values (KG Axis 1 alignment)
--
-- Old categories: industrial_automation, service_robotics, surveillance_security
-- New categories: industrial, professional_service, personal_service, medical, specialized_environment
--
-- Mapping:
--   industrial_automation  -> industrial
--   service_robotics       -> professional_service (reclassification pass will split personal_service later)
--   surveillance_security  -> professional_service (security is a professional service sub-category)
--
-- Apply via Supabase Dashboard SQL Editor.

-- Step 1: Drop the old CHECK constraint FIRST so updates don't violate it.
-- PostgreSQL auto-names inline CHECK constraints as {table}_{column}_check.
ALTER TABLE application_gallery DROP CONSTRAINT IF EXISTS application_gallery_application_category_check;
-- Also try the shorter name in case it was manually created
ALTER TABLE application_gallery DROP CONSTRAINT IF EXISTS application_gallery_category_check;

-- Step 2: Migrate existing data
UPDATE application_gallery SET application_category = 'industrial'
  WHERE application_category = 'industrial_automation';

UPDATE application_gallery SET application_category = 'professional_service'
  WHERE application_category = 'surveillance_security';

UPDATE application_gallery SET application_category = 'professional_service'
  WHERE application_category = 'service_robotics';

-- Step 3: Add new CHECK constraint
ALTER TABLE application_gallery ADD CONSTRAINT application_gallery_category_check
  CHECK (application_category IN (
    'industrial', 'professional_service', 'personal_service',
    'medical', 'specialized_environment'
  ));
