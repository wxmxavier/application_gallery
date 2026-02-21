"""
Add a single YouTube video to the Application Gallery.

Usage:
    python src/add_single_video.py MG4PPkCyJig
    python src/add_single_video.py https://www.youtube.com/watch?v=MG4PPkCyJig
"""
import asyncio
import re
import sys
import json
from typing import Optional

import structlog
import logging

# Configure logging
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=logging.INFO,
)
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

from config import get_config
from crawlers.youtube_crawler import YouTubeCrawler
from processors.ai_classifier import RSIPClassifier
from storage.supabase_client import SupabaseClient


def extract_video_id(input_str: str) -> str:
    """Extract YouTube video ID from URL or raw ID."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',
    ]
    for pattern in patterns:
        match = re.search(pattern, input_str)
        if match:
            return match.group(1)
    return input_str


async def add_single_video(video_id: str, auto_approve: bool = True):
    """Fetch, classify, and store a single YouTube video."""
    config = get_config()
    
    # Initialize components
    yt_crawler = YouTubeCrawler(config)
    classifier = RSIPClassifier(config)
    db = SupabaseClient(config)
    
    logger.info("Fetching video details", video_id=video_id)
    
    # Check if already exists
    if await db.item_exists("youtube", video_id):
        logger.warning("Video already exists in database", video_id=video_id)
        result = db.client.table("application_gallery").select("id,title,status").eq(
            "source_type", "youtube"
        ).eq("external_id", video_id).execute()
        if result.data:
            existing = result.data[0]
            logger.info("Existing item", id=existing["id"], title=existing["title"], status=existing["status"])
        return
    
    # Fetch video details using the crawler's internal method
    video_details = await yt_crawler._get_video_details(video_id)
    
    if not video_details:
        logger.error("Failed to fetch video details or video was filtered out (duration limits: 30s-1800s)", video_id=video_id)
        return
    
    logger.info("Video fetched",
                title=video_details.get("title"),
                duration=video_details.get("duration_seconds"),
                views=video_details.get("view_count"))
    
    # Classify with AI
    logger.info("Classifying with AI...")
    video_details["source_name"] = "Boston Dynamics"
    classification = await classifier.classify(video_details)
    
    logger.info("Classification result",
                content_type=classification.get("content_type"),
                category=classification.get("application_category"),
                tasks=classification.get("specific_tasks"),
                educational_value=classification.get("educational_value"),
                relevance_score=classification.get("relevance_score"))
    
    # Merge classification into item
    video_details.update({
        "application_category": classification["application_category"],
        "task_types": classification.get("task_types", []),
        "functional_requirements": classification.get("functional_requirements", []),
        "scene_type": classification.get("scene_type"),
        "environment_setting": classification.get("environment", {}).get("setting"),
        "environment_features": classification.get("environment", {}),
        "ai_classification": classification,
        "ai_confidence": classification.get("confidence", {}),
        "ai_summary": classification.get("summary"),
        "content_type": classification.get("content_type", "tech_demo"),
        "deployment_maturity": classification.get("deployment_maturity", "unknown"),
        "educational_value": classification.get("educational_value", 3),
        "specific_tasks": classification.get("specific_tasks", []),
        "application_context": classification.get("application_context", {}),
        "status": "approved" if auto_approve else "pending",
    })
    
    # Insert into database
    logger.info("Inserting into database...")
    item_id = await db.insert_gallery_item(video_details)
    
    if item_id:
        logger.info("SUCCESS - Video added to gallery",
                    id=item_id,
                    title=video_details["title"],
                    status=video_details["status"])
    else:
        logger.error("Failed to insert video into database")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python src/add_single_video.py <video_id_or_url>")
        print("Example: python src/add_single_video.py MG4PPkCyJig")
        sys.exit(1)
    
    video_input = sys.argv[1]
    video_id = extract_video_id(video_input)
    
    logger.info("Adding single YouTube video", video_id=video_id, input=video_input)
    asyncio.run(add_single_video(video_id))
