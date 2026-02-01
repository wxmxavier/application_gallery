# Video Library & Crawler - Development Handoff Document

**Prepared for:** Standalone Video Library Development Team
**Prepared by:** RSIP v2 Development Team
**Date:** 2026-01-30
**Status:** Ready for Implementation

---

## 1. Executive Summary

### 1.1 Project Overview
Build a standalone video/photo library showcasing real-world robot applications with an automated crawler to collect content from open sources (YouTube, News, social media).

### 1.2 Key Decisions Made

| Decision | Status | Details |
|----------|--------|---------|
| Standalone Repository | ✅ Confirmed | Separate from RSIP main codebase |
| Crawler Architecture | ✅ Confirmed | Python service on Google Cloud Run |
| Content Moderation | ✅ Confirmed | Admin approval required before public display |
| Database | ✅ Confirmed | Shared Supabase with RSIP (separate tables) |
| AI Classification | ✅ Confirmed | Gemini API for auto-tagging |
| RSIP Integration | ✅ Confirmed | Link-based navigation by category |

### 1.3 System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VIDEO LIBRARY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐ │
│  │  ROBOT MEDIA CRAWLER        │    │  VIDEO LIBRARY FRONTEND     │ │
│  │  (Standalone Python)        │    │  (Standalone React App)     │ │
│  │                             │    │                             │ │
│  │  - YouTube API integration  │    │  - Browse/search videos     │ │
│  │  - News RSS aggregation     │    │  - Filter by category       │ │
│  │  - AI classification        │    │  - Embedded players         │ │
│  │  - Supabase storage         │    │  - User suggestions         │ │
│  │                             │    │                             │ │
│  │  Deploy: Google Cloud Run   │    │  Deploy: Vercel/Netlify     │ │
│  │  Schedule: Daily 2:00 AM    │    │                             │ │
│  └──────────────┬──────────────┘    └──────────────┬──────────────┘ │
│                 │                                   │                │
│                 └─────────────┬─────────────────────┘                │
│                               ▼                                      │
│                 ┌─────────────────────────────┐                      │
│                 │      SUPABASE DATABASE      │                      │
│                 │  (Shared with RSIP)         │                      │
│                 │                             │                      │
│                 │  - video_library            │                      │
│                 │  - content_suggestions      │                      │
│                 │  - crawler_runs             │                      │
│                 └─────────────────────────────┘                      │
│                               ▲                                      │
│                               │                                      │
│                 ┌─────────────────────────────┐                      │
│                 │      RSIP PLATFORM          │                      │
│                 │  (Links to Video Library)   │                      │
│                 │                             │                      │
│                 │  Category buttons link to   │                      │
│                 │  filtered video library     │                      │
│                 └─────────────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Migration File: `077_video_library.sql`

