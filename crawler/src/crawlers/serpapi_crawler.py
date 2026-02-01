"""
SerpAPI Crawler for RSIP Application Gallery

Searches Google via SerpAPI for news articles and images related to robotics applications.
Raw API responses are saved to log files for future analysis and reprocessing.
"""
import asyncio
import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
import structlog
import requests

from config import Config, get_config


logger = structlog.get_logger()


class SerpAPICrawler:
    """
    Crawls Google Search via SerpAPI for robotics news and images.
    """

    SERPAPI_URL = "https://serpapi.com/search"

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self.api_key = self.config.serpapi_key
        self.searches_used = 0

        # Setup log directory for raw API responses
        self.log_dir = Path(__file__).parent.parent.parent / "logs" / "serpapi"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.run_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.raw_results: List[Dict] = []  # Store all raw results

    async def crawl_news(self) -> List[Dict[str, Any]]:
        """
        Crawl for news articles about robotics applications.
        """
        if not self._check_api_key():
            return []

        items = []
        search_config = self.config.google_search  # Reuse existing config

        for category, queries in search_config.get("news_queries", {}).items():
            for query in queries:
                try:
                    results = await self._search(
                        query=query,
                        search_type="web",
                        category_hint=category
                    )
                    items.extend(results)
                    logger.info("News search complete",
                              query=query[:50],
                              results=len(results))
                except Exception as e:
                    logger.error("News search failed",
                               query=query[:50],
                               error=str(e))

                # Rate limiting
                await asyncio.sleep(0.5)

        logger.info("SerpAPI news search complete", items=len(items))

        # Save raw results to log file
        self._save_raw_results("news")

        return items

    async def crawl_images(self) -> List[Dict[str, Any]]:
        """
        Crawl for images of robotics applications.
        """
        if not self._check_api_key():
            return []

        items = []
        search_config = self.config.google_search

        for category, queries in search_config.get("image_queries", {}).items():
            for query in queries:
                try:
                    results = await self._search(
                        query=query,
                        search_type="image",
                        category_hint=category
                    )
                    items.extend(results)
                    logger.info("Image search complete",
                              query=query[:50],
                              results=len(results))
                except Exception as e:
                    logger.error("Image search failed",
                               query=query[:50],
                               error=str(e))

                # Rate limiting
                await asyncio.sleep(0.5)

        logger.info("SerpAPI image search complete", items=len(items))

        # Save raw results to log file
        self._save_raw_results("images")

        return items

    async def _search(
        self,
        query: str,
        search_type: str = "web",
        category_hint: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform a search via SerpAPI.
        """
        items = []

        params = {
            "api_key": self.api_key,
            "q": query,
            "num": 10,
        }

        if search_type == "image":
            params["engine"] = "google_images"
            params["tbm"] = "isch"
        else:
            params["engine"] = "google"

        try:
            response = requests.get(self.SERPAPI_URL, params=params, timeout=30)
            self.searches_used += 1

            if response.status_code != 200:
                logger.error("SerpAPI error",
                           status=response.status_code,
                           error=response.text[:200])
                return []

            data = response.json()

            # Save raw response for future analysis
            self.raw_results.append({
                "query": query,
                "search_type": search_type,
                "category_hint": category_hint,
                "response": data
            })

            if search_type == "image":
                for result in data.get("images_results", [])[:10]:
                    item = self._parse_image_result(result, query, category_hint)
                    if item:
                        items.append(item)
            else:
                for result in data.get("organic_results", [])[:10]:
                    item = self._parse_web_result(result, query, category_hint)
                    if item:
                        items.append(item)

        except Exception as e:
            logger.error("SerpAPI search error", query=query[:50], error=str(e))

        return items

    def _parse_web_result(
        self,
        result: Dict[str, Any],
        query: str,
        category_hint: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """Parse a web search result"""
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

    def _parse_image_result(
        self,
        result: Dict[str, Any],
        query: str,
        category_hint: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """Parse an image search result"""
        image_url = result.get("original", "")
        if not image_url:
            return None

        # Check dimensions
        width = result.get("original_width", 0)
        height = result.get("original_height", 0)

        min_width = self.config.crawler.image_min_width
        min_height = self.config.crawler.image_min_height

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

    def _check_api_key(self) -> bool:
        """Check if API key is configured"""
        if not self.api_key:
            logger.warning("SerpAPI key not configured. Set SERPAPI_KEY in .env")
            return False
        return True

    def _save_raw_results(self, search_type: str):
        """Save raw API results to JSON file for future analysis"""
        if not self.raw_results:
            return

        filename = f"{self.run_timestamp}_{search_type}_raw.json"
        filepath = self.log_dir / filename

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": self.run_timestamp,
                "search_type": search_type,
                "total_searches": self.searches_used,
                "results": self.raw_results
            }, f, indent=2, ensure_ascii=False)

        logger.info("Saved raw SerpAPI results",
                   filepath=str(filepath),
                   total_results=len(self.raw_results))

    @classmethod
    def load_from_log(cls, filepath: str) -> List[Dict[str, Any]]:
        """
        Load raw results from a previous log file for reprocessing.

        Usage:
            results = SerpAPICrawler.load_from_log("logs/serpapi/20260131_123456_news_raw.json")
        """
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("results", [])
