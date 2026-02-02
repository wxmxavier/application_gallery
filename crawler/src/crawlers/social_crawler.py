"""
Social Media Crawler - LinkedIn and TikTok via SerpAPI
Searches Google for robotics content on social platforms
"""
import os
import json
import asyncio
import httpx
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class SocialContent:
    """Represents content from social media platforms."""
    title: str
    description: str
    url: str
    thumbnail_url: Optional[str]
    platform: str  # 'linkedin' or 'tiktok'
    author: Optional[str]
    published_at: Optional[str]
    media_type: str  # 'video' or 'article'


class SocialCrawler:
    """Crawls LinkedIn and TikTok content via SerpAPI Google search."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://serpapi.com/search"

    async def search_linkedin(self, queries: List[str], max_results: int = 50) -> List[SocialContent]:
        """Search for LinkedIn robotics content."""
        results = []

        for query in queries:
            # Search LinkedIn videos and posts
            search_queries = [
                f"site:linkedin.com/posts {query} robot",
                f"site:linkedin.com/feed {query} robotics video",
                f"site:linkedin.com {query} automation demo",
            ]

            for search_query in search_queries:
                items = await self._search_google(
                    search_query,
                    platform='linkedin',
                    max_results=max_results // len(search_queries)
                )
                results.extend(items)

                if len(results) >= max_results:
                    break

            if len(results) >= max_results:
                break

        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for item in results:
            if item.url not in seen_urls:
                seen_urls.add(item.url)
                unique_results.append(item)

        return unique_results[:max_results]

    async def search_tiktok(self, queries: List[str], max_results: int = 50) -> List[SocialContent]:
        """Search for TikTok robotics content."""
        results = []

        for query in queries:
            # Search TikTok videos
            search_queries = [
                f"site:tiktok.com {query} robot",
                f"site:tiktok.com {query} robotics",
                f"site:tiktok.com {query} automation factory",
                f"site:tiktok.com {query} warehouse robot",
            ]

            for search_query in search_queries:
                items = await self._search_google(
                    search_query,
                    platform='tiktok',
                    max_results=max_results // len(search_queries)
                )
                results.extend(items)

                if len(results) >= max_results:
                    break

            if len(results) >= max_results:
                break

        # Deduplicate by URL
        seen_urls = set()
        unique_results = []
        for item in results:
            if item.url not in seen_urls:
                seen_urls.add(item.url)
                unique_results.append(item)

        return unique_results[:max_results]

    async def _search_google(
        self,
        query: str,
        platform: str,
        max_results: int = 20
    ) -> List[SocialContent]:
        """Execute Google search via SerpAPI."""
        results = []

        params = {
            "api_key": self.api_key,
            "engine": "google",
            "q": query,
            "num": min(max_results, 100),
            "tbm": "vid" if platform == 'tiktok' else None,  # Video search for TikTok
        }

        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()

            # Save raw response for debugging
            log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'social')
            os.makedirs(log_dir, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            log_file = os.path.join(log_dir, f'{platform}_{timestamp}_raw.json')
            with open(log_file, 'w') as f:
                json.dump(data, f, indent=2)

            # Parse organic results
            organic_results = data.get('organic_results', [])
            video_results = data.get('video_results', [])

            # Process organic results
            for item in organic_results:
                url = item.get('link', '')

                # Filter by platform
                if platform == 'linkedin' and 'linkedin.com' not in url:
                    continue
                if platform == 'tiktok' and 'tiktok.com' not in url:
                    continue

                content = SocialContent(
                    title=item.get('title', ''),
                    description=item.get('snippet', ''),
                    url=url,
                    thumbnail_url=item.get('thumbnail'),
                    platform=platform,
                    author=self._extract_author(url, platform),
                    published_at=item.get('date'),
                    media_type='video' if platform == 'tiktok' else 'article'
                )
                results.append(content)

            # Process video results (for TikTok)
            for item in video_results:
                url = item.get('link', '')

                if platform == 'tiktok' and 'tiktok.com' not in url:
                    continue

                content = SocialContent(
                    title=item.get('title', ''),
                    description=item.get('snippet', ''),
                    url=url,
                    thumbnail_url=item.get('thumbnail'),
                    platform=platform,
                    author=item.get('channel', {}).get('name') if isinstance(item.get('channel'), dict) else None,
                    published_at=item.get('published_date'),
                    media_type='video'
                )
                results.append(content)

        except Exception as e:
            print(f"Error searching {platform}: {e}")

        return results

    def _extract_author(self, url: str, platform: str) -> Optional[str]:
        """Extract author/channel from URL."""
        try:
            if platform == 'linkedin':
                # LinkedIn URLs: linkedin.com/posts/username_...
                if '/posts/' in url:
                    parts = url.split('/posts/')
                    if len(parts) > 1:
                        author = parts[1].split('_')[0].split('-')[0]
                        return author
                # linkedin.com/in/username
                if '/in/' in url:
                    parts = url.split('/in/')
                    if len(parts) > 1:
                        return parts[1].split('/')[0].split('?')[0]

            elif platform == 'tiktok':
                # TikTok URLs: tiktok.com/@username/video/...
                if '/@' in url:
                    parts = url.split('/@')
                    if len(parts) > 1:
                        return '@' + parts[1].split('/')[0].split('?')[0]

        except Exception:
            pass

        return None


async def crawl_social_media(
    serpapi_key: str,
    platforms: List[str] = ['linkedin', 'tiktok'],
    max_per_platform: int = 50
) -> Dict[str, List[SocialContent]]:
    """
    Main function to crawl social media platforms.

    Args:
        serpapi_key: SerpAPI API key
        platforms: List of platforms to crawl
        max_per_platform: Maximum results per platform

    Returns:
        Dictionary mapping platform to list of content
    """
    crawler = SocialCrawler(serpapi_key)

    # Search queries for robotics content
    robotics_queries = [
        "industrial robot",
        "warehouse automation",
        "Boston Dynamics",
        "collaborative robot cobot",
        "AMR autonomous mobile robot",
        "delivery robot",
        "factory automation",
        "robot arm manufacturing",
    ]

    results = {}

    if 'linkedin' in platforms:
        print("Searching LinkedIn...")
        results['linkedin'] = await crawler.search_linkedin(
            robotics_queries,
            max_results=max_per_platform
        )
        print(f"  Found {len(results['linkedin'])} LinkedIn items")

    if 'tiktok' in platforms:
        print("Searching TikTok...")
        results['tiktok'] = await crawler.search_tiktok(
            robotics_queries,
            max_results=max_per_platform
        )
        print(f"  Found {len(results['tiktok'])} TikTok items")

    return results


# For testing
if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()

    async def test():
        key = os.getenv('SERPAPI_KEY')
        if not key:
            print("SERPAPI_KEY not found")
            return

        results = await crawl_social_media(key, max_per_platform=20)

        for platform, items in results.items():
            print(f"\n=== {platform.upper()} ===")
            for item in items[:5]:
                print(f"  {item.title[:50]}...")
                print(f"    URL: {item.url[:60]}...")
                print(f"    Author: {item.author}")
                print()

    asyncio.run(test())