```sql
-- ============================================
-- RSIP Video Library System
-- Migration: 077_video_library.sql
-- ============================================

-- Main video library table
CREATE TABLE IF NOT EXISTS video_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content identification
  external_id VARCHAR(255),          -- YouTube video ID, article URL hash
  source_type VARCHAR(50) NOT NULL   -- 'youtube', 'vimeo', 'news', 'research'
    CHECK (source_type IN ('youtube', 'vimeo', 'news', 'research', 'company', 'other')),
  source_url TEXT NOT NULL,
  source_name VARCHAR(255),          -- 'Boston Dynamics', 'TechCrunch', etc.

  -- Content metadata
  title VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  embed_url TEXT,                    -- YouTube/Vimeo embed URL
  media_type VARCHAR(50) DEFAULT 'video'
    CHECK (media_type IN ('video', 'image', 'article')),
  duration_seconds INTEGER,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Classification tags (arrays for filtering)
  industry_tags TEXT[] DEFAULT '{}',     -- ['medical', 'warehouse', 'manufacturing']
  robot_type_tags TEXT[] DEFAULT '{}',   -- ['quadruped', 'humanoid', 'arm', 'mobile']
  use_case_tags TEXT[] DEFAULT '{}',     -- ['inspection', 'surgery', 'picking']
  robot_names TEXT[] DEFAULT '{}',       -- ['Spot', 'Atlas', 'Stretch', 'Digit']
  technology_tags TEXT[] DEFAULT '{}',   -- ['ai', 'computer-vision', 'navigation']

  -- AI-generated metadata
  ai_summary TEXT,
  ai_relevance_score DECIMAL(3,2),   -- 0.00 to 1.00
  ai_classification JSONB,           -- Full AI analysis result

  -- Moderation
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'flagged', 'archived')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason VARCHAR(255),

  -- Source tracking
  crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  crawler_source VARCHAR(100),       -- 'youtube-api', 'news-rss', 'manual'
  crawler_run_id VARCHAR(100),       -- For tracking crawl batches

  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  featured_order INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  UNIQUE(source_type, external_id)
);

-- User content suggestions
CREATE TABLE IF NOT EXISTS content_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by UUID REFERENCES users(id),
  url TEXT NOT NULL,
  title VARCHAR(500),
  description TEXT,
  suggested_tags TEXT[],

  -- Review status
  status VARCHAR(50) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  -- If approved, link to created video entry
  video_library_id UUID REFERENCES video_library(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crawler run history (for monitoring)
CREATE TABLE IF NOT EXISTS crawler_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id VARCHAR(100) UNIQUE NOT NULL,
  crawler_type VARCHAR(50) NOT NULL,   -- 'youtube', 'news', 'web'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'partial')),

  -- Statistics
  items_found INTEGER DEFAULT 0,
  items_added INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Configuration used
  config JSONB
);

-- Indexes for efficient filtering
CREATE INDEX idx_video_library_status ON video_library(status);
CREATE INDEX idx_video_library_source_type ON video_library(source_type);
CREATE INDEX idx_video_library_published ON video_library(published_at DESC);
CREATE INDEX idx_video_library_featured ON video_library(featured, featured_order);
CREATE INDEX idx_video_library_industry ON video_library USING GIN(industry_tags);
CREATE INDEX idx_video_library_robot_type ON video_library USING GIN(robot_type_tags);
CREATE INDEX idx_video_library_use_case ON video_library USING GIN(use_case_tags);
CREATE INDEX idx_video_library_robot_names ON video_library USING GIN(robot_names);
CREATE INDEX idx_video_library_search ON video_library
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX idx_content_suggestions_status ON content_suggestions(status);
CREATE INDEX idx_crawler_runs_type ON crawler_runs(crawler_type);
CREATE INDEX idx_crawler_runs_status ON crawler_runs(status);

-- RLS Policies
ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawler_runs ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved videos
CREATE POLICY "Public can view approved videos" ON video_library
  FOR SELECT USING (status = 'approved');

-- Admins can view all videos
CREATE POLICY "Admins can view all videos" ON video_library
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role IN ('admin', 'system_admin', 'moderator'))
  );

-- Admins can manage videos
CREATE POLICY "Admins can manage videos" ON video_library
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role IN ('admin', 'system_admin', 'moderator'))
  );

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions" ON content_suggestions
  FOR SELECT USING (suggested_by = auth.uid());

-- Authenticated users can create suggestions
CREATE POLICY "Authenticated users can suggest content" ON content_suggestions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can manage suggestions
CREATE POLICY "Admins can manage suggestions" ON content_suggestions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role IN ('admin', 'system_admin', 'moderator'))
  );

-- Service role for crawler runs (bypasses RLS with service key)
CREATE POLICY "Service role for crawler runs" ON crawler_runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()
            AND role = 'system_admin')
  );

-- Helper function for full-text search
CREATE OR REPLACE FUNCTION search_videos(search_query TEXT)
RETURNS SETOF video_library AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM video_library
  WHERE status = 'approved'
    AND to_tsvector('english', title || ' ' || COALESCE(description, ''))
        @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(
    to_tsvector('english', title || ' ' || COALESCE(description, '')),
    plainto_tsquery('english', search_query)
  ) DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function for incrementing view count
CREATE OR REPLACE FUNCTION increment_video_view(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE video_library
  SET view_count = view_count + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Classification Taxonomy

### 3.1 Industry Tags
```
medical, warehouse, manufacturing, commercial, agriculture,
construction, hospitality, research, logistics, retail,
food_processing, pharmaceutical, automotive, aerospace,
energy, mining, defense, education, entertainment
```

### 3.2 Robot Type Tags
```
quadruped, humanoid, arm, mobile, drone, agv, amr, cobot,
exoskeleton, surgical, underwater, aerial, wheeled, tracked,
legged, snake, soft_robot
```

### 3.3 Use Case Tags
```
inspection, surgery, picking, delivery, welding, assembly,
cleaning, security, research, packaging, palletizing,
material_handling, quality_control, painting, polishing,
cutting, drilling, sorting, loading, unloading, maintenance
```

### 3.4 Technology Tags
```
ai, computer_vision, navigation, manipulation, lidar,
depth_sensing, force_control, machine_learning, slam,
natural_language, gesture_recognition, autonomous
```

---

## 4. Crawler Specifications

### 4.1 Project Structure

```
/robot-media-crawler/
├── src/
│   ├── __init__.py
│   ├── main.py                 # Entry point
│   ├── config.py               # Configuration loader
│   ├── crawlers/
│   │   ├── __init__.py
│   │   ├── base_crawler.py     # Abstract base class
│   │   ├── youtube_crawler.py
│   │   ├── news_crawler.py
│   │   └── web_crawler.py
│   ├── processors/
│   │   ├── __init__.py
│   │   ├── content_processor.py
│   │   └── ai_classifier.py
│   └── storage/
│       ├── __init__.py
│       └── supabase_client.py
├── config/
│   ├── sources.yaml            # Crawl targets
│   └── keywords.yaml           # Search terms
├── deployment/
│   ├── Dockerfile
│   ├── cloudbuild.yaml
│   └── scheduler.yaml
├── tests/
├── requirements.txt
├── README.md
└── .env.example
```

### 4.2 Required Python Dependencies

```
# requirements.txt
google-api-python-client==2.100.0
google-generativeai==0.3.0
supabase==2.0.0
feedparser==6.0.10
beautifulsoup4==4.12.0
aiohttp==3.9.0
pyyaml==6.0.1
python-dotenv==1.0.0
pytest==7.4.0
pytest-asyncio==0.21.0
```

### 4.3 Environment Variables

```bash
# Supabase Connection (uses SERVICE_ROLE_KEY for write access)
SUPABASE_URL=https://wbtrtckvwtlxfnadrvzo.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys
YOUTUBE_API_KEY=...              # Google Cloud Console
GOOGLE_AI_API_KEY=...            # For Gemini classification

