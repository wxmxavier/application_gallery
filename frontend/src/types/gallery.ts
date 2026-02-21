/**
 * RSIP Application Gallery Types V2
 * Enhanced classification to distinguish real applications from demos
 */

// V2: Content type classification (primary filter)
export type ContentType =
  | 'real_application'  // Deployed in actual business
  | 'pilot_poc'         // Trial/proof of concept
  | 'case_study'        // Documented with results
  | 'tech_demo'         // Capability demonstration
  | 'product_announcement' // New product reveal
  | 'tutorial'          // How-to content
  | 'interview_comment' // Interviews, commentary, reactions
  | 'unknown';

// V2: Deployment maturity
export type DeploymentMaturity =
  | 'production'  // Running in real operations
  | 'pilot'       // Limited deployment
  | 'prototype'   // R&D stage
  | 'concept'     // Simulation/rendering
  | 'unknown';

export type ApplicationCategory =
  | 'industrial'
  | 'professional_service'
  | 'personal_service'
  | 'medical'
  | 'specialized_environment';

export type MediaType = 'video' | 'image' | 'photo' | 'article' | 'case_study' | 'gallery';

export type SourceType =
  | 'company_website'
  | 'news'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'research'
  | 'case_study'
  | 'serpapi_news'
  | 'serpapi_image'
  | 'other';

export type EnvironmentSetting = 'indoor' | 'outdoor' | 'mixed';

export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'archived';

export interface EnvironmentFeatures {
  setting?: EnvironmentSetting;
  human_presence?: 'high_traffic' | 'low_traffic' | 'collaborative' | 'none';
  floor_type?: 'smooth' | 'rough' | 'multi_level';
  lighting?: 'natural' | 'artificial' | 'variable' | 'low_light';
}

// V2: Application context for real deployments
export interface ApplicationContext {
  problem_solved?: string;  // labor_shortage, safety_hazard, quality_consistency, etc.
  deployment_scale?: 'single_unit' | 'small_fleet' | 'large_fleet' | 'facility_wide' | 'multi_site';
  customer_identified?: boolean;
  has_metrics?: boolean;
}

export interface GalleryItem {
  id: string;
  external_id: string;
  source_type: SourceType;
  source_url: string;
  source_name: string;

  // Content
  title: string;
  title_zh?: string;
  description?: string;
  description_zh?: string;
  media_type: MediaType;
  thumbnail_url?: string;
  content_url?: string;
  duration_seconds?: number;
  published_at?: string;

  // V2 Classification (primary)
  content_type: ContentType;
  deployment_maturity: DeploymentMaturity;
  educational_value: number;  // 1-5 stars
  application_context?: ApplicationContext;

  // RSIP Classification
  application_category: ApplicationCategory;
  task_types: string[];           // Broad types (transportation, manipulation)
  specific_tasks: string[];       // V2: Specific tasks (pallet_transport, machine_tending)
  functional_requirements: string[];
  scene_type?: string;
  environment_setting?: EnvironmentSetting;
  environment_features?: EnvironmentFeatures;

  // Robot info (secondary)
  robot_names: string[];
  robot_types: string[];
  manufacturers: string[];

  // AI analysis
  ai_summary?: string;
  ai_summary_zh?: string;

  // Engagement
  view_count: number;
  featured: boolean;

  // Moderation
  status?: ItemStatus;  // Optional since not always returned by queries

  // Timestamps
  created_at: string;
  updated_at: string;
}

// V2: Enhanced filters
export interface GalleryFilters {
  // V2 primary filters
  content_types?: ContentType[];
  min_educational_value?: number;  // 1-5, default 3

  // Existing filters
  category?: ApplicationCategory;
  task_types?: string[];
  specific_tasks?: string[];      // V2
  requirements?: string[];
  scene_type?: string;
  media_type?: MediaType;
  search?: string;
  featured?: boolean;

  // Show all toggle
  include_demos?: boolean;  // If false, excludes tech_demo and product_announcement
}

export interface GalleryResponse {
  data: GalleryItem[];
  count: number;
  error?: string;
}

