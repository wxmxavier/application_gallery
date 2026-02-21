-- Migration 098: Cross-Platform Taxonomy Synchronization — Environment Types
--
-- Purpose: Align environment_types, application_categories, and functional_requirements
-- across the Video Library, V2 Platform, and Knowledge Graph.
--
-- Changes:
--   1. Clean orphan rows from application_categories (legacy 5 that coexist with new 5)
--   2. Update environment_types.category CHECK from 3-value to 5-domain taxonomy
--   3. Migrate existing environment_types.category values to 5-domain
--   4. Insert 6 new environment types from Video Library real-world data
--   5. Update functional_requirements.category_filter to 5-domain (where still 'unknown')
--
-- Prerequisite: Migration 097 must have run (renames application_categories to 5-domain).
--
-- IMPORTANT: Apply via Supabase Dashboard → SQL Editor.

BEGIN;

-- ============================================================
-- 1. Clean orphan rows from application_categories
--
--    After migration 097, both the OLD long-name rows AND the
--    new short-name rows may coexist (10 rows total, should be 5).
--    Delete the 5 legacy rows that are no longer referenced.
-- ============================================================

DELETE FROM application_categories
WHERE category_key IN (
  'industrial_automation',
  'service_robotics',
  'surveillance_security',
  'aerial',
  'underwater'
);

-- Verify: should have exactly 5 rows
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM application_categories;
  IF row_count <> 5 THEN
    RAISE WARNING 'application_categories has % rows (expected 5). Inspect manually.', row_count;
  ELSE
    RAISE NOTICE 'application_categories: OK — 5 rows';
  END IF;
END $$;


-- ============================================================
-- 2. Update environment_types.category CHECK constraint
--    from 3-value ('industrial', 'service', 'special')
--    to 5-domain taxonomy.
-- ============================================================

-- 2a. Drop the old CHECK constraint
ALTER TABLE environment_types DROP CONSTRAINT IF EXISTS environment_types_category_check;

-- 2b. Migrate existing category values BEFORE adding new constraint
-- Map old 3-category → new 5-domain using the exact mapping table:
--
--   warehouse_logistics   : industrial   → industrial         (no change)
--   manufacturing_floor   : industrial   → industrial         (no change)
--   construction_site     : industrial   → industrial         (no change)
--   mining_facility       : industrial   → industrial         (no change)
--   agricultural_farm     : industrial   → industrial         (no change)
--   hospital_healthcare   : service      → medical            (healthcare subcategory)
--   hotel_hospitality     : service      → professional_service
--   retail_shopping       : service      → professional_service
--   office_corporate      : service      → professional_service
--   educational_campus    : service      → professional_service
--   outdoor_public        : special      → professional_service  (public spaces)
--   hazardous_nuclear     : special      → specialized_environment
--   underwater_marine     : special      → specialized_environment
--   fire_emergency        : special      → specialized_environment

-- hospital → medical
UPDATE environment_types
  SET category = 'medical'
  WHERE environment_key = 'hospital_healthcare'
    AND category = 'service';

-- service (non-healthcare) → professional_service
UPDATE environment_types
  SET category = 'professional_service'
  WHERE category = 'service'
    AND environment_key IN ('hotel_hospitality', 'retail_shopping', 'office_corporate', 'educational_campus');

-- outdoor_public → professional_service (public spaces, delivery, etc.)
UPDATE environment_types
  SET category = 'professional_service'
  WHERE environment_key = 'outdoor_public'
    AND category = 'special';

-- remaining special → specialized_environment
UPDATE environment_types
  SET category = 'specialized_environment'
  WHERE category = 'special';

-- 2c. Add new 5-domain CHECK constraint
ALTER TABLE environment_types
  ADD CONSTRAINT environment_types_category_check
  CHECK (category IN ('industrial', 'professional_service', 'personal_service', 'medical', 'specialized_environment'));


