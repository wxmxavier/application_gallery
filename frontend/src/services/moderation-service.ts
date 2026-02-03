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
import type { GalleryItem } from '../types/gallery';

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
