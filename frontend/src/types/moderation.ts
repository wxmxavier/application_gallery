/**
 * Moderation Types
 * Types for content reporting and admin moderation features
 */

import type { GalleryItem } from './gallery';

// Report reason options
export type ReportReason =
  | 'inappropriate'
  | 'copyright'
  | 'misleading'
  | 'broken_link'
  | 'spam'
  | 'other';

// Report status workflow
export type ReportStatus =
  | 'pending'
  | 'reviewed'
  | 'dismissed'
  | 'action_taken';

// Gallery item moderation status
export type ItemStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'archived';

// Content report from database
export interface ContentReport {
  id: string;
  gallery_item_id: string;
  content_url?: string;
  content_title?: string;
  reporter_email?: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// Gallery item with moderation metadata (status is required)
export interface ModerationItem extends GalleryItem {
  status: ItemStatus;  // Required for moderation, overrides optional in GalleryItem
  reports_count?: number;
  pending_reports?: ContentReport[];
}

// Report submission payload
export interface ReportSubmission {
  gallery_item_id: string;
  content_url?: string;
  content_title?: string;
  reporter_email?: string;
  reason: ReportReason;
  description?: string;
}

// Moderation action types
export type ModerationAction =
  | 'approve'
  | 'reject'
  | 'flag'
  | 'archive';

// Moderation stats for dashboard
export interface ModerationStats {
  pendingContent: number;
  pendingReports: number;
  approvedToday: number;
  rejectedToday: number;
}

// Report reason display labels
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  inappropriate: 'Inappropriate Content',
  copyright: 'Copyright Violation',
  misleading: 'Misleading Information',
  broken_link: 'Broken Link',
  spam: 'Spam',
  other: 'Other',
};

// Report status display labels
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pending Review',
  reviewed: 'Reviewed',
  dismissed: 'Dismissed',
  action_taken: 'Action Taken',
};

// Item status display labels
export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged for Review',
  archived: 'Archived',
};