-- ============================================================
-- 3. Insert 6 new environment types from Video Library data
--
--    These scenes have real classified gallery items but were
--    missing from the canonical environment_types table.
-- ============================================================

-- laboratory_research — #1 scene in Video Library (338 items)
INSERT INTO environment_types (
  environment_key, environment_name, environment_name_zh,
  description, description_zh,
  category, subcategory,
  icon_name, color_scheme, complexity_level,
  typical_tasks, required_capabilities, environmental_factors,
  compatible_robot_types, recommended_sensors, safety_requirements,
  is_active, display_order
) VALUES (
  'laboratory_research',
  'Laboratory & Research',
  '实验室与研究',
  'Research laboratories, clean rooms, and scientific testing facilities requiring precision and contamination control',
  '研究实验室、洁净室和科学测试设施，需要精密操作和污染控制',
  'industrial', 'research',
  'microscope', 'indigo', 3,
  '["sample_handling", "lab_automation", "precision_measurement", "cell_culture"]'::jsonb,
  '["precision_manipulation", "contamination_control", "sample_tracking"]'::jsonb,
  '{"temperature": "controlled", "humidity": "controlled", "cleanliness": "cleanroom", "vibration": "minimal"}'::jsonb,
  '["collaborative_robots", "lab_automation_systems", "mobile_platforms"]'::jsonb,
  '["force_sensors", "vision_systems", "pipette_sensors"]'::jsonb,
  '["cleanroom_compatible", "chemical_resistance", "esd_safe"]'::jsonb,
  true, 15
)
ON CONFLICT (environment_key) DO NOTHING;

-- logistics_center — 20 gallery items
INSERT INTO environment_types (
  environment_key, environment_name, environment_name_zh,
  description, description_zh,
  category, subcategory,
  icon_name, color_scheme, complexity_level,
  typical_tasks, required_capabilities, environmental_factors,
  compatible_robot_types, recommended_sensors, safety_requirements,
  is_active, display_order
) VALUES (
  'logistics_center',
  'Logistics Center',
  '物流中心',
  'Distribution centers, fulfillment hubs, and cross-dock facilities with high-throughput sorting and shipping',
  '配送中心、履约中心和转运设施，具有高吞吐量的分拣和运输',
  'industrial', 'logistics',
  'truck', 'cyan', 3,
  '["package_sorting", "order_fulfillment", "goods_transportation", "dock_operations"]'::jsonb,
  '["high_speed_sorting", "barcode_scanning", "fleet_coordination"]'::jsonb,
  '{"temperature": "variable", "space": "large_open", "traffic": "high", "noise_level": "moderate"}'::jsonb,
  '["mobile_robots", "sorting_systems", "autonomous_vehicles"]'::jsonb,
  '["lidar", "cameras", "barcode_scanners", "weight_sensors"]'::jsonb,
  '["collision_avoidance", "pedestrian_safety", "emergency_stop"]'::jsonb,
  true, 16
)
ON CONFLICT (environment_key) DO NOTHING;

-- restaurant_food_service — 17 gallery items
INSERT INTO environment_types (
  environment_key, environment_name, environment_name_zh,
  description, description_zh,
  category, subcategory,
  icon_name, color_scheme, complexity_level,
  typical_tasks, required_capabilities, environmental_factors,
  compatible_robot_types, recommended_sensors, safety_requirements,
  is_active, display_order
) VALUES (
  'restaurant_food_service',
  'Restaurant & Food Service',
  '餐饮服务',
  'Restaurants, cafeterias, and food service establishments with food delivery and customer interaction',
  '餐厅、食堂和餐饮服务场所，涉及食品配送和客户互动',
  'professional_service', 'hospitality',
  'utensils', 'amber', 2,
  '["food_delivery", "table_service", "kitchen_automation", "order_management"]'::jsonb,
  '["food_safe_materials", "human_interaction", "obstacle_avoidance"]'::jsonb,
  '{"temperature": "warm", "humidity": "moderate", "traffic": "high", "space": "tight"}'::jsonb,
  '["service_robots", "delivery_robots"]'::jsonb,
  '["proximity_sensors", "cameras", "tray_sensors"]'::jsonb,
  '["food_safety_compliant", "human_safe_speed", "spill_prevention"]'::jsonb,
  true, 17
)
ON CONFLICT (environment_key) DO NOTHING;

