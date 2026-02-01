"""
YouTube Crawler for RSIP Application Gallery

Crawls videos from YouTube channels and search queries.
"""
import asyncio
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import structlog
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import Config, get_config


logger = structlog.get_logger()


class YouTubeCrawler:
    """Crawls YouTube for robotics application videos"""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self.youtube = build(
            "youtube", "v3",
            developerKey=self.config.youtube_api_key
        )
        self.quota_used = 0

    async def crawl(self) -> List[Dict[str, Any]]:
        """
        Crawl YouTube channels and search queries.

        Returns:
            List of video items with metadata
        """
        items = []

        logger.info("Starting YouTube crawl",
                   num_channels=len(self.config.youtube_channels),
                   num_query_categories=len(self.config.youtube_search_queries))

        # Crawl configured channels
        for i, channel in enumerate(self.config.youtube_channels):
            logger.info("Crawling channel",
                       index=i+1,
                       total=len(self.config.youtube_channels),
                       channel=channel.name)
            try:
                channel_videos = await self._crawl_channel(channel)
                items.extend(channel_videos)
                logger.info("Channel crawl done",
                          channel=channel.name,
                          videos_found=len(channel_videos))
            except Exception as e:
                logger.error("Channel crawl failed",
                           channel=channel.name,
                           error=str(e))

        # Crawl search queries by category (skip for initial test - expensive quota)
        # TODO: Re-enable after channel crawl is verified
        # for category, queries in self.config.youtube_search_queries.items():
        #     for query_config in queries:
        #         try:
        #             search_videos = await self._search_videos(
        #                 query_config.query,
        #                 category,
        #                 query_config.tasks
        #             )
        #             items.extend(search_videos)
        #         except Exception as e:
        #             logger.error("Search crawl failed",
        #                        query=query_config.query,
        #                        error=str(e))
        logger.info("Skipping search queries for initial test")

        logger.info("YouTube crawl complete",
                   total_items=len(items),
                   quota_used=self.quota_used)

        return items

    async def _crawl_channel(self, channel) -> List[Dict[str, Any]]:
        """Crawl videos from a specific channel"""
        items = []

        try:
            # Get channel uploads playlist
            channel_response = self.youtube.channels().list(
                part="contentDetails",
                id=channel.id
            ).execute()
            self.quota_used += 1

            if not channel_response.get("items"):
                return items

            uploads_playlist_id = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

            # Get videos from uploads playlist
            playlist_response = self.youtube.playlistItems().list(
                part="snippet",
                playlistId=uploads_playlist_id,
                maxResults=min(self.config.crawler.max_results_per_source, 50)
            ).execute()
            self.quota_used += 1

            for playlist_item in playlist_response.get("items", []):
                video_id = playlist_item["snippet"]["resourceId"]["videoId"]

                # Get video details
                video_details = await self._get_video_details(video_id)
                if video_details:
                    video_details["source_name"] = channel.name
                    video_details["default_category"] = channel.default_category
                    items.append(video_details)

                # Rate limiting
                await asyncio.sleep(1 / self.config.rate_limits.requests_per_second)

        except HttpError as e:
            logger.error("YouTube API error", error=str(e))

        return items

    async def _search_videos(
        self,
        query: str,
        category: str,
        default_tasks: List[str]
    ) -> List[Dict[str, Any]]:
        """Search YouTube for videos matching query"""
        items = []

        # Calculate date filter
        published_after = (
            datetime.utcnow() - timedelta(days=self.config.crawler.published_within_days)
        ).isoformat() + "Z"

        try:
            search_response = self.youtube.search().list(
                part="snippet",
                q=query,
                type="video",
                videoEmbeddable="true",
                videoDuration="medium",  # 4-20 minutes
                publishedAfter=published_after,
                maxResults=min(self.config.crawler.max_results_per_source, 25),
                order="relevance"
            ).execute()
            self.quota_used += 100  # Search costs 100 quota units

            for search_item in search_response.get("items", []):
                video_id = search_item["id"]["videoId"]

                # Get full video details
                video_details = await self._get_video_details(video_id)
                if video_details:
                    video_details["default_category"] = category
                    video_details["default_tasks"] = default_tasks
                    video_details["source_name"] = search_item["snippet"].get("channelTitle", "Unknown")
                    items.append(video_details)

                # Rate limiting
                await asyncio.sleep(1 / self.config.rate_limits.requests_per_second)

        except HttpError as e:
            logger.error("YouTube search error", query=query, error=str(e))

        return items

    async def _get_video_details(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a video"""
        try:
            video_response = self.youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=video_id
            ).execute()
            self.quota_used += 1

            if not video_response.get("items"):
                return None

            video = video_response["items"][0]
            snippet = video["snippet"]
            content_details = video["contentDetails"]
            statistics = video.get("statistics", {})

            # Parse duration (ISO 8601 format: PT#M#S)
            duration_str = content_details.get("duration", "PT0S")
            duration_seconds = self._parse_duration(duration_str)

            # Filter by duration
            if duration_seconds < self.config.crawler.video_min_duration:
                return None
            if duration_seconds > self.config.crawler.video_max_duration:
                return None

            return {
                "external_id": video_id,
                "source_type": "youtube",
                "source_url": f"https://www.youtube.com/watch?v={video_id}",
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "thumbnail_url": self._get_best_thumbnail(snippet.get("thumbnails", {})),
                "content_url": f"https://www.youtube.com/embed/{video_id}",
                "media_type": "video",
                "duration_seconds": duration_seconds,
                "published_at": snippet.get("publishedAt"),
                "view_count": int(statistics.get("viewCount", 0)),
                "like_count": int(statistics.get("likeCount", 0)),
            }

        except HttpError as e:
            logger.error("Failed to get video details", video_id=video_id, error=str(e))
            return None

    def _parse_duration(self, duration_str: str) -> int:
        """Parse ISO 8601 duration to seconds"""
        import re
        match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration_str)
        if not match:
            return 0

        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)

        return hours * 3600 + minutes * 60 + seconds

    def _get_best_thumbnail(self, thumbnails: Dict) -> str:
        """Get the best available thumbnail URL"""
        for quality in ["maxres", "high", "medium", "default"]:
            if quality in thumbnails:
                return thumbnails[quality].get("url", "")
        return ""
