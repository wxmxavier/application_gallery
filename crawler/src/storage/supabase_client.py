"""
Supabase Client V2 for RSIP Application Gallery

Handles all database operations for the crawler with V2 classification support.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
import structlog
from supabase import create_client, Client

from config import Config, get_config


logger = structlog.get_logger()


class SupabaseClient:
    """Supabase database client for Application Gallery V2"""

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
        Insert a new gallery item with V2 classification fields.

        Args:
            item: Gallery item data including V2 classification

        Returns:
            ID of inserted item or None on failure
        """
        try:
            # Extract V2 classification data
            classification = item.get("ai_classification", {})

            # Prepare data for insert
            data = {
                # Core fields
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

                # V2 Classification fields
                "content_type": item.get("content_type") or classification.get("content_type", "unknown"),
                "deployment_maturity": item.get("deployment_maturity") or classification.get("deployment_maturity", "unknown"),
                "educational_value": item.get("educational_value") or classification.get("educational_value", 3),
                "specific_tasks": item.get("specific_tasks") or classification.get("specific_tasks", []),
                "application_context": item.get("application_context") or classification.get("application_context", {}),

                # Existing classification fields
                "application_category": item.get("application_category") or classification.get("application_category"),
                "task_types": item.get("task_types") or classification.get("task_types", []),
                "functional_requirements": item.get("functional_requirements") or classification.get("functional_requirements", []),
                "scene_type": item.get("scene_type") or classification.get("scene_type"),
                "environment_setting": item.get("environment_setting"),
                "environment_features": item.get("environment_features") or classification.get("environment", {}),

                # Robot info
                "robot_names": item.get("robot_names", []),
                "robot_types": item.get("robot_types", []),
                "manufacturers": item.get("manufacturers", []),

                # AI analysis
                "ai_classification": classification,
                "ai_confidence": item.get("ai_confidence") or classification.get("confidence", {}),
                "ai_summary": item.get("ai_summary") or classification.get("summary"),
                "ai_summary_zh": item.get("ai_summary_zh"),

                # Status
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
                inserted = result.data[0]
                logger.info("Inserted gallery item",
                          title=item.get("title", "")[:50],
                          id=inserted.get("id"),
                          content_type=data.get("content_type"),
                          educational_value=data.get("educational_value"))
                return inserted.get("id")

            return None

        except Exception as e:
            logger.error("Failed to insert gallery item",
                        title=item.get("title", "")[:50],
                        error=str(e))
            return None

    async def update_item_classification(
        self,
        item_id: str,
        classification: Dict[str, Any]
    ) -> bool:
        """
        Update an existing item's classification with V2 fields.

        Args:
            item_id: ID of the item to update
            classification: New classification data from V2 classifier

        Returns:
            True if update succeeded
        """
        try:
            data = {
                "content_type": classification.get("content_type", "unknown"),
                "deployment_maturity": classification.get("deployment_maturity", "unknown"),
                "educational_value": classification.get("educational_value", 3),
                "specific_tasks": classification.get("specific_tasks", []),
                "application_context": classification.get("application_context", {}),
                "task_types": classification.get("task_types", []),
                "functional_requirements": classification.get("functional_requirements", []),
                "ai_classification": classification,
                "ai_confidence": classification.get("confidence", {}),
                "ai_summary": classification.get("summary"),
            }

            if classification.get("scene_type"):
                data["scene_type"] = classification["scene_type"]

            if classification.get("application_category"):
                data["application_category"] = classification["application_category"]

            if classification.get("environment"):
                data["environment_features"] = classification["environment"]
                if classification["environment"].get("setting"):
                    data["environment_setting"] = classification["environment"]["setting"]

            self.client.table("application_gallery").update(data).eq("id", item_id).execute()

            logger.info("Updated item classification",
                       id=item_id,
                       content_type=data["content_type"],
                       educational_value=data["educational_value"])
            return True

        except Exception as e:
            logger.error("Failed to update item classification",
                        id=item_id,
                        error=str(e))
            return False

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
        """Get gallery statistics including V2 content type breakdown"""
        try:
            # Count by status
            approved = self.client.table("application_gallery").select(
                "id", count="exact"
            ).eq("status", "approved").execute()

            pending = self.client.table("application_gallery").select(
                "id", count="exact"
            ).eq("status", "pending").execute()

            # V2: Count by content type
            content_type_stats = {}
            for ct in ["real_application", "pilot_poc", "case_study", "tech_demo",
                       "product_announcement", "tutorial", "unknown"]:
                try:
                    result = self.client.table("application_gallery").select(
                        "id", count="exact"
                    ).eq("status", "approved").eq("content_type", ct).execute()
                    content_type_stats[ct] = result.count or 0
                except:
                    content_type_stats[ct] = 0

            # V2: Count quality content
            quality_result = self.client.table("application_gallery").select(
                "id", count="exact"
            ).eq("status", "approved").in_(
                "content_type", ["real_application", "case_study", "pilot_poc"]
            ).gte("educational_value", 3).execute()

            return {
                "approved_count": approved.count or 0,
                "pending_count": pending.count or 0,
                "content_type_stats": content_type_stats,
                "quality_content_count": quality_result.count or 0,
            }

        except Exception as e:
            logger.error("Failed to get gallery stats", error=str(e))
            return {}

    async def get_items_for_reclassification(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get approved items for V2 re-classification"""
        try:
            result = self.client.table("application_gallery").select(
                "id", "title", "description", "source_name", "media_type",
                "content_type", "educational_value"
            ).eq(
                "status", "approved"
            ).order(
                "created_at", desc=False
            ).range(offset, offset + limit - 1).execute()

            return result.data

        except Exception as e:
            logger.error("Failed to get items for reclassification", error=str(e))
            return []
