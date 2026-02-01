"""
Supabase Client for RSIP Application Gallery

Handles all database operations for the crawler.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
import structlog
from supabase import create_client, Client

from config import Config, get_config


logger = structlog.get_logger()


class SupabaseClient:
    """Supabase database client for Application Gallery"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self.client: Client = create_client(
            self.config.supabase_url,
            self.config.supabase_service_key
        )

    async def item_exists(self, source_type: str, external_id: str) -> bool:
        """Check if an item already exists in the database"""
        try:
            result = self.client.table("application_gallery").select("id").eq(
                "source_type", source_type
            ).eq(
                "external_id", external_id
            ).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error("Failed to check item existence", error=str(e))
            return False

    async def insert_gallery_item(self, item: Dict[str, Any]) -> Optional[str]:
        """
        Insert a new gallery item.

        Args:
            item: Gallery item data

        Returns:
            ID of inserted item or None on failure
        """
        try:
            # Prepare data for insert
            data = {
                "external_id": item.get("external_id"),
                "source_type": item.get("source_type"),
                "source_url": item.get("source_url"),
                "source_name": item.get("source_name"),
                "title": item.get("title"),
                "title_zh": item.get("title_zh"),
                "description": item.get("description"),
                "description_zh": item.get("description_zh"),
                "media_type": item.get("media_type"),
                "thumbnail_url": item.get("thumbnail_url"),
                "content_url": item.get("content_url"),
                "duration_seconds": item.get("duration_seconds"),
                "published_at": item.get("published_at"),
                "application_category": item.get("application_category"),
                "task_types": item.get("task_types", []),
                "functional_requirements": item.get("functional_requirements", []),
                "scene_type": item.get("scene_type"),
                "environment_setting": item.get("environment_setting"),
                "environment_features": item.get("environment_features", {}),
                "robot_names": item.get("robot_names", []),
                "robot_types": item.get("robot_types", []),
                "manufacturers": item.get("manufacturers", []),
                "ai_classification": item.get("ai_classification", {}),
                "ai_confidence": item.get("ai_confidence", {}),
                "ai_summary": item.get("ai_summary"),
                "ai_summary_zh": item.get("ai_summary_zh"),
                "status": item.get("status", "pending"),
                "crawler_source": item.get("crawler_source", "automated"),
                "crawler_run_id": item.get("crawler_run_id"),
                "view_count": item.get("view_count", 0),
                "featured": False,
            }

            # Remove None values
            data = {k: v for k, v in data.items() if v is not None}

            result = self.client.table("application_gallery").insert(data).execute()

            if result.data:
                logger.info("Inserted gallery item",
                          title=item.get("title", "")[:50],
                          id=result.data[0].get("id"))
                return result.data[0].get("id")

            return None

        except Exception as e:
            logger.error("Failed to insert gallery item",
                        title=item.get("title", "")[:50],
                        error=str(e))
            return None

    async def start_crawler_run(self, run_id: str, crawler_type: str) -> bool:
        """Record the start of a crawler run"""
        try:
            data = {
                "run_id": run_id,
                "crawler_type": crawler_type,
                "status": "running",
                "started_at": datetime.utcnow().isoformat(),
            }

            self.client.table("gallery_crawler_runs").insert(data).execute()
            logger.info("Started crawler run", run_id=run_id, type=crawler_type)
            return True

        except Exception as e:
            logger.error("Failed to start crawler run", error=str(e))
            return False

    async def complete_crawler_run(
        self,
        run_id: str,
        status: str,
        stats: Dict[str, int],
        error: Optional[str] = None
    ) -> bool:
        """Record completion of a crawler run"""
        try:
            data = {
                "status": status,
                "completed_at": datetime.utcnow().isoformat(),
                "items_found": stats.get("items_found", 0),
                "items_added": stats.get("items_added", 0),
                "items_skipped": stats.get("items_skipped", 0),
                "items_failed": stats.get("items_failed", 0),
            }

            if error:
                data["error_message"] = error

            self.client.table("gallery_crawler_runs").update(data).eq(
                "run_id", run_id
            ).execute()

            logger.info("Completed crawler run",
                       run_id=run_id,
                       status=status,
                       stats=stats)
            return True

        except Exception as e:
            logger.error("Failed to complete crawler run", error=str(e))
            return False

    async def get_pending_items(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get pending items for moderation"""
        try:
            result = self.client.table("application_gallery").select("*").eq(
                "status", "pending"
            ).order(
                "created_at", desc=True
            ).limit(limit).execute()

            return result.data

        except Exception as e:
            logger.error("Failed to get pending items", error=str(e))
            return []

    async def update_item_status(
        self,
        item_id: str,
        status: str,
        moderator_id: Optional[str] = None,
        notes: Optional[str] = None,
        rejection_reason: Optional[str] = None
    ) -> bool:
        """Update the status of a gallery item"""
        try:
            data = {
                "status": status,
                "moderated_at": datetime.utcnow().isoformat(),
            }

            if moderator_id:
                data["moderated_by"] = moderator_id
            if notes:
                data["moderation_notes"] = notes
            if rejection_reason:
                data["rejection_reason"] = rejection_reason

            self.client.table("application_gallery").update(data).eq(
                "id", item_id
            ).execute()

            logger.info("Updated item status", id=item_id, status=status)
            return True

        except Exception as e:
            logger.error("Failed to update item status", error=str(e))
            return False

    async def get_gallery_stats(self) -> Dict[str, Any]:
        """Get gallery statistics"""
        try:
            # Count by status
            approved = self.client.table("application_gallery").select(
                "id", count="exact"
            ).eq("status", "approved").execute()

            pending = self.client.table("application_gallery").select(
                "id", count="exact"
            ).eq("status", "pending").execute()

            # Count by category
            categories = self.client.rpc(
                "get_gallery_filter_options"
            ).execute()

            return {
                "approved_count": approved.count or 0,
                "pending_count": pending.count or 0,
                "categories": categories.data if categories.data else [],
            }

        except Exception as e:
            logger.error("Failed to get gallery stats", error=str(e))
            return {}