# Crawler Configuration
CRAWLER_MAX_RESULTS=50
CRAWLER_LOG_LEVEL=INFO
CRAWLER_RUN_INTERVAL=daily
```

### 4.4 Crawl Sources

**YouTube Search Keywords:**
```yaml
youtube:
  - "robot demonstration"
  - "industrial robot"
  - "Boston Dynamics"
  - "warehouse robot"
  - "medical robot surgery"
  - "humanoid robot"
  - "robot arm automation"
  - "AGV warehouse"
  - "collaborative robot"
  - "robot inspection"
  - "delivery robot"
  - "quadruped robot"
```

**News RSS Feeds:**
```yaml
news_rss:
  - name: "TechCrunch Robotics"
    url: "https://techcrunch.com/tag/robotics/feed/"
  - name: "IEEE Spectrum Robotics"
    url: "https://spectrum.ieee.org/feeds/topic/robotics"
  - name: "The Robot Report"
    url: "https://www.therobotreport.com/feed/"
```

**YouTube Channels to Monitor:**
```yaml
youtube_channels:
  - name: "Boston Dynamics"
    channel_id: "UC7vVhkEfw4nOGp8TyDk7RcQ"
  - name: "KUKA Robotics"
    channel_id: "UCKuMrA1rMbHzMUqYwJNpKjA"
  - name: "ABB Robotics"
    channel_id: "UCKBDWtJBRdVsLpVqJvGJl5g"
  - name: "FANUC America"
    channel_id: "UCx8rZl5Qo6BqNmJmRz1qW-w"
  - name: "Universal Robots"
    channel_id: "UCqGn1f0O7c4qAFbWjNxNS3A"
```

### 4.5 AI Classification Prompt

```python
CLASSIFICATION_PROMPT = """
Analyze this robotics video and classify it:

Title: {title}
Description: {description}
Source: {source_name}

Provide classification in this exact JSON format:
{{
  "industry_tags": ["tag1", "tag2"],
  "robot_type_tags": ["type1"],
  "use_case_tags": ["use1", "use2"],
  "robot_names": ["Robot Name"],
  "relevance_score": 0.85,
  "summary": "One sentence summary"
}}

Valid industry tags: medical, warehouse, manufacturing, commercial, agriculture,
  construction, hospitality, research, logistics, retail
Valid robot types: quadruped, humanoid, arm, mobile, drone, agv, amr, cobot, exoskeleton
Valid use cases: inspection, surgery, picking, delivery, welding, assembly,
  cleaning, security, packaging, palletizing, quality_control

Only include tags that are clearly relevant. If no robot names are mentioned, use empty array.
Relevance score should be 0-1 indicating how relevant this is to robotics.
"""
```

---

## 5. Frontend Specifications

### 5.1 Component Architecture

```
/video-library-frontend/
├── src/
│   ├── components/
│   │   ├── VideoLibraryPage.tsx      # Main page container
│   │   ├── VideoSearchBar.tsx        # Search input
│   │   ├── VideoFilterBar.tsx        # Filter chips
│   │   ├── VideoGrid.tsx             # Responsive video grid
│   │   ├── VideoCard.tsx             # Individual video card
│   │   ├── VideoDetailModal.tsx      # Full video details
│   │   ├── ContentSuggestionForm.tsx # User contribution form
│   │   └── AdminModeration.tsx       # Admin approval queue
│   ├── services/
│   │   └── video-library-service.ts  # API client
│   ├── types/
│   │   └── video.ts                  # TypeScript interfaces
│   └── hooks/
│       └── useVideos.ts              # Data fetching hook
├── public/
└── package.json
```

### 5.2 TypeScript Interfaces

```typescript
// types/video.ts

