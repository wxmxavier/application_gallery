-- Migration 099: Reclassify application_gallery items to 5-domain taxonomy
--
-- Problem: Migration 094 expanded the CHECK constraint from 3 to 5 categories
-- but bulk-mapped all existing items into only 2 domains:
--   industrial_automation  → industrial
--   service_robotics       → professional_service
--   surveillance_security  → professional_service
--
-- This left medical, personal_service, and specialized_environment with 0 items,
-- even though the gallery contains hospital robots, home robots, underwater ROVs, etc.
--
-- Fix: Use specific_tasks, task_types, and scene_type (which were always correctly
-- classified by Gemini) to reassign application_category to the proper 5-domain value.
--
-- Order matters: specialized_environment first (most specific), then medical,
-- then personal_service (broadest reclassification last).
--
-- IMPORTANT: Apply via Supabase Dashboard → SQL Editor.

BEGIN;

-- ============================================================
-- 0. Snapshot: count before reclassification
-- ============================================================
DO $$
DECLARE
  cnt_ind INTEGER;
  cnt_pro INTEGER;
  cnt_per INTEGER;
  cnt_med INTEGER;
  cnt_spe INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt_ind FROM application_gallery WHERE application_category = 'industrial';
  SELECT COUNT(*) INTO cnt_pro FROM application_gallery WHERE application_category = 'professional_service';
  SELECT COUNT(*) INTO cnt_per FROM application_gallery WHERE application_category = 'personal_service';
  SELECT COUNT(*) INTO cnt_med FROM application_gallery WHERE application_category = 'medical';
  SELECT COUNT(*) INTO cnt_spe FROM application_gallery WHERE application_category = 'specialized_environment';
  RAISE NOTICE 'BEFORE — industrial: %, professional_service: %, personal_service: %, medical: %, specialized_environment: %',
    cnt_ind, cnt_pro, cnt_per, cnt_med, cnt_spe;
END $$;

-- ============================================================
-- 1. specialized_environment
--    Hazardous, underwater, space, bomb disposal, firefighting, nuclear
-- ============================================================

-- By specific_tasks
UPDATE application_gallery
  SET application_category = 'specialized_environment'
  WHERE application_category IN ('industrial', 'professional_service')
    AND specific_tasks && ARRAY[
      'hazardous_inspection', 'bomb_disposal', 'underwater_operation',
      'space_operation', 'nuclear_decommission', 'firefighting'
    ];

-- By task_types (broad)
UPDATE application_gallery
  SET application_category = 'specialized_environment'
  WHERE application_category IN ('industrial', 'professional_service')
    AND task_types && ARRAY['hazardous_ops', 'underwater_ops']
    AND NOT specific_tasks && ARRAY[
      'surgical_procedure', 'rehabilitation_therapy', 'pharmacy_dispensing',
      'lab_automation', 'sample_handling', 'cell_therapy',
      'diagnostic_imaging', 'patient_monitoring', 'sterilization'
    ];

-- By title/description keywords (catch items without proper task tags)
UPDATE application_gallery
  SET application_category = 'specialized_environment'
  WHERE application_category IN ('industrial', 'professional_service')
    AND (
      title ~* '\m(bomb disposal|eod|hazmat|nuclear decommission|underwater rov|subsea|deep.?sea)\M'
      OR title ~* '\m(firefighting robot|fire.?fighting drone|search and rescue robot)\M'
    )
    AND scene_type IS DISTINCT FROM 'hospital';


-- ============================================================
-- 2. medical
--    Surgical, rehabilitation, pharmacy, diagnostics, hospital delivery,
--    lab automation in clinical/pharma context
-- ============================================================

-- By specific_tasks
UPDATE application_gallery
  SET application_category = 'medical'
  WHERE application_category IN ('industrial', 'professional_service')
    AND specific_tasks && ARRAY[
      'surgical_procedure', 'rehabilitation_therapy', 'pharmacy_dispensing',
      'diagnostic_imaging', 'patient_monitoring', 'sterilization',
      'cell_therapy', 'sample_handling'
    ];

-- By scene_type = hospital (hospital delivery, hospital cleaning, etc. are medical)
UPDATE application_gallery
  SET application_category = 'medical'
  WHERE application_category IN ('industrial', 'professional_service')
    AND scene_type = 'hospital';