-- airport_terminal — 4 gallery items
INSERT INTO environment_types (
  environment_key, environment_name, environment_name_zh,
  description, description_zh,
  category, subcategory,
  icon_name, color_scheme, complexity_level,
  typical_tasks, required_capabilities, environmental_factors,
  compatible_robot_types, recommended_sensors, safety_requirements,
  is_active, display_order
) VALUES (
  'airport_terminal',
  'Airport Terminal',
  '机场航站楼',
  'Airport terminals and aviation facilities with wayfinding, cleaning, and security operations',
  '机场航站楼和航空设施，涉及导航引导、清洁和安保操作',
  'professional_service', 'transportation',
  'plane', 'sky', 4,
  '["wayfinding", "floor_cleaning", "luggage_handling", "security_patrol"]'::jsonb,
  '["multi_language_interaction", "large_area_navigation", "crowd_navigation"]'::jsonb,
  '{"space": "very_large", "traffic": "very_high", "lighting": "bright", "noise_level": "high"}'::jsonb,
  '["service_robots", "cleaning_robots", "security_robots"]'::jsonb,
  '["lidar", "cameras", "rfid_readers", "air_quality_sensors"]'::jsonb,
  '["crowd_safety", "emergency_protocols", "aviation_security_compliance"]'::jsonb,
  true, 18
)
ON CONFLICT (environment_key) DO NOTHING;

-- residential_home — 7 gallery items
INSERT INTO environment_types (
  environment_key, environment_name, environment_name_zh,
  description, description_zh,
  category, subcategory,
  icon_name, color_scheme, complexity_level,
  typical_tasks, required_capabilities, environmental_factors,
  compatible_robot_types, recommended_sensors, safety_requirements,
  is_active, display_order
) VALUES (
  'residential_home',
  'Residential & Home',
  '住宅家庭',
  'Residential homes and living spaces with domestic cleaning, companionship, and personal assistance',
  '住宅和生活空间，涉及家庭清洁、陪伴和个人助理服务',
  'personal_service', 'personal',
  'home', 'green', 2,
  '["home_cleaning", "lawn_mowing", "companion", "personal_assistant"]'::jsonb,
  '["home_navigation", "gentle_interaction", "voice_control"]'::jsonb,
  '{"space": "small_cluttered", "traffic": "low", "lighting": "variable", "surfaces": "mixed"}'::jsonb,
  '["vacuum_robots", "lawn_robots", "companion_robots", "home_assistants"]'::jsonb,
  '["cameras", "lidar", "cliff_sensors", "bumper_sensors"]'::jsonb,
  '["child_safe", "pet_safe", "low_noise", "furniture_protection"]'::jsonb,
  true, 19
)
ON CONFLICT (environment_key) DO NOTHING;

-- entertainment_venue — new category
INSERT INTO environment_types (
  environment_key, environment_name, environment_name_zh,
  description, description_zh,
  category, subcategory,
  icon_name, color_scheme, complexity_level,
  typical_tasks, required_capabilities, environmental_factors,
  compatible_robot_types, recommended_sensors, safety_requirements,
  is_active, display_order
) VALUES (
  'entertainment_venue',
  'Entertainment Venue',
  '演艺场所',
  'Theme parks, stadiums, exhibition halls, and performance venues with entertainment and crowd interaction',
  '主题公园、体育场、展览馆和演出场所，涉及娱乐和人群互动',
  'personal_service', 'entertainment',
  'sparkles', 'purple', 3,
  '["entertainment", "crowd_interaction", "guided_tours", "performance"]'::jsonb,
  '["expressive_interaction", "crowd_navigation", "audio_visual_sync"]'::jsonb,
  '{"space": "large", "traffic": "very_high", "lighting": "variable", "noise_level": "high"}'::jsonb,
  '["humanoid_robots", "entertainment_robots", "guide_robots"]'::jsonb,
  '["cameras", "microphones", "proximity_sensors", "gesture_sensors"]'::jsonb,
  '["crowd_safety", "child_safe_interaction", "emergency_stop"]'::jsonb,
  true, 20
)
ON CONFLICT (environment_key) DO NOTHING;