export interface FilterOptions {
  categories: ApplicationCategory[];
  content_types: ContentType[];
  scene_types: string[];
  task_types: string[];
  specific_tasks: string[];
  manufacturers: string[];
}

// V2: Content type display info
export const CONTENT_TYPE_INFO: Record<ContentType, {
  label: string;
  labelZh: string;
  icon: string;
  color: string;
  description: string;
}> = {
  real_application: {
    label: 'Real Application',
    labelZh: '实际应用',
    icon: '✅',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Deployed in actual business operations',
  },
  pilot_poc: {
    label: 'Pilot / POC',
    labelZh: '试点项目',
    icon: '🧪',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Trial deployment or proof of concept',
  },
  case_study: {
    label: 'Case Study',
    labelZh: '案例研究',
    icon: '📊',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Documented deployment with results',
  },
  tech_demo: {
    label: 'Tech Demo',
    labelZh: '技术演示',
    icon: '🎬',
    color: 'bg-gray-100 text-gray-600 border-gray-300',
    description: 'Capability demonstration or trade show',
  },
  product_announcement: {
    label: 'Product News',
    labelZh: '产品发布',
    icon: '📢',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'New product announcement',
  },
  tutorial: {
    label: 'Tutorial',
    labelZh: '教程',
    icon: '📚',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'How-to or educational content',
  },
  interview_comment: {
    label: 'Interview & Comment',
    labelZh: '访谈与评论',
    icon: '🎤',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Interviews, commentary, or reactions about robots',
  },
  unknown: {
    label: 'Uncategorized',
    labelZh: '未分类',
    icon: '❓',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    description: 'Not yet classified',
  },
};

// V2: Educational value display
export const EDUCATIONAL_VALUE_INFO: Record<number, {
  label: string;
  labelZh: string;
  stars: string;
}> = {
  5: { label: 'Excellent', labelZh: '优秀', stars: '★★★★★' },
  4: { label: 'Very Good', labelZh: '很好', stars: '★★★★☆' },
  3: { label: 'Good', labelZh: '良好', stars: '★★★☆☆' },
  2: { label: 'Fair', labelZh: '一般', stars: '★★☆☆☆' },
  1: { label: 'Low', labelZh: '较低', stars: '★☆☆☆☆' },
};

// Category display info
export const CATEGORY_INFO: Record<ApplicationCategory, {
  label: string;
  labelZh: string;
  icon: string;
  color: string;
}> = {
  industrial: {
    label: 'Industrial',
    labelZh: '工业',
    icon: '🏭',
    color: 'bg-blue-100 text-blue-800',
  },
  professional_service: {
    label: 'Professional Service',
    labelZh: '专业服务',
    icon: '🤖',
    color: 'bg-green-100 text-green-800',
  },
  personal_service: {
    label: 'Personal Service',
    labelZh: '个人服务',
    icon: '🏠',
    color: 'bg-purple-100 text-purple-800',
  },
  medical: {
    label: 'Medical',
    labelZh: '医疗',
    icon: '🏥',
    color: 'bg-red-100 text-red-800',
  },
  specialized_environment: {
    label: 'Specialized',
    labelZh: '特殊环境',
    icon: '⚠️',
    color: 'bg-amber-100 text-amber-800',
  },
};

