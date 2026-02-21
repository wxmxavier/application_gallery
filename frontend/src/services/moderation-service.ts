/**
 * Moderation Service
 * Admin functions for content moderation and report management
 */
import { supabase } from './gallery-service';
import type {
  ContentReport,
  ModerationItem,
  ModerationStats,
  ItemStatus,
  ReportStatus,
} from '../types/moderation';
import type { GalleryItem, ContentType, ApplicationCategory } from '../types/gallery';
import type { ClassificationUpdate } from '../components/admin/ClassificationEditor';

/**
 * Get pending content items for moderation
 */
export async function getPendingContent(
  status: ItemStatus = 'pending',
  limit: number = 50
): Promise<ModerationItem[]> {
  try {
    const { data, error } = await supabase
      .from('application_gallery')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending content:', error);
      return [];
    }

    // Get report counts for each item
    // Data includes status from database (we're filtering by it)
    const items = data as (GalleryItem & { status: ItemStatus })[];
    const itemsWithReports: ModerationItem[] = [];

    for (const item of items) {
      const { count } = await supabase
        .from('content_reports')
        .select('*', { count: 'exact', head: true })
        .eq('gallery_item_id', item.id)
        .eq('status', 'pending');

      itemsWithReports.push({
        ...item,
        status: item.status,  // Explicitly include status
        reports_count: count || 0,
      });
    }

    return itemsWithReports;
  } catch (err) {
    console.error('Moderation service error:', err);
    return [];
  }
}

/**
 * Get flagged content items (items with pending reports)
 */
