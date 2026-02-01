/**
 * Gallery Service - Supabase integration for Application Gallery
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  GalleryItem,
  GalleryFilters,
  GalleryResponse,
  FilterOptions,
  ApplicationCategory,
} from '../types/gallery';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type SortOption = 'recent' | 'popular' | 'oldest';

/**
 * Get gallery items with optional filtering
 */
export async function getGalleryItems(
  filters: GalleryFilters = {},
  limit: number = 20,
  offset: number = 0,
  sortBy: SortOption = 'recent'
): Promise<GalleryResponse> {
  try {
    let query = supabase
      .from('application_gallery')
      .select('*', { count: 'exact' })
      .eq('status', 'approved');

    // Apply sorting
    if (sortBy === 'recent') {
      query = query.order('published_at', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'popular') {
      query = query.order('view_count', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('published_at', { ascending: true, nullsFirst: false });
    }

    // Featured items still get priority within the sort
    query = query.order('featured', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    // Apply filters
    if (filters.category) {
      query = query.eq('application_category', filters.category);
    }

    if (filters.task_types && filters.task_types.length > 0) {
      query = query.overlaps('task_types', filters.task_types);
    }

    if (filters.requirements && filters.requirements.length > 0) {
      query = query.overlaps('functional_requirements', filters.requirements);
    }

    if (filters.scene_type) {
      query = query.eq('scene_type', filters.scene_type);
    }

    if (filters.media_type) {
      query = query.eq('media_type', filters.media_type);
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    if (filters.search) {
      query = query.textSearch('title', filters.search, {
        type: 'websearch',
        config: 'english',
      });
    }

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
    },
    limit
  );
}

/**
 * Get featured gallery items
 */
export async function getFeaturedItems(limit: number = 6): Promise<GalleryItem[]> {
  const response = await getGalleryItems({ featured: true }, limit);
  return response.data;
}

/**
 * Get related items based on tags
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
      .overlaps('task_types', item.task_types)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related items:', error);
      return [];
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
      return {
        categories: ['industrial_automation', 'service_robotics', 'surveillance_security'],
        scene_types: [],
        task_types: [],
        manufacturers: [],
      };
    }

    return data as FilterOptions;
  } catch (err) {
    console.error('Gallery service error:', err);
    return {
      categories: ['industrial_automation', 'service_robotics', 'surveillance_security'],
      scene_types: [],
      task_types: [],
      manufacturers: [],
    };
  }
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
 * Get gallery statistics
 */
export async function getGalleryStats(): Promise<{
  total: number;
  byCategory: Record<ApplicationCategory, number>;
}> {
  try {
    const { count } = await supabase
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

    return {
      total: count || 0,
      byCategory,
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
    };
  }
}
