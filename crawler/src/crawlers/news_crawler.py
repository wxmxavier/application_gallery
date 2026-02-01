"""
News RSS Crawler for RSIP Application Gallery

Crawls robotics news from RSS feeds.
"""
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
import structlog
import feedparser
import aiohttp
from bs4 import BeautifulSoup

from config import Config, get_config


logger = structlog.get_logger()


class NewsCrawler:
    """Crawls robotics news from RSS feeds"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()

    async def crawl(self) -> List[Dict[str, Any]]:
        """
        Crawl all configured news RSS feeds.

        Returns:
            List of news items with metadata
        """
        items = []

        for source in self.config.news_sources:
            try:
                source_items = await self._crawl_feed(source)
                items.extend(source_items)
                logger.info("Feed crawl complete",
                          source=source.name,
                          items=len(source_items))
            except Exception as e:
                logger.error("Feed crawl failed",
                           source=source.name,
                           error=str(e))

            # Rate limiting between feeds
            await asyncio.sleep(1 / self.config.rate_limits.requests_per_second)

        return items

    async def _crawl_feed(self, source) -> List[Dict[str, Any]]:
        """Crawl a single RSS feed"""
        items = []

        try:
            # Parse RSS feed
            feed = feedparser.parse(source.url)

            if feed.bozo:
                logger.warning("Feed parsing warning",
                             source=source.name,
                             error=str(feed.bozo_exception))

            # Calculate date filter
            cutoff_date = datetime.utcnow() - timedelta(days=self.config.crawler.published_within_days)

            for entry in feed.entries[:self.config.crawler.max_results_per_source]:
                # Parse published date
                published = self._parse_date(entry)
                if published and published < cutoff_date:
                    continue

                # Check if robotics-related
                if not self._is_robotics_related(entry):
                    continue

                # Extract item data
                item = await self._extract_item(entry, source)
                if item:
                    items.append(item)

        except Exception as e:
            logger.error("RSS parse error", source=source.name, error=str(e))

        return items

    async def _extract_item(self, entry, source) -> Optional[Dict[str, Any]]:
        """Extract item data from RSS entry"""
        try:
            # Generate unique ID from URL
            url = entry.get("link", "")
            external_id = hashlib.md5(url.encode()).hexdigest()[:16]

            # Get title and description
            title = entry.get("title", "")
            description = self._clean_html(entry.get("summary", "") or entry.get("description", ""))

            # Try to find image
            thumbnail_url = self._extract_image(entry)

            # If no image in feed, try to fetch from page
            if not thumbnail_url and url:
                thumbnail_url = await self._fetch_og_image(url)

            return {
                "external_id": external_id,
                "source_type": "news",
                "source_url": url,
                "source_name": source.name,
                "title": title,
                "description": description[:2000] if description else "",
                "thumbnail_url": thumbnail_url,
                "content_url": url,
                "media_type": "article",
                "duration_seconds": None,
                "published_at": self._parse_date(entry).isoformat() if self._parse_date(entry) else None,
            }

        except Exception as e:
            logger.error("Item extraction failed", error=str(e))
            return None

    def _parse_date(self, entry) -> Optional[datetime]:
        """Parse date from RSS entry"""
        for date_field in ["published_parsed", "updated_parsed", "created_parsed"]:
            if hasattr(entry, date_field) and getattr(entry, date_field):
                try:
                    import time
                    return datetime(*getattr(entry, date_field)[:6])
                except:
                    pass
        return None

    def _is_robotics_related(self, entry) -> bool:
        """Check if entry is robotics-related"""
        robotics_keywords = [
            "robot", "robotic", "automation", "autonomous", "agv", "amr",
            "cobot", "manipulator", "humanoid", "quadruped", "drone",
            "warehouse automation", "industrial automation", "service robot",
            "delivery robot", "surgical robot", "inspection robot"
        ]

        text = (
            entry.get("title", "").lower() +
            entry.get("summary", "").lower() +
            entry.get("description", "").lower()
        )

        return any(keyword in text for keyword in robotics_keywords)

    def _clean_html(self, text: str) -> str:
        """Remove HTML tags from text"""
        if not text:
            return ""
        soup = BeautifulSoup(text, "html.parser")
        return soup.get_text(separator=" ", strip=True)

    def _extract_image(self, entry) -> Optional[str]:
        """Extract image URL from RSS entry"""
        # Check media content
        if hasattr(entry, "media_content"):
            for media in entry.media_content:
                if media.get("medium") == "image" or media.get("type", "").startswith("image"):
                    return media.get("url")

        # Check media thumbnail
        if hasattr(entry, "media_thumbnail"):
            for thumb in entry.media_thumbnail:
                return thumb.get("url")

        # Check enclosures
        if hasattr(entry, "enclosures"):
            for enclosure in entry.enclosures:
                if enclosure.get("type", "").startswith("image"):
                    return enclosure.get("href") or enclosure.get("url")

        # Check for image in content
        content = entry.get("summary", "") or entry.get("description", "")
        soup = BeautifulSoup(content, "html.parser")
        img = soup.find("img")
        if img and img.get("src"):
            return img["src"]

        return None

    async def _fetch_og_image(self, url: str) -> Optional[str]:
        """Fetch Open Graph image from URL"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status != 200:
                        return None

                    html = await response.text()
                    soup = BeautifulSoup(html, "html.parser")

                    # Try Open Graph image
                    og_image = soup.find("meta", property="og:image")
                    if og_image and og_image.get("content"):
                        return og_image["content"]

                    # Try Twitter image
                    twitter_image = soup.find("meta", attrs={"name": "twitter:image"})
                    if twitter_image and twitter_image.get("content"):
                        return twitter_image["content"]

        except Exception as e:
            logger.debug("Failed to fetch OG image", url=url, error=str(e))

        return None
