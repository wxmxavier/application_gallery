"""
Reprocess saved SerpAPI raw results from log files.
This avoids calling the API again - uses cached responses.
"""
import asyncio
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from config import get_config
from processors.ai_classifier import RSIPClassifier
from storage.supabase_client import SupabaseClient
import structlog

# Configure logging
import logging
logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)
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


def parse_web_result(result: Dict, query: str, category_hint: str) -> Optional[Dict]:
    """Parse a web/news result from raw API response"""
    url = result.get("link", "")
    if not url:
        return None

    external_id = hashlib.md5(url.encode()).hexdigest()[:16]
    title = result.get("title", "")
    description = result.get("snippet", "")
    thumbnail_url = result.get("thumbnail")

    parsed_url = urlparse(url)
    source_name = parsed_url.netloc.replace("www.", "")

    return {
        "external_id": external_id,
        "source_type": "serpapi_news",
        "source_url": url,
        "source_name": source_name,
        "title": title,
        "description": description[:2000] if description else "",
        "thumbnail_url": thumbnail_url,
        "content_url": url,
        "media_type": "article",
        "duration_seconds": None,
        "published_at": None,
        "default_category": category_hint,
        "search_query": query,
    }


def parse_image_result(result: Dict, query: str, category_hint: str, config) -> Optional[Dict]:
    """Parse an image result from raw API response"""
    image_url = result.get("original", "")
    if not image_url:
        return None

    # Check dimensions
    width = result.get("original_width", 0)
    height = result.get("original_height", 0)

    min_width = config.crawler.image_min_width
    min_height = config.crawler.image_min_height

    if width < min_width or height < min_height:
        return None

    external_id = hashlib.md5(image_url.encode()).hexdigest()[:16]
    title = result.get("title", "")
    source_url = result.get("link", image_url)
    thumbnail_url = result.get("thumbnail", image_url)

    parsed_url = urlparse(source_url)
    source_name = parsed_url.netloc.replace("www.", "")

    return {
        "external_id": external_id,
        "source_type": "serpapi_image",
        "source_url": source_url,
        "source_name": source_name,
        "title": title,
        "description": f"Image from {source_name}",
        "thumbnail_url": thumbnail_url,
        "content_url": image_url,
        "media_type": "image",
        "duration_seconds": None,
        "published_at": None,
        "default_category": category_hint,
        "search_query": query,
        "image_width": width,
        "image_height": height,
    }


async def reprocess_log_file(filepath: str, config, db: SupabaseClient, classifier: RSIPClassifier) -> Dict:
    """Reprocess a single log file"""
    stats = {"found": 0, "added": 0, "skipped": 0, "failed": 0}

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    search_type = data.get("search_type", "")
    results = data.get("results", [])

    logger.info(f"Processing {filepath}", search_type=search_type, total_searches=len(results))

    items = []
    for search_result in results:
        query = search_result.get("query", "")
        category_hint = search_result.get("category_hint")
        response = search_result.get("response", {})

        if search_type == "images":
            for result in response.get("images_results", [])[:10]:
                item = parse_image_result(result, query, category_hint, config)
                if item:
                    items.append(item)
        else:
            for result in response.get("organic_results", [])[:10]:
                item = parse_web_result(result, query, category_hint)
                if item:
                    items.append(item)

    stats["found"] = len(items)
    logger.info(f"Parsed {len(items)} items from log file")

    # Process and classify items
    for item in items:
        try:
            # Check for duplicates
            if await db.item_exists(item["source_type"], item["external_id"]):
                stats["skipped"] += 1
                continue

            # Classify with AI
            classification = await classifier.classify(item)

            # Skip if relevance too low
            if classification.get("relevance_score", 0) < config.crawler.min_relevance_score:
                stats["skipped"] += 1
                logger.debug("Skipping low relevance", title=item.get("title")[:50])
                continue

            # Merge classification into item
            item.update({
                "application_category": classification["application_category"],
                "task_types": classification.get("task_types", []),
                "functional_requirements": classification.get("functional_requirements", []),
                "scene_type": classification.get("scene_type"),
                "environment_setting": classification.get("environment", {}).get("setting"),
                "environment_features": classification.get("environment", {}),
                "ai_classification": classification,
                "ai_confidence": classification.get("confidence", {}),
                "ai_summary": classification.get("summary"),
                "crawler_run_id": "reprocess_logs",
                "status": "pending",
            })

            # Save to database
            await db.insert_gallery_item(item)
            stats["added"] += 1
            logger.info("Added item", title=item.get("title", "")[:50], type=item["media_type"])

        except Exception as e:
            stats["failed"] += 1
            logger.error("Failed to process item", title=item.get("title", "")[:30], error=str(e))

    return stats


async def main():
    config = get_config()
    db = SupabaseClient(config)
    classifier = RSIPClassifier(config)

    log_dir = Path(__file__).parent.parent / "logs" / "serpapi"

    # Find all raw log files
    log_files = sorted(log_dir.glob("*_raw.json"))

    if not log_files:
        logger.error("No log files found in", path=str(log_dir))
        return

    logger.info(f"Found {len(log_files)} log files to process")

    total_stats = {"found": 0, "added": 0, "skipped": 0, "failed": 0}

    for log_file in log_files:
        logger.info(f"Processing: {log_file.name}")
        stats = await reprocess_log_file(str(log_file), config, db, classifier)

        for key in total_stats:
            total_stats[key] += stats[key]

    logger.info("Reprocessing complete", **total_stats)


if __name__ == "__main__":
    asyncio.run(main())
