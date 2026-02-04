/**
 * Gallery Service V2 - Supabase integration for Application Gallery
 * Enhanced with content type filtering and educational value scoring
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  GalleryItem,
  GalleryFilters,
  GalleryResponse,
  FilterOptions,
  ApplicationCategory,
  ContentType,
} from '../types/gallery';
import { getDefaultFilters } from '../types/gallery';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type SortOption = 'recent' | 'popular' | 'oldest' | 'quality';

/**
 * Get gallery items with optional filtering (V2 enhanced)
 */
export async function getGalleryItems(
  filters: GalleryFilters = {},
  limit: number = 20,
  offset: number = 0,
  sortBy: SortOption = 'recent'
): Promise<GalleryResponse> {
  try {
    // Apply default filters if include_demos is false or undefined
    const effectiveFilters = filters.include_demos
      ? filters
      : { ...getDefaultFilters(), ...filters };

    let query = supabase
      .from('application_gallery')
      .select('*', { count: 'exact' })
      .eq('status', 'approved');

    // V2: Filter by content types
    if (effectiveFilters.content_types && effectiveFilters.content_types.length > 0) {
      query = query.in('content_type', effectiveFilters.content_types);
    }

    // V2: Filter by minimum educational value
    if (effectiveFilters.min_educational_value !== undefined) {
      query = query.gte('educational_value', effectiveFilters.min_educational_value);
    }

    // V2: Filter by specific tasks
    if (effectiveFilters.specific_tasks && effectiveFilters.specific_tasks.length > 0) {
      query = query.overlaps('specific_tasks', effectiveFilters.specific_tasks);
    }

    // Existing filters
    if (effectiveFilters.category) {
      query = query.eq('application_category', effectiveFilters.category);
    }

    if (effectiveFilters.task_types && effectiveFilters.task_types.length > 0) {
      query = query.overlaps('task_types', effectiveFilters.task_types);
    }

    if (effectiveFilters.requirements && effectiveFilters.requirements.length > 0) {
      query = query.overlaps('functional_requirements', effectiveFilters.requirements);
    }

    if (effectiveFilters.scene_type) {
      query = query.eq('scene_type', effectiveFilters.scene_type);
    }

    if (effectiveFilters.media_type) {
      query = query.eq('media_type', effectiveFilters.media_type);
    }

    if (effectiveFilters.featured !== undefined) {
      query = query.eq('featured', effectiveFilters.featured);
    }

    if (effectiveFilters.search) {
      // Use ilike for partial matching since textSearch may not work on all setups
      query = query.or(`title.ilike.%${effectiveFilters.search}%,description.ilike.%${effectiveFilters.search}%,ai_summary.ilike.%${effectiveFilters.search}%`);
    }

    // Apply sorting
    if (sortBy === 'quality') {
      // V2: Sort by educational value first
      query = query
        .order('educational_value', { ascending: false })
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });
    } else if (sortBy === 'recent') {
      query = query
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'popular') {
      query = query
        .order('featured', { ascending: false })
        .order('view_count', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query
        .order('published_at', { ascending: true, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching gallery items:', error);
      return { data: [], count: 0, error: error.message };
    }

    return { data: data as GalleryItem[], count: count || 0 };
  } catch (err) {
    console.error('Gallery service error:', err);
    return { data: [], count: 0, error: 'Failed to fetch gallery items' };
  }
}

/**
 * Get a single gallery item by ID
 */
export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  try {
    const { data, error } = await supabase
      .from('application_gallery')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error) {
      console.error('Error fetching gallery item:', error);
      return null;
    }

    return data as GalleryItem;
  } catch (err) {
    console.error('Gallery service error:', err);
    return null;
  }
}

/**
 * Search gallery items by text query
 */
export async function searchGallery(
  query: string,
  category?: ApplicationCategory,
  limit: number = 20
): Promise<GalleryResponse> {
  return getGalleryItems(
    {
      search: query,
      category,
      include_demos: true,  // Search across all content
    },
    limit
  );
}

/**
 * Get featured gallery items (real applications preferred)
 */
export async function getFeaturedItems(limit: number = 6): Promise<GalleryItem[]> {
  const response = await getGalleryItems(
    {
      featured: true,
      content_types: ['real_application', 'case_study', 'pilot_poc'],
      min_educational_value: 3,
    },
    limit,
    0,
    'quality'
  );
  return response.data;
}

/**
 * Get related items based on tags (prefer real applications)
 */
export async function getRelatedItems(
  item: GalleryItem,
  limit: number = 4
): Promise<GalleryItem[]> {
  try {
    const { data, error } = await supabase
      .from('application_gallery')
      .select('*')
      .eq('status', 'approved')
      .eq('application_category', item.application_category)
      .neq('id', item.id)
      .in('content_type', ['real_application', 'case_study', 'pilot_poc'])
      .gte('educational_value', 3)
      .overlaps('task_types', item.task_types)
      .order('educational_value', { ascending: false })
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      // Fallback without content_type filter if column doesn't exist yet
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('application_gallery')
        .select('*')
        .eq('status', 'approved')
        .eq('application_category', item.application_category)
        .neq('id', item.id)
        .overlaps('task_types', item.task_types)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        console.error('Error fetching related items:', fallbackError);
        return [];
      }
      return fallbackData as GalleryItem[];
    }

    return data as GalleryItem[];
  } catch (err) {
    console.error('Gallery service error:', err);
    return [];
  }
}

