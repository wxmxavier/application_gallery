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
  | 'unknown';

// V2: Deployment maturity
export type DeploymentMaturity =
  | 'production'  // Running in real operations
  | 'pilot'       // Limited deployment
  | 'prototype'   // R&D stage
  | 'concept'     // Simulation/rendering
  | 'unknown';

export type ApplicationCategory =
  | 'industrial_automation'
  | 'service_robotics'
  | 'surveillance_security';

export type MediaType = 'video' | 'image' | 'photo' | 'article' | 'case_study' | 'gallery';

export type SourceType =
  | 'company_website'
  | 'news'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
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
  industrial_automation: {
    label: 'Industrial Automation',
    labelZh: '工业自动化',
    icon: '🏭',
    color: 'bg-blue-100 text-blue-800',
  },
  service_robotics: {
    label: 'Service Robotics',
    labelZh: '服务机器人',
    icon: '🤖',
    color: 'bg-green-100 text-green-800',
  },
  surveillance_security: {
    label: 'Security & Surveillance',
    labelZh: '安防监控',
    icon: '🛡️',
    color: 'bg-red-100 text-red-800',
  },
};

// Scene type display info
export const SCENE_INFO: Record<string, { label: string; labelZh: string }> = {
  warehouse: { label: 'Warehouse', labelZh: '仓库' },
  manufacturing: { label: 'Manufacturing', labelZh: '制造车间' },
  retail: { label: 'Retail', labelZh: '零售' },
  hospital: { label: 'Hospital', labelZh: '医院' },
  office: { label: 'Office', labelZh: '办公' },
  hotel: { label: 'Hotel', labelZh: '酒店' },
  outdoor: { label: 'Outdoor', labelZh: '户外' },
  laboratory: { label: 'Laboratory', labelZh: '实验室' },
  construction: { label: 'Construction', labelZh: '建筑' },
  logistics_center: { label: 'Logistics Center', labelZh: '物流中心' },
  airport: { label: 'Airport', labelZh: '机场' },
  restaurant: { label: 'Restaurant', labelZh: '餐厅' },
  residential: { label: 'Residential', labelZh: '住宅' },
  campus: { label: 'Campus', labelZh: '园区' },
};

// V2: Specific tasks display info
export const SPECIFIC_TASK_INFO: Record<string, {
  label: string;
  labelZh: string;
  category: ApplicationCategory;
}> = {
  // Industrial - Transport
  pallet_transport: { label: 'Pallet Transport', labelZh: '托盘搬运', category: 'industrial_automation' },
  tote_transport: { label: 'Tote Transport', labelZh: '料箱搬运', category: 'industrial_automation' },
  cart_towing: { label: 'Cart Towing', labelZh: '拖车牵引', category: 'industrial_automation' },
  dock_to_stock: { label: 'Dock to Stock', labelZh: '卸货入库', category: 'industrial_automation' },
  material_handling: { label: 'Material Handling', labelZh: '物料搬运', category: 'industrial_automation' },

  // Industrial - Manipulation
  machine_tending: { label: 'Machine Tending', labelZh: '机床上下料', category: 'industrial_automation' },
  assembly_insertion: { label: 'Assembly Insertion', labelZh: '装配插入', category: 'industrial_automation' },
  screw_driving: { label: 'Screw Driving', labelZh: '螺丝拧紧', category: 'industrial_automation' },
  bin_picking: { label: 'Bin Picking', labelZh: '料箱拣选', category: 'industrial_automation' },
  kitting: { label: 'Kitting', labelZh: '配套组装', category: 'industrial_automation' },
  welding: { label: 'Welding', labelZh: '焊接', category: 'industrial_automation' },
  painting: { label: 'Painting', labelZh: '喷涂', category: 'industrial_automation' },

  // Industrial - Palletizing
  case_palletizing: { label: 'Case Palletizing', labelZh: '箱子码垛', category: 'industrial_automation' },
  depalletizing: { label: 'Depalletizing', labelZh: '拆垛', category: 'industrial_automation' },

  // Industrial - Inspection
  visual_inspection: { label: 'Visual Inspection', labelZh: '视觉检测', category: 'industrial_automation' },
  weld_inspection: { label: 'Weld Inspection', labelZh: '焊缝检测', category: 'industrial_automation' },
  quality_control: { label: 'Quality Control', labelZh: '质量控制', category: 'industrial_automation' },

  // Service - Delivery
  room_delivery: { label: 'Room Delivery', labelZh: '客房配送', category: 'service_robotics' },
  medication_delivery: { label: 'Medication Delivery', labelZh: '药品配送', category: 'service_robotics' },
  food_delivery: { label: 'Food Delivery', labelZh: '餐饮配送', category: 'service_robotics' },

  // Service - Cleaning
  floor_scrubbing: { label: 'Floor Scrubbing', labelZh: '地面清洗', category: 'service_robotics' },
  vacuum_cleaning: { label: 'Vacuum Cleaning', labelZh: '吸尘清洁', category: 'service_robotics' },
  disinfection: { label: 'Disinfection', labelZh: '消毒杀菌', category: 'service_robotics' },

  // Service - Interaction
  reception_greeting: { label: 'Reception', labelZh: '接待迎宾', category: 'service_robotics' },
  wayfinding: { label: 'Wayfinding', labelZh: '导航引导', category: 'service_robotics' },
  telepresence: { label: 'Telepresence', labelZh: '远程呈现', category: 'service_robotics' },
  inventory_scanning: { label: 'Inventory Scanning', labelZh: '库存盘点', category: 'service_robotics' },
  companion: { label: 'Companion', labelZh: '陪伴', category: 'service_robotics' },
  concierge: { label: 'Concierge', labelZh: '礼宾服务', category: 'service_robotics' },

  // Security
  perimeter_patrol: { label: 'Perimeter Patrol', labelZh: '周界巡逻', category: 'surveillance_security' },
  intrusion_detection: { label: 'Intrusion Detection', labelZh: '入侵检测', category: 'surveillance_security' },
  access_verification: { label: 'Access Verification', labelZh: '门禁验证', category: 'surveillance_security' },
  remote_monitoring: { label: 'Remote Monitoring', labelZh: '远程监控', category: 'surveillance_security' },
  threat_detection: { label: 'Threat Detection', labelZh: '威胁检测', category: 'surveillance_security' },
  facility_inspection: { label: 'Facility Inspection', labelZh: '设施巡检', category: 'surveillance_security' },
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