// Scene type display info
// dbEnvironmentKey maps Video Library short keys → canonical environment_types.environment_key in Supabase
export const SCENE_INFO: Record<string, { label: string; labelZh: string; dbEnvironmentKey: string }> = {
  warehouse: { label: 'Warehouse', labelZh: '仓库', dbEnvironmentKey: 'warehouse_logistics' },
  manufacturing: { label: 'Manufacturing', labelZh: '制造车间', dbEnvironmentKey: 'manufacturing_floor' },
  retail: { label: 'Retail', labelZh: '零售', dbEnvironmentKey: 'retail_shopping' },
  hospital: { label: 'Hospital', labelZh: '医院', dbEnvironmentKey: 'hospital_healthcare' },
  office: { label: 'Office', labelZh: '办公', dbEnvironmentKey: 'office_corporate' },
  hotel: { label: 'Hotel', labelZh: '酒店', dbEnvironmentKey: 'hotel_hospitality' },
  outdoor: { label: 'Outdoor', labelZh: '户外', dbEnvironmentKey: 'outdoor_public' },
  laboratory: { label: 'Laboratory', labelZh: '实验室', dbEnvironmentKey: 'laboratory_research' },
  construction: { label: 'Construction', labelZh: '建筑', dbEnvironmentKey: 'construction_site' },
  logistics_center: { label: 'Logistics Center', labelZh: '物流中心', dbEnvironmentKey: 'logistics_center' },
  airport: { label: 'Airport', labelZh: '机场', dbEnvironmentKey: 'airport_terminal' },
  restaurant: { label: 'Restaurant', labelZh: '餐厅', dbEnvironmentKey: 'restaurant_food_service' },
  residential: { label: 'Residential', labelZh: '住宅', dbEnvironmentKey: 'residential_home' },
  campus: { label: 'Campus', labelZh: '园区', dbEnvironmentKey: 'educational_campus' },
  entertainment_venue: { label: 'Entertainment Venue', labelZh: '演艺场所', dbEnvironmentKey: 'entertainment_venue' },
};