export type VideoSourceType = 'youtube' | 'vimeo' | 'news' | 'research' | 'company' | 'other';
export type VideoStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'archived';
export type MediaType = 'video' | 'image' | 'article';

export interface VideoItem {
  id: string;
  externalId: string;
  sourceType: VideoSourceType;
  sourceUrl: string;
  sourceName: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  embedUrl: string;
  mediaType: MediaType;
  durationSeconds: number | null;
  publishedAt: string;
  industryTags: string[];
  robotTypeTags: string[];
  useCaseTags: string[];
  robotNames: string[];
  aiSummary: string;
  aiRelevanceScore: number;
  viewCount: number;
  featured: boolean;
  createdAt: string;
}

export interface VideoFilters {
  industry?: string;
  robotType?: string;
  useCase?: string;
  robotName?: string;
  sourceType?: VideoSourceType;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export interface ContentSuggestion {
  url: string;
  title?: string;
  description?: string;
  suggestedTags?: string[];
}

export interface VideoLibraryResponse {
  data: VideoItem[];
  count: number;
  error: string | null;
}
```

### 5.3 UI Layout Specification

```
┌─────────────────────────────────────────────────────────────────────┐
│  Robot Video Library                                     [+ Suggest]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  🔍 Search videos...                                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   All    │ │ Medical  │ │Warehouse │ │  Mfg     │ │  News    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│  │ ▶️              │ │ ▶️              │ │ ▶️              │        │
│  │  [thumbnail]    │ │  [thumbnail]    │ │  [thumbnail]    │        │
│  ├─────────────────┤ ├─────────────────┤ ├─────────────────┤        │
│  │ Boston Dynamics │ │ Warehouse AGV   │ │ Medical Robot   │        │
│  │ 📺 YouTube      │ │ 📺 YouTube      │ │ 📰 TechCrunch   │        │
│  │ 🏷️ quadruped   │ │ 🏷️ logistics   │ │ 🏷️ medical     │        │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘        │
│                                                                      │
│  [row 2...]                                                          │
│  [row 3...]                                                          │
│                                                                      │
│                        [Load More]                                   │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│  📊 1,247 videos • Updated daily • Sources: YouTube, News, Research │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.4 Responsive Breakpoints

| Breakpoint | Grid Columns | Card Width |
|------------|--------------|------------|
| Desktop (>1200px) | 4 columns | 280px |
| Tablet (880-1200px) | 3 columns | 300px |
| Mobile (<880px) | 1-2 columns | Full width |

---

## 6. RSIP Integration Points

### 6.1 Link Structure

RSIP platform will link to the Video Library with category pre-filters:

```
Base URL: https://videos.rsip-platform.com (or subdomain)

Category Links from RSIP:
- Medical: /videos?industry=medical
- Warehouse: /videos?industry=warehouse
- Manufacturing: /videos?industry=manufacturing
- Commercial: /videos?industry=commercial
- All Videos: /videos
```

### 6.2 Shared Authentication (Optional)

If single sign-on is needed:
- Use Supabase Auth tokens
- Video Library validates JWT from RSIP
- Same user table reference

### 6.3 Shared Database Connection

```
Supabase Project: wbtrtckvwtlxfnadrvzo
Region: EU West

Tables owned by Video Library:
- video_library
- content_suggestions
- crawler_runs

Tables referenced (read-only):
- users (for moderation tracking)
```

---

## 7. Deployment Configuration

### 7.1 Crawler Deployment (Google Cloud Run)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY config/ ./config/

ENV PYTHONPATH=/app

CMD ["python", "src/main.py"]
```

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/robot-media-crawler', '.']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/robot-media-crawler']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'jobs'
      - 'update'
      - 'robot-media-crawler'
      - '--image=gcr.io/$PROJECT_ID/robot-media-crawler'
      - '--region=europe-west1'
      - '--memory=1Gi'
      - '--task-timeout=30m'
```

```yaml
# scheduler.yaml
name: robot-media-crawler-daily
description: Daily robot video content crawler
schedule: "0 2 * * *"  # 2:00 AM UTC daily
timeZone: UTC
httpTarget:
  uri: https://europe-west1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/rsip-knowledgebase/jobs/robot-media-crawler:run
  httpMethod: POST
  oauthToken:
    serviceAccountEmail: crawler-scheduler@rsip-knowledgebase.iam.gserviceaccount.com
```

### 7.2 Frontend Deployment

- **Platform:** Vercel or Netlify (standalone)
- **Domain:** `videos.rsip-platform.com` or similar
- **Build:** `npm run build`
- **Environment Variables:**
  ```
  VITE_SUPABASE_URL=https://wbtrtckvwtlxfnadrvzo.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

---

## 8. Security & Compliance

### 8.1 Access Control

| Component | Credential | Access Level |
|-----------|------------|--------------|
| Crawler | `SUPABASE_SERVICE_ROLE_KEY` | Full write (bypasses RLS) |
| Frontend | `VITE_SUPABASE_ANON_KEY` | Read approved only (RLS) |
| Admin | User JWT + admin role | Full CRUD via RLS |

### 8.2 Content Guidelines

| Source | Approach | Notes |
|--------|----------|-------|
| YouTube | Embed only | Never download/re-host |
| News | Link + summary | Respect copyright |
| Company | Embed with attribution | Contact for permission if needed |

### 8.3 Crawler Ethics

- ✅ Always respect robots.txt
- ✅ Max 1 request/second per source
- ✅ Always credit original source
- ✅ Honor removal requests
- ✅ Review Terms of Service per source

---

## 9. Monitoring & Alerts

### 9.1 Crawler Metrics

```
- crawler_run_success_rate
- crawler_items_found_per_run
- crawler_items_added_vs_skipped
- crawler_api_quota_usage
- crawler_processing_time
- crawler_classification_accuracy
```

### 9.2 Alert Conditions

| Alert | Condition | Action |
|-------|-----------|--------|
| Crawler Failed | 3 consecutive failures | Notify team |
| Low Yield | <10 items per run | Review keywords |
| API Quota | >80% used | Reduce frequency |
| Classification Errors | >20% failure | Review AI prompts |

---

## 10. Implementation Checklist

### Phase 1: Database Setup (Day 1)
- [ ] Apply migration `077_video_library.sql` to Supabase
- [ ] Verify RLS policies work correctly
- [ ] Test search function with sample data
- [ ] Confirm indexes are created

### Phase 2: Crawler Development (Days 2-5)
- [ ] Create repository `/robot-media-crawler/`
- [ ] Implement YouTube crawler
- [ ] Implement News RSS crawler
- [ ] Implement AI classifier with Gemini
- [ ] Implement Supabase client
- [ ] Add deduplication logic
- [ ] Write unit tests
- [ ] Create Docker configuration
- [ ] Deploy to Google Cloud Run
- [ ] Set up Cloud Scheduler

### Phase 3: Frontend Development (Days 6-9)
- [ ] Create repository `/video-library-frontend/`
- [ ] Implement video-library-service.ts
- [ ] Build VideoLibraryPage component
- [ ] Build VideoGrid and VideoCard components
- [ ] Build VideoDetailModal component
- [ ] Build VideoFilterBar component
- [ ] Build ContentSuggestionForm
- [ ] Add responsive styles
- [ ] Deploy to Vercel/Netlify

### Phase 4: Admin & Integration (Days 10-11)
- [ ] Build AdminModeration component
- [ ] Add moderation workflow
- [ ] Configure RSIP category links
- [ ] Test end-to-end flow
- [ ] Documentation

---

## 11. Contacts & Resources

### Supabase Access
- **Project URL:** https://wbtrtckvwtlxfnadrvzo.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/wbtrtckvwtlxfnadrvzo
- **Credentials:** Contact RSIP admin for SERVICE_ROLE_KEY

### Google Cloud Project
- **Project ID:** rsip-knowledgebase
- **Region:** europe-west1
- **Console:** https://console.cloud.google.com/run?project=rsip-knowledgebase

### API Keys Needed
- YouTube Data API v3 key (Google Cloud Console)
- Gemini API key (Google AI Studio)

### Related Documentation
- Full tech spec: `/RSIP/v2/docs/TECH_SPEC_VIDEO_LIBRARY.md`
- Task pipeline: `/RSIP/v2/docs/TASK_PIPELINE.md`
- RSIP architecture: `/RSIP/v2/docs/SYSTEM_ARCHITECTURE_REPORT.md`

---

*Document prepared for Video Library Development Team*
*RSIP v2 - 2026-01-30*