export async function getFlaggedContent(limit: number = 50): Promise<ModerationItem[]> {
  try {
    // Get items that have pending reports
    const { data: reportsData, error: reportsError } = await supabase
      .from('content_reports')
      .select('gallery_item_id')
      .eq('status', 'pending');

    if (reportsError) {
      console.error('Error fetching flagged content:', reportsError);
      return [];
    }

    const itemIds = [...new Set(reportsData?.map((r) => r.gallery_item_id) || [])];

    if (itemIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('application_gallery')
      .select('*')
      .in('id', itemIds)
      .limit(limit);

    if (error) {
      console.error('Error fetching flagged items:', error);
      return [];
    }

    // Get report counts and reports for each item
    // Data includes status from database
    const items = data as (GalleryItem & { status: ItemStatus })[];
    const itemsWithReports: ModerationItem[] = [];

    for (const item of items) {
      const { data: reports, count } = await supabase
        .from('content_reports')
        .select('*')
        .eq('gallery_item_id', item.id)
        .eq('status', 'pending');

      itemsWithReports.push({
        ...item,
        status: item.status || 'approved',  // Default to approved if not set
        reports_count: count || 0,
        pending_reports: reports as ContentReport[],
      });
    }

    return itemsWithReports;
  } catch (err) {
    console.error('Moderation service error:', err);
    return [];
  }
}

/**
 * Approve content item
 */
export async function approveContent(
  itemId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('application_gallery')
      .update({
        status: 'approved',
        reviewer_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Moderation service error:', err);
    return { success: false, error: 'Failed to approve content' };
  }
}

/**
 * Reject content item
 */
export async function rejectContent(
  itemId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('application_gallery')
      .update({
        status: 'rejected',
        reviewer_notes: reason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Moderation service error:', err);
    return { success: false, error: 'Failed to reject content' };
  }
}

/**
 * Flag content for further review
 */
export async function flagContent(
  itemId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('application_gallery')
      .update({
        status: 'flagged',
        reviewer_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Moderation service error:', err);
    return { success: false, error: 'Failed to flag content' };
  }
}

/**
 * Archive content item
 */
export async function archiveContent(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('application_gallery')
      .update({
        status: 'archived',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Moderation service error:', err);
    return { success: false, error: 'Failed to archive content' };
  }
}

/**
 * Get pending reports
 */
export async function getPendingReports(
  limit: number = 50
): Promise<ContentReport[]> {
  try {
    const { data, error } = await supabase
      .from('content_reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching pending reports:', error);
      return [];
    }

    return data as ContentReport[];
  } catch (err) {
    console.error('Moderation service error:', err);
    return [];
  }
}

/**
 * Get reports for a specific item
 */
export async function getItemReports(itemId: string): Promise<ContentReport[]> {
  try {
    const { data, error } = await supabase
      .from('content_reports')
      .select('*')
      .eq('gallery_item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching item reports:', error);
      return [];
    }

    return data as ContentReport[];
  } catch (err) {
    console.error('Moderation service error:', err);
    return [];
  }
}

/**
 * Dismiss a report
 */
export async function dismissReport(
  reportId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('content_reports')
      .update({
        status: 'dismissed' as ReportStatus,
        reviewer_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Moderation service error:', err);
    return { success: false, error: 'Failed to dismiss report' };
  }
}

/**
 * Resolve a report with action taken
 */
export async function resolveReport(
  reportId: string,
  action: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('content_reports')
      .update({
        status: 'action_taken' as ReportStatus,
        reviewer_notes: `Action: ${action}${notes ? `\nNotes: ${notes}` : ''}`,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Moderation service error:', err);
    return { success: false, error: 'Failed to resolve report' };
  }
}

/**
 * Bulk dismiss reports
 */
export async function bulkDismissReports(
  reportIds: string[],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('content_reports')
      .update({
        status: 'dismissed' as ReportStatus,
        reviewer_notes: notes || 'Bulk dismissed',
        reviewed_at: new Date().toISOString(),
      })
      .in('id', reportIds);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Moderation service error:', err);
    return { success: false, error: 'Failed to bulk dismiss reports' };
  }
}

/**
 * Update classification for a gallery item
 */
export async function updateClassification(
  itemId: string,
  updates: ClassificationUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('application_gallery')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Classification update error:', err);
    return { success: false, error: 'Failed to update classification' };
  }
}

/**
 * Delete a gallery item permanently
 */
export async function deleteContent(
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('application_gallery')
      .delete()
      .eq('id', itemId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Delete error:', err);
    return { success: false, error: 'Failed to delete content' };
  }
}

/**
 * Browse all gallery content with search, filter, and pagination
 */
export async function browseAllContent(params: {
  search?: string;
  category?: ApplicationCategory;
  contentType?: ContentType;
  offset?: number;
  limit?: number;
}): Promise<{ data: GalleryItem[]; count: number }> {
  try {
    let query = supabase
      .from('application_gallery')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (params.category) {
      query = query.eq('application_category', params.category);
    }
    if (params.contentType) {
      query = query.eq('content_type', params.contentType);
    }
    if (params.search) {
      // Search by title or ID prefix
      if (params.search.startsWith('#')) {
        const idPrefix = params.search.slice(1);
        query = query.ilike('id', `${idPrefix}%`);
      } else {
        query = query.ilike('title', `%${params.search}%`);
      }
    }

    const offset = params.offset || 0;
    const limit = params.limit || 25;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Browse content error:', error);
      return { data: [], count: 0 };
    }

    return { data: (data || []) as GalleryItem[], count: count || 0 };
  } catch (err) {
    console.error('Browse content error:', err);
    return { data: [], count: 0 };
  }
}

/**
 * Add content by URL - fetches YouTube oEmbed metadata and inserts
 * For non-YouTube URLs, creates a basic entry for manual classification
 */
export async function addContentByUrl(
  url: string
): Promise<{ item?: GalleryItem; error?: string }> {
  try {
    // Detect platform and extract metadata
    let title = '';
    let thumbnailUrl = '';
    let sourceName = 'Unknown';
    let sourceType = 'other';
    let mediaType = 'article';
    let contentUrl: string | null = null;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // YouTube: Use oEmbed API
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);

      if (!response.ok) {
        return { error: 'Failed to fetch YouTube video metadata. Check the URL.' };
      }

      const data = await response.json();
      title = data.title || 'Untitled YouTube Video';
      thumbnailUrl = data.thumbnail_url || '';
      sourceName = data.author_name || 'YouTube';
      sourceType = 'youtube';
      mediaType = 'video';

      // Extract video ID for embed URL
      const videoIdMatch = url.match(/(?:v=|\/)([\w-]{11})/);
      if (videoIdMatch) {
        contentUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
      }
    } else if (url.includes('tiktok.com')) {
      sourceType = 'tiktok';
      sourceName = 'TikTok';
      mediaType = 'video';
      title = 'TikTok Video';
    } else if (url.includes('linkedin.com')) {
      sourceType = 'linkedin';
      sourceName = 'LinkedIn';
      title = 'LinkedIn Post';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      sourceType = 'twitter';
      sourceName = 'X/Twitter';
      title = 'X Post';
    } else {
      // Generic URL - extract domain as source name
      try {
        const urlObj = new URL(url);
        sourceName = urlObj.hostname.replace('www.', '');
      } catch {
        sourceName = 'Website';
      }
      title = 'Content from ' + sourceName;
    }

    // Generate a unique external_id
    const externalId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Insert into database with default classification
    const insertData = {
      external_id: externalId,
      source_type: sourceType,
      source_url: url,
      source_name: sourceName,
      title,
      media_type: mediaType,
      thumbnail_url: thumbnailUrl || null,
      content_url: contentUrl,
      content_type: 'tech_demo' as const,
      application_category: 'industrial' as const,
      deployment_maturity: 'unknown',
      educational_value: 2,
      specific_tasks: [],
      task_types: [],
      functional_requirements: [],
      robot_names: [],
      robot_types: [],
      manufacturers: [],
      view_count: 0,
      featured: false,
      status: 'approved',
      ai_summary: 'Manually added by admin — awaiting classification',
    };

    const { data, error } = await supabase
      .from('application_gallery')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { error: 'This URL already exists in the gallery.' };
      }
      return { error: error.message };
    }

    return { item: data as GalleryItem };
  } catch (err) {
    console.error('Add content error:', err);
    return { error: 'Failed to add content. Please try again.' };
  }
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<ModerationStats> {
  try {
    // Count pending content
    const { count: pendingContent } = await supabase
      .from('application_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Count pending reports
    const { count: pendingReports } = await supabase
      .from('content_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Count approved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: approvedToday } = await supabase
      .from('application_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('reviewed_at', today.toISOString());

    // Count rejected today
    const { count: rejectedToday } = await supabase
      .from('application_gallery')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .gte('reviewed_at', today.toISOString());

    return {
      pendingContent: pendingContent || 0,
      pendingReports: pendingReports || 0,
      approvedToday: approvedToday || 0,
      rejectedToday: rejectedToday || 0,
    };
  } catch (err) {
    console.error('Moderation service error:', err);
    return {
      pendingContent: 0,
      pendingReports: 0,
      approvedToday: 0,
      rejectedToday: 0,
    };
  }
}