// V2: Specific tasks display info
export const SPECIFIC_TASK_INFO: Record<string, {
  label: string;
  labelZh: string;
  category: ApplicationCategory;
}> = {
  // Industrial - Transport
  pallet_transport: { label: 'Pallet Transport', labelZh: '托盘搬运', category: 'industrial' },
  tote_transport: { label: 'Tote Transport', labelZh: '料箱搬运', category: 'industrial' },
  cart_towing: { label: 'Cart Towing', labelZh: '拖车牵引', category: 'industrial' },
  dock_to_stock: { label: 'Dock to Stock', labelZh: '卸货入库', category: 'industrial' },
  material_handling: { label: 'Material Handling', labelZh: '物料搬运', category: 'industrial' },

  // Industrial - Manipulation
  machine_tending: { label: 'Machine Tending', labelZh: '机床上下料', category: 'industrial' },
  assembly_insertion: { label: 'Assembly Insertion', labelZh: '装配插入', category: 'industrial' },
  screw_driving: { label: 'Screw Driving', labelZh: '螺丝拧紧', category: 'industrial' },
  bin_picking: { label: 'Bin Picking', labelZh: '料箱拣选', category: 'industrial' },
  kitting: { label: 'Kitting', labelZh: '配套组装', category: 'industrial' },
  welding: { label: 'Welding', labelZh: '焊接', category: 'industrial' },
  painting: { label: 'Painting', labelZh: '喷涂', category: 'industrial' },

  // Industrial - Palletizing
  case_palletizing: { label: 'Case Palletizing', labelZh: '箱子码垛', category: 'industrial' },
  depalletizing: { label: 'Depalletizing', labelZh: '拆垛', category: 'industrial' },

  // Industrial - Inspection
  visual_inspection: { label: 'Visual Inspection', labelZh: '视觉检测', category: 'industrial' },
  weld_inspection: { label: 'Weld Inspection', labelZh: '焊缝检测', category: 'industrial' },
  quality_control: { label: 'Quality Control', labelZh: '质量控制', category: 'industrial' },

  // Service - Delivery
  room_delivery: { label: 'Room Delivery', labelZh: '客房配送', category: 'professional_service' },
  medication_delivery: { label: 'Medication Delivery', labelZh: '药品配送', category: 'professional_service' },
  food_delivery: { label: 'Food Delivery', labelZh: '餐饮配送', category: 'professional_service' },

  // Service - Cleaning
  floor_scrubbing: { label: 'Floor Scrubbing', labelZh: '地面清洗', category: 'professional_service' },
  vacuum_cleaning: { label: 'Vacuum Cleaning', labelZh: '吸尘清洁', category: 'professional_service' },
  disinfection: { label: 'Disinfection', labelZh: '消毒杀菌', category: 'professional_service' },

  // Service - Interaction
  reception_greeting: { label: 'Reception', labelZh: '接待迎宾', category: 'professional_service' },
  wayfinding: { label: 'Wayfinding', labelZh: '导航引导', category: 'professional_service' },
  telepresence: { label: 'Telepresence', labelZh: '远程呈现', category: 'professional_service' },
  inventory_scanning: { label: 'Inventory Scanning', labelZh: '库存盘点', category: 'professional_service' },
  companion: { label: 'Companion', labelZh: '陪伴', category: 'professional_service' },
  concierge: { label: 'Concierge', labelZh: '礼宾服务', category: 'professional_service' },

  // Security
  perimeter_patrol: { label: 'Perimeter Patrol', labelZh: '周界巡逻', category: 'professional_service' },
  intrusion_detection: { label: 'Intrusion Detection', labelZh: '入侵检测', category: 'professional_service' },
  access_verification: { label: 'Access Verification', labelZh: '门禁验证', category: 'professional_service' },
  remote_monitoring: { label: 'Remote Monitoring', labelZh: '远程监控', category: 'professional_service' },
  threat_detection: { label: 'Threat Detection', labelZh: '威胁检测', category: 'professional_service' },
  facility_inspection: { label: 'Facility Inspection', labelZh: '设施巡检', category: 'professional_service' },

  // Medical
  surgical_procedure: { label: 'Surgical Procedure', labelZh: '外科手术', category: 'medical' },
  rehabilitation_therapy: { label: 'Rehabilitation', labelZh: '康复治疗', category: 'medical' },
  pharmacy_dispensing: { label: 'Pharmacy Dispensing', labelZh: '药房配药', category: 'medical' },
  lab_automation: { label: 'Lab Automation', labelZh: '实验室自动化', category: 'medical' },
  sample_handling: { label: 'Sample Handling', labelZh: '样本处理', category: 'medical' },
  cell_therapy: { label: 'Cell Therapy', labelZh: '细胞治疗', category: 'medical' },
  diagnostic_imaging: { label: 'Diagnostic Imaging', labelZh: '诊断成像', category: 'medical' },
  patient_monitoring: { label: 'Patient Monitoring', labelZh: '患者监测', category: 'medical' },
  sterilization: { label: 'Sterilization', labelZh: '灭菌消毒', category: 'medical' },

  // Specialized Environment
  hazardous_inspection: { label: 'Hazardous Inspection', labelZh: '危险环境检查', category: 'specialized_environment' },
  bomb_disposal: { label: 'Bomb Disposal', labelZh: '排爆', category: 'specialized_environment' },
  underwater_operation: { label: 'Underwater Operation', labelZh: '水下作业', category: 'specialized_environment' },
  space_operation: { label: 'Space Operation', labelZh: '太空作业', category: 'specialized_environment' },
  nuclear_decommission: { label: 'Nuclear Decommission', labelZh: '核退役', category: 'specialized_environment' },
  firefighting: { label: 'Firefighting', labelZh: '消防', category: 'specialized_environment' },

  // Personal Service
  home_cleaning: { label: 'Home Cleaning', labelZh: '家庭清洁', category: 'personal_service' },
  lawn_mowing: { label: 'Lawn Mowing', labelZh: '草坪修剪', category: 'personal_service' },
  entertainment: { label: 'Entertainment', labelZh: '娱乐表演', category: 'personal_service' },
  personal_assistant: { label: 'Personal Assistant', labelZh: '个人助理', category: 'personal_service' },

  // Cross-category
  locomotion_demo: { label: 'Locomotion Demo', labelZh: '运动演示', category: 'industrial' },
  general_demo: { label: 'General Demo', labelZh: '综合演示', category: 'industrial' },
  research_platform: { label: 'Research Platform', labelZh: '研究平台', category: 'industrial' },
};

// Helper: Get default filters (show quality content only)
export const getDefaultFilters = (): GalleryFilters => ({
  content_types: ['real_application', 'case_study', 'pilot_poc'],
  min_educational_value: 3,
  include_demos: false,
});

// Helper: Get all content filters (include demos)
export const getAllContentFilters = (): GalleryFilters => ({
  content_types: undefined,  // All types
  min_educational_value: 1,
  include_demos: true,
});
