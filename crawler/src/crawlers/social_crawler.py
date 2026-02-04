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

    async def search_linkedin_videos(self, queries: List[str], max_results: int = 100) -> List[SocialContent]:
        """Search specifically for LinkedIn video content."""
        results = []

        for query in queries:
            # Video-specific search queries
            search_queries = [
                f"site:linkedin.com {query} robot video",
                f"site:linkedin.com {query} robotics demo",
                f"site:linkedin.com {query} automation video",
                f"site:linkedin.com {query} factory robot",
                f"site:linkedin.com {query} cobot video",
            ]

            for search_query in search_queries:
                items = await self._search_google_video(
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

    async def search_linkedin_images(self, queries: List[str], max_results: int = 100) -> List[SocialContent]:
        """Search specifically for LinkedIn image content."""
        results = []

        for query in queries:
            # Image-specific search queries
            search_queries = [
                f"site:linkedin.com {query} robot",
                f"site:linkedin.com {query} robotics",
                f"site:linkedin.com {query} automation factory",
                f"site:linkedin.com {query} warehouse robot",
                f"site:linkedin.com {query} industrial robot",
            ]

            for search_query in search_queries:
                items = await self._search_google_images(
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

            # Platform URL filters
            platform_filters = {
                'linkedin': ['linkedin.com'],
                'tiktok': ['tiktok.com'],
                'twitter': ['x.com', 'twitter.com'],
                'facebook': ['facebook.com', 'fb.com', 'fb.watch'],
                'instagram': ['instagram.com'],
            }

            # Process organic results
            for item in organic_results:
                url = item.get('link', '')

                # Filter by platform
                filters = platform_filters.get(platform, [])
                if filters and not any(f in url.lower() for f in filters):
                    continue

                # Determine media type based on platform and URL
                media_type = 'article'
                if platform == 'tiktok':
                    media_type = 'video'
                elif platform == 'twitter' and '/status/' in url:
                    media_type = 'video'  # Tweets with media
                elif platform == 'facebook' and ('/watch' in url or '/videos/' in url):
                    media_type = 'video'
                elif platform == 'instagram' and '/reel/' in url:
                    media_type = 'video'

                content = SocialContent(
                    title=item.get('title', ''),
                    description=item.get('snippet', ''),
                    url=url,
                    thumbnail_url=item.get('thumbnail'),
                    platform=platform,
                    author=self._extract_author(url, platform),
                    published_at=item.get('date'),
                    media_type=media_type
                )
                results.append(content)

            # Process video results
            for item in video_results:
                url = item.get('link', '')

                # Filter by platform
                filters = platform_filters.get(platform, [])
                if filters and not any(f in url.lower() for f in filters):
                    continue

                content = SocialContent(
                    title=item.get('title', ''),
                    description=item.get('snippet', ''),
                    url=url,
                    thumbnail_url=item.get('thumbnail'),
                    platform=platform,
                    author=item.get('channel', {}).get('name') if isinstance(item.get('channel'), dict) else self._extract_author(url, platform),
                    published_at=item.get('published_date'),
                    media_type='video'
                )
                results.append(content)

        except Exception as e:
            print(f"Error searching {platform}: {e}")

        return results

    async def _search_google_video(
        self,
        query: str,
        platform: str,
        max_results: int = 20
    ) -> List[SocialContent]:
        """Execute Google VIDEO search via SerpAPI (tbm=vid)."""
        results = []

        params = {
            "api_key": self.api_key,
            "engine": "google",
            "q": query,
            "num": min(max_results, 100),
            "tbm": "vid",  # Video search
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()

            # Save raw response for debugging
            log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'social')
            os.makedirs(log_dir, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            log_file = os.path.join(log_dir, f'{platform}_video_{timestamp}_raw.json')
            with open(log_file, 'w') as f:
                json.dump(data, f, indent=2)

            # Platform URL filters
            platform_filters = {
                'linkedin': ['linkedin.com'],
                'tiktok': ['tiktok.com'],
                'twitter': ['x.com', 'twitter.com'],
                'facebook': ['facebook.com', 'fb.com', 'fb.watch'],
                'instagram': ['instagram.com'],
            }

            # Parse video results
            video_results = data.get('video_results', [])

            for item in video_results:
                url = item.get('link', '')

                # Filter by platform
                filters = platform_filters.get(platform, [])
                if filters and not any(f in url.lower() for f in filters):
                    continue

                content = SocialContent(
                    title=item.get('title', ''),
                    description=item.get('snippet', ''),
                    url=url,
                    thumbnail_url=item.get('thumbnail'),
                    platform=platform,
                    author=self._extract_author(url, platform),
                    published_at=item.get('published_date'),
                    media_type='video'
                )
                results.append(content)

            print(f"    Video search '{query[:30]}...' -> {len(results)} {platform} videos")

        except Exception as e:
            print(f"Error in video search {platform}: {e}")

        return results

    async def _search_google_images(
        self,
        query: str,
        platform: str,
        max_results: int = 20
    ) -> List[SocialContent]:
        """Execute Google IMAGE search via SerpAPI (tbm=isch)."""
        results = []

        params = {
            "api_key": self.api_key,
            "engine": "google_images",
            "q": query,
            "num": min(max_results, 100),
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()

            # Save raw response for debugging
            log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs', 'social')
            os.makedirs(log_dir, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            log_file = os.path.join(log_dir, f'{platform}_image_{timestamp}_raw.json')
            with open(log_file, 'w') as f:
                json.dump(data, f, indent=2)

            # Platform URL filters
            platform_filters = {
                'linkedin': ['linkedin.com'],
                'tiktok': ['tiktok.com'],
                'twitter': ['x.com', 'twitter.com'],
                'facebook': ['facebook.com', 'fb.com'],
                'instagram': ['instagram.com'],
            }

            # Parse image results
            image_results = data.get('images_results', [])

            for item in image_results:
                # Get the source page URL
                source_url = item.get('link', '')
                image_url = item.get('original', '') or item.get('thumbnail', '')

                # Filter by platform in source URL
                filters = platform_filters.get(platform, [])
                if filters and not any(f in source_url.lower() for f in filters):
                    continue

                content = SocialContent(
                    title=item.get('title', ''),
                    description=item.get('snippet', '') or item.get('source', ''),
                    url=source_url,  # Link to the social post
                    thumbnail_url=image_url,  # The actual image
                    platform=platform,
                    author=self._extract_author(source_url, platform),
                    published_at=None,
                    media_type='image'
                )
                results.append(content)

            print(f"    Image search '{query[:30]}...' -> {len(results)} {platform} images")

        except Exception as e:
            print(f"Error in image search {platform}: {e}")

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

            elif platform == 'twitter':
                # X/Twitter URLs: x.com/username/status/... or twitter.com/username/status/...
                url_lower = url.lower()
                if '/status/' in url_lower:
                    # Extract username before /status/
                    if 'x.com/' in url_lower:
                        parts = url.split('x.com/')
                    elif 'twitter.com/' in url_lower:
                        parts = url.split('twitter.com/')
                    else:
                        return None
                    if len(parts) > 1:
                        username = parts[1].split('/status/')[0]
                        return f'@{username}' if not username.startswith('@') else username

            elif platform == 'facebook':
                # Facebook URLs: facebook.com/pagename/videos/... or facebook.com/watch?v=...
                if '/videos/' in url:
                    parts = url.split('facebook.com/')
                    if len(parts) > 1:
                        page = parts[1].split('/videos/')[0]
                        return page
                elif '/watch' in url:
                    return 'Facebook Watch'

            elif platform == 'instagram':
                # Instagram URLs: instagram.com/username/reel/... or instagram.com/p/...
                if '/reel/' in url or '/p/' in url:
                    parts = url.split('instagram.com/')
                    if len(parts) > 1:
                        username = parts[1].split('/')[0]
                        if username and username not in ['reel', 'p']:
                            return f'@{username}'

        except Exception:
            pass

        return None

    async def search_twitter(self, queries: List[str], max_results: int = 100) -> List[SocialContent]:
        """Search for X/Twitter robotics content."""
        results = []

        for query in queries:
            search_queries = [
                f"site:x.com {query} robot",
                f"site:twitter.com {query} robotics",
                f"site:x.com {query} automation video",
                f"site:twitter.com {query} factory robot",
            ]

            for search_query in search_queries:
                # Use video search for Twitter
                items = await self._search_google_video(
                    search_query,
                    platform='twitter',
                    max_results=max_results // len(search_queries)
                )
                results.extend(items)

                # Also get regular results
                items = await self._search_google(
                    search_query,
                    platform='twitter',
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
            # Normalize twitter.com and x.com URLs
            normalized_url = item.url.replace('twitter.com', 'x.com')
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                unique_results.append(item)

        return unique_results[:max_results]

    async def search_facebook(self, queries: List[str], max_results: int = 100) -> List[SocialContent]:
        """Search for Facebook robotics content."""
        results = []

        for query in queries:
            search_queries = [
                f"site:facebook.com/watch {query} robot",
                f"site:facebook.com {query} robotics video",
                f"site:facebook.com {query} automation",
                f"site:facebook.com {query} industrial robot",
            ]

            for search_query in search_queries:
                # Video search for Facebook
                items = await self._search_google_video(
                    search_query,
                    platform='facebook',
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

    async def search_instagram(self, queries: List[str], max_results: int = 100) -> List[SocialContent]:
        """Search for Instagram robotics content."""
        results = []

        for query in queries:
            search_queries = [
                f"site:instagram.com/reel {query} robot",
                f"site:instagram.com/p {query} robotics",
                f"site:instagram.com {query} automation",
                f"site:instagram.com {query} industrial robot",
            ]

            for search_query in search_queries:
                # Video/reel search for Instagram
                items = await self._search_google_video(
                    search_query,
                    platform='instagram',
                    max_results=max_results // len(search_queries)
                )
                results.extend(items)

                # Also image search
                items = await self._search_google_images(
                    search_query,
                    platform='instagram',
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


async def crawl_linkedin_media(
    serpapi_key: str,
    max_videos: int = 100,
    max_images: int = 100
) -> Dict[str, List[SocialContent]]:
    """
    Crawl LinkedIn specifically for videos and images.

    Args:
        serpapi_key: SerpAPI API key
        max_videos: Maximum video results
        max_images: Maximum image results

    Returns:
        Dictionary with 'videos' and 'images' lists
    """
    crawler = SocialCrawler(serpapi_key)

    # Expanded robotics queries for better coverage
    robotics_queries = [
        # Companies
        "Boston Dynamics",
        "Universal Robots",
        "FANUC robot",
        "KUKA robot",
        "ABB robotics",
        "Agility Robotics",
        "Fetch Robotics",
        "Locus Robotics",
        "6 River Systems",
        "Berkshire Grey",
        # Applications
        "industrial robot arm",
        "warehouse automation robot",
        "collaborative robot cobot",
        "AMR autonomous mobile robot",
        "delivery robot",
        "factory automation",
        "robot welding",
        "robot palletizing",
        "pick and place robot",
        "robot assembly line",
        # Scenes
        "warehouse robot deployment",
        "manufacturing robot",
        "logistics robot",
        "hospital robot",
        "retail robot",
    ]

    results = {'videos': [], 'images': []}

    print("\n" + "="*50)
    print("LINKEDIN VIDEO SEARCH")
    print("="*50)
    results['videos'] = await crawler.search_linkedin_videos(
        robotics_queries,
        max_results=max_videos
    )
    print(f"\nTotal LinkedIn videos found: {len(results['videos'])}")

    print("\n" + "="*50)
    print("LINKEDIN IMAGE SEARCH")
    print("="*50)
    results['images'] = await crawler.search_linkedin_images(
        robotics_queries,
        max_results=max_images
    )
    print(f"\nTotal LinkedIn images found: {len(results['images'])}")

    return results


async def crawl_all_social_platforms(
    serpapi_key: str,
    max_per_platform: int = 100
) -> Dict[str, List[SocialContent]]:
    """
    Crawl all social media platforms for robotics content.

    Args:
        serpapi_key: SerpAPI API key
        max_per_platform: Maximum results per platform

    Returns:
        Dictionary mapping platform to list of content
    """
    crawler = SocialCrawler(serpapi_key)

    # Expanded robotics queries
    robotics_queries = [
        # Companies
        "Boston Dynamics",
        "Universal Robots",
        "FANUC robot",
        "KUKA robot",
        "ABB robotics",
        "Agility Robotics",
        "Figure AI",
        "Tesla Optimus",
        "Unitree robot",
        # Applications
        "industrial robot",
        "warehouse automation",
        "collaborative robot cobot",
        "AMR autonomous mobile robot",
        "delivery robot",
        "factory automation",
        "robot welding",
        "robot palletizing",
        "humanoid robot",
    ]

    results = {}

    print("\n" + "="*60)
    print("CRAWLING X/TWITTER")
    print("="*60)
    results['twitter'] = await crawler.search_twitter(
        robotics_queries,
        max_results=max_per_platform
    )
    print(f"\nTotal X/Twitter items found: {len(results['twitter'])}")

    print("\n" + "="*60)
    print("CRAWLING FACEBOOK")
    print("="*60)
    results['facebook'] = await crawler.search_facebook(
        robotics_queries,
        max_results=max_per_platform
    )
    print(f"\nTotal Facebook items found: {len(results['facebook'])}")

    print("\n" + "="*60)
    print("CRAWLING INSTAGRAM")
    print("="*60)
    results['instagram'] = await crawler.search_instagram(
        robotics_queries,
        max_results=max_per_platform
    )
    print(f"\nTotal Instagram items found: {len(results['instagram'])}")

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
