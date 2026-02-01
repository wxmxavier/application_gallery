/**
 * RSIP Application Gallery Types
 * Aligned with RSIP platform taxonomy
 */

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
  | 'other';

export type EnvironmentSetting = 'indoor' | 'outdoor' | 'mixed';

export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'archived';

export interface EnvironmentFeatures {
  setting?: EnvironmentSetting;
  human_presence?: 'high_traffic' | 'low_traffic' | 'collaborative' | 'none';
  floor_type?: 'smooth' | 'rough' | 'multi_level';
  lighting?: 'natural' | 'artificial' | 'variable' | 'low_light';
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

  // RSIP Classification
  application_category: ApplicationCategory;
  task_types: string[];
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

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface GalleryFilters {
  category?: ApplicationCategory;
  task_types?: string[];
  requirements?: string[];
  scene_type?: string;
  media_type?: MediaType;
  search?: string;
  featured?: boolean;
}

export interface GalleryResponse {
  data: GalleryItem[];
  count: number;
  error?: string;
}

export interface FilterOptions {
  categories: ApplicationCategory[];
  scene_types: string[];
  task_types: string[];
  manufacturers: string[];
}

// Category display info
export const CATEGORY_INFO: Record<ApplicationCategory, { label: string; labelZh: string; icon: string; color: string }> = {
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
};