-- By task_types (broad)
UPDATE application_gallery
  SET application_category = 'medical'
  WHERE application_category IN ('industrial', 'professional_service')
    AND task_types && ARRAY['healthcare_assist'];

-- By title keywords for medical content missed by task tags
UPDATE application_gallery
  SET application_category = 'medical'
  WHERE application_category IN ('industrial', 'professional_service')
    AND (
      title ~* '\m(surgical robot|surgery robot|da vinci|intuitive surgical)\M'
      OR title ~* '\m(hospital robot|pharmacy robot|rehabilitation robot|exoskeleton)\M'
      OR title ~* '\m(medical robot|clinical robot|patient transport|drug dispensing)\M'
    );

-- lab_automation in pharma/biotech context → medical (not industrial)
UPDATE application_gallery
  SET application_category = 'medical'
  WHERE application_category = 'industrial'
    AND specific_tasks && ARRAY['lab_automation']
    AND (
      title ~* '\m(pharma|biotech|clinical|drug|cell therapy|assay|genomic|pathology)\M'
      OR description ~* '\m(pharma|biotech|clinical|drug discovery|cell therapy)\M'
    );


-- ============================================================
-- 3. personal_service
--    Home cleaning, lawn mowing, companion, entertainment, personal assistant
-- ============================================================

-- By specific_tasks
UPDATE application_gallery
  SET application_category = 'personal_service'
  WHERE application_category IN ('industrial', 'professional_service')
    AND specific_tasks && ARRAY[
      'home_cleaning', 'lawn_mowing', 'companion',
      'entertainment', 'personal_assistant'
    ];

-- By scene_type = residential
UPDATE application_gallery
  SET application_category = 'personal_service'
  WHERE application_category IN ('industrial', 'professional_service')
    AND scene_type = 'residential';

-- By scene_type = entertainment_venue
UPDATE application_gallery
  SET application_category = 'personal_service'
  WHERE application_category IN ('industrial', 'professional_service')
    AND scene_type = 'entertainment_venue';

-- By title keywords for consumer/home robots
UPDATE application_gallery
  SET application_category = 'personal_service'
  WHERE application_category IN ('industrial', 'professional_service')
    AND (
      title ~* '\m(roomba|roborock|ecovacs|dreame|robot vacuum|robotic vacuum)\M'
      OR title ~* '\m(lawn mow|robomow|husqvarna automower|robot mower)\M'
      OR title ~* '\m(companion robot|social robot|home assistant robot|personal robot)\M'
      OR title ~* '\m(robot dog pet|toy robot|entertainment robot)\M'
    );


-- ============================================================
-- 4. Snapshot: count after reclassification
-- ============================================================
DO $$
DECLARE
  cnt_ind INTEGER;
  cnt_pro INTEGER;
  cnt_per INTEGER;
  cnt_med INTEGER;
  cnt_spe INTEGER;
  cnt_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt_ind FROM application_gallery WHERE application_category = 'industrial';
  SELECT COUNT(*) INTO cnt_pro FROM application_gallery WHERE application_category = 'professional_service';
  SELECT COUNT(*) INTO cnt_per FROM application_gallery WHERE application_category = 'personal_service';
  SELECT COUNT(*) INTO cnt_med FROM application_gallery WHERE application_category = 'medical';
  SELECT COUNT(*) INTO cnt_spe FROM application_gallery WHERE application_category = 'specialized_environment';
  cnt_total := cnt_ind + cnt_pro + cnt_per + cnt_med + cnt_spe;

  RAISE NOTICE 'AFTER  — industrial: %, professional_service: %, personal_service: %, medical: %, specialized_environment: %',
    cnt_ind, cnt_pro, cnt_per, cnt_med, cnt_spe;
  RAISE NOTICE 'Total items: %', cnt_total;
  RAISE NOTICE 'Items moved to medical: ≥ any hospital scene or medical tasks';
  RAISE NOTICE 'Items moved to personal_service: ≥ any residential/entertainment scene or home tasks';
  RAISE NOTICE 'Items moved to specialized_environment: ≥ any hazardous/underwater/space tasks';
END $$;

COMMIT;
