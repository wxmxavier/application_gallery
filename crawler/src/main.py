"""
RSIP Application Gallery Crawler - Main Entry Point

Crawls content from multiple sources and classifies according to RSIP taxonomy.
"""
import asyncio
import uuid
from datetime import datetime
from typing import List, Optional
import structlog

from config import get_config, Config
from crawlers.youtube_crawler import YouTubeCrawler
from crawlers.news_crawler import NewsCrawler
from crawlers.google_crawler import GoogleSearchCrawler
from crawlers.serpapi_crawler import SerpAPICrawler
from processors.ai_classifier import RSIPClassifier
from storage.supabase_client import SupabaseClient


# Configure logging - simplified for console output
import logging
import sys

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


class CrawlerOrchestrator:
    """Orchestrates the crawling, classification, and storage pipeline"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self.run_id = str(uuid.uuid4())[:8]
        self.stats = {
            "items_found": 0,
            "items_added": 0,
            "items_skipped": 0,
            "items_failed": 0,
        }

    async def run(self, crawler_types: Optional[List[str]] = None):
        """
        Run the crawler pipeline.

        Args:
            crawler_types: List of crawler types to run.
                          Options: ['youtube', 'news', 'google', 'google_images', 'websites']
                          Default: youtube + news (Phase 1)
        """
        crawler_types = crawler_types or ["youtube", "news"]

        logger.info("Starting crawler run",
                   run_id=self.run_id,
                   crawler_types=crawler_types)

        # Validate configuration
        errors = self.config.validate()
        if errors:
            logger.error("Configuration validation failed", errors=errors)
            return

        # Initialize components
        db = SupabaseClient(self.config)
        classifier = RSIPClassifier(self.config)

        # Record crawler run start
        await db.start_crawler_run(self.run_id, ",".join(crawler_types))

        try:
            all_items = []

            # Run YouTube crawler
            if "youtube" in crawler_types:
                youtube_crawler = YouTubeCrawler(self.config)
                youtube_items = await youtube_crawler.crawl()
                all_items.extend(youtube_items)
                logger.info("YouTube crawl complete", items=len(youtube_items))

            # Run News crawler (RSS feeds)
            if "news" in crawler_types:
                news_crawler = NewsCrawler(self.config)
                news_items = await news_crawler.crawl()
                all_items.extend(news_items)
                logger.info("News RSS crawl complete", items=len(news_items))

            # Run Google Search crawler (Phase 2 - news search)
            if "google" in crawler_types:
                google_crawler = GoogleSearchCrawler(self.config)
                google_news_items = await google_crawler.crawl_news()
                all_items.extend(google_news_items)
                logger.info("Google news search complete", items=len(google_news_items))

            # Run Google Image Search crawler (Phase 2 - image search)
            if "google_images" in crawler_types:
                google_crawler = GoogleSearchCrawler(self.config)
                google_image_items = await google_crawler.crawl_images()
                all_items.extend(google_image_items)
                logger.info("Google image search complete", items=len(google_image_items))

            # Run SerpAPI crawler (Phase 2 alternative - news search)
            if "serpapi" in crawler_types:
                serpapi_crawler = SerpAPICrawler(self.config)
                serpapi_news_items = await serpapi_crawler.crawl_news()
                all_items.extend(serpapi_news_items)
                logger.info("SerpAPI news search complete", items=len(serpapi_news_items))

            # Run SerpAPI Image crawler (Phase 2 alternative - image search)
            if "serpapi_images" in crawler_types:
                serpapi_crawler = SerpAPICrawler(self.config)
                serpapi_image_items = await serpapi_crawler.crawl_images()
                all_items.extend(serpapi_image_items)
                logger.info("SerpAPI image search complete", items=len(serpapi_image_items))

            self.stats["items_found"] = len(all_items)
            logger.info("Total items found", count=len(all_items))

            # Process and classify items
            for item in all_items:
                try:
                    # Check for duplicates
                    if await db.item_exists(item["source_type"], item["external_id"]):
                        self.stats["items_skipped"] += 1
                        continue

                    # Classify with AI
                    classification = await classifier.classify(item)

                    # Skip if relevance too low
                    if classification.get("relevance_score", 0) < self.config.crawler.min_relevance_score:
                        self.stats["items_skipped"] += 1
                        logger.debug("Skipping low relevance item",
                                   title=item.get("title"),
                                   score=classification.get("relevance_score"))
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
                        "crawler_run_id": self.run_id,
                        "status": "pending",  # All items start as pending
                    })

                    # Save to database
                    await db.insert_gallery_item(item)
                    self.stats["items_added"] += 1

                except Exception as e:
                    self.stats["items_failed"] += 1
                    logger.error("Failed to process item",
                               title=item.get("title"),
                               error=str(e))

            # Complete crawler run
            await db.complete_crawler_run(
                self.run_id,
                status="completed",
                stats=self.stats
            )

            logger.info("Crawler run complete",
                       run_id=self.run_id,
                       stats=self.stats)

        except Exception as e:
            logger.error("Crawler run failed", error=str(e))
            await db.complete_crawler_run(
                self.run_id,
                status="failed",
                stats=self.stats,
                error=str(e)
            )
            raise


async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="RSIP Application Gallery Crawler")
    parser.add_argument(
        "--sources",
        nargs="+",
        choices=["youtube", "news", "google", "google_images", "serpapi", "serpapi_images", "websites", "all"],
        default=["youtube", "news"],
        help="Content sources to crawl (Phase 1: youtube, news; Phase 2: serpapi, serpapi_images)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without saving to database"
    )

    args = parser.parse_args()

    orchestrator = CrawlerOrchestrator()
    await orchestrator.run(crawler_types=args.sources)


if __name__ == "__main__":
    asyncio.run(main())