-- Handle legacy home_wellness → merge into residential_home if it exists
UPDATE environment_types
  SET environment_key = 'residential_home',
      environment_name = 'Residential & Home',
      environment_name_zh = '住宅家庭',
      category = 'personal_service',
      subcategory = 'personal'
  WHERE environment_key = 'home_wellness'
    AND NOT EXISTS (SELECT 1 FROM environment_types WHERE environment_key = 'residential_home');


-- ============================================================
-- 4. Update functional_requirements.category_filter
--
--    Migration 097 already updated from old 3-value to 5-domain
--    for rows that had 'service' → 'professional_service' and
--    'other' → 'specialized_environment'. But some rows may
--    still need medical/personal_service classification.
--
--    Reclassify based on requirement_key patterns:
-- ============================================================

-- Medical requirements
UPDATE functional_requirements
  SET category_filter = 'medical'
  WHERE requirement_key IN (
    'sterile_operation', 'medical_device_integration', 'patient_monitoring',
    'surgical_precision', 'rehabilitation_support', 'pharmacy_automation',
    'biocompatible_materials', 'clinical_workflow', 'medical_imaging',
    'tissue_handling', 'drug_dispensing', 'vital_sign_monitoring',
    'medical_record_integration', 'sterilization_compatible'
  )
  AND category_filter != 'medical';

-- Personal service requirements
UPDATE functional_requirements
  SET category_filter = 'personal_service'
  WHERE requirement_key IN (
    'voice_control', 'home_navigation', 'pet_detection',
    'child_safety', 'home_automation_integration', 'quiet_operation',
    'furniture_avoidance', 'companion_behavior', 'personal_schedule',
    'entertainment_interaction'
  )
  AND category_filter != 'personal_service';


-- ============================================================
-- 5. Verification summary
-- ============================================================

DO $$
DECLARE
  env_count INTEGER;
  cat_count INTEGER;
  fr_industrial INTEGER;
  fr_professional INTEGER;
  fr_personal INTEGER;
  fr_medical INTEGER;
  fr_specialized INTEGER;
BEGIN
  SELECT COUNT(*) INTO env_count FROM environment_types WHERE is_active = true;
  SELECT COUNT(*) INTO cat_count FROM application_categories;

  SELECT COUNT(*) INTO fr_industrial FROM functional_requirements WHERE category_filter = 'industrial';
  SELECT COUNT(*) INTO fr_professional FROM functional_requirements WHERE category_filter = 'professional_service';
  SELECT COUNT(*) INTO fr_personal FROM functional_requirements WHERE category_filter = 'personal_service';
  SELECT COUNT(*) INTO fr_medical FROM functional_requirements WHERE category_filter = 'medical';
  SELECT COUNT(*) INTO fr_specialized FROM functional_requirements WHERE category_filter = 'specialized_environment';

  RAISE NOTICE '=== Migration 098 Summary ===';
  RAISE NOTICE 'environment_types (active): %', env_count;
  RAISE NOTICE 'application_categories: %', cat_count;
  RAISE NOTICE 'functional_requirements by category_filter:';
  RAISE NOTICE '  industrial: %', fr_industrial;
  RAISE NOTICE '  professional_service: %', fr_professional;
  RAISE NOTICE '  personal_service: %', fr_personal;
  RAISE NOTICE '  medical: %', fr_medical;
  RAISE NOTICE '  specialized_environment: %', fr_specialized;
END $$;

COMMIT;
