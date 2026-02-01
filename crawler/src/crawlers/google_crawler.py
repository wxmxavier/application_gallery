"""
Google Search Crawler for RSIP Application Gallery

Searches Google for news articles and images related to robotics applications.
Uses Google Custom Search API for both web and image search.

PHASE 2 CRAWLER - Run after YouTube pipeline is verified.
"""
import asyncio
import hashlib
import ssl
import certifi
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, urlencode
import structlog
import aiohttp
from bs4 import BeautifulSoup

from config import Config, get_config


logger = structlog.get_logger()


class GoogleSearchCrawler:
    """
    Crawls Google Search for robotics news and images.

    Supports:
    - Web search (news articles, case studies)
    - Image search (photos of real robot deployments)
    """

    SEARCH_API_URL = "https://www.googleapis.com/customsearch/v1"

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self.api_key = self.config.google_search_api_key
        self.search_engine_id = self.config.google_search_engine_id
        self.daily_quota_used = 0
        self.daily_quota_limit = self.config.rate_limits.google_search_daily_quota

    async def crawl_news(self) -> List[Dict[str, Any]]:
        """
        Crawl Google for news articles about robotics applications.

        Returns:
            List of news article items
        """
        if not self._check_api_credentials():
            return []

        items = []
        search_config = self.config.google_search

        for category, queries in search_config.get("news_queries", {}).items():
            for query in queries:
                if self.daily_quota_used >= self.daily_quota_limit:
                    logger.warning("Google Search daily quota reached")
                    return items

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
                await asyncio.sleep(1 / self.config.rate_limits.requests_per_second)

        return items

    async def crawl_images(self) -> List[Dict[str, Any]]:
        """
        Crawl Google for images of robotics applications.

        Returns:
            List of image items
        """
        if not self._check_api_credentials():
            return []

        items = []
        search_config = self.config.google_search

        for category, queries in search_config.get("image_queries", {}).items():
            for query in queries:
                if self.daily_quota_used >= self.daily_quota_limit:
                    logger.warning("Google Search daily quota reached")
                    return items

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
                await asyncio.sleep(1 / self.config.rate_limits.requests_per_second)

        return items

    async def crawl(self) -> List[Dict[str, Any]]:
        """
        Crawl both news and images.

        Returns:
            Combined list of all items
        """
        news_items = await self.crawl_news()
        image_items = await self.crawl_images()

        logger.info("Google crawl complete",
                   news_count=len(news_items),
                   image_count=len(image_items))

        return news_items + image_items

    async def _search(
        self,
        query: str,
        search_type: str = "web",
        category_hint: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform a Google Custom Search.

        Args:
            query: Search query string
            search_type: "web" or "image"
            category_hint: RSIP category to pre-assign

        Returns:
            List of search result items
        """
        items = []

        params = {
            "key": self.api_key,
            "cx": self.search_engine_id,
            "q": query,
            "num": self.config.google_search.get("api_settings", {}).get(
                "results_per_query", 10
            ),
            "safe": self.config.google_search.get("api_settings", {}).get(
                "safe_search", "active"
            ),
        }

        # Add date restriction for recent content
        days = self.config.crawler.published_within_days
        if days:
            params["dateRestrict"] = f"d{days}"

        # Configure for image search
        if search_type == "image":
            params["searchType"] = "image"
            params["imgSize"] = "large"
            params["imgType"] = "photo"

        try:
            # Create SSL context with certifi certificates for macOS compatibility
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            connector = aiohttp.TCPConnector(ssl=ssl_context)

            async with aiohttp.ClientSession(connector=connector) as session:
                url = f"{self.SEARCH_API_URL}?{urlencode(params)}"

                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    self.daily_quota_used += 1

                    if response.status != 200:
                        error_text = await response.text()
                        logger.error("Google API error",
                                   status=response.status,
                                   error=error_text[:200])
                        return []

                    data = await response.json()

                    for result in data.get("items", []):
                        item = self._parse_result(
                            result,
                            search_type=search_type,
                            query=query,
                            category_hint=category_hint
                        )
                        if item:
                            items.append(item)

        except asyncio.TimeoutError:
            logger.error("Google search timeout", query=query[:50])
        except Exception as e:
            logger.error("Google search error", query=query[:50], error=str(e))

        return items

    def _parse_result(
        self,
        result: Dict[str, Any],
        search_type: str,
        query: str,
        category_hint: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """
        Parse a single search result into gallery item format.

        Args:
            result: Raw Google search result
            search_type: "web" or "image"
            query: Original search query
            category_hint: RSIP category hint

        Returns:
            Parsed item dict or None
        """
        try:
            if search_type == "image":
                return self._parse_image_result(result, query, category_hint)
            else:
                return self._parse_web_result(result, query, category_hint)
        except Exception as e:
            logger.debug("Result parse error", error=str(e))
            return None

    def _parse_web_result(
        self,
        result: Dict[str, Any],
        query: str,
        category_hint: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """Parse a web search result (news article)"""
        url = result.get("link", "")
        if not url:
            return None

        # Generate unique ID from URL
        external_id = hashlib.md5(url.encode()).hexdigest()[:16]

        # Extract title and description
        title = result.get("title", "")
        description = result.get("snippet", "")

        # Get thumbnail from pagemap if available
        thumbnail_url = None
        pagemap = result.get("pagemap", {})

        # Try different image sources
        if "cse_image" in pagemap:
            thumbnail_url = pagemap["cse_image"][0].get("src")
        elif "cse_thumbnail" in pagemap:
            thumbnail_url = pagemap["cse_thumbnail"][0].get("src")
        elif "metatags" in pagemap:
            for tag in pagemap["metatags"]:
                if "og:image" in tag:
                    thumbnail_url = tag["og:image"]
                    break

        # Extract source name from URL
        parsed_url = urlparse(url)
        source_name = parsed_url.netloc.replace("www.", "")

        return {
            "external_id": external_id,
            "source_type": "google_news",
            "source_url": url,
            "source_name": source_name,
            "title": title,
            "description": description[:2000] if description else "",
            "thumbnail_url": thumbnail_url,
            "content_url": url,
            "media_type": "article",
            "duration_seconds": None,
            "published_at": None,  # Google doesn't always provide this
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
        image_url = result.get("link", "")
        if not image_url:
            return None

        # Check image dimensions
        image_info = result.get("image", {})
        width = image_info.get("width", 0)
        height = image_info.get("height", 0)

        min_width = self.config.crawler.image_min_width
        min_height = self.config.crawler.image_min_height

        if width < min_width or height < min_height:
            logger.debug("Image too small",
                        url=image_url[:50],
                        width=width,
                        height=height)
            return None

        # Generate unique ID from image URL
        external_id = hashlib.md5(image_url.encode()).hexdigest()[:16]

        # Get context page URL
        context_url = result.get("image", {}).get("contextLink", "")

        # Extract title from result
        title = result.get("title", "")
        description = result.get("snippet", "")

        # Get thumbnail
        thumbnail_url = image_info.get("thumbnailLink", image_url)

        # Extract source name
        parsed_url = urlparse(context_url or image_url)
        source_name = parsed_url.netloc.replace("www.", "")

        return {
            "external_id": external_id,
            "source_type": "google_image",
            "source_url": context_url or image_url,
            "source_name": source_name,
            "title": title,
            "description": description[:2000] if description else "",
            "thumbnail_url": thumbnail_url,
            "content_url": image_url,  # Direct image URL
            "media_type": "image",
            "duration_seconds": None,
            "published_at": None,
            "default_category": category_hint,
            "search_query": query,
            "image_width": width,
            "image_height": height,
        }

    def _check_api_credentials(self) -> bool:
        """Check if API credentials are configured"""
        if not self.api_key:
            logger.warning("Google Custom Search API key not configured. "
                         "Set GOOGLE_CUSTOM_SEARCH_API_KEY in .env")
            return False

        if not self.search_engine_id:
            logger.warning("Google Custom Search Engine ID not configured. "
                         "Set GOOGLE_CUSTOM_SEARCH_ENGINE_ID in .env")
            return False

        return True


class GoogleImageDownloader:
    """
    Helper to download and validate images from Google search results.

    Use this for:
    - Verifying image accessibility
    - Checking actual dimensions
    - Downloading thumbnails for storage
    """

    def __init__(self):
        self.session = None

    async def validate_image(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Validate that an image URL is accessible and meets requirements.

        Args:
            url: Image URL to validate

        Returns:
            Image metadata dict or None if invalid
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.head(
                    url,
                    timeout=aiohttp.ClientTimeout(total=10),
                    allow_redirects=True
                ) as response:
                    if response.status != 200:
                        return None

                    content_type = response.headers.get("content-type", "")
                    if not content_type.startswith("image/"):
                        return None

                    content_length = response.headers.get("content-length")

                    return {
                        "url": str(response.url),  # Final URL after redirects
                        "content_type": content_type,
                        "size_bytes": int(content_length) if content_length else None,
                    }

        except Exception as e:
            logger.debug("Image validation failed", url=url[:50], error=str(e))
            return None

    async def fetch_page_images(self, url: str) -> List[str]:
        """
        Fetch all image URLs from a webpage.

        Useful for finding images from case study pages.

        Args:
            url: Webpage URL

        Returns:
            List of image URLs found on the page
        """
        images = []

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as response:
                    if response.status != 200:
                        return images

                    html = await response.text()
                    soup = BeautifulSoup(html, "html.parser")

                    # Find all img tags
                    for img in soup.find_all("img"):
                        src = img.get("src") or img.get("data-src")
                        if src:
                            # Convert relative URLs to absolute
                            if src.startswith("//"):
                                src = "https:" + src
                            elif src.startswith("/"):
                                parsed = urlparse(url)
                                src = f"{parsed.scheme}://{parsed.netloc}{src}"

                            if src.startswith("http"):
                                images.append(src)

                    # Find Open Graph and Twitter images
                    for meta in soup.find_all("meta"):
                        prop = meta.get("property", "") or meta.get("name", "")
                        if prop in ["og:image", "twitter:image"]:
                            content = meta.get("content")
                            if content and content.startswith("http"):
                                images.append(content)

        except Exception as e:
            logger.debug("Page image fetch failed", url=url[:50], error=str(e))

        return list(set(images))  # Remove duplicates