/**
 * Increment view count for an item
 */
export async function incrementViewCount(itemId: string): Promise<void> {
  try {
    await supabase.rpc('increment_gallery_view', { item_id: itemId });
  } catch (err) {
    console.error('Failed to increment view count:', err);
  }
}

/**
 * Get filter options (available values)
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  try {
    const { data, error } = await supabase.rpc('get_gallery_filter_options');

    if (error) {
      console.error('Error fetching filter options:', error);
      return getDefaultFilterOptions();
    }

    return {
      ...getDefaultFilterOptions(),
      ...data,
    } as FilterOptions;
  } catch (err) {
    console.error('Gallery service error:', err);
    return getDefaultFilterOptions();
  }
}

function getDefaultFilterOptions(): FilterOptions {
  return {
    categories: ['industrial_automation', 'service_robotics', 'surveillance_security'],
    content_types: ['real_application', 'pilot_poc', 'case_study', 'tech_demo', 'product_announcement', 'tutorial'],
    scene_types: [],
    task_types: [],
    specific_tasks: [],
    manufacturers: [],
  };
}

/**
 * Submit a content suggestion
 */
export async function submitSuggestion(suggestion: {
  url: string;
  title?: string;
  description?: string;
  suggested_category?: ApplicationCategory;
  suggested_tags?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('gallery_suggestions').insert({
      url: suggestion.url,
      title: suggestion.title,
      description: suggestion.description,
      suggested_category: suggestion.suggested_category,
      suggested_tags: suggestion.suggested_tags,
      status: 'pending',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to submit suggestion' };
  }
}

/**
 * Get gallery statistics (V2 enhanced)
 */
export async function getGalleryStats(): Promise<{
  total: number;
  byCategory: Record<ApplicationCategory, number>;
  byContentType: Record<ContentType, number>;
  qualityContent: number;  // Items with educational_value >= 3 and real applications
}> {
  try {
    const { count: total } = await supabase
      .from('application_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    // Get counts by category
    const categories: ApplicationCategory[] = [
      'industrial_automation',
      'service_robotics',
      'surveillance_security',
    ];

    const byCategory: Record<ApplicationCategory, number> = {} as Record<ApplicationCategory, number>;

    for (const cat of categories) {
      const { count: catCount } = await supabase
        .from('application_gallery')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('application_category', cat);

      byCategory[cat] = catCount || 0;
    }

    // V2: Get counts by content type
    const contentTypes: ContentType[] = [
      'real_application',
      'pilot_poc',
      'case_study',
      'tech_demo',
      'product_announcement',
      'tutorial',
      'unknown',
    ];

    const byContentType: Record<ContentType, number> = {} as Record<ContentType, number>;

    for (const ct of contentTypes) {
      try {
        const { count: ctCount } = await supabase
          .from('application_gallery')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .eq('content_type', ct);

        byContentType[ct] = ctCount || 0;
      } catch {
        byContentType[ct] = 0;
      }
    }

    // V2: Count quality content
    let qualityContent = 0;
    try {
      const { count: qualityCount } = await supabase
        .from('application_gallery')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .in('content_type', ['real_application', 'case_study', 'pilot_poc'])
        .gte('educational_value', 3);

      qualityContent = qualityCount || 0;
    } catch {
      qualityContent = 0;
    }

    return {
      total: total || 0,
      byCategory,
      byContentType,
      qualityContent,
    };
  } catch (err) {
    console.error('Failed to get gallery stats:', err);
    return {
      total: 0,
      byCategory: {
        industrial_automation: 0,
        service_robotics: 0,
        surveillance_security: 0,
      },
      byContentType: {
        real_application: 0,
        pilot_poc: 0,
        case_study: 0,
        tech_demo: 0,
        product_announcement: 0,
        tutorial: 0,
        interview_comment: 0,
        unknown: 0,
      },
      qualityContent: 0,
    };
  }
}

/**
 * V2: Get content type statistics
 */
export async function getContentTypeStats(): Promise<{
  content_type: ContentType;
  count: number;
  avg_educational_value: number;
}[]> {
  try {
    const { data, error } = await supabase.rpc('get_gallery_content_stats');

    if (error) {
      console.error('Error fetching content stats:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Gallery service error:', err);
    return [];
  }
}

/**
 * Submit a content report
 */
export async function submitContentReport(report: {
  gallery_item_id: string;
  content_url?: string;
  content_title?: string;
  reason: string;
  description?: string;
  reporter_email?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('content_reports').insert({
      gallery_item_id: report.gallery_item_id,
      content_url: report.content_url,
      content_title: report.content_title,
      reason: report.reason,
      description: report.description,
      reporter_email: report.reporter_email,
      status: 'pending',
    });

    if (error) {
      console.error('Error submitting report:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Gallery service error:', err);
    return { success: false, error: 'Failed to submit report' };
  }
}
