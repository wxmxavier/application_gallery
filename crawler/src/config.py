"""
Configuration loader for RSIP Application Gallery Crawler
"""
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from dotenv import load_dotenv
import yaml


# Load environment variables
load_dotenv()


@dataclass
class CrawlerConfig:
    """Main crawler configuration"""
    max_results_per_source: int = 50
    max_results_per_query: int = 20
    min_relevance_score: float = 0.6
    video_min_duration: int = 30
    video_max_duration: int = 1800
    published_within_days: int = 365
    image_min_width: int = 400
    image_min_height: int = 300


@dataclass
class RateLimitConfig:
    """Rate limiting configuration"""
    youtube_api_daily_quota: int = 10000
    google_search_daily_quota: int = 100
    requests_per_second: float = 1.0
    retry_delay_seconds: int = 5
    max_retries: int = 3


@dataclass
class YouTubeChannel:
    """YouTube channel configuration"""
    id: str
    name: str
    default_category: str
    priority: int = 1


@dataclass
class YouTubeSearchQuery:
    """YouTube search query configuration"""
    query: str
    tasks: List[str] = field(default_factory=list)


@dataclass
class NewsSource:
    """News RSS source configuration"""
    name: str
    url: str
    priority: int = 1


@dataclass
class CompanyWebsite:
    """Company website configuration"""
    name: str
    base_url: str
    paths: List[str] = field(default_factory=list)
    priority: int = 1


class Config:
    """Application configuration manager"""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration from environment and YAML files"""
        self.config_path = config_path or self._get_default_config_path()
        self._load_env()
        self._load_yaml()

    def _get_default_config_path(self) -> str:
        """Get default config directory path"""
        return str(Path(__file__).parent.parent / "config")

    def _load_env(self):
        """Load environment variables"""
        # Supabase
        self.supabase_url = os.getenv("SUPABASE_URL", "https://wbtrtckvwtlxfnadrvzo.supabase.co")
        self.supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

        # YouTube
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY", "")

        # Gemini (for AI classification)
        self.gemini_api_key = os.getenv("GOOGLE_AI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")

        # Google Custom Search API (for Phase 2 - news and image search)
        self.google_search_api_key = os.getenv("GOOGLE_CUSTOM_SEARCH_API_KEY", "")
        self.google_search_engine_id = os.getenv("GOOGLE_CUSTOM_SEARCH_ENGINE_ID", "")

        # SerpAPI (alternative for Phase 2)
        self.serpapi_key = os.getenv("SERPAPI_KEY", "")

        # Crawler settings
        self.log_level = os.getenv("CRAWLER_LOG_LEVEL", "INFO")
        self.max_results = int(os.getenv("CRAWLER_MAX_RESULTS", "50"))

    def _load_yaml(self):
        """Load YAML configuration files"""
        sources_path = Path(self.config_path) / "sources.yaml"

        if sources_path.exists():
            with open(sources_path, "r") as f:
                self._sources = yaml.safe_load(f)
        else:
            self._sources = {}

        # Parse configurations
        self._parse_crawler_config()
        self._parse_rate_limits()
        self._parse_youtube_config()
        self._parse_news_sources()
        self._parse_company_websites()
        self._parse_google_search_config()

    def _parse_crawler_config(self):
        """Parse crawler configuration"""
        crawler_cfg = self._sources.get("crawler", {})
        self.crawler = CrawlerConfig(
            max_results_per_source=crawler_cfg.get("max_results_per_source", 50),
            max_results_per_query=crawler_cfg.get("max_results_per_query", 20),
            min_relevance_score=crawler_cfg.get("min_relevance_score", 0.6),
            video_min_duration=crawler_cfg.get("video_min_duration", 30),
            video_max_duration=crawler_cfg.get("video_max_duration", 1800),
            published_within_days=crawler_cfg.get("published_within_days", 365),
            image_min_width=crawler_cfg.get("image_min_width", 400),
            image_min_height=crawler_cfg.get("image_min_height", 300),
        )

    def _parse_rate_limits(self):
        """Parse rate limit configuration"""
        rate_cfg = self._sources.get("rate_limits", {})
        self.rate_limits = RateLimitConfig(
            youtube_api_daily_quota=rate_cfg.get("youtube_api_daily_quota", 10000),
            google_search_daily_quota=rate_cfg.get("google_search_daily_quota", 100),
            requests_per_second=rate_cfg.get("requests_per_second", 1.0),
            retry_delay_seconds=rate_cfg.get("retry_delay_seconds", 5),
            max_retries=rate_cfg.get("max_retries", 3),
        )

    def _parse_youtube_config(self):
        """Parse YouTube configuration"""
        yt_cfg = self._sources.get("youtube", {})

        # Channels
        self.youtube_channels: List[YouTubeChannel] = []
        for ch in yt_cfg.get("channels", []):
            self.youtube_channels.append(YouTubeChannel(
                id=ch["id"],
                name=ch["name"],
                default_category=ch.get("default_category", "industrial_automation"),
                priority=ch.get("priority", 1),
            ))

        # Search queries by category
        self.youtube_search_queries: Dict[str, List[YouTubeSearchQuery]] = {}
        for category, queries in yt_cfg.get("search_queries", {}).items():
            self.youtube_search_queries[category] = [
                YouTubeSearchQuery(
                    query=q["query"],
                    tasks=q.get("tasks", []),
                )
                for q in queries
            ]

    def _parse_news_sources(self):
        """Parse news RSS sources"""
        self.news_sources: List[NewsSource] = []
        for src in self._sources.get("news_rss", []):
            self.news_sources.append(NewsSource(
                name=src["name"],
                url=src["url"],
                priority=src.get("priority", 1),
            ))

    def _parse_company_websites(self):
        """Parse company website sources"""
        self.company_websites: Dict[str, List[CompanyWebsite]] = {}
        for category, websites in self._sources.get("company_websites", {}).items():
            self.company_websites[category] = [
                CompanyWebsite(
                    name=w["name"],
                    base_url=w["base_url"],
                    paths=w.get("paths", []),
                    priority=w.get("priority", 1),
                )
                for w in websites
            ]

    def _parse_google_search_config(self):
        """Parse Google Search configuration"""
        self.google_search: Dict[str, Any] = self._sources.get("google_search", {})

    def validate(self) -> List[str]:
        """Validate configuration and return list of errors"""
        errors = []

        if not self.supabase_service_key:
            errors.append("SUPABASE_SERVICE_ROLE_KEY is required")

        if not self.youtube_api_key:
            errors.append("YOUTUBE_API_KEY is required for YouTube crawling")

        if not self.gemini_api_key:
            errors.append("GOOGLE_AI_API_KEY or GEMINI_API_KEY is required for AI classification")

        return errors


# Global config instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get or create global config instance"""
    global _config
    if _config is None:
        _config = Config()
    return _config
